const admin = require('firebase-admin');
const serviceAccount = require('./firebaseToken.json');  // Your downloaded key

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});



const sendTestNotification = async (token) => {
 try {
     const message = {
         notification: {
             title: 'Test Notification',
             body: 'This is a test message'
         },
         webpush: {
             headers: {
                 Urgency: 'high'
             },
             notification: {
                 requireInteraction: true,
                 icon: 'your-icon-url' // Optional: Add your app icon URL
             }
         },
         token: token
     };

     const response = await admin.messaging().send(message);
     return response;
 } catch (error) {
     console.error('Error sending message:', error);
     throw error;
 }
};

// module.exports = admin;


module.exports = {
 admin,
 sendTestNotification
};