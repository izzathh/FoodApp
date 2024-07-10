const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const Admin = require("../models/admin.model");
const { NotFound, BadRequest, ValidationError } = require("../utils/errors");
const {
  verifyEmailAndSentOtp,
  fetchUserFromEmailAndOtp,
  updatePassword,
} = require("../services/auth.service");
const { mongo, default: mongoose } = require("mongoose");

const registerUser = async (req, res, next) => {
  try {
    const {
      name,
      email,
      phonenumber
    } = req.body;
    if (
      !email ||
      !phonenumber ||
      !name
    ) {
      throw new BadRequest("Please enter all fields");
    }
    const userEmail = await User.findOne({ email });
    const userPhoneNum = await User.findOne({ phoneNumber: phonenumber });
    if (userEmail || userPhoneNum) {
      throw new ValidationError(`This ${userEmail ? 'email' : 'mobile number'} already exists`);
    }
    const newUser = new User({
      email,
      name,
      phoneNumber: phonenumber
    });
    await newUser.save();
    return res.status(201).json({
      status: 1,
      message: "User Created Successfully!",
      newUser
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const adminId = req.headers.adminid || "";
    const users = await User.find({ createdAdminId: adminId }).select("-__v");
    return res
      .status(200)
      .json({ message: "fetched all users", users: users || [] });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

const editUser = async (req, res, next) => {
  const {
    userId,
    email,
    password,
    branchCode,
    googleMapLocation,
    houseNumber,
    streetAddress,
    phoneNumber,
    name,
    max_daily_order
  } = req.body;
  try {
    const user = await User.findById(userId).select("-__v");
    const userByEmail = await User.findOne({ email: email });
    const getBranchCode = await Admin.findOne({
      branchCode: { $regex: new RegExp(`^${branchCode}$`, 'i') },
    })

    const adminId = req.headers.adminid || "";
    // if (!getBranchCode) {
    //   throw new NotFound("Branch Not Found!");
    // }

    if (!user) {
      throw new NotFound("User Not Found!");
    }

    if (user.email !== email && userByEmail) {
      throw new ValidationError("This email is already taken");
    }

    if (user.password === password) {
      user.email = email;
      user.name = name;
      user.password = user.password;
      user.createdAdminId = !getBranchCode ? adminId : getBranchCode._id;
      user.branchCode = branchCode;
      user.googleMapLocation = googleMapLocation;
      user.houseNumber = houseNumber;
      user.streetAddress = streetAddress;
      user.phoneNumber = phoneNumber;
      user.max_daily_order = max_daily_order;

      const updatedUser = await user.save();
      return res.status(200).json({
        message: "user details updated sucessfully!",
        user: updatedUser,
      });
    } else {
      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(password, salt, async (err, hash) => {
          if (err) {
            throw new Error(err);
          }
          user.email = email;
          user.name = name;
          user.password = hash;
          user.createdAdminId = !getBranchCode ? adminId : getBranchCode._id;
          user.branchCode = branchCode;
          user.googleMapLocation = googleMapLocation;
          user.houseNumber = houseNumber;
          user.streetAddress = streetAddress;
          user.phoneNumber = phoneNumber;
          user.max_daily_order = max_daily_order;

          const updatedUser = await user.save();
          return res.status(200).json({
            message: "user details updated sucessfully!",
            user: updatedUser,
          });
        });
      });
    }
  } catch (error) {
    console.error(error);
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  const { userId } = req.params;
  try {
    const UserNeedsToBeDeleted = await User.findByIdAndDelete(userId);
    return res.status(200).json({
      message: "User Deleted Successfully!",
      result: UserNeedsToBeDeleted,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

function generateOtp() {
  const totalDigit = 6;
  const max = 999999;
  const min = 100000;
  const otp = Math.floor(Math.random() * (max - min + 1) + min);
  const otpNum = otp.toString().padStart(totalDigit, '0');
  return otpNum
}

const userLogin = async (req, res, next) => {
  const { phonenumber } = req.body;

  try {
    if (!phonenumber) {
      throw new BadRequest("Please enter mobile number!");
    }

    const user = await User.findOne({ phoneNumber: phonenumber });
    if (!user) {
      return res.status(404).json({ message: "This user does not exist" });
    }

    const getOtp = generateOtp();
    return res.status(200).json({ otp: getOtp, user })
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const initUser = async (req, res, next) => {
  try {
    const adminId = req.headers.adminid ?? "";
    const user = await User.findById(req.body.id).select("-password -__v");

    return res.status(200).json({
      user,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const forgotUserPassword = async (req, res, next) => {
  try {
    await verifyEmailAndSentOtp(req.body.email, false);

    res.json({});
  } catch (error) {
    next(error);
  }
};

const resetUserPassword = async (req, res, next) => {
  try {
    let user = await fetchUserFromEmailAndOtp(
      req.body.email,
      req.body.otp,
      false
    );
    await updatePassword(user._id, req.body.password, false);
    res.json({});
  } catch (error) {
    next(error);
  }
};

const updateUserAddress = async (req, res) => {
  try {
    const { userId, address, title } = req.body;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(500).json({ status: 0, message: 'Enter a valid user id' })
    }
    if (!userId || !address || !title)
      return res.status(500).json({ status: 0, message: 'Send the required fields' })
    const getUser = await User.findById(userId);
    if (!getUser) return res.status(404).json({ status: 0, message: 'User Not Found' })
    getUser.addresses.push({ address, title })
    await getUser.save()
    return res.status(200).json({ status: 1, messgae: 'New address added successfully' })

  } catch (error) {
    console.log('updateUserAddress:', error);
    return res.status(500).json({ status: 0, messgae: error })
  }
}

const getUserAddresses = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(500).json({ status: 0, message: 'Enter a valid user id' })
    }
    const getUser = await User.findById(userId);
    if (!getUser) return res.status(404).json({ status: 0, message: 'User Not Found' })
    return res.status(200).json({ status: 1, addresses: getUser.addresses })
  } catch (error) {
    console.log('getUserAddresses:', error);
    return res.status(500).json({ status: 0, messgae: error })
  }
}

module.exports = {
  registerUser,
  getAllUsers,
  editUser,
  deleteUser,
  userLogin,
  initUser,
  forgotUserPassword,
  resetUserPassword,
  updateUserAddress,
  getUserAddresses,
  generateOtp
};
