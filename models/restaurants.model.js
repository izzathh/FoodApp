const mongoose = require('mongoose');

const RestaurantSchema = new mongoose.Schema(
    {
        address: { type: String, required: true },
        city: { type: String, required: true },
        categoryId: { type: mongoose.Types.ObjectId },
        subCategoryId: { type: mongoose.Types.ObjectId },
        restaurantName: { type: String, required: true },
        image: { type: String, default: 'none' },
        deliveryTime: { type: String, default: '0-0mins' },
        delivery: { type: Boolean, default: true },
        rating: { type: String, default: '0.0' },
        offer: { type: String, default: "" },
        veg: { type: Boolean, default: false },
        description: { type: String, required: true },
        fullDescription: { type: String, required: true },
        coordinates: { type: String, required: true },
        menu: { type: Array, default: [] },
        adminId: {
            type: mongoose.Types.ObjectId,
            ref: 'Admin'
        },
        adminApproved: { type: Boolean, default: false }
    },
    {
        timestamps: true
    }
)

module.exports = mongoose.model("Restaurant", RestaurantSchema, "restaurants")