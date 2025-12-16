import { User } from "../models/User.model.js";
import { DonationHistory } from "../models/DonationHistory.model.js";

// Get logged-in user profile
 const getProfile = async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json(user);
};

// Update donor availability
 const updateAvailability = async (req, res) => {
  const { availabilityStatus } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { availabilityStatus },
    { new: true }
  );

  res.json({
    message: "Availability updated successfully",
    user
  });
};

// Update user location
 const updateLocation = async (req, res) => {
  const { latitude, longitude } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user.id,
    {
      location: {
        type: "Point",
        coordinates: [longitude, latitude]
      }
    },
    { new: true }
  );

  res.json({
    message: "Location updated successfully",
    user
  });
};


const checkEligibility = async (req, res) => {
  const lastDonation = await DonationHistory.findOne({
    donorId: req.user.id
  }).sort({ donationDate: -1 });

  if (!lastDonation) {
    return res.json({
      eligible: true,
      message: "You are eligible to donate"
    });
  }

  const daysPassed =
    (Date.now() - new Date(lastDonation.donationDate)) /
    (1000 * 60 * 60 * 24);

  const requiredDays = req.user.gender === "female" ? 120 : 90;

  const eligible = daysPassed >= requiredDays;

  res.json({
    eligible,
    daysRemaining: eligible ? 0 : Math.ceil(requiredDays - daysPassed),
    lastDonationDate: lastDonation.donationDate
  });
};


export {
  getProfile,
  updateAvailability,
  updateLocation,
  checkEligibility

} 