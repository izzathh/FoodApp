const axios = require('axios');

const calculateDeliveryCharge = (distance) => {
    const baseCharge = 25
    const increCharge = 5
    const baseDistance = 2

    let deliveryCharge

    if (distance <= baseDistance)
        deliveryCharge = baseCharge
    else
        deliveryCharge = baseCharge + (distance - baseDistance) * increCharge

    return deliveryCharge
}

const calculateTax = (subtotal, deliveryCharge) => {
    const taxPercent = 5
    const tax = subtotal * (taxPercent / 100)
    const total = tax + subtotal + deliveryCharge
    const rounded = Math.round(total)
    return { tax, total: rounded }
}

const calculateDistance = async (origin, destination) => {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&origins=${origin}&destinations=${destination}&key=${apiKey}`;
    try {
        const response = await axios.get(url);
        if (response.data.rows[0].elements[0].status === "OK") {
            console.log('response:', response.data.rows[0].elements);

            const distance = response.data.rows[0].elements[0].distance.text;
            console.log(`Distance: ${distance.split(' km')[0]}`);
            return Number(distance.split(' km')[0])
        } else {
            console.error('Error fetching distance:', response.data.rows[0].elements[0].status);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

module.exports = {
    calculateDeliveryCharge,
    calculateDistance,
    calculateTax
}