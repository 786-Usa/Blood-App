import { User } from "../models/User.model.js";
import {
  bloodCompatibility,
  isBloodCompatible,
} from "../utils/bloodCompatibility.js";
import { getSearchRadius } from "../utils/radiusLogic.js";
import { checkEligibility } from "../utils/eligibility.js";
// import { io } from "../server.js";

// // export const findNearbyDonors = async (req, res) => {
// //   try {
// //     const { latitude, longitude, bloodGroup } = req.body;

// //     // 1. Compatibility Check
// //     const compatibleGroups = bloodCompatibility[bloodGroup];
// //     if (!compatibleGroups) {
// //       return res.status(400).json({ message: "Invalid Blood Group" });
// //     }

// //     // 2. Maximum Radius (e.g., last element of your radiusSteps)
// //     const MAX_DISTANCE = 50000; // 50km in meters

// //     const matchedDonors = await User.aggregate([
// //       {
// //         $geoNear: {
// //           near: { type: "Point", coordinates: [parseFloat(longitude), parseFloat(latitude)] },
// //           maxDistance: MAX_DISTANCE,
// //           distanceField: "distance",
// //           spherical: true,
// //           query: {
// //             role: "donor",
// //             availabilityStatus: "available",
// //             bloodGroup: { $in: compatibleGroups },
// //             isBlocked: false // Security check
// //           }
// //         }
// //       },
// //       {
// //         $addFields: {
// //           daysSinceLastDonation: {
// //             $cond: [
// //               { $ifNull: ["$lastDonationDate", false] },
// //               { $divide: [{ $subtract: [new Date(), "$lastDonationDate"] }, 1000 * 60 * 60 * 24] },
// //               999 // New donors get a high score
// //             ]
// //           }
// //         }
// //       },
// //       // 3. CRITICAL FILTER: Eligibility (90 days rule)
// //       {
// //         $match: {
// //           daysSinceLastDonation: { $gte: 90 }
// //         }
// //       },
// //       // 4. SMART SCORING: Aggregation level par score calculate karein
// //       {
// //         $addFields: {
// //           // Logic: Score reduces as distance increases, increases as eligibility days increase
// //           matchScore: {
// //             $add: [
// //               { $multiply: [{ $subtract: [MAX_DISTANCE, "$distance"] }, 0.001] }, // Distance Weight
// //               { $multiply: ["$daysSinceLastDonation", 0.5] } // Eligibility Weight
// //             ]
// //           }
// //         }
// //       },
// //       { $sort: { matchScore: -1 } },
// //       { $limit: 10 } // Return top 10 matches
// //     ]);

// //     res.json(matchedDonors);
// //   } catch (error) {
// //     console.error("Matching Error:", error);
// //     res.status(500).json({ message: "Matching failed internally" });
// //   }
// // };

// import { User } from "../models/User.model.js";
// import { isBloodCompatible } from "../utils/bloodCompatibility.js";
// import { getSearchRadius } from "../utils/radiusLogic.js";
// import { calculateMatchScore } from "../utils/matchScore.js";
// import { checkEligibility } from "../utils/eligibility.js";

// /**
//  * Find nearby eligible donors using smart matching
//  */
// export const findNearbyDonors = async (req, res) => {
//   try {
//     const { latitude, longitude, bloodGroup } = req.body;

//     if (!latitude || !longitude || !bloodGroup) {
//       return res.status(400).json({ message: "Missing required fields" });
//     }

//     // Normalize recipient blood group to avoid casing/whitespace issues
//     const recipientGroup = String(bloodGroup).trim().toUpperCase();

//     let finalMatches = [];

//     // Try radius expansion: 10km → 20km → 30km
//     for (let attempt = 0; attempt < 3; attempt++) {
//       const radius = getSearchRadius(attempt);

//       // Remove strict availabilityStatus filter from DB query so we don't
//       // accidentally exclude donors due to minor data inconsistencies.
//       // We'll enforce availability and compatibility in application logic below.
//       const donors = await User.aggregate([
//         {
//           $geoNear: {
//             near: {
//               type: "Point",
//               coordinates: [Number(longitude), Number(latitude)]
//             },
//             distanceField: "distance",
//             maxDistance: radius,
//             spherical: true,
//             query: {
//               role: "donor",
//               isBlocked: false
//             }
//           }
//         }
//       ]);

