const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

function getFirebaseAdmin() {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
    return admin
}

module.exports = { getFirebaseAdmin }