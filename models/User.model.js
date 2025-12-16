import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },

    phone: {
      type: String,
      required: true,
      unique: true
    },

    email: {
      type: String
    },

    password: {
      type: String,
      required: true
    },

    role: {
      type: String,
      enum: ["donor", "recipient", "admin"],
      default: "donor"
    },

    bloodGroup: {
      type: String,
      required: true
    },

    availabilityStatus: {
      type: String,
      enum: ["available", "busy", "not_available"],
      default: "available"
    },

    lastDonationDate: {
      type: Date
    },

    // location: {
    //   type: {
    //     type: String,
    //     enum: ["Point"],
    //     default: "Point"
    //   },
    //   coordinates: {
    //     type: [Number], // [longitude, latitude]
    //     required: true
    //   }
    // },

    isBlocked: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

// GeoSpatial index
// userSchema.index({ location: "2dsphere" });

export const User = mongoose.model("User", userSchema);
