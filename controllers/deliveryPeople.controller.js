const { default: mongoose } = require("mongoose");
const DeliveryPeople = require("../models/deliveryPeople.model");
const User = require("../models/user.model");
const { NotFound, BadRequest, ValidationError } = require("../utils/errors");
const { generateOtp } = require("./user.controller")
const moment = require("moment")

const registerDeliveryPeople = async (req, res, next) => {
    try {
        const {
            name,
            phoneNumber,
            vehicleNumber,
        } = req.body;
        if (
            !vehicleNumber ||
            !phoneNumber ||
            !name
        ) {
            throw new BadRequest("Please enter all fields");
        }
        const dpVehicleNum = await DeliveryPeople.findOne({ vehicleNumber });
        const dpPhoneNum = await DeliveryPeople.findOne({ phoneNumber });
        const userPhoneNum = await User.findOne({ phoneNumber });
        if (dpVehicleNum || dpPhoneNum || userPhoneNum) {
            throw new ValidationError(`This ${dpVehicleNum ? 'vehicle' : 'phone'} number already exists`);
        }
        const newDeliveryPeople = new DeliveryPeople({
            vehicleNumber,
            name,
            registeredAt: moment().format('YYYY-MM-DD HH:mm:ss'),
            phoneNumber
        });
        await newDeliveryPeople.save();
        return res.status(201).json({
            status: 1,
            message: "Thank you for registering! Your application is currently under review. We will notify you as soon as an admin approves your registration. We appreciate your patience in the meantime."
        });
    } catch (error) {
        console.error(error);
        next(error);
    }
};

const deliveryPeopleLogin = async (req, res, next) => {
    const { phoneNumber } = req.body;

    try {
        if (!phoneNumber) {
            throw new BadRequest("Please enter mobile number!");
        }

        const dp = await DeliveryPeople.findOne({ phoneNumber });

        if (!dp) {
            throw new NotFound("This user does not exist");
        }

        if (!dp.adminApproved || dp.adminDeclined) {
            const message = dp.adminDeclined
                ? "Your application has been declined, please try again later"
                : "Your application is still under review. Please wait for approval."
            return res.status(200).json({ status: 0, message })
        }
        const getOtp = generateOtp();
        return res.status(200).json({
            status: 1,
            message: 'Logged in successfully',
            data: {
                otp: getOtp,
                user: dp
            }
        })
    } catch (error) {
        console.log(error);
        next(error);
    }
};

const getPendingRegistrations = async (req, res, next) => {
    try {
        const dp = await DeliveryPeople.find({ adminApproved: false, adminDeclined: false });
        return res.status(200).json({ status: 1, registrations: dp })
    } catch (error) {
        console.log('getPendingRegistrations:', error);
        next(error);
    }
}

const updateDeliveryJobStatus = async (req, res, next) => {
    try {
        const { id, adminApproved } = req.body;
        const update = adminApproved
            ? { adminApproved }
            : { adminDeclined: true }
        const updateDpJobStatus = await DeliveryPeople.findByIdAndUpdate(id, {
            $set: update
        })
        if (updateDpJobStatus)
            return res.status(200).json({ status: 1, message: 'Job status updated' })
        return res.status(403).json({ status: 0, message: 'Cannot update job status' })
    } catch (error) {
        console.log('updateDeliveryJobStatus:', error);
        next(error);
    }
}

const shiftDpStatus = async (req, res, next) => {
    try {
        const { id, shiftStatus, currentLatitude, currentLongitude } = req.body;
        if (shiftStatus !== 0 && !shiftStatus)
            throw new BadRequest("Shift status is required");
        if (shiftStatus == 1) {
            if (!currentLatitude || !currentLongitude)
                throw new BadRequest("Please enter lat and lang both fields!");
        }
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new BadRequest("Please enter a valid delivery people ID!");
        }

        if (shiftStatus != 1 && shiftStatus != 0)
            throw new BadRequest("Please enter a valid shift status!");

        const updatedData = await DeliveryPeople.findByIdAndUpdate(id, {
            $set: { shiftStatus, latitude: currentLatitude, longitude: currentLongitude }
        }, { new: true })

        if (!updatedData)
            throw new NotFound("User not found")

        return res.status(200).json({
            status: 1,
            message: "Shift status updated successfully",
            data: {
                updatedData
            }
        })
    } catch (error) {
        console.log('shiftDpStatus:', error);
        next(error);
    }
}

module.exports = {
    registerDeliveryPeople,
    deliveryPeopleLogin,
    getPendingRegistrations,
    updateDeliveryJobStatus,
    shiftDpStatus
}