import bcrypt from "bcryptjs";
import { generateToken } from "../utils/jwt.js";
import { User } from "../models/User.model.js";

const register = async (req, res) => {
  const { name, email, phone, password, bloodGroup, latitude, longitude, role } = req.body;
  try {
    // 1. Validate input (Achi practice hai)
    if (!name || !phone || !password || !bloodGroup) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ phone });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const cleanBloodGroup = bloodGroup.trim().toUpperCase().replace(/0/g, "O");
    const validBloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
    if (!validBloodGroups.includes(cleanBloodGroup)) {
      return res.status(400).json({ message: "Invalid blood group" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name, email, phone,
      password: hashedPassword,
      bloodGroup: cleanBloodGroup,
      location: {
        type: "Point",
        // Agar frontend se nahi aaye toh default [0,0] ya null dein 
        // Lekin model mein 'required: true' hai toh default value dena hogi
        coordinates: [longitude || 0, latitude || 0] 
      },
      role: role || "donor"
    });

    // Registration ke baad seedha token bhej dena behtar hota hai taaki user seedha login ho jaye
    const token = generateToken({ id: user._id, role: user.role });
    
    // Password hide karein response se
    user.password = undefined;

    res.status(201).json({ message: "User registered successfully", token, user });
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const login = async (req, res) => {
  const { phone, password } = req.body;
  try {
    // 1. Validate input (Achi practice hai)
    if (!phone || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({ phone });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ message: "Invalid credentials" });

    const token = generateToken({ id: user._id, role: user.role });
    res.status(200).json({ message: "User logged in successfully", token, user });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
const logout = async (req, res) => {
  try {
    // Agar aap chahte hain ke logout hote hi donor 'offline' ho jaye
    if (req.user) {
      await User.findByIdAndUpdate(req.user.id, { 
        // Aap yahan status change kar sakte hain agar zaroorat ho
        // availabilityStatus: "offline" 
      });
    }

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: "Logout failed" });
  }
};


export { register, login, logout };