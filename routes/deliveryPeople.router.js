const express = require('express')
const router = express.Router()

const {
    registerDeliveryPeople,
    deliveryPeopleLogin,
    getPendingRegistrations
} = require('../controllers/deliveryPeople.controller')

router.route('/register-delivery-people').post(registerDeliveryPeople);

router.route('/login-delivery-people').post(deliveryPeopleLogin);

router.route('/get-pending-registration').get(getPendingRegistrations);

module.exports = router