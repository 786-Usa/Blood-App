import { DonationHistory } from "../models/DonationHistory.model.js";

 const getDonationHistory = async (req, res) => {
  const filter =
    req.user.role === "donor"
      ? { donorId: req.user.id }
      : { recipientId: req.user.id };

  const history = await DonationHistory.find(filter)
    .populate("donorId", "name bloodGroup")
    .populate("recipientId", "name bloodGroup")
    .sort({ donationDate: -1 });

  res.json(history);
};

export { getDonationHistory };