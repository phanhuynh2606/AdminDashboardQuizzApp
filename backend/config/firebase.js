const admin = require('firebase-admin');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();
// const serviceAccountPath = path.resolve(__dirname, '../serviceAccountKey.json');

// Check if process.env.FIREBASE_SERVICE_ACCOUNT is set (for deployment environments)
let serviceAccount;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // Decode Base64 string from environment variable
    const decodedServiceAccount = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString('ascii');
    serviceAccount = JSON.parse(decodedServiceAccount);

    // Validate if the parsed serviceAccount is an object
    if (typeof serviceAccount !== 'object' || serviceAccount === null) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is not a valid JSON object after decoding.');
    }
  } else {
    // For local development, if serviceAccountKey.json is expected but not found
    // This branch will likely not be hit if serviceAccountKey.json is deleted
    throw new Error('serviceAccountKey.json not found and FIREBASE_SERVICE_ACCOUNT environment variable is not set.');
  }
} catch (error) {
  console.error("Lỗi khởi tạo Firebase Admin SDK:", error.message);
  console.error("Vui lòng đảm bảo FIREBASE_SERVICE_ACCOUNT môi trường được đặt chính xác (chứa toàn bộ nội dung file serviceAccountKey.json đã được mã hóa Base64).\n" +
                "Hoặc đảm bảo file backend/serviceAccountKey.json tồn tại và có nội dung hợp lệ cho môi trường phát triển.");
  process.exit(1); // Thoát ứng dụng nếu khóa không hợp lệ, vì Firebase là một phần quan trọng
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

console.log('Firebase Admin SDK initialized successfully!');

module.exports = admin; 