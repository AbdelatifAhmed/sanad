const User       = require('../../models/user.schema');
const Companion  = require('../../models/companion.schema');
const Booking    = require('../../models/booking.schema');
const Payment    = require('../../models/payment.schema');
const JobPost    = require('../../models/jobPost.schema');

/**
 * Resolve a named period or explicit startDate/endDate into { start, end }.
 * Query params accepted:
 *   period   = today | yesterday | last7 | last30 | last90 |
 *              thisMonth | lastMonth | thisYear | allTime
 *   startDate / endDate (ISO strings, override period)
 */
function resolveDateRange(query) {
  const now = new Date();

  // Explicit override wins
  if (query.startDate || query.endDate) {
    const start = query.startDate ? new Date(query.startDate) : new Date(0);
    const end   = query.endDate   ? new Date(query.endDate)   : now;
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  const period = query.period || 'last30';

  const startOfDay = (d) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  };
  const endOfDay = (d) => {
    const x = new Date(d);
    x.setHours(23, 59, 59, 999);
    return x;
  };

  switch (period) {
    case 'today':
      return { start: startOfDay(now), end: endOfDay(now) };

    case 'yesterday': {
      const y = new Date(now);
      y.setDate(now.getDate() - 1);
      return { start: startOfDay(y), end: endOfDay(y) };
    }

    case 'last7': {
      const s = new Date(now);
      s.setDate(now.getDate() - 6);
      return { start: startOfDay(s), end: endOfDay(now) };
    }

    case 'last30': {
      const s = new Date(now);
      s.setDate(now.getDate() - 29);
      return { start: startOfDay(s), end: endOfDay(now) };
    }

    case 'last90': {
      const s = new Date(now);
      s.setDate(now.getDate() - 89);
      return { start: startOfDay(s), end: endOfDay(now) };
    }

    case 'thisMonth': {
      const s = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: startOfDay(s), end: endOfDay(now) };
    }

    case 'lastMonth': {
      const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const e = new Date(now.getFullYear(), now.getMonth(), 0);
      return { start: startOfDay(s), end: endOfDay(e) };
    }

    case 'thisYear': {
      const s = new Date(now.getFullYear(), 0, 1);
      return { start: startOfDay(s), end: endOfDay(now) };
    }

    case 'allTime':
      return { start: new Date(0), end: endOfDay(now) };

    default: {
      // fallback: last 30 days
      const s = new Date(now);
      s.setDate(now.getDate() - 29);
      return { start: startOfDay(s), end: endOfDay(now) };
    }
  }
}

/**
 * Build growth-trend buckets (up to 8 buckets, labeled Week N or Day N etc.)
 * Returns { labels, bookingCounts, userCounts }
 */
function buildGrowthBuckets(start, end, bookingsRaw, usersRaw) {
  const diffMs   = end - start;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  let bucketMs, labelPrefix, bucketCount;
  if (diffDays <= 1) {
    // Single day → 6 hourly buckets of 4 hours each
    bucketMs     = 4 * 60 * 60 * 1000;
    labelPrefix  = 'Hour';
    bucketCount  = 6;
  } else if (diffDays <= 14) {
    // Up to 2 weeks → daily buckets
    bucketMs    = 24 * 60 * 60 * 1000;
    labelPrefix = 'Day';
    bucketCount = Math.ceil(diffDays);
  } else if (diffDays <= 90) {
    // Up to 90 days → weekly buckets
    bucketMs    = 7 * 24 * 60 * 60 * 1000;
    labelPrefix = 'Week';
    bucketCount = Math.ceil(diffDays / 7);
  } else {
    // Over 90 days → monthly buckets (approx 30 days)
    bucketMs    = 30 * 24 * 60 * 60 * 1000;
    labelPrefix = 'Month';
    bucketCount = Math.ceil(diffDays / 30);
  }

  // Clamp to 12 buckets max
  bucketCount = Math.min(bucketCount, 12);

  const labels         = [];
  const bookingCounts  = new Array(bucketCount).fill(0);
  const userCounts     = new Array(bucketCount).fill(0);

  for (let i = 0; i < bucketCount; i++) {
    labels.push(`${labelPrefix} ${i + 1}`);
  }

  const mapToBucket = (dateVal) => {
    const ms  = new Date(dateVal).getTime() - start.getTime();
    const idx = Math.floor(ms / bucketMs);
    return Math.max(0, Math.min(idx, bucketCount - 1));
  };

  for (const b of bookingsRaw) {
    const idx = mapToBucket(b.createdAt);
    bookingCounts[idx]++;
  }
  for (const u of usersRaw) {
    const idx = mapToBucket(u.createdAt);
    userCounts[idx]++;
  }

  return { labels, bookingCounts, userCounts };
}

/**
 * GET /api/admin/reports
 *
 * Query params:
 *   period     = today|yesterday|last7|last30|last90|thisMonth|lastMonth|thisYear|allTime
 *   startDate  = ISO date string (explicit override)
 *   endDate    = ISO date string (explicit override)
 *
 * Returns a comprehensive analytics snapshot for the requested time period.
 */
const getReports = async (req, res) => {
  try {
    const { start, end } = resolveDateRange(req.query);
    const dateRange      = { $gte: start, $lte: end };

    // ── Parallel data fetch ─────────────────────────────────────────────────
    const [
      paidPayments,
      pendingPayments,
      allPaidPayments,
      allPendingPayments,
      bookingStats,
      jobPostStats,
      companions,
      totalFamilies,
      totalCompanions,
      bookingsForGrowth,
      usersForGrowth,
    ] = await Promise.all([

      // Revenue within period: sum of paid payments
      Payment.aggregate([
        { $match: { status: 'paid', createdAt: dateRange } },
        { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
      ]),

      // Outstanding within period: pending payments
      Payment.aggregate([
        { $match: { status: 'pending', createdAt: dateRange } },
        { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
      ]),

      // All-time paid (for fallback if period returns 0)
      Payment.aggregate([
        { $match: { status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
      ]),

      // All-time pending (for outstanding snapshot)
      Payment.aggregate([
        { $match: { status: 'pending' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
      ]),

      // Booking breakdown by status within period
      Booking.aggregate([
        { $match: { createdAt: dateRange } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),

      // Service distribution by serviceType from job posts within period
      JobPost.aggregate([
        { $match: { createdAt: dateRange } },
        { $group: { _id: '$serviceType', count: { $sum: 1 } } }
      ]),

      // Top caregivers: sort by rating desc, take 10 (always all-time performance)
      Companion.find({ verificationStatus: 'verified' })
        .populate('userId', 'name avatar')
        .sort({ rating: -1, reviewCount: -1 })
        .limit(10)
        .lean(),

      // User counts (scoped to period for growth sense, all-time for totals)
      User.countDocuments({ role: 'family', createdAt: dateRange }),
      User.countDocuments({ role: 'companion', isBanned: false, createdAt: dateRange }),

      // Raw bookings in period (for growth chart)
      Booking.find({ createdAt: dateRange }, { createdAt: 1 }).lean(),

      // Raw users in period (for growth chart)
      User.find(
        { role: { $ne: 'admin' }, createdAt: dateRange },
        { createdAt: 1 }
      ).lean(),
    ]);

    // ── Revenue KPIs ──────────────────────────────────────────────────────
    const totalRevenue    = paidPayments[0]?.total    ?? 0;
    const totalPaidCount  = paidPayments[0]?.count    ?? 0;
    const outstandingAmt  = allPendingPayments[0]?.total ?? 0;
    const pendingCount    = allPendingPayments[0]?.count ?? 0;
    const avgBookingValue = totalPaidCount > 0 ? (totalRevenue / totalPaidCount) : 0;

    // ── Booking breakdown ─────────────────────────────────────────────────
    const bookingMap = {};
    bookingStats.forEach(b => { bookingMap[b._id] = b.count; });
    const completedBookings = bookingMap['completed']     ?? 0;
    const activeBookings    = (bookingMap['active'] ?? 0) + (bookingMap['approved'] ?? 0);
    const pendingBookings   = (bookingMap['pending'] ?? 0) + (bookingMap['pending_payment'] ?? 0);
    const totalBookings     = Object.values(bookingMap).reduce((s, v) => s + v, 0);

    // ── Service distribution ──────────────────────────────────────────────
    const totalJobPosts = jobPostStats.reduce((s, j) => s + j.count, 0) || 1;
    const serviceLabels = {
      elderly_care:     'Elderly Care',
      home_nursing:     'Home Nursing',
      companionship:    'Companionship',
      physical_therapy: 'Physical Therapy',
      child_care:       'Child Care',
    };
    const serviceDistribution = jobPostStats
      .map(j => ({
        type:       j._id,
        label:      serviceLabels[j._id] || j._id,
        count:      j.count,
        percentage: Math.round((j.count / totalJobPosts) * 100),
      }))
      .sort((a, b) => b.count - a.count);

    // ── Growth trends (dynamic bucketing) ────────────────────────────────
    const { labels, bookingCounts, userCounts } =
      buildGrowthBuckets(start, end, bookingsForGrowth, usersForGrowth);

    const growthTrends = {
      bookings: labels.map((lbl, i) => ({ week: lbl, count: bookingCounts[i] })),
      users:    labels.map((lbl, i) => ({ week: lbl, count: userCounts[i]    })),
    };

    // ── Caregiver performance ─────────────────────────────────────────────
    const bookingHoursAgg = await Booking.aggregate([
      { $match: { status: { $in: ['completed', 'active'] }, createdAt: dateRange } },
      { $group: { _id: '$companionId', bookedHours: { $sum: '$totalHours' } } }
    ]);
    const hoursMap = {};
    bookingHoursAgg.forEach(b => { hoursMap[b._id.toString()] = b.bookedHours; });

    const getReliability = (hours, rating) => {
      if (rating >= 4.8 && hours >= 100) return 'Exemplary';
      if (rating >= 4.5 || hours >= 80)  return 'High';
      if (rating >= 4.0 || hours >= 50)  return 'Medium';
      return 'Standard';
    };

    const caregiverPerformance = companions.map(c => {
      const realHours = hoursMap[c.userId?._id?.toString()] ?? 0;
      return {
        _id:            c._id,
        name:           c.userId?.name        ?? 'Unknown',
        avatar:         c.userId?.avatar?.url ?? null,
        specialization: c.specialization,
        totalWorkHours: realHours,
        rating:         c.rating              ?? 0,
        reviewCount:    c.reviewCount         ?? 0,
        reliability:    getReliability(realHours, c.rating ?? 0),
        status:         c.verificationStatus,
      };
    }).sort((a, b) => b.totalWorkHours - a.totalWorkHours || b.rating - a.rating);

    // ── Geographic insights from job posts within period ──────────────────
    const geoData = await JobPost.aggregate([
      { $match: { createdAt: dateRange } },
      { $group: { _id: '$location.city', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Fallback: if selected period has no geo data, use all-time
    let geographicInsights = geoData
      .filter(g => g._id)
      .map(g => ({ city: g._id, bookings: g.count }));

    if (geographicInsights.length === 0) {
      const geoAllTime = await JobPost.aggregate([
        { $group: { _id: '$location.city', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]);
      geographicInsights = geoAllTime
        .filter(g => g._id)
        .map(g => ({ city: g._id, bookings: g.count }));
    }

    // ── All-time totals (always shown for context) ────────────────────────
    const [allTimeFamilies, allTimeCompanions] = await Promise.all([
      User.countDocuments({ role: 'family' }),
      User.countDocuments({ role: 'companion', isBanned: false }),
    ]);

    return res.status(200).json({
      status: 'success',
      data: {
        period: {
          start: start.toISOString(),
          end:   end.toISOString(),
        },
        kpis: {
          totalRevenue,
          avgBookingValue,
          outstandingPayments: outstandingAmt,
          pendingPaymentsCount: pendingCount,
          completedBookings,
          activeBookings,
          pendingBookings,
          totalBookings,
          // Period-scoped new registrations
          newFamilies:    totalFamilies,
          newCaregivers:  totalCompanions,
          // All-time totals
          totalFamilies:  allTimeFamilies,
          totalCaregivers: allTimeCompanions,
        },
        growthTrends,
        serviceDistribution,
        caregiverPerformance,
        geographicInsights,
      }
    });

  } catch (error) {
    console.error('Error in getReports:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

module.exports = { getReports };
