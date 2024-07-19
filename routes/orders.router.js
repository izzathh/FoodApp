const express = require('express')
const router = express.Router()

const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const {
    placeOrder,
    getPendingOrders,
    updateOrderStatus,
    getRestaurantOrderList,
    deleteOrder
} = require('../controllers/orders.controller')

router.route('/place-order').post(upload.any(), placeOrder)

router.route('/get-pending-orders').get(getPendingOrders)

router.route('/update-order-status').post(updateOrderStatus)

router.route('/get-restaurant-order-list').get(getRestaurantOrderList)

router.route('/delete-order').delete(deleteOrder)

module.exports = router