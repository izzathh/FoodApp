const express = require("express");
const router = express.Router();

const {
  getAllRestaurants,
} = require("../controllers/admin.controller");
const { handleValidation, validate } = require('../middlewares/validator')

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

router.route("/user-register")
  .all(validate('userRegister'))
  .all(handleValidation)
  .post(upload.any(), registerUser);

router.route("/user-login")
  .all(validate('userLogin'))
  .all(handleValidation)
  .post(upload.any(), userLogin);

router.route("/get-all-restaurants").get(getAllRestaurants)

router.route("/add-new-address")
  .all(validate('addNewAddress'))
  .all(handleValidation)
  .post(updateUserAddress);

router.route("/get-all-address")
  .all(validate('getAllAddress'))
  .all(handleValidation)
  .get(getUserAddresses);

router.route("/change-default-address")
  .all(validate('changeDefaultAddress'))
  .all(handleValidation)
  .post(changeUserDefaultAddress)

module.exports = router;
