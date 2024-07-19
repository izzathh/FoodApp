const jwt = require("jsonwebtoken");
const Admin = require("../models/admin.model");
const Orders = require("../models/orders.model");
const Category = require("../models/categories.model");
const SubCategory = require("../models/subcategories.model");
const Restaurant = require("../models/restaurants.model");
const { BadRequest, NotFound, ValidationError } = require("../utils/errors");
const { default: mongoose } = require("mongoose");
const moment = require("moment");
const { query, validationResult } = require("express-validator");

const adminLogin = async (req, res, next) => {
  const { username, password, rememberMe } = req.body;

  try {
    if (!username || !password) {
      throw new BadRequest("Please Enter all fields!");
    }

    const admin = await Admin.findOne({ username });

    if (admin.adminType === 'shop-admin' && !admin.adminApproved) {
      throw new ValidationError('Your application is not yet approved by admin, please be patient until that')
    }

    if (!admin) {
      return res.status(404).json({ message: "User does not exist" });
    }

    const checkPassword = password === admin.password;
    // const checkPassword = await bcrypt.compare(password, admin.password);
    if (!checkPassword) {
      throw new BadRequest("Invalid Credentials!");
    }

    const JwtSecretKey = process.env.JWT_SECRET;

    const payload = {
      id: admin._id,
      adminType: admin.adminType,
      restaurantId: admin.adminType === 'shop-admin' ? admin.restaurantId : null
    }
    jwt.sign(
      payload,
      JwtSecretKey,
      { expiresIn: rememberMe ? "60d" : '1h' },
      (err, token) => {
        if (err) {
          throw new Error(err);
        }
        admin.password = undefined;
        const options = rememberMe
          ? {
            maxAge: 30 * 24 * 60 * 60 * 1000,
            httpOnly: false,
            path: '/',
            sameSite: 'Strict',
            secure: false
          }
          : { httpOnly: false, path: '/', sameSite: 'Strict', secure: false };

        res.cookie('auth_token', token, options);
        res
          .status(200)
          .json({ status: 1, message: "You are logged in", token, admin });
      }
    );
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const adminLogout = (req, res) => {
  const options = { path: '/', sameSite: 'Strict', secure: false };
  res.clearCookie('auth_token', options);
  res.status(200).json({ message: 'Logged out successfully' })
}

const addNewRestaurant = async (req, res) => {
  try {
    const {
      address,
      city,
      category,
      subCategory,
      restaurantName,
      offer,
      veg,
      description,
      fullDescription
    } = req.body;

    const image = req.file;

    console.log('offer:', offer);

    const addRestaurant = new Restaurant({
      address,
      city,
      category,
      subCategory,
      restaurantName,
      offer,
      veg,
      description,
      fullDescription,
      adminApproved: true,
      image: 'data:image/png;base64,' + image.buffer.toString('base64')
    })

    await addRestaurant.save()

    return res.json({ status: 1, message: 'New restaurant added', restaurant: addRestaurant })

  } catch (error) {
    console.log('error:', error);
    return res.status(500).json({ status: 0, addRestaurant: 'Internal Server Error' });
  }
}

const getAllRestaurants = async (req, res) => {
  try {
    const getRestaurants = await Restaurant
      .find({ adminApproved: true })
    return res.json({
      status: 1,
      message: "Fetched all restaurants",
      data: {
        restaurants: getRestaurants
      }
    })
  } catch (error) {
    console.log('error:', error);
    return res.status(500).json({ status: 0, getAllRestaurants: 'Internal Server Error' });
  }
}

const getEditRestaurantData = async (req, res) => {
  try {
    const { id } = req.query
    const getRestaurants = await Restaurant
      .findById(id);
    return res.json({ status: 1, restaurantData: getRestaurants })
  } catch (error) {
    console.log('error:', error);
    return res.status(500).json({ status: 0, getEditRestaurantData: 'Internal Server Error' });
  }
}

const updateRestaurant = async (req, res) => {
  try {
    const {
      address,
      id,
      city,
      category,
      subCategory,
      restaurantName,
      offer,
      veg,
      description,
      fullDescription,
      image } = req.body;

    const updatedRestaurant = await Restaurant.findByIdAndUpdate(id,
      {
        address,
        city,
        category,
        subCategory,
        restaurantName,
        image,
        offer,
        veg,
        description,
        fullDescription
      }, { new: true });

    if (!updatedRestaurant) {
      return res.status(404).json({ status: 0, message: 'Restaurant not found' });
    }

    return res.json({
      status: 1,
      message: 'Restaurant updated successfully',
      updatedRes: updatedRestaurant,
    });

  } catch (error) {
    console.log('error:', error);
    return res.status(500).json({ status: 0, updateRestaurant: 'Internal Server Error' });
  }
}

const deleteRestaurant = async (req, res, next) => {
  try {
    const { id } = req.query;
    await Restaurant.findByIdAndDelete(id);
    await Admin.findOneAndDelete({ restaurantId: id });
    await Orders.deleteMany({ restaurantId: id });
    return res.json({
      status: 1,
      message: 'Resturant deleted successfully'
    })
  } catch (error) {
    console.log('error:', error);
    next(error);
  }
}

const addMenuItems = async (req, res) => {
  try {
    const {
      itemName,
      description,
      fullDescription,
      offer,
      price,
      address,
      veg,
      restaurantId } = req.body;
    console.log('offer:', offer);
    const image = req.file

    const updatedRestaurant = await Restaurant.findById(restaurantId);
    const itemId = updatedRestaurant.menu.length + 1
    updatedRestaurant.menu.push({
      id: itemId,
      itemName,
      description,
      fullDescription,
      offer: offer || null,
      price,
      address,
      rating: '0.0',
      delivery: true,
      veg,
      image: 'data:image/png;base64,' + image.buffer.toString('base64')
    })
    await updatedRestaurant.save();

    return res.json({
      status: 1,
      message: 'Item added successfully',
      updatedRestaurant
    })

  } catch (error) {
    console.log('addMenuItems:', error);
    return res.status(500).json({
      status: 0,
      message: 'Internal server error'
    })
  }
}

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const editMenuItems = async (req, res) => {
  try {
    const {
      itemName,
      description,
      fullDescription,
      offer,
      price,
      veg,
      image,
      restaurantId,
      menuId
    } = req.body;
    if (!isValidObjectId(restaurantId)) {
      return res.status(400).json({ status: 0, message: 'Invalid restaurant ID' });
    }
    const restaurantObjectId = mongoose.Types.ObjectId(restaurantId);
    const menuItems = await Restaurant.updateOne(
      {
        _id: restaurantObjectId,
        'menu.id': Number(menuId)
      },
      {
        $set: {
          'menu.$.itemName': itemName,
          'menu.$.description': description,
          'menu.$.fullDescription': fullDescription,
          'menu.$.offer': offer,
          'menu.$.price': price,
          'menu.$.veg': veg,
          'menu.$.image': image
        }
      }
    );

    return res.json({ status: 1, message: 'Menu updated successfully', updated: menuItems })

  } catch (error) {
    console.log('editMenuItems:', error);
    return res.status(500).json({ status: 0, message: "Can't Menu updated successfully" })
  }
}

const deleteMenuItem = async (req, res) => {
  try {
    const { restaurantId, menuId } = req.body;
    const result = await Restaurant.updateOne(
      { _id: mongoose.Types.ObjectId(restaurantId) },
      { $pull: { menu: { id: menuId } } }
    )
    return res.json({ status: 1, message: 'Menu item deleted successfully', result })
  } catch (error) {
    console.log('deleteMenuItem:', error);
    return res.status(500).json({ status: 0, message: 'Error deleting menu item' })
  }
}

const registerRestaurant = async (req, res) => {
  try {
    const {
      email,
      password,
      username,
      address,
      city,
      restaurantName,
      image,
      offer,
      veg,
      description,
      fullDescription
    } = req.body;

    const findEmail = await Admin.findOne({ email });
    const findUsername = await Admin.findOne({ username });
    if (findEmail) {
      return res.json({
        status: 0,
        message: "This email already exist"
      })
    }
    if (findUsername) {
      return res.json({
        status: 0,
        message: 'This username is already taken'
      })
    }
    const newRestaurant = new Restaurant({
      address,
      city,
      restaurantName,
      image,
      offer,
      veg,
      description,
      fullDescription
    })

    await newRestaurant.save()

    const newAdmin = new Admin({
      email,
      password,
      username,
      adminType: 'shop-admin',
      restaurantId: mongoose.Types.ObjectId(newRestaurant._id),
      registeredAt: moment().format('YYYY-MM-DD HH:mm:ss'),
    })

    await newAdmin.save();

    return res.json({
      status: 1,
      message: "Restaurant registered successfully, please wait for the admin's approval"
    })

  } catch (error) {
    console.log('error:', error);
    return res.status(500).json({ status: 0, message: 'Error registering restaurant', error })
  }
}

const getRestaurantRequests = async (req, res) => {
  try {
    const { admin, restaurantId } = req.query;
    const getRestaurants = admin === '1'
      ? await Admin.find({ adminApproved: false, restaurantDeclined: false })
      : await Restaurant.find({ adminApproved: false, _id: restaurantId })
    if (getRestaurants.length > 0) return res.json({ status: 1, restaurants: getRestaurants })
    return res.json({ status: 0, message: 'No current requests' })
  } catch (error) {
    console.log('getRestaurantRequests:', error);
    return res.status(500).json({ status: 0, message: 'get restaurant requests', error })
  }
}

const updateRestaurantStatus = async (req, res) => {
  try {
    const { adminId, restaurantId, adminApproved } = req.body;
    const update = adminApproved
      ? { adminApproved }
      : { restaurantDeclined: true }
    const updatedAdmin = await Admin.findByIdAndUpdate(adminId, {
      $set: update
    })
    const updateRestaurant = await Restaurant.findByIdAndUpdate(restaurantId, {
      $set: { adminApproved }
    }, { new: true })

    if (updatedAdmin && updateRestaurant)
      return res.json({ status: 1, message: 'Restaurant status updated', updateRestaurant })
    return res.json({ status: 0, message: 'Cannot update restaurant status' })
  } catch (error) {
    console.log('updateRestaurantStatus:', error);
    return res.status(500).json({ status: 0, message: 'Error updating restaurant status', error })
  }
}

const getRestaurantDishes = [
  query('restaurantId').notEmpty().withMessage('restaurant id is required'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      const { restaurantId } = req.query;
      if (!errors.isEmpty() || !mongoose.Types.ObjectId.isValid(restaurantId)) {
        throw new ValidationError(!errors.isEmpty() ? errors.array() : 'Invalid restaurant id')
      }
      const getDishes = await Restaurant.findById(restaurantId).select('menu');
      if (!getDishes) {
        throw new NotFound('Restaurant not found')
      }
      return res.status(200).json({
        status: 1,
        message: 'Dishes fetched successfully',
        dishes: getDishes
      })
    } catch (error) {
      console.log('getRestaurantDishes:', error);
      next(error);
    }
  }
]

const addNewCategory = async (req, res, next) => {
  try {
    const { restaurantId, categoryName, createdAdminId } = req.body

    const addNewCategory = new Category({
      restaurantId,
      createdAdminId,
      categoryName
    })

    await addNewCategory.save();

    return res.status(200).json({
      status: 1,
      message: 'New category added',
      category: addNewCategory
    })

  } catch (error) {
    console.log('addNewCategory:', error);
    next(error);
  }
}

const getAllCategories = async (req, res, next) => {
  try {
    const { restaurantId } = req.params
    const getCatgories = await Category.find({ restaurantId });
    if (!getCatgories) {
      throw new NotFound('Restaurant not found');
    }
    return res.status(200).json({ status: 1, message: 'Fetched all categories', categories: getCatgories })
  } catch (error) {
    console.log('getAllCategories:', error);
    next(error);
  }
}

const deleteCategory = async (req, res, next) => {
  try {
    const { categoryId, restaurantId } = req.body;
    await Category.findByIdAndDelete(categoryId);
    await SubCategory.findOneAndDelete({ categoryId });
    const getRestaurantMenu = await Restaurant.updateOne(
      { _id: mongoose.Types.ObjectId(restaurantId) },
      { $pull: { menu: { categoryId } } }
    );
    console.log('getRestaurantMenu:', getRestaurantMenu);
    return res.status(200).json({ status: 1, message: 'Category deleted successfully' })
  } catch (error) {
    console.log('deleteCategory:', error);
    next(error);
  }
}

const updateCategory = async (req, res, next) => {
  try {
    const {
      categoryId,
      categoryName
    } = req.body
    await Category.findByIdAndUpdate(categoryId, {
      $set: { categoryName }
    })
    await SubCategory.updateMany({ categoryId }, {
      $set: { categoryName }
    })
    return res.status(200).json({ status: 1, message: 'Category name updated' })
  } catch (error) {
    console.log('updateCategory:', error);
    next(error);
  }
}

const getAllSubCategories = async (req, res, next) => {
  try {
    const { restaurantId } = req.params
    const getSubCatgories = await SubCategory.find({ restaurantId });
    if (!getSubCatgories) {
      throw new NotFound('Restaurant not found');
    }
    return res.status(200).json({
      status: 1,
      message: 'Fetched all sub categories',
      subcategories: getSubCatgories
    })
  } catch (error) {
    console.log('getAllSubCategories:', error);
    next(error);
  }
}
module.exports = {
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
  getAllSubCategories
};
