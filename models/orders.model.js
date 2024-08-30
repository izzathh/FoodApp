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
        deliveryBy: {
            type: mongoose.Types.ObjectId,
            ref: 'deliveryPeople',
            default: null
        },
        deliveredAt: {
            type: String,
            default: null
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
            required: [true, "Order time is required"]
        },
        userLatitude: {
            type: String,
            required: [true, "User latitude is required"]
        },
        userLongitude: {
            type: String,
            required: [true, "User longitude is required"]
        },
        distance: {
            type: Number,
            required: [true, "Distance is required"]
        },
        deliveryCharge: {
            type: Number,
            required: [true, "Delivery charge is required"]
        },
        tax: {
            type: Number,
            required: [true, "Tax is required"]
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Order', OrdersSchema, 'orders')