const express = require('express')
const router = express.Router()

const {
    registerDeliveryPeople,
    deliveryPeopleLogin,
    getPendingRegistrations,
    updateDeliveryJobStatus,
    shiftDpStatus
} = require('../controllers/deliveryPeople.controller')

router.route('/register-delivery-people').post(registerDeliveryPeople);

router.route('/login-delivery-people').post(deliveryPeopleLogin);

router.route('/get-pending-registration').get(getPendingRegistrations);

router.route('/update-deliveryjob-status').post(updateDeliveryJobStatus);

router.route('/shift-status').post(shiftDpStatus);

module.exports = router