const Orders = require('../models/orders.model')
const Admin = require('../models/admin.model')
const DeliveryPeople = require('../models/deliveryPeople.model')
const WebSocket = require('ws');

const checkOrderRequest = async (wss) => {
    const changeStream = Orders.watch()

    changeStream.on('change', (change) => {
        if (change.operationType === 'insert' && change.fullDocument.status === 'pending') {
            const newOrder = change.fullDocument
            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: 'newOrder', data: newOrder }))
                }
            })
        }
    })
}

const checkRestaurantRequest = async (wss) => {
    const adminChange = Admin.watch()

    adminChange.on('change', (data) => {
        if (data.operationType === 'insert' && !data.fullDocument.adminApproved) {
            const newRestaurant = data.fullDocument
            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: 'newRestaurant', data: newRestaurant }))
                }
            })
        }
    })
}

const checkDeliveryRegistration = async (wss) => {
    const dpRegistrationChange = DeliveryPeople.watch()

    dpRegistrationChange.on('change', (data) => {
        if (data.operationType === 'insert' && !data.fullDocument.adminApproved) {
            const regApplication = data.fullDocument
            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: 'newDeliveryPeople', application: regApplication }))
                }
            })
        }
    })
}

module.exports = {
    checkOrderRequest,
    checkRestaurantRequest,
    checkDeliveryRegistration
}