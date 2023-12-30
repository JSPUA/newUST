import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    username: String,
    image: String,
    imageSecond: String, // Add a field for the second image
    firstName: String,
    surname: String,
    dob: Date,
    icNo: String,
    gender: String,
    address: String,
    mobileNo: String,
    email: String,
    hospitalName: String,
    department: String,
    position: String,
    mmcRegistrationNo: String,
    password: String,
  },
  {
    collection: "User", // You can keep the collection name as "Signup"
  }
);

export default mongoose.model("User", UserSchema);
