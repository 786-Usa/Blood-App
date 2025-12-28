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

    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point"
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true
      }
    },

    isBlocked: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

// GeoSpatial index
userSchema.index({ location: "2dsphere" });
// UserSchema define karne ke baad aur "mongoose.model" se pehle ye paste karein:

// User.model.js mein pre-save hook ko aise likhein:

// User.model.js

userSchema.pre("save", function () {
  // Note: Humne 'next' parameter hata diya hai
  if (this.isModified("bloodGroup") && this.bloodGroup) {
    try {
      // 1. Whitespace aur Uppercase
      let bg = this.bloodGroup.toString().trim().toUpperCase();

      // 2. Zero to O replacement
      bg = bg.replace(/0/g, "O");

      // 3. Single letter to +/- logic
      if (bg.length === 1 && ["A", "B", "O"].includes(bg)) {
        bg = bg + "+";
      }

      this.bloodGroup = bg;
    } catch (error) {
      // Agar error aaye toh save process cancel ho jayega
      throw new Error("Blood group processing failed: " + error.message);
    }
  }
  // next() call karne ki zaroori nahi, process khud complete ho jayega
});

export const User = mongoose.model("User", userSchema);
