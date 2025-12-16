import mongoose from "mongoose";

const donationHistorySchema = new mongoose.Schema(
  {
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    donationDate: {
      type: Date,
      required: true
    },

    location: {
      type: String
    }
  },
  { timestamps: true }
);

export const DonationHistory = mongoose.model(
  "DonationHistory",
  donationHistorySchema
);