//       // Post-processing (clean business logic)
//       const processedDonors = donors
//         .filter(donor => donor && donor.bloodGroup)
//         .map(donor => {
//           // Normalize donor blood group too
//           const donorGroup = String(donor.bloodGroup).trim().toUpperCase();

//           // Compatibility check
//           if (!isBloodCompatible(recipientGroup, donorGroup)) return null;

//           // Treat missing availabilityStatus as 'available' for safety
//           const availability = donor.availabilityStatus
//             ? String(donor.availabilityStatus).toLowerCase()
//             : "available";

//           // Skip donors explicitly marked not available
//           if (availability === "not_available") return null;

//           const { eligible, daysRemaining } = checkEligibility(
//             donor.lastDonationDate,
//             donor.gender
//           );

//           if (!eligible) return null;

//           const daysSinceLastDonation =
//             donor.lastDonationDate
//               ? Math.floor(
//                   (Date.now() - new Date(donor.lastDonationDate)) /
//                   (1000 * 60 * 60 * 24)
//                 )
//               : 365;

//           const score = calculateMatchScore({
//             distance: donor.distance,
//             availabilityStatus: availability,
//             daysSinceLastDonation
//           });

//           return {
//             _id: donor._id,
//             name: donor.name,
//             bloodGroup: donor.bloodGroup,
//             distance: Math.round(donor.distance),
//             score
//           };
//         })
//         .filter(Boolean)
//         .sort((a, b) => b.score - a.score);

//       if (processedDonors.length > 0) {
//         finalMatches = processedDonors.slice(0, 10);
//         break; // Stop expanding radius
//       }
//     }

//     if (finalMatches.length === 0) {
//       return res.status(404).json({
//         message: "No eligible donors found nearby"
//       });
//     }

//     res.status(200).json({
//       count: finalMatches.length,
//       donors: finalMatches
//     });

//   } catch (error) {
//     console.error("Smart Matching Error:", error);
//     res.status(500).json({ message: "Internal matching error" });
//   }
// };

export const findNearbyDonors = async (req, res) => {
  try {
    const { latitude, longitude, bloodGroup } = req.body;
    console.log(
      `Request received for ${bloodGroup} at [${latitude}, ${longitude}]`
    );

    let finalMatches = [];

    for (let attempt = 0; attempt < 3; attempt++) {
      const radius = getSearchRadius(attempt);
      console.log(`Searching in radius: ${radius}m (Attempt ${attempt + 1})`);

      const donors = await User.aggregate([
        {
          $geoNear: {
            near: {
              type: "Point",
              coordinates: [Number(longitude), Number(latitude)],
            },
            distanceField: "distance",
            maxDistance: radius,
            spherical: true,
            query: {
              role: "donor",
              availabilityStatus: "available",
              isBlocked: false,
            },
          },
        },
      ]);

      console.log(`Found ${donors.length} raw donors in DB`);

      const processedDonors = donors
        .map((donor) => {
          // Compatibility check
          const isComp = isBloodCompatible(bloodGroup, donor.bloodGroup);
          // Eligibility check
          const elig = checkEligibility(donor.lastDonationDate, donor.gender);

          console.log(
            `- Donor: ${donor.name} | Compatible: ${isComp} | Eligible: ${elig.eligible}`
          );
          console.log("Comparing:", {
            recipient: bloodGroup,
            donor: donor.bloodGroup,
          });

          if (isComp && elig.eligible) {
            return {
              _id: donor._id,
              name: donor.name,
              bloodGroup: donor.bloodGroup,
              distance: Math.round(donor.distance),
              matchScore: 100,
              location: donor.location, // 🔥 REQUIRED FOR MAP
            };
          }
          return null;
        })
        .filter(Boolean);

      if (processedDonors.length > 0) {
        finalMatches = processedDonors;
        break;
      }
    }

    if (finalMatches.length === 0) {
      return res
        .status(404)
        .json({ message: "No eligible donors found nearby" });
    }

    res.status(200).json({ donors: finalMatches });
  } catch (error) {
    console.error("CRITICAL ERROR:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};
