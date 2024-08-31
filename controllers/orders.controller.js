const { default: mongoose } = require('mongoose');
const Orders = require('../models/orders.model')
const Restaurant = require('../models/restaurants.model')
const momentTz = require('moment-timezone');
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
            distance,
            deliveryCharge,
            tax,
            total
        } = req.body;

        const timestamp = momentTz.tz(TIMEZONE).format('YYYYMMDDHHmmss');
        const orderId = 'FA-' + timestamp
        const orderedAt = momentTz.tz(TIMEZONE).format(TIMEFORMAT);
        const newOrder = new Orders({
            restaurantId,
            userId,
            orderId,
            menu: typeof menu == 'object' ? menu : JSON.parse(menu),
            status,
            address,
            menucount,
            userLatitude: latitude,
            userLongitude: longitude,
            distance,
            deliveryCharge,
            tax,
            subtotal,
            total,
            orderedAt
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

const otherOrderCharges = async (req, res, next) => {
    const { latitude, longitude, coordinates, subtotal } = req.body
    try {
        const destination = latitude + ',' + longitude;
        const distance = await calculateDistance(coordinates, destination)
        if (!distance)
            return res.status(500).json({ status: 0, message: "Can't find locations" })
        const calcDeliveryCharge = calculateDeliveryCharge(distance)
        const deliveryCharge = Math.round(calcDeliveryCharge)
        const { tax, total } = calculateTax(Number(subtotal), deliveryCharge)
        return res.status(200).json({
            status: 1,
            message: 'Fetched other order charges',
            data: {
                distance,
                tax,
                deliveryCharge,
                total
            }
        })
    } catch (error) {
        console.log(error);
        next(error)
    }
}

const getPendingOrders = async (req, res, next) => {
    try {
        let filter
        if (!req.query.forRestaurant || req.query.forRestaurant == '1') {
            filter = {
                restaurantId: mongoose.Types.ObjectId(req.query.id),
                status: PENDING
            }
        } else {
            filter = {
                status: PENDING
            }
        }

        const getPendingOrders = await Orders.find(filter).sort({ createdAt: -1 })

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
        const newSts = status === CONFIRMED ? CONFIRMED : REJECTED
        const updateStatus = await Orders.findOneAndUpdate(
            { _id: orderUniqueId, restaurantId },
            { $set: { status: newSts } },
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
            if (status === CONFIRMED) {
                const admin = getFirebaseAdmin();
                const getDeliveryPeoples = await DeliveryPeople.find({
                    adminApproved: true,
                    shiftStatus: 1
                })
                if (getDeliveryPeoples.length !== 0 && getDeliveryPeoples[0].fcmToken) {
                    const message = {
                        data: {
                            orderDetails: JSON.stringify({
                                ...updateStatus._doc, menu: updateStatus.menu = modifiedMenu
                            }),
                            orderAccepted: '0'
                        },
                        token: getDeliveryPeoples[0].fcmToken
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
        const getRestaurantOrders = await Orders
            .find({ restaurantId, status: { $nin: [PENDING, REJECTED] } })
            .sort({ createdAt: -1 })
        return res.json({ status: 1, orders: getRestaurantOrders })
    } catch (error) {
        return res.status(500).json({ status: 0, message: error })
    }
}

const deleteOrder = async (req, res, next) => {
    try {
        const { restaurantId, orderId } = req.body;
        const deleteOrder = await Orders.findOneAndDelete({ restaurantId, orderId })
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
        const getOrders = await Orders.find({ userId }).sort({ createdAt: -1 });

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
    getUserOrders,
    otherOrderCharges
}