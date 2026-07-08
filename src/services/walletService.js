const mongoose = require("mongoose");
const Companion = require("../models/companion.schema");
const Family = require("../models/family.schema");
// Assuming WalletTransaction schema exists, if not it will use standard mongoose methods
const WalletTransaction = require("../models/walletTransaction.schema");

/**
 * Service to handle Wallet Transactions atomically using MongoDB Sessions.
 */
class WalletService {
  /**
   * Process a payment/credit securely.
   * @param {Object} params 
   * @param {String} params.userId - The ID of the user (Family or Companion)
   * @param {String} params.userType - 'Family' or 'Companion'
   * @param {Number} params.amount - Amount to adjust (positive for credit, negative for debit)
   * @param {String} params.type - Transaction type (e.g., 'credit', 'debit', 'payout', 'refund')
   * @param {String} params.description - Human readable description
   * @param {String} params.bookingId - (Optional) Related booking
   */
  static async processTransaction({ userId, userType, amount, type, description, bookingId }) {
    if (amount === 0) return null;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      let updatedUser;
      
      // 1. Update the balance on the respective model
      if (userType === "Family") {
        updatedUser = await Family.findOneAndUpdate(
          { userId },
          { $inc: { walletBalance: amount } },
          { new: true, session }
        );
      } else if (userType === "Companion") {
        updatedUser = await Companion.findOneAndUpdate(
          { userId },
          { $inc: { walletBalance: amount } },
          { new: true, session }
        );
      }

      if (!updatedUser) {
        throw new Error(`User not found in ${userType} collection`);
      }

      if (updatedUser.walletBalance < 0 && type !== 'debt') {
        throw new Error("Insufficient wallet balance.");
      }

      // 2. Write to the WalletTransaction ledger
      const transaction = new WalletTransaction({
        userId,
        userType,
        amount,
        type,
        status: "completed",
        description,
        bookingId: bookingId || null,
        balanceAfter: updatedUser.walletBalance,
      });

      await transaction.save({ session });

      // 3. Commit the transaction atomically
      await session.commitTransaction();
      session.endSession();

      return {
        success: true,
        transaction,
        newBalance: updatedUser.walletBalance
      };

    } catch (error) {
      // Rollback on any failure
      await session.abortTransaction();
      session.endSession();
      console.error("[WalletService] Transaction aborted:", error.message);
      throw error;
    }
  }

  static async getLedger(userId, userType, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const total = await WalletTransaction.countDocuments({ userId, userType });
    const transactions = await WalletTransaction.find({ userId, userType })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return {
      total,
      transactions
    };
  }
}

module.exports = WalletService;
