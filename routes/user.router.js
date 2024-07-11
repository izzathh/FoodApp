const express = require("express");
const router = express.Router();

const {
  getAllRestaurants,
} = require("../controllers/admin.controller");

const {
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
  changeUserDefaultAddress
} = require("../controllers/user.controller");
const checkAdmin = require("../middlewares/checkAdmin");
const checkAuth = require("../middlewares/checkAuth");
const {
  checkIsSuperAdmin,
  checkIsSuperOrSalesAdmin,
} = require("../middlewares/checkRole");
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
//Register user - by sales/super admin
router
  .route("/admin/register-user")
  .all(checkAdmin)
  .all(checkIsSuperOrSalesAdmin)
  .post(registerUser);

// list all users created by admin
router
  .route("/admin/list-users")
  .all(checkAdmin)
  .all(checkIsSuperAdmin)
  .get(getAllUsers);

//Edit a user
router
  .route("/admin/edit-user")
  .all(checkAdmin)
  .all(checkIsSuperAdmin)
  .post(editUser);

//Delete a user
router
  .route("/admin/:userId/delete-user")
  .all(checkAdmin)
  .all(checkIsSuperAdmin)
  .delete(deleteUser);

router.route("/user-register").post(upload.any(), registerUser);
// User Login
router.route("/user-login").post(upload.any(), userLogin);
// Init User
router.route("/user/init").all(checkAuth).post(initUser);

//Generate OTP
router.route("/user/generate-otp").post(forgotUserPassword);

router.route("/get-all-restaurants").get(getAllRestaurants)

router.route("/user/reset-password").post(resetUserPassword);

router.route("/add-new-address").post(updateUserAddress);

router.route("/get-all-address").get(getUserAddresses);

router.route("/change-default-address").post(changeUserDefaultAddress);

// new changes
module.exports = router;
