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
        }
    }, {
    timestamps: true
}
)

module.exports = mongoose.model("DeliveryPeople", deliveryPeopleSchema, "deliverypeoples")