const { default: mongoose } = require('mongoose');
const Orders = require('../models/orders.model')
const moment = require("moment");
const WebSocket = require('ws');
const { getWebSocketServer } = require('../websocket');
const { getFirebaseAdmin } = require('../firebase');
const DeliveryPeople = require('../models/deliveryPeople.model');

const placeOrder = async (req, res) => {
    try {
        const {
            restaurantId,
            userId,
            menu,
            status,
            address,
            menucount,
            subtotal,
            total
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

        const newOrder = new Orders({
            restaurantId,
            userId,
            orderId: orderId || `FA-${currentDate.format('YYYYMMDD')}-1`,
            menu: typeof menu === 'object' ? menu : JSON.parse(menu),
            status,
            address,
            menucount,
            subtotal,
            total
        })

        await newOrder.save();

        return res.json({
            status: 1,
            message: 'Order placed successfully',
            data: {
                order: newOrder
            }
        })

    } catch (error) {
        console.log('error:', error);
        return res.status(500).json({ status: 0, message: error })
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

        return res.json({ status: 1, orders: getPendingOrders })
    } catch (error) {
        console.log('getPendingOrders:', error);
        next(error);
    }
}

const updateOrderStatus = async (req, res) => {
    try {
        const { orderId, status, restaurantId } = req.body;

        const updateStatus = await Orders.findOneAndUpdate(
            { orderId, restaurantId },
            { $set: { status } },
            { new: true }
        )

        if (updateStatus && updateStatus.menu && Array.isArray(updateStatus.menu)) {
            updateStatus.menu = updateStatus.menu.map(item => {
                const { image, ...rest } = item;
                return rest;
            });
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
                            orderDetails: JSON.stringify(updateStatus),
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
                    client.send(JSON.stringify({ type: status, data: updateStatus }));
                }
            });
            return res.json({ status: 1, message: 'Order status changed', updateStatus })
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
        const getRestaurantOrders = await Orders.find({ restaurantId, status: 'confirmed' })
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

module.exports = {
    placeOrder,
    getPendingOrders,
    updateOrderStatus,
    getRestaurantOrderList,
    deleteOrder
}