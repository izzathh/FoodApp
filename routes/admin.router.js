const express = require("express");
const router = express.Router();
const {
  checkIsSuperAdmin,
  checkIsCeoOrSuperAdmin,
  checkIsCeo,
  checkIsSalesAdmin,
} = require("../middlewares/checkRole");
const {
  registerAdmin,
  adminLogin,
  initAdmin,
  changePassword,
  forgotPassword,
  resetPassword,
  editAdminDetails,
  adminLogout,
  addNewRestaurant,
  getAllRestaurants,
  getEditRestaurantData,
  updateRestaurant,
  deleteRestaurant,
  addMenuItems,
  editMenuItems,
  deleteMenuItem,
  registerRestaurant,
  getRestaurantRequests,
  updateRestaurantStatus
} = require("../controllers/admin.controller");
const checkAuth = require("../middlewares/checkAuth");
const checkAdmin = require("../middlewares/checkAdmin");
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
// Admin Register
router
  .route("/register-admin")
  .all(checkAuth)
  .all(checkIsCeoOrSuperAdmin)
  .post(registerAdmin);

//Admin Login
router.route("/login").post(adminLogin);

router.route("/logout").post(adminLogout);
//Init admin
router.route("/init").all(checkAdmin).post(initAdmin);

router.route("/add-restaurant").post(upload.single('image'), addNewRestaurant)

router.route("/delete-restaurant").delete(deleteRestaurant)

router.route("/edit-restaurant").post(upload.any(), updateRestaurant)

router.route("/get-all-restaurants").get(getAllRestaurants)

router.route("/get-edit-restaurant-data").get(getEditRestaurantData)

router.route("/add-menu-items").post(upload.single('image'), addMenuItems)

router.route("/edit-menu-items").post(upload.any(), editMenuItems)

router.route("/delete-menu-item").delete(deleteMenuItem)

router.route("/register-restaurant").post(upload.any(), registerRestaurant)

router.route("/get-restaurant-requests").get(getRestaurantRequests);

router.route("/update-restaurant-status").post(updateRestaurantStatus);

// Init Sales Admin
router
  .route("/sales-admin-init")
  .all(checkIsSalesAdmin)
  .all(checkAdmin)
  .post(initAdmin);

//Change Password
router.route("/change-password").all(checkAdmin).post(changePassword);

// Generate OTP for forgot password
router.route("/generate-otp").post(forgotPassword);

// validate OTP and reset password
router.route("/reset-password").post(resetPassword);

// Edit admin Details
router
  .route("/edit-admin-details")
  .all(checkAdmin)
  .all(checkIsSuperAdmin)
  .post(editAdminDetails);

module.exports = router;
