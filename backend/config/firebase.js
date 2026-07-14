const admin = require("firebase-admin");

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: `${serviceAccount.project_id}.appspot.com`,
  });
}

const db = admin.firestore();
const auth = admin.auth();
const bucket = admin.storage().bucket();

module.exports = { admin, db, auth, bucket };