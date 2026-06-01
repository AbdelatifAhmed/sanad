const User = require('../models/user.schema.js');
const Companion = require('../models/companion.schema.js');
const Booking = require('../models/booking.schema.js');

const getAdminDashboardStats = async (req, res) => {
  try {
    const [
      totalUsersCount,
      familiesCount,
      companionsStats,
      bookingsStats
    ] = await Promise.all([
      User.countDocuments(),

      User.countDocuments({ role: 'family' }),

      Companion.aggregate([
        {
          $group: {
            _id: '$status', 
            count: { $sum: 1 }
          }
        }
      ]),

      Booking.aggregate([
        {
          $group: {
            _id: '$status', 
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    const companions = { total: 0, verified: 0, pending: 0, rejected: 0 };
    companionsStats.forEach(item => {
      const status = item._id || 'pending';
      if (status === 'approved' || status === 'verified') companions.verified = item.count;
      else if (status === 'pending') companions.pending = item.count;
      else if (status === 'rejected') companions.rejected = item.count;
      companions.total += item.count;
    });

    const bookings = { total: 0, active: 0, completed: 0, pending: 0 };
    bookingsStats.forEach(item => {
      const status = item._id;
      if (status === 'accepted' || status === 'confirmed') bookings.active = item.count; 
      else if (status === 'completed') bookings.completed = item.count;
      else if (status === 'pending') bookings.pending = item.count;
      bookings.total += item.count;
    });

    return res.status(200).json({
      status: 'success',
      data: {
        kpis: {
          globalUsers: totalUsersCount,
          totalFamilies: familiesCount,
          totalCompanions: companions.total,
          activeServices: bookings.active, 
          completedServices: bookings.completed
        },
        companionsBreakdown: {
          verified: companions.verified,
          pendingOnboarding: companions.pending,
          rejected: companions.rejected
        },
        bookingsBreakdown: {
          pendingApproval: bookings.pending,
          inProgress: bookings.active,
          completed: bookings.completed,
          totalRequests: bookings.total
        }
      }
    });

  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error);
    return res.status(500).json({ 
      status: 'error', 
      message: error.message 
    });
  }
};

module.exports = {
  getAdminDashboardStats
};