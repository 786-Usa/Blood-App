import mongoose from "mongoose";

const bloodRequestSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    bloodGroup: {
      type: String,
      required: true
    },

    urgencyLevel: {
      type: String,
      enum: ["normal", "high", "critical"],
      default: "high"
    },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point"
      },
      coordinates: {
        type: [Number],
        required: true
      }
    },

    status: {
      type: String,
      enum: ["pending", "fulfilled", "cancelled"],
      default: "pending"
    },
    fulfilledBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User"
},
expiresAt: {
  type: Date,
  default: () => new Date(Date.now() + 30 * 60 * 1000)
},


fulfilledAt: {
  type: Date
},


    donorResponses: [
      {
        donorId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User"
        },
        response: {
          type: String,
          enum: ["pending", "accepted", "rejected"],
          default: "pending"
        }
      }
    ]
  },
  { timestamps: true }
);

bloodRequestSchema.index({ location: "2dsphere" });

export const BloodRequest = mongoose.model(
  "BloodRequest",
  bloodRequestSchema
);
