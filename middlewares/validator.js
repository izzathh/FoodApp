const { query, body, param, validationResult } = require('express-validator');
const { ValidationError } = require('../utils/errors');

const validate = (method) => {
    const options = {
        'deleteRestaurant': [
            query('id')
                .notEmpty().withMessage('Restaurant id is required')
                .isMongoId().withMessage('Invalid restaurant id')
        ],
        'addCategory': [
            body('restaurantId')
                .notEmpty().withMessage('Restaurant id is required')
                .isMongoId().withMessage('Invalid restaurant id'),
            body('createdAdminId')
                .notEmpty().withMessage('Admin id is required')
                .isMongoId().withMessage('Invalid admin name'),
            body('categoryName')
                .notEmpty().withMessage('Category name is required')
                .isString().withMessage('Invalid category name')
        ],
        'getCategory': [
            param('restaurantId')
                .notEmpty().withMessage('Restaurant id is required')
                .isMongoId().withMessage('Invalid restaurant id')
        ],
        "dpLogin": [
            body('phoneNumber')
                .notEmpty().withMessage('phoneNumber is required')
                .isMobilePhone().withMessage('Invalid mobile number'),
            body('fcmToken')
                .notEmpty().withMessage('fcmToken is required')
                .isString().withMessage("Invalid FCM token"),
        ],
        "deleteCategory": [
            body('categoryId')
                .notEmpty().withMessage('Category id is required')
                .isMongoId().withMessage('Invalid category id'),
            body('restaurantId')
                .notEmpty().withMessage('Restaurant id is required')
                .isMongoId().withMessage('Invalid restaurant id')

        ],
        "updateCategory": [
            body('categoryId')
                .notEmpty().withMessage('Category id is required')
                .isMongoId().withMessage('Invalid category id'),
            body('categoryName')
                .notEmpty().withMessage('Category name is required')
                .isString().withMessage('Category name must be a string')
        ],
        "addSubCategory": [
            body('restaurantId')
                .notEmpty().withMessage('Restaurant id is required')
                .isMongoId().withMessage('Invalid restaurant id'),
            body('subCategoryName')
                .notEmpty().withMessage('Sub category name is required')
                .isString().withMessage('Sub category name must be a string'),
            body('categoryName')
                .notEmpty().withMessage('Category name is required')
                .isString().withMessage('Category name must be a string'),
            body('categoryId')
                .notEmpty().withMessage('Category id is required')
                .isMongoId().withMessage('Invalid category id'),
            body('createdAdminId')
                .notEmpty().withMessage('Created admin id is required')
                .isMongoId().withMessage('Invalid admin id'),
        ],
        "deleteSubCategory": [
            body('restaurantId')
                .notEmpty().withMessage('Restaurant id is required')
                .isMongoId().withMessage('Invalid restaurant id'),
            body('subCategoryId')
                .notEmpty().withMessage('Sub category id is required')
                .isMongoId().withMessage('Invalid sub category id')
        ],
        "acceptOrder": [
            body('_id')
                .notEmpty().withMessage('Unique order id is required')
                .isMongoId().withMessage('Invalid order id'),
            body('deliveryPeopleId')
                .notEmpty().withMessage('Delivery people id is required')
                .isMongoId().withMessage('Invalid delivery people id'),
        ]
    }
    return options[method] || []
}

const handleValidation = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new ValidationError(errors.array())
        }
        next();
    } catch (error) {
        next(error)
    }
}

module.exports = { validate, handleValidation }