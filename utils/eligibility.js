// export const isEligibleDonor = (lastDonationDate, gender = "male") => {
//   if (!lastDonationDate) return true;

//   const daysRequired = gender === "female" ? 120 : 90;

//   const diffInDays =
//     (new Date() - new Date(lastDonationDate)) / (1000 * 60 * 60 * 24);

//   return diffInDays >= daysRequired;
// };


/**
 * Check donor eligibility based on last donation
 */
export const checkEligibility = (lastDonationDate, gender = "male") => {
  if (!lastDonationDate) {
    return { eligible: true, daysRemaining: 0 };
  }

  const normalizedGender = gender.toLowerCase();
  const requiredDays = normalizedGender === "female" ? 120 : 90;

  const diffInDays = Math.floor(
    (Date.now() - new Date(lastDonationDate)) / (1000 * 60 * 60 * 24)
  );

  return {
    eligible: diffInDays >= requiredDays,
    daysRemaining: Math.max(requiredDays - diffInDays, 0)
  };
};
