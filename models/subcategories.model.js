const mongoose = require('mongoose');

const SubCategorySchema = new mongoose.Schema(
    {
        restaurantId: {
            type: mongoose.Types.ObjectId,
            ref: 'Restaurant',
            required: [true, "Restaurant id is required"]
        },
        categoryId: {
            type: mongoose.Types.ObjectId,
            ref: 'Restaurant',
            required: [true, "Category id is required"]
        },
        createdAdminId: {
            type: mongoose.Types.ObjectId,
            ref: 'Admin',
            required: [true, "Admin id is required"]
        },
        categoryName: {
            type: String, required: [true, "category name is required"]
        },
        subCategoryName: {
            type: String, required: [true, "Sub-category name is required"]
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Subcategory', SubCategorySchema, 'subcategories')