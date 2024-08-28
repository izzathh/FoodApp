const { default: mongoose } = require('mongoose');
const Orders = require('../models/orders.model')
const Restaurant = require('../models/restaurants.model')
const moment = require("moment");
const WebSocket = require('ws');
const { getWebSocketServer } = require('../websocket');
const { getFirebaseAdmin } = require('../firebase');
const DeliveryPeople = require('../models/deliveryPeople.model');
const { calculateDeliveryCharge, calculateDistance, calculateTax } = require('../services/delivery.service')

const placeOrder = async (req, res, next) => {
    try {
        const {
            restaurantId,
            userId,
            menu,
            status,
            address,
            menucount,
            subtotal,
            latitude,
            longitude,
            coordinates
        } = req.body;

        const getLastOrder = await Orders
            .find({ restaurantId: new mongoose.Types.ObjectId(restaurantId) })
            .sort({ createdAt: -1 })
            .limit(1);

        let orderId
        const currentDate = moment().startOf('day')
        if (getLastOrder.length > 0) {
            const lastOrderDate = moment(getLastOrder[0].orderedAt).startOf('day')
            orderId = currentDate.isAfter(lastOrderDate)
                ? `FA-${currentDate.format('YYYYMMDD')}-1`
                : `FA-${currentDate.format('YYYYMMDD')}-${Number(getLastOrder[0].orderId.split('-')[2]) + 1}`
        }

        const destination = latitude + ',' + longitude;
        const distance = await calculateDistance(coordinates, destination)
        if (!distance)
            return res.status(500).json({ status: 0, message: "Can't find locations" })
        const deliveryCharge = calculateDeliveryCharge(distance)
        const roundedDeliveryCharge = Math.round(deliveryCharge)
        const { tax, total } = calculateTax(Number(subtotal), roundedDeliveryCharge)
        console.log(distance, tax, total);

        const newOrder = new Orders({
            restaurantId,
            userId,
            orderId: orderId || `FA-${currentDate.format('YYYYMMDD')}-1`,
            menu: typeof menu == 'object' ? menu : JSON.parse(menu),
            status,
            address,
            menucount,
            userLatitude: latitude,
            userLongitude: longitude,
            distance: distance,
            deliveryCharge: roundedDeliveryCharge,
            tax,
            subtotal,
            total
        })

        await newOrder.save();

        return res.status(200).json({
            status: 1,
            message: 'Order placed successfully',
            data: {
                order: newOrder
            }
        })

    } catch (error) {
        console.log('error:', error);
        next(error);
    }
}

const getPendingOrders = async (req, res, next) => {
    try {
        let filter
        if (!req.query.forRestaurant || req.query.forRestaurant == '1') {
            filter = {
                restaurantId: mongoose.Types.ObjectId(req.query.id),
                status: 'pending'
            }
        } else {
            filter = {
                status: 'pending'
            }
        }
        const getPendingOrders = await Orders.find(filter)

        return res.json({
            status: 1,
            message: 'Fetched pending orders',
            orders: getPendingOrders
        })
    } catch (error) {
        console.log('getPendingOrders:', error);
        next(error);
    }
}

const updateOrderStatus = async (req, res) => {
    try {
        const { orderUniqueId, status, restaurantId } = req.body;

        const updateStatus = await Orders.findOneAndUpdate(
            { _id: orderUniqueId, restaurantId },
            { $set: { status } },
            { new: true }
        )
        let modifiedMenu
        let originalMenu
        if (updateStatus && updateStatus.menu && Array.isArray(updateStatus.menu)) {
            modifiedMenu = updateStatus.menu.map(item => {
                const { image, ...rest } = item;
                return rest;
            });
            originalMenu = updateStatus.menu
        }

        if (updateStatus) {
            if (status === 'confirmed') {
                const admin = getFirebaseAdmin();
                const getDeliveryPeoples = await DeliveryPeople.findOne({
                    _id: "668e675dbb7e02cf2db711f0",
                    adminApproved: true,
                    shiftStatus: 1
                })
                if (getDeliveryPeoples && getDeliveryPeoples.fcmToken) {
                    const message = {
                        data: {
                            orderDetails: JSON.stringify({ ...updateStatus._doc, menu: updateStatus.menu = modifiedMenu }),
                            orderAccepted: '0'
                        },
                        token: getDeliveryPeoples.fcmToken
                    }
                    admin.messaging().send(message)
                        .then((response) => {
                            console.log('firebase message sent to delivery people', response);
                        })
                        .catch((err) => {
                            console.log('error sending firebase message', err);
                        })
                }
            }
            const wss = getWebSocketServer();
            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: status,
                        data: { ...updateStatus._doc, menu: updateStatus.menu = modifiedMenu }
                    }));
                }
            });
            return res.json({
                status: 1,
                message: 'Order status changed',
                updateStatus: updateStatus._doc
            })
        }
        return res.status(500).json({ status: 0, message: 'Cannot update order status' })
    } catch (error) {
        console.log('updateOrderStatus:', error);
        return res.status(500).json({ status: 0, message: error })
    }
}

const getRestaurantOrderList = async (req, res) => {
    try {
        const { restaurantId } = req.query;
        if (!restaurantId || !mongoose.Types.ObjectId.isValid(restaurantId)) {
            return res.status(400).json({ status: 0, message: 'Please enter a valid restaurant ID' })
        }
        const getRestaurantOrders = await Orders.find({ restaurantId, status: { $ne: 'pending' } })
        console.log('getRestaurantOrders:', getRestaurantOrders);
        return res.json({ status: 1, orders: getRestaurantOrders })
    } catch (error) {
        return res.status(500).json({ status: 0, message: error })
    }
}

const deleteOrder = async (req, res, next) => {
    try {
        const { restaurantId, orderId } = req.body;
        const deleteOrder = await Orders.findOneAndDelete({ restaurantId, orderId })
        console.log('deleteOrder:', deleteOrder);
        if (deleteOrder) {
            return res.status(200).json({ status: 1, message: 'Order deleted successfully' })
        }
        return res.status(400).json({ status: 0, message: 'Cannot delete the order' })
    } catch (error) {
        console.log('deleteOrder:', error);
        next();
    }
}

const getUserOrders = async (req, res, next) => {
    const { userId } = req.params
    try {
        const getOrders = await Orders.find({ userId });

        const modifiedOrders = await Promise.all(getOrders.map(async (order) => {
            const getRestaurant = await Restaurant
                .findById(order.restaurantId)
                .select('image restaurantName');
            return {
                ...order._doc,
                restaurantName: getRestaurant.restaurantName,
                restaurantImage: getRestaurant.image
            }
        }))

        return res.status(200).json({
            status: 1,
            message: 'Orders fetched',
            data: {
                allOrders: modifiedOrders
            }
        })
    } catch (error) {
        console.log(error);
        next(error);
    }
}

module.exports = {
    placeOrder,
    getPendingOrders,
    updateOrderStatus,
    getRestaurantOrderList,
    deleteOrder,
    getUserOrders
}