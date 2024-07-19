const express = require("express");
const router = express.Router();

const {
  getAllRestaurants,
} = require("../controllers/admin.controller");

const {
  registerUser,
  userLogin,
  updateUserAddress,
  getUserAddresses,
  changeUserDefaultAddress
} = require("../controllers/user.controller");

const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.route("/user-register").post(upload.any(), registerUser);

router.route("/user-login").post(upload.any(), userLogin);

router.route("/get-all-restaurants").get(getAllRestaurants)

router.route("/add-new-address").post(updateUserAddress);

router.route("/get-all-address").get(getUserAddresses);

router.route("/change-default-address").post(changeUserDefaultAddress);

module.exports = router;
