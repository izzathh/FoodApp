const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
const { Firestore } = require('@google-cloud/firestore');

let firebaseApp
function getFirebaseAdmin() {
    if (!firebaseApp) {
        firebaseApp = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
        return firebaseApp
    }
    return firebaseApp
}

const firestore = new Firestore();

module.exports = { getFirebaseAdmin, firestore }