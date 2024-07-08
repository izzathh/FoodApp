const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const validator = require("validator");

const UserSchema = new Schema(
  {
    email: {
      type: String,
      trim: true,
      lowercase: true,
      validate: {
        validator: validator.isEmail,
        message: "Invalid Email",
        isAsync: false,
      },
      required: [true, "Please enter a valid password"],
      unique: [true, "This email already exists"],
    },
    name: {
      type: String,
      required: [true, "Please enter a valid name"],
    },
    phoneNumber: {
      type: String,
      required: [true, "Please enter a valid phone number"],
    },
    addresses: {
      type: Array,
      default: []
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema, 'users');
