import bcrypt from "bcryptjs";
import { generateToken } from "../utils/jwt.js";
import { User } from "../models/User.model.js";

const register = async (req, res) => {
  const { name, email, phone, password, bloodGroup } =
    req.body;
  try {
    const existingUser = await User.findOne({ phone });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      bloodGroup,
      // location: {
      //   coordinates: [longitude, latitude],
      // },
    });

    res.status(201).json({ message: "User registered successfully", user });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const login = async (req, res) => {
  const { phone, password } = req.body;

  const user = await User.findOne({ phone });
  if (!user) return res.status(404).json({ message: "User not found" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

  const token = generateToken({
  id: user._id,
  role: user.role
});

  const newUser = await User.findById(user._id).select("-password");

  res.json({ token, user: newUser });
};

export { register, login };
