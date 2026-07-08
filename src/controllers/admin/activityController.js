const User = require('../../models/user.schema');
const Companion = require('../../models/companion.schema');
const Booking = require('../../models/booking.schema');
const Notification = require('../../models/notification.schema');
const ActivityLog = require('../../models/activityLog.schema');

/**
 * GET /api/admin/activity
 * Aggregates a unified activity feed from Users, Companions, and Bookings.
 * Supports pagination, date filtering, category filtering, role filtering, and search.
 */
const getActivityFeed = async (req, res) => {
  try {
    const page    = Math.max(parseInt(req.query.page,  10) || 1, 1);
    const limit   = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const category = req.query.category  || 'all';   // all | registration | verification | booking | profile
    const role     = req.query.role      || 'all';   // all | family | companion | admin
    const dateRange = req.query.dateRange || 'all';  // all | today | week | month | 3months
    const sortOrder = req.query.sort     || 'desc';  // desc | asc
    const search    = (req.query.search  || '').trim().toLowerCase();

    // ── Date boundary ────────────────────────────────────────────────────────
    const now = new Date();
    let fromDate = null;
    if (dateRange === 'today') {
      fromDate = new Date(now); fromDate.setHours(0, 0, 0, 0);
    } else if (dateRange === 'week') {
      fromDate = new Date(now); fromDate.setDate(now.getDate() - 7);
    } else if (dateRange === 'month') {
      fromDate = new Date(now); fromDate.setDate(now.getDate() - 30);
    } else if (dateRange === '3months') {
      fromDate = new Date(now); fromDate.setDate(now.getDate() - 90);
    }

    const dateFilter = fromDate ? { createdAt: { $gte: fromDate } } : {};

    // ── Fetch source data in parallel ────────────────────────────────────────
    const [users, companions, bookings, resubmissionNotifications, activityLogs] = await Promise.all([
      // All non-admin users (registrations + profile changes tracked via updatedAt)
      (category === 'all' || category === 'registration' || category === 'profile')
        ? User.find({
            role: { $ne: 'admin' },
            ...(role !== 'all' ? { role } : {}),
            ...dateFilter
          }).select('_id name role isBanned createdAt updatedAt').lean()
        : Promise.resolve([]),

      // Companions (verification events)
      (category === 'all' || category === 'verification')
        ? Companion.find({
            ...dateFilter
          })
          .populate('userId', 'name role')
          .lean()
        : Promise.resolve([]),

      // Bookings
      (category === 'all' || category === 'booking')
        ? Booking.find({
            ...dateFilter
          })
          .populate('familyId',   'name role')
          .populate('companionId', 'name role')
          .lean()
        : Promise.resolve([]),

      // Resubmission notifications — used to inject distinct resubmission activity events
      (category === 'all' || category === 'verification')
        ? Notification.find({
            title: 'Caregiver Resubmitted Documents 📋',
            type:  'system_alert',
            ...dateFilter
          })
          .populate('senderId', 'name')
          .lean()
        : Promise.resolve([]),

      // Activity Logs
      ActivityLog.find({
        ...dateFilter
      }).lean(),
    ]);

    // ── Build unified event list ──────────────────────────────────────────────
    const events = [];

    // ── User registration events ──────────────────────────────────────────────
    for (const u of users) {
      const actorName = u.name || 'Unknown';
      const actorRole = u.role;

      // Registration
      events.push({
        id:          `user-reg-${u._id}`,
        category:    'registration',
        type:        actorRole === 'companion' ? 'caregiver_registered' : 'family_registered',
        title:       actorRole === 'companion' ? 'Caregiver Registration' : 'Family Registration',
        description: `${actorName} created a new ${actorRole} account`,
        actorName,
        actorRole,
        relatedId:   u._id.toString(),
        relatedModel:'User',
        icon:        'person_add',
        iconBg:      'bg-primary-container/20',
        iconColor:   'text-primary',
        badgeLabel:  'Registration',
        badgeClass:  'bg-primary/10 text-primary border-primary/20',
        timestamp:   u.createdAt,
        exactDate:   u.createdAt,
        navigateTo:  actorRole === 'family'
          ? `/families/${u._id}`
          : `/caregivers?id=${u._id}`,
        entityId:    u._id.toString(),
      });
    }

    // ── Companion verification events ─────────────────────────────────────────
    for (const c of companions) {
      const name = c.userId?.name || 'Unknown Caregiver';
      const actorRole = 'companion';

      if (role !== 'all' && role !== actorRole) continue;

      const statusMeta = {
        pending:      { title: 'Verification Requested', icon: 'pending',          iconBg: 'bg-amber-100',              iconColor: 'text-amber-700',  badge: 'bg-amber-50 text-amber-700 border-amber-200',   type: 'verification_requested' },
        under_review: { title: 'Verification In Review',  icon: 'manage_search',    iconBg: 'bg-blue-100',               iconColor: 'text-blue-700',   badge: 'bg-blue-50 text-blue-700 border-blue-200',       type: 'verification_requested' },
        verified:     { title: 'Caregiver Verified',      icon: 'verified',         iconBg: 'bg-secondary-container/20', iconColor: 'text-secondary',  badge: 'bg-secondary/10 text-secondary border-secondary/20', type: 'caregiver_approved' },
        rejected:     { title: 'Verification Rejected',   icon: 'cancel',           iconBg: 'bg-error-container/20',     iconColor: 'text-error',      badge: 'bg-error/10 text-error border-error/20',         type: 'caregiver_rejected' },
      };

      const meta = statusMeta[c.verificationStatus] || statusMeta.pending;
      // c.userId holds the User document (populated); use its _id for navigation
      const caregiverUserId = c.userId?._id?.toString() || c.userId?.toString();

      events.push({
        id:          `comp-ver-${c._id}`,
        category:    'verification',
        type:        meta.type,
        title:       meta.title,
        description: `${name}'s caregiver profile is ${c.verificationStatus}`,
        actorName:   name,
        actorRole,
        relatedId:   c._id.toString(),
        relatedModel:'Companion',
        icon:        meta.icon,
        iconBg:      meta.iconBg,
        iconColor:   meta.iconColor,
        badgeLabel:  'Verification',
        badgeClass:  meta.badge,
        timestamp:   c.updatedAt,
        exactDate:   c.updatedAt,
        navigateTo:  caregiverUserId ? `/caregivers?id=${caregiverUserId}` : '/caregivers',
        entityId:    caregiverUserId || c._id.toString(),
      });
    }

    // ── Resubmission events (caregiver uploaded docs after under_review) ──────
    // Each resubmission creates a notification sent to admins — we use those
    // notification records as the source of truth for this distinct event type.
    for (const notif of resubmissionNotifications) {
      if (role !== 'all' && role !== 'companion') continue;

      const actorName = notif.senderId?.name || 'A Caregiver';
      const actorUserId = notif.senderId?._id?.toString() || notif.senderId?.toString();

      events.push({
        id:          `resubmit-${notif._id}`,
        category:    'verification',
        type:        'documents_resubmitted',
        title:       'Documents Resubmitted',
        description: `${actorName} resubmitted requested documents — status changed from Under Review to Pending.`,
        actorName,
        actorRole:   'companion',
        relatedId:   actorUserId || '',
        relatedModel:'Companion',
        icon:        'upload_file',
        iconBg:      'bg-teal-100',
        iconColor:   'text-teal-700',
        badgeLabel:  'Resubmission',
        badgeClass:  'bg-teal-50 text-teal-700 border-teal-200',
        timestamp:   notif.createdAt,
        exactDate:   notif.createdAt,
        navigateTo:  actorUserId ? `/caregivers?id=${actorUserId}` : '/caregivers',
        entityId:    actorUserId || '',
      });
    }

    // ── Booking events ────────────────────────────────────────────────────────
    const bookingMeta = {
      pending:         { title: 'Booking Requested',  icon: 'pending_actions',      iconBg: 'bg-amber-100',              iconColor: 'text-amber-700',  badge: 'bg-amber-50 text-amber-700 border-amber-200',   type: 'booking_created' },
      pending_payment: { title: 'Awaiting Payment',   icon: 'payment',              iconBg: 'bg-blue-100',               iconColor: 'text-blue-700',   badge: 'bg-blue-50 text-blue-700 border-blue-200',       type: 'booking_created' },
      approved:        { title: 'Booking Approved',   icon: 'assignment_turned_in', iconBg: 'bg-secondary-container/20', iconColor: 'text-secondary',  badge: 'bg-secondary/10 text-secondary border-secondary/20', type: 'booking_created' },
      active:          { title: 'Booking Active',     icon: 'play_circle',          iconBg: 'bg-tertiary-container/20',  iconColor: 'text-tertiary',   badge: 'bg-tertiary/10 text-tertiary border-tertiary/20', type: 'booking_created' },
      completed:       { title: 'Booking Completed',  icon: 'task_alt',             iconBg: 'bg-secondary-container/20', iconColor: 'text-secondary',  badge: 'bg-secondary/10 text-secondary border-secondary/20', type: 'booking_completed' },
      cancelled:       { title: 'Booking Cancelled',  icon: 'cancel',               iconBg: 'bg-error-container/20',     iconColor: 'text-error',      badge: 'bg-error/10 text-error border-error/20',         type: 'booking_cancelled' },
    };

    for (const b of bookings) {
      const familyName    = b.familyId?.name    || 'A Family';
      const companionName = b.companionId?.name || 'A Caregiver';
      const actorRole     = 'family';

      if (role !== 'all' && role !== actorRole && role !== 'companion') {
        // still include if either party matches requested role
        const familyRole    = b.familyId?.role    || 'family';
        const companionRole = b.companionId?.role || 'companion';
        if (role !== familyRole && role !== companionRole) continue;
      }

      const meta = bookingMeta[b.status] || bookingMeta.pending;

      events.push({
        id:          `booking-${b._id}`,
        category:    'booking',
        type:        meta.type,
        title:       meta.title,
        description: `${familyName} ↔ ${companionName}`,
        actorName:   familyName,
        actorRole,
        relatedId:   b._id.toString(),
        relatedModel:'Booking',
        icon:        meta.icon,
        iconBg:      meta.iconBg,
        iconColor:   meta.iconColor,
        badgeLabel:  'Booking',
        badgeClass:  meta.badge,
        timestamp:   b.updatedAt,
        exactDate:   b.updatedAt,
        navigateTo:  `/bookings?id=${b._id}`,
        entityId:    b._id.toString(),
      });
    }

    // ── Activity logs events ──────────────────────────────────────────────────
    if (activityLogs && activityLogs.length > 0) {
      for (const log of activityLogs) {
        if (category !== 'all' && log.category !== category) continue;
        if (role !== 'all' && log.actorRole !== role) continue;

        events.push({
          id:          `act-log-${log._id}`,
          category:    log.category,
          type:        log.type,
          title:       log.title,
          description: log.description,
          actorName:   log.actorName,
          actorRole:   log.actorRole,
          relatedId:   log.relatedId?.toString() || '',
          relatedModel:log.relatedModel || '',
          icon:        log.icon,
          iconBg:      log.iconBg,
          iconColor:   log.iconColor,
          badgeLabel:  log.badgeLabel,
          badgeClass:  log.badgeClass,
          timestamp:   log.createdAt,
          exactDate:   log.createdAt,
          navigateTo:  log.relatedModel === 'User' 
            ? `/families/${log.relatedId}` 
            : log.relatedModel === 'Booking' 
            ? `/bookings?id=${log.relatedId}` 
            : '',
          entityId:    log.relatedId?.toString() || '',
        });
      }
    }

    // ── Filter by search term ─────────────────────────────────────────────────
    let filtered = events;
    if (search) {
      filtered = events.filter(e =>
        e.actorName.toLowerCase().includes(search)  ||
        e.title.toLowerCase().includes(search)      ||
        e.description.toLowerCase().includes(search)
      );
    }

    // ── Sort ──────────────────────────────────────────────────────────────────
    filtered.sort((a, b) =>
      sortOrder === 'asc'
        ? new Date(a.timestamp) - new Date(b.timestamp)
        : new Date(b.timestamp) - new Date(a.timestamp)
    );

    // ── Paginate ──────────────────────────────────────────────────────────────
    const total     = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const skip      = (page - 1) * limit;
    const paginated = filtered.slice(skip, skip + limit);

    return res.status(200).json({
      status: 'success',
      results: paginated.length,
      pagination: { total, page, limit, totalPages, hasMore: page < totalPages },
      data: { activities: paginated }
    });

  } catch (error) {
    console.error('Error in getActivityFeed:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

module.exports = { getActivityFeed };
