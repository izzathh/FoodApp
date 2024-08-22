const { firestore } = require('../firebase');
const Orders = require('../models/orders.model')

async function listenForFirebase() {
    try {
        firestore.collection('order-delivery-status').onSnapshot(snapshot => {
            snapshot.docChanges().forEach(async (change) => {
                if (change.type === 'added') {
                    const { id, status } = change.doc.data()
                    await Orders.findByIdAndUpdate(id, {
                        $set: { status }
                    })
                    console.log('firebase data added');
                }
                if (change.type === 'modified') {
                    console.log('Modified order status: ', change.doc.data());
                    const { id, status } = change.doc.data()
                    await Orders.findByIdAndUpdate(id, {
                        $set: { status }
                    })
                    console.log('firebase data updated');
                }
                if (change.type === 'removed') {
                    console.log('Removed order status: ', change.doc.data());
                    const { id, status } = change.doc.data()
                    if (status === 'order delivered') {
                        await Orders.findByIdAndUpdate(id, {
                            $set: { status: "payment received" }
                        })
                        console.log('payment received from the order');
                    }
                }
            });
        });
    } catch (error) {
        console.log('error:', error);
    }
}

module.exports = { listenForFirebase }