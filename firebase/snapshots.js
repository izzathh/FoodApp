const { firestore } = require('../firebase');
const Orders = require('../models/orders.model')

async function listenForFirebase() {
    try {
        firestore.collection('order-delivery-status').onSnapshot(snapshot => {
            snapshot.docChanges().forEach(async (change) => {
                if (change.type === 'added') {
                    console.log('New data: ', change.doc.data());
                    const { id, status } = change.doc.data()
                    await Orders.findByIdAndUpdate(id, {
                        $set: { status }
                    })
                    console.log('firebase data added');
                }
                if (change.type === 'modified') {
                    console.log('Modified data: ', change.doc.data());
                    const { id, status } = change.doc.data()
                    await Orders.findByIdAndUpdate(id, {
                        $set: { status }
                    })
                    console.log('firebase data updated');
                }
                if (change.type === 'removed') {
                    console.log('Removed data: ', change.doc.data());
                }
            });
        });
    } catch (error) {
        console.log('error:', error);
    }
}

module.exports = { listenForFirebase }