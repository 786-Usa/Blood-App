import { User } from "../models/User.model.js";
import { DonationHistory } from "../models/DonationHistory.model.js";
import bcrypt from "bcryptjs";

// 1. Get Profile (With selective data for security)
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Error fetching profile" });
  }
};

// 2. Comprehensive Profile Update (Name, Email, BloodGroup, Phone)
const updateProfile = async (req, res) => {
  try {
    const { name, email, phone, bloodGroup } = req.body;

    // Edge Case: Check if req.user exists (Auth middleware check)
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized: No user ID found" });
    }

    // 1. Phone number uniqueness check
    if (phone) {
      const existing = await User.findOne({ phone, _id: { $ne: req.user.id } });
      if (existing) {
        return res.status(400).json({ message: "Phone number already in use" });
      }
    }

    // 2. Update with Validation
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { name, email, phone, bloodGroup } },
      { 
        new: true, 
        runValidators: true, // Yeh check karega ke BloodGroup valid hai ya nahi
        context: 'query' 
      }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found in database" });
    }

    res.json({ message: "Profile updated successfully", user: updatedUser });

  } catch (error) {
    // ASAL MASLA YAHAN NAZAR AAYEGA:
    console.error("UPDATE_PROFILE_ERROR:", error);

    // Agar Mongoose validation error hai (e.g. Blood Group invalid hai)
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: Object.values(error.errors).map(val => val.message)[0] });
    }

    res.status(500).json({ message: "Internal Server Error", details: error.message });
  }
};

// 3. Update Availability
const updateAvailability = async (req, res) => {
  const { availabilityStatus } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { availabilityStatus },
    { new: true }
  ).select("-password");

  res.json({ message: "Status updated", user });
};

// 4. Update Location
const updateLocation = async (req, res) => {
  const { latitude, longitude } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user.id,
    {
      location: { type: "Point", coordinates: [longitude, latitude] }
    },
    { new: true }
  ).select("-password");

  res.json({ message: "Location updated", user });
};

// 5. Check Eligibility (Upgraded with better logic)
const checkEligibility = async (req, res) => {
  const lastDonation = await DonationHistory.findOne({ donorId: req.user.id }).sort({ donationDate: -1 });

  if (!lastDonation) {
    return res.json({ eligible: true, message: "You are eligible to donate" });
  }

  const daysPassed = (Date.now() - new Date(lastDonation.donationDate)) / (1000 * 60 * 60 * 24);
  const requiredDays = req.user.gender === "female" ? 120 : 90;
  const eligible = daysPassed >= requiredDays;

  res.json({
    eligible,
    daysRemaining: eligible ? 0 : Math.ceil(requiredDays - daysPassed),
    lastDonationDate: lastDonation.donationDate
  });
};

export { getProfile, updateProfile, updateAvailability, updateLocation, checkEligibility };