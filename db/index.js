import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({
  path: "./.env", // Path to the environment variables file
});
const dbURI = process.env.MONGO_URI;

const connectDB = async ()=>{
    try {
        await mongoose.connect(dbURI)
        console.log("MongoDB connected");
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
    }
}

export default connectDB;