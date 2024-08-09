const express = require("express");
const router = express.Router();
const {
  adminLogin,
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
  updateRestaurantStatus,
  getRestaurantDishes,
  addNewCategory,
  getAllCategories,
  deleteCategory,
  updateCategory,
  getAllSubCategories,
  addNewSubCategory,
  deleteSubCategory,
  updateSubCategory
} = require("../controllers/admin.controller");
const multer = require('multer');
const { validate, handleValidation } = require("../middlewares/validator");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.route("/login").post(adminLogin);

router.route("/logout").post(adminLogout);

router.route("/add-restaurant").post(upload.single('image'), addNewRestaurant)

router.route("/delete-restaurant")
  .all(validate('deleteRestaurant'))
  .all(handleValidation)
  .delete(deleteRestaurant)

router.route("/edit-restaurant").post(upload.any(), updateRestaurant)

router.route("/get-all-restaurants").get(getAllRestaurants)

router.route("/get-edit-restaurant-data").get(getEditRestaurantData)

router.route("/add-menu-items").post(upload.single('image'), addMenuItems)

router.route("/edit-menu-items").post(upload.any(), editMenuItems)

router.route("/delete-menu-item").delete(deleteMenuItem)

router.route("/register-restaurant").post(upload.any(), registerRestaurant)

router.route("/get-restaurant-requests").get(getRestaurantRequests);

router.route("/update-restaurant-status").post(updateRestaurantStatus);

router.route("/get-restaurant-dishes").get(getRestaurantDishes);

router.route("/add-new-category")
  .all(validate('addCategory'))
  .all(handleValidation)
  .post(addNewCategory);

router.route("/get-all-categories/:restaurantId")
  .all(validate('getCategory'))
  .all(handleValidation)
  .get(getAllCategories);

router.route("/update-category")
  .all(validate('updateCategory'))
  .all(handleValidation)
  .post(updateCategory);

router.route("/delete-category")
  .all(validate('deleteCategory'))
  .all(handleValidation)
  .delete(deleteCategory);

router.route("/get-all-subcategories/:restaurantId")
  .all(validate('getCategory'))
  .all(handleValidation)
  .get(getAllSubCategories);

router.route("/add-new-subcategory")
  .all(validate('addSubCategory'))
  .all(handleValidation)
  .post(addNewSubCategory);

router.route("/delete-sub-category")
  .all(validate('deleteSubCategory'))
  .all(handleValidation)
  .delete(deleteSubCategory);

router.route("/update-sub-category")
  .all(validate('updateSubCategory'))
  .all(handleValidation)
  .post(updateSubCategory)

module.exports = router;
