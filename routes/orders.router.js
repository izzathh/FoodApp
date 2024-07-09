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
    getAllOrders
} = require('../controllers/orders.controller')

router.route('/place-order').post(upload.any(), placeOrder)

router.route('/get-pending-orders').get(getPendingOrders)

router.route('/update-order-status').post(updateOrderStatus)

router.route('/get-restaurant-order-list').get(getRestaurantOrderList)

router.route("/get-all-orders").get(getAllOrders);

module.exports = router