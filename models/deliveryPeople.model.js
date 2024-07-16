const mongoose = require('mongoose');

const deliveryPeopleSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "name is required"]
        },
        phoneNumber: {
            type: String,
            required: [true, "Phone number is required"]
        },
        vehicleNumber: {
            type: String,
            required: [true, "Vehicle number is required"]
        },
        adminApproved: {
            type: Boolean,
            default: false
        },
        adminDeclined: {
            type: Boolean,
            default: false
        },
        registeredAt: {
            type: String
        },
        shiftStatus: {
            type: Number,
            enum: [0, 1],
            default: 0
        },
        fcmToken: {
            type: String,
            default: null
        },
        latitude: {
            type: String
        },
        longitude: {
            type: String
        }
    }, {
    timestamps: true
}
)

module.exports = mongoose.model("DeliveryPeople", deliveryPeopleSchema, "deliverypeoples")