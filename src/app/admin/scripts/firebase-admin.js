import admin from "firebase-admin";
import fs from "fs";
let serviceAccountPath="I:\\code\\trackingApp\\tracking\\gps-admin\\src\\app\\admin\\scripts\\firebase-key.json";
// Load service account key
const serviceAccount = JSON.parse(
  fs.readFileSync(serviceAccountPath, "utf8")
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

export default admin;
