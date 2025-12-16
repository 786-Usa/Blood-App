export const isEligibleDonor = (lastDonationDate, gender = "male") => {
  if (!lastDonationDate) return true;

  const daysRequired = gender === "female" ? 120 : 90;

  const diffInDays =
    (new Date() - new Date(lastDonationDate)) / (1000 * 60 * 60 * 24);

  return diffInDays >= daysRequired;
};
