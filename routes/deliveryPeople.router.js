const express = require('express')
const router = express.Router()
const { handleValidation, validate } = require('../middlewares/validator')
const {
    registerDeliveryPeople,
    deliveryPeopleLogin,
    getPendingRegistrations,
    updateDeliveryJobStatus,
    shiftDpStatus,
    acceptOrderDelivery,
    getAllPendingOrders,
    getAcceptedOrderDetails,
    getAllDeliveryPeepOrders,
    getTotalEarningsOfDp
} = require('../controllers/deliveryPeople.controller')

router.route('/register-delivery-people').post(registerDeliveryPeople);

router.route('/login-delivery-people')
    .all(validate('dpLogin'))
    .all(handleValidation)
    .post(deliveryPeopleLogin);

router.route('/get-pending-registration').get(getPendingRegistrations);

router.route('/update-deliveryjob-status').post(updateDeliveryJobStatus);

router.route('/shift-status').post(shiftDpStatus);

router.route('/accept-order')
    .all(validate('acceptOrder'))
    .all(handleValidation)
    .post(acceptOrderDelivery);

router.route('/get-all-pending-orders').get(getAllPendingOrders);

router.route('/get-accepted-order/:id/:deliveryBy')
    .all(validate('getAcceptedOrder'))
    .all(handleValidation)
    .get(getAcceptedOrderDetails)

router.route('/get-my-orders/:id')
    .all(validate('getMyOrders'))
    .all(handleValidation)
    .get(getAllDeliveryPeepOrders)

router.route('/get-my-earnings/:id')
    .all(validate('getMyOrders'))
    .all(handleValidation)
    .get(getTotalEarningsOfDp)

module.exports = router