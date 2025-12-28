import { User } from "../models/User.model.js";
import { BloodRequest } from "../models/BloodRequest.model.js";

// 1. Get All Users with Pagination & Search
// Hamesha pagination use karein taaki ek saath hazaron users load na hon
const getAllUsers = async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    
    // Search filter (Name ya Phone se search karne ke liye)
    const query = search ? {
      $or: [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } }
      ]
    } : {};

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({ users, totalPages: Math.ceil(total / limit), currentPage: page });
  } catch (error) {
    res.status(500).json({ message: "Error fetching users" });
  }
};

// 2. Toggle Block User (Optimized)
const toggleBlockUser = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);
    
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role === 'admin') return res.status(403).json({ message: "Cannot block an admin" });

    user.isBlocked = !user.isBlocked;
    await user.save();

    res.json({ 
      success: true, 
      message: `User ${user.isBlocked ? "blocked" : "unblocked"}`,
      isBlocked: user.isBlocked 
    });
  } catch (error) {
    res.status(500).json({ message: "Action failed" });
  }
};

// 3. System Stats (Parallel Processing)
// Parallel calls se response time 3 guna fast ho jata hai
const getSystemStats = async (req, res) => {
  try {
    const [totalUsers, totalDonors, totalRequests, fulfilledRequests, pendingRequests] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "donor", availabilityStatus: "available" }),
      BloodRequest.countDocuments(),
      BloodRequest.countDocuments({ status: "fulfilled" }),
      BloodRequest.countDocuments({ status: "pending" })
    ]);

    res.json({
      stats: {
        totalUsers,
        totalDonors, // Ab sirf available donors count honge
        totalRequests,
        fulfilledRequests,
        pendingRequests,
        successRate: totalRequests > 0 ? ((fulfilledRequests / totalRequests) * 100).toFixed(2) : 0
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Stats fetch failed" });
  }
};

// 4. Get All Requests with better Population
const getAllRequests = async (req, res) => {
  try {
    const requests = await BloodRequest.find()
      .populate("requesterId", "name phone bloodGroup") // Recipient details
      .populate("fulfilledBy", "name phone") // Donor details
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: "Error fetching requests" });
  }
};

// 5. Delete User (New Feature for Admin)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (user.role === 'admin') return res.status(403).json({ message: "Admins cannot be deleted" });
    
    await User.findByIdAndDelete(id);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Delete failed" });
  }
};

export { getAllUsers, toggleBlockUser, getAllRequests, getSystemStats, deleteUser };