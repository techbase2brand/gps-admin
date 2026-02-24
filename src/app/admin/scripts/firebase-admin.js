import admin from "firebase-admin";
import fs from "fs";

let serviceAccountPath = process.env.serviceAccountPath;
console.log("Service Account path ", serviceAccountPath);

// let serviceAccountPath = "I:\\code\\trackingApp\\tracking\\gps-admin\\src\\app\\admin\\scripts\\firebase-key.json"
// Load service account key
const serviceAccount = JSON.parse(
  fs.readFileSync(serviceAccountPath, "utf8")
);
if (!serviceAccountPath) {
  console.error(" Error: serviceAccountPath is not defined in .env file!");
  process.exit(1);
}
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

export default admin;
