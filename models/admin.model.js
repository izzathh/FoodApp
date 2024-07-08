const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const validator = require("validator");

const AdminSchema = new Schema(
  {
    email: {
      type: String,
      required: [true, "Please enter an email"],
      unique: true,
      validate: {
        validator: validator.isEmail,
        message: "Please enter a valid email"
      }
    },
    password: {
      type: String,
      trim: true,
      required: [true, "Please enter a valid password"],
    },
    username: {
      type: String,
      trim: true,
      required: [true, "Please enter a username"],
    },
    adminType: {
      type: String,
      trim: true,
      required: [true, "Please enter admin type"],
    },
    restaurantId: {
      type: mongoose.Types.ObjectId,
      ref: 'Restaurant'
    },
    adminApproved: {
      type: Boolean,
      default: false
    },
    restaurantDeclined: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Admin", AdminSchema, "admins");
