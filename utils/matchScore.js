// export const calculateMatchScore = ({
//   distance,
//   availabilityStatus,
//   daysSinceLastDonation
// }) => {
//   let score = 0;

//   // Distance (closer = higher score)
//   if (distance <= 5000) score += 40;
//   else if (distance <= 10000) score += 30;
//   else score += 20;

//   // Availability
//   if (availabilityStatus === "available") score += 30;

//   // Donation gap
//   if (daysSinceLastDonation > 180) score += 30;
//   else if (daysSinceLastDonation > 120) score += 20;
//   else score += 10;

//   return score;
// };


/**
 * Calculate donor match score
 * Higher score = better match
 */
export const calculateMatchScore = ({
  distance,                // meters
  availabilityStatus,
  daysSinceLastDonation
}) => {
  let score = 0;

  /* Distance Weight (40%) */
  if (distance <= 5000) score += 40;
  else if (distance <= 10000) score += 30;
  else if (distance <= 20000) score += 20;
  else score += 10;

  /* Availability Weight (30%) */
  if (availabilityStatus === "available") score += 30;
  else if (availabilityStatus === "busy") score += 10;

  /* Donation Gap Weight (30%) */
  if (daysSinceLastDonation > 180) score += 30;
  else if (daysSinceLastDonation > 120) score += 20;
  else if (daysSinceLastDonation > 90) score += 10;

  return Math.min(score, 100); // Cap score
};