const User = require("../models/user.model");
const { BadRequest, ValidationError } = require("../utils/errors");
const { default: mongoose } = require("mongoose");

const registerUser = async (req, res, next) => {
  try {
    const {
      name,
      email,
      phonenumber,
      address,
      latlng
    } = req.body;
    if (
      !email ||
      !phonenumber ||
      !name ||
      !address ||
      !latlng
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
      phoneNumber: phonenumber,
      addresses: [{ address, title: 'home', default: true, latlng }]
    });
    await newUser.save();
    return res.status(201).json({
      status: 1,
      message: "User Created Successfully!",
      data: {
        newUser
      }
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
      return res.status(404).json({ status: 0, message: "This user does not exist", data: null });
    }

    const getOtp = generateOtp();
    return res.status(200).json({
      status: 1,
      message: 'Logged in successfully',
      data: {
        otp: getOtp,
        user
      }
    })
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const updateUserAddress = async (req, res) => {
  try {
    const { userId, address, title, latlng } = req.body;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(500).json({ status: 0, message: 'Enter a valid user id' })
    }
    if (!userId || !address || !title || !latlng)
      return res.status(500).json({ status: 0, message: 'Send the required fields' })

    const getUser = await User.findById(userId);

    if (!getUser) return res.status(404).json({ status: 0, message: 'User Not Found' })
    const isExistingAdd = getUser.addresses.filter(exist => exist.address == address)
    if (isExistingAdd.length > 0)
      return res.status(200).json({ status: 0, message: 'Please select a new address' })

    getUser.addresses.push({ address, title, default: true, latlng })
    getUser.addresses.map(adrs => {
      if (adrs.default && adrs.address != address) adrs.default = false
    });
    await User.findByIdAndUpdate(getUser._id, {
      $set: { addresses: getUser.addresses }
    })
    return res.status(200).json({
      status: 1,
      message: 'New address added successfully',
      data: {
        addresses: getUser.addresses
      }
    })

  } catch (error) {
    console.log('updateUserAddress:', error);
    return res.status(500).json({ status: 0, message: error })
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
    return res.status(200).json({
      status: 1,
      message: "Fetched user addresses successfully",
      addresses: getUser.addresses
    })
  } catch (error) {
    console.log('getUserAddresses:', error);
    return res.status(500).json({ status: 0, message: error })
  }
}

const changeUserDefaultAddress = async (req, res, next) => {
  try {
    const { userId, addressId } = req.body;
    if (!userId || !addressId)
      return res.status(500).json({ status: 0, message: 'Send the required fields' })
    const getUser = await User.findById(userId)
    if (!getUser) return res.status(404).json({ status: 0, message: 'User Not Found' })
    getUser.addresses.map(adrs => {
      if (adrs.default) adrs.default = false
    })
    getUser.addresses[addressId].default = true
    await User.findByIdAndUpdate(userId, {
      $set: { addresses: getUser.addresses }
    })
    return res.status(200).json({
      status: 1,
      message: 'New default address updated successfully',
      data: {
        addresses: getUser.addresses
      }
    })
  } catch (error) {
    console.log('changeUserDefaultAddress:', error);
    next(error);
  }
}

module.exports = {
  registerUser,
  userLogin,
  updateUserAddress,
  getUserAddresses,
  generateOtp,
  changeUserDefaultAddress
};
