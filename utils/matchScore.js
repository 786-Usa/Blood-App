export const calculateMatchScore = ({
  distance,
  availabilityStatus,
  daysSinceLastDonation
}) => {
  let score = 0;

  // Distance (closer = higher score)
  if (distance <= 5000) score += 40;
  else if (distance <= 10000) score += 30;
  else score += 20;

  // Availability
  if (availabilityStatus === "available") score += 30;

  // Donation gap
  if (daysSinceLastDonation > 180) score += 30;
  else if (daysSinceLastDonation > 120) score += 20;
  else score += 10;

  return score;
};
