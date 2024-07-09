const express = require('express')
const router = express.Router()

const {
    registerDeliveryPeople,
    deliveryPeopleLogin
} = require('../controllers/deliveryPeople.controller')

router.route('/register-delivery-people').post(registerDeliveryPeople);

router.route('/login-delivery-people').post(deliveryPeopleLogin);

module.exports = router