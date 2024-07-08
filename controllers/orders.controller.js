const { default: mongoose } = require('mongoose');
const Orders = require('../models/orders.model')
const moment = require("moment");
const WebSocket = require('ws');
const { getWebSocketServer } = require('../websocket');

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

        return res.json({ status: '1', message: 'Order placed successfully', order: newOrder })

    } catch (error) {
        console.log('error:', error);
        return res.status(500).json({ status: 0, messgae: error })
    }
}

const getPendingOrders = async (req, res) => {
    try {
        const getPendingOrders = await Orders.find({ status: 'pending' })
        return res.json({ status: '1', orders: getPendingOrders })
    } catch (error) {
        console.log('getPendingOrders:', error);
        return res.status(500).json({ status: 0, messgae: error })
    }
}

const updateOrderStatus = async (req, res) => {
    try {
        const { orderId, status } = req.body;

        const updateStatus = await Orders.findOneAndUpdate(
            { orderId },
            { $set: { status } },
            { new: true, fields: { menu: 0 } }
        )

        if (updateStatus) {
            const wss = getWebSocketServer();
            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: status, data: updateStatus }));
                }
            });
            return res.json({ status: 1, message: 'Order status changed', updateStatus })
        }
        return res.status(500).json({ status: 0, messgae: 'Cannot update order status' })
    } catch (error) {
        console.log('updateOrderStatus:', error);
        return res.status(500).json({ status: 0, messgae: error })
    }
}

const getRestaurantOrderList = async (req, res) => {
    try {
        const { restaurantId } = req.query;
        const getRestaurantOrders = await Orders.find({ restaurantId, status: 'confirmed' })
        console.log('getRestaurantOrders:', getRestaurantOrders);
        return res.json({ status: 1, orders: getRestaurantOrders })
    } catch (error) {
        return res.status(500).json({ status: 0, messgae: error })
    }
}

module.exports = {
    placeOrder,
    getPendingOrders,
    updateOrderStatus,
    getRestaurantOrderList
}