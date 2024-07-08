const mongoose = require('mongoose');
const moment = require("moment")

const OrdersSchema = new mongoose.Schema(
    {
        restaurantId: {
            type: mongoose.Types.ObjectId,
            ref: 'Restaurant',
            required: [true, "Restaurant id is required"]
        },
        userId: {
            type: mongoose.Types.ObjectId, ref: 'User', required: [true, "User id is required"]
        },
        orderId: {
            type: String, required: [true, "Order id is required"]
        },
        menu: {
            type: Array, required: [true, "Menu is required"]
        },
        status: {
            type: String, required: [true, "Status is required"]
        },
        address: {
            type: String, trim: true, required: [true, "Address is required"]
        },
        menucount: {
            type: Number, required: true
        },
        subtotal: {
            type: Number, required: [true, "Sub total is required"]
        },
        total: {
            type: Number, required: [[true, "Total is required"]]
        },
        orderedAt: {
            type: String,
            default: moment().format('YYYY-MM-DD HH:mm:ss')
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Order', OrdersSchema, 'orders')