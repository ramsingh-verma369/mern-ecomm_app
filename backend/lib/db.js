import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB is connected : ${conn.connection.host}`);
    } catch (error) {
        console.log("Error in connecting string to MongoDB", error.message);
        process.exit(1);
    }
}