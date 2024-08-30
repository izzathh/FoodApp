const express = require('express')
const router = express.Router()

const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const { handleValidation, validate } = require('../middlewares/validator')

const {
    placeOrder,
    getPendingOrders,
    updateOrderStatus,
    getRestaurantOrderList,
    deleteOrder,
    getUserOrders,
    otherOrderCharges
} = require('../controllers/orders.controller');

router.route('/place-order').post(upload.any(), placeOrder)

router.route('/get-pending-orders').get(getPendingOrders)

router.route('/update-order-status').post(updateOrderStatus)

router.route('/get-restaurant-order-list').get(getRestaurantOrderList)

router.route('/delete-order').delete(deleteOrder)

router.route('/get-user-orders/:userId')
    .all(validate('getUserOrders'))
    .all(handleValidation)
    .get(getUserOrders)

router.route('/order-charges')
    .all(validate('otherOrderCharges'))
    .all(handleValidation)
    .post(otherOrderCharges)

module.exports = router