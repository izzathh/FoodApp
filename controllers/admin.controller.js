const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { default: validator } = require("validator");
const Admin = require("../models/admin.model");
const Restaurant = require("../models/restaurants.model");
const { BadRequest, NotFound, ValidationError } = require("../utils/errors");
const {
  verifyEmailAndSentOtp,
  updatePassword,
  fetchUserFromEmailAndOtp,
} = require("../services/auth.service");
const { default: mongoose } = require("mongoose");

const registerAdmin = async (req, res, next) => {
  const { email, password, branchName, branchCode, adminType } = req.body;
  const adminId = req.headers.adminid || "";
  try {

    if (!email || !password || !adminType) {
      throw new BadRequest("Missing required fields");
    }
    if (!validator.isEmail(email)) {
      throw new BadRequest("Please enter a valid email");
    }

    const isUserAlreadyFound = await Admin.findOne({ email });

    if (adminType === "super") {
      const isBranchCodeAlreadyFound = await Admin.findOne({
        branchCode: { $regex: new RegExp(`^${branchCode}$`, 'i') },
      });
      if (isBranchCodeAlreadyFound) {
        throw new BadRequest("Branch code exists");
      }
    }

    if (isUserAlreadyFound) {
      throw new BadRequest("Admin already exists");
    }

    const newAdmin = new Admin({
      email,
      password,
      adminType,
      createdAdminId: adminId,
    });

    if (adminType === "super") {
      newAdmin.branchCode = branchCode
      newAdmin.branchName = branchName
    }

    const initialStartTime = new Date().setHours(0, 0, 0, 0);
    const initialEndTime = new Date().setHours(23, 59, 59, 999);

    bcrypt.genSalt(10, (err, salt) => {
      if (err) {
        throw new Error(err);
      }
      bcrypt.hash(newAdmin.password, salt, async (err, hash) => {
        if (err) {
          throw new Error(err);
        }
        newAdmin.password = hash;
        const savedUser = await newAdmin.save();

        jwt.sign(
          { id: savedUser._id },
          process.env.JWT_SECRET,
          { expiresIn: "90d" },
          (err, token) => {
            if (err) {
              throw new Error(err);
            }
            savedUser.__v = undefined;
            savedUser.password = undefined;
            res.status(201).json({
              message: "Admin created Successfully",
              token,
              user: savedUser,
            });
          }
        );
      });
    });
  } catch (error) {
    next(error);
  }
};

const adminLogin = async (req, res, next) => {
  const { username, password, rememberMe } = req.body;

  try {
    if (!username || !password) {
      throw new BadRequest("Please Enter all fields!");
    }

    const admin = await Admin.findOne({ username });

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
          .json({ message: "You are logged in", token, admin });
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

const initAdmin = async (req, res, next) => {
  try {

    const admin = await Admin.findById(req.body.id).select("-password -__v");

    if (!admin) {
      return res.status(404).json({ message: "Admin does not exist" });
    }

    return res.status(200).json({
      admin
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new BadRequest("Please Enter all fields!");
    }
    if (!validator.isEmail(email)) {
      throw new BadRequest("Please enter a valid email");
    }
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({ message: "User does not exist" });
    }

    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(password, salt, async (err, hash) => {
        if (err) {
          throw new Error(err);
        }
        admin.password = hash;
        const savedUser = await admin.save();
        savedUser.password = undefined;
        return res.status(201).json({
          message: "User Created Successfully!",
          user: savedUser,
        });
      });
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    await verifyEmailAndSentOtp(req.body.email, true);
    res.json({ message: 'Otp sent successfully' });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    let user = await fetchUserFromEmailAndOtp(
      req.body.email,
      req.body.otp,
      true
    );
    await updatePassword(user._id, req.body.password, true);
    res.json({});
  } catch (error) {
    next(error);
  }
};

const editAdminDetails = async (req, res, next) => {
  try {
    const { editAdminId, email, password, adminType } = req.body;
    const admin = await Admin.findById(editAdminId);
    const adminByEmail = await Admin.findOne({ email: email });

    if (!admin) {
      throw new NotFound("Admin not found!");
    }

    if (admin.email !== email && adminByEmail) {
      throw new ValidationError("This email is already taken");
    }

    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(password, salt, async (err, hash) => {
        if (err) {
          throw new Error(err);
        }
        admin.email = email;
        admin.adminType = adminType;
        admin.password = hash;

        const updatedUser = await admin.save();
        return res.status(200).json({
          message: "user details updated sucessfully!",
          user: updatedUser,
        });
      });
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

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
      image: 'data:image/png;base64,' + image.buffer.toString('base64')
    })

    await addRestaurant.save()

    return res.json({ status: '1', message: 'New restaurant added', restaurant: addRestaurant })

  } catch (error) {
    console.log('error:', error);
    return res.status(500).json({ addRestaurant: 'Internal Server Error' });
  }
}

const getAllRestaurants = async (req, res) => {
  try {
    const getRestaurants = await Restaurant
      .find({ adminApproved: true })
    return res.json({ restaurants: getRestaurants })
  } catch (error) {
    console.log('error:', error);
    return res.status(500).json({ getAllRestaurants: 'Internal Server Error' });
  }
}

const getEditRestaurantData = async (req, res) => {
  try {
    const { id } = req.query
    const getRestaurants = await Restaurant
      .findById(id);
    return res.json({ restaurantData: getRestaurants })
  } catch (error) {
    console.log('error:', error);
    return res.status(500).json({ getEditRestaurantData: 'Internal Server Error' });
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
      return res.status(404).json({ status: '0', message: 'Restaurant not found' });
    }

    return res.json({
      status: '1',
      message: 'Restaurant updated successfully',
      updatedRes: updatedRestaurant,
    });

  } catch (error) {
    console.log('error:', error);
    return res.status(500).json({ updateRestaurant: 'Internal Server Error' });
  }
}

const deleteRestaurant = async (req, res) => {
  try {
    const { id } = req.query;
    await Restaurant.findByIdAndDelete(id);
    return res.json({
      status: '1',
      message: 'Resturant deleted successfully'
    })
  } catch (error) {
    console.log('error:', error);
    return res.status(500).json({ deleteRestaurant: 'Internal Server Error' });
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
      status: '1',
      message: 'Item added successfully',
      updatedRestaurant
    })

  } catch (error) {
    console.log('addMenuItems:', error);
    return res.status(500).json({
      status: '0',
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
      return res.status(400).json({ status: '0', message: 'Invalid restaurant ID' });
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

    return res.json({ status: '1', message: 'Menu updated successfully', updated: menuItems })

  } catch (error) {
    console.log('editMenuItems:', error);
    return res.status(500).json({ status: '0', message: "Can't Menu updated successfully" })
  }
}

const deleteMenuItem = async (req, res) => {
  try {
    const { restaurantId, menuId } = req.body;
    const result = await Restaurant.updateOne(
      { _id: mongoose.Types.ObjectId(restaurantId) },
      { $pull: { menu: { id: menuId } } }
    )

    return res.json({ status: '1', message: 'Menu item deleted successfully', result })
  } catch (error) {
    console.log('deleteMenuItem:', error);
    return res.status(500).json({ status: '0', message: 'Error deleting menu item' })
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
    if (findEmail) {
      return res.json({
        status: 0,
        message: "This email already exist"
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
      restaurantId: mongoose.Types.ObjectId(newRestaurant._id)
    })

    await newAdmin.save()

    return res.json({
      status: 1,
      message: "Restaurant registered successfully, please wait for the admin's approval"
    })

  } catch (error) {
    console.log('error:', error);
    return res.status(500).json({ status: '0', message: 'Error registering restaurant', error })
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
    })
    if (updatedAdmin && updateRestaurant)
      return res.json({ status: 1, message: 'Restaurant status updated' })
    return res.json({ status: 0, message: 'Cannot update restaurant status' })
  } catch (error) {
    console.log('updateRestaurantStatus:', error);
    return res.status(500).json({ status: 0, message: 'Error updating restaurant status', error })
  }
}

module.exports = {
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
};
