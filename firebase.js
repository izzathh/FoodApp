const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

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

module.exports = { getFirebaseAdmin }