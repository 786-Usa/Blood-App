import { User } from "../models/User.model.js";
import { bloodCompatibility } from "../utils/bloodCompatibility.js";
import { calculateMatchScore } from "../utils/matchScore.js";
import { radiusSteps } from "../utils/radiusLogic.js";

export const findNearbyDonors = async (req, res) => {
  const { latitude, longitude, bloodGroup } = req.body;

  const compatibleGroups = bloodCompatibility[bloodGroup];
  let matchedDonors = [];

  for (let radius of radiusSteps) {
    const donors = await User.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [longitude, latitude]
          },
          maxDistance: radius,
          distanceField: "distance",
          spherical: true
        }
      },
      {
        $match: {
          role: "donor",
          availabilityStatus: "available",
          bloodGroup: { $in: compatibleGroups }
        }
      },
      {
        $addFields: {
          daysSinceLastDonation: {
            $cond: [
              { $ifNull: ["$lastDonationDate", false] },
              {
                $divide: [
                  { $subtract: [new Date(), "$lastDonationDate"] },
                  1000 * 60 * 60 * 24
                ]
              },
              999
            ]
          }
        }
      }
    ]);

    donors.forEach(donor => {
      donor.matchScore = calculateMatchScore(donor);
    });

    matchedDonors.push(...donors);

    if (matchedDonors.length >= 5) break;
  }

  matchedDonors.sort((a, b) => b.matchScore - a.matchScore);

  res.json(matchedDonors.slice(0, 5));
};
