import { User } from "../models/User.model.js";
import { BloodRequest } from "../models/BloodRequest.model.js";
 const getAllUsers = async (req, res) => {
  const users = await User.find().select("-password");
  res.json(users);
};

const toggleBlockUser = async (req, res) => {
  const { userId } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  user.isBlocked = !user.isBlocked;
  await user.save();

  res.json({
    message: `User ${user.isBlocked ? "blocked" : "unblocked"} successfully`
  });
};
const getAllRequests = async (req, res) => {
  const requests = await BloodRequest.find()
    .populate("recipientId", "name bloodGroup")
    .populate("fulfilledBy", "name bloodGroup");

  res.json(requests);
};

 const getSystemStats = async (req, res) => {
  const totalUsers = await User.countDocuments();
  const totalDonors = await User.countDocuments({ role: "donor" });
  const totalRequests = await BloodRequest.countDocuments();
  const fulfilledRequests = await BloodRequest.countDocuments({
    status: "fulfilled"
  });

  res.json({
    totalUsers,
    totalDonors,
    totalRequests,
    fulfilledRequests
  });
};



export { getAllUsers, toggleBlockUser, getAllRequests, getSystemStats };
