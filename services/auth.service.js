const bcrypt = require("bcryptjs");
const { BadRequest } = require("../utils/errors");
const otpGenerator = require("otp-generator");
const ResetPassword = require("../models/resetPassword.model");
const User = require("../models/user.model");
const Admin = require("../models/admin.model");
const nodemailer = require("nodemailer")

const verifyEmailAndSentOtp = async (email, isAdmin) => {
  console.log("email-->", email);
  const user = isAdmin
    ? await Admin.findOne({
      email: email,
    })
      .select("email")
      .lean({ getters: true })
    : await User.findOne({
      email: email,
    })
      .select("email")
      .lean({ getters: true });

  if (!user) throw new BadRequest("Invalid email");

  const otp = isAdmin
    ? otpGenerator.generate(12, {
      lowerCaseAlphabets: false,
      upperCaseAlphabets: true,
      specialChars: false,
      digits: false
    })
    : otpGenerator.generate(9, {
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
      specialChars: false,
    });
  await ResetPassword.findOneAndUpdate(
    { user: user._id },
    { otp: otp, created: new Date(), used: false },
    { upsert: true }
  );

  let transporter = nodemailer.createTransport({
    host: 'smtp.googlemail.com',
    port: 587,
    secure: false,
    auth: {
      user: 'developer@itflexsolutions.com',
      pass: 'ITFPass@2022#DeV'
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  let mailOptions = {
    from: 'developer@itflexsolutions.com',
    to: email,
    subject: 'OTP for reset password',
    html: `The OTP for resetting your password is <strong>${otp}</strong> Please note that this otp is only valid for 15 minutes.`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error occurred:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });
};

const updatePassword = async (userId, newPassword, isAdmin) => {
  let newHash = await bcrypt.hash(newPassword, 10);

  isAdmin
    ? await Admin.findOneAndUpdate(
      {
        _id: userId,
      },
      {
        password: newHash,
      },
      {
        new: true,
        select: "name email",
      }
    )
    : await User.findOneAndUpdate(
      {
        _id: userId,
      },
      {
        password: newHash,
      },
      {
        new: true,
        select: "name email",
      }
    );
};

const fetchUserFromEmailAndOtp = async (email, otp, isAdmin) => {
  const user = isAdmin
    ? await Admin.findOne({
      email: email,
    })
      .select("_id")
      .lean({ getters: true })
    : await User.findOne({
      email: email,
    })
      .select("_id")
      .lean({ getters: true });

  if (!user) throw new BadRequest("Invalid email");

  let resetPasswordOtpDoc = await ResetPassword.findOneAndUpdate(
    {
      user: user._id,
      otp: otp,
      used: false,
      created: { $gte: Date.now() - 15 * 60 * 1000 }, //must be created in last 15min
    },
    {
      used: true,
    }
  );

  if (!resetPasswordOtpDoc) throw new BadRequest("Invalid/expired otp");

  return user;
};

module.exports = {
  verifyEmailAndSentOtp,
  updatePassword,
  fetchUserFromEmailAndOtp,
};
