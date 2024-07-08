const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema(
    {
        restaurantId: {
            type: mongoose.Types.ObjectId,
            ref: 'Restaurant',
            required: [true, "Restaurant id is required"]
        },
        createdAdminId: {
            type: mongoose.Types.ObjectId,
            ref: 'Admin',
            required: [true, "Admin id is required"]
        },
        categoryName: {
            type: String, required: [true, "Category name is required"]
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Category', CategorySchema, 'categories')