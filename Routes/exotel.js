// Routes/exotelRoutes.js

const express = require('express');
const router = express.Router();

router.get('/exotel-webhook', (req, res) => {
  // Extract relevant information from the request query
  const {
    CallSid,
    CallFrom,
    CallTo,
    Direction,
    Created,
    DialCallDuration,
    StartTime,
    EndTime,
    DialCallStatus,
    CallType,
    DialWhomNumber,
    // Add other fields as needed
  } = req.query;

  // Process the data as needed
  console.log('Received Exotel webhook:', req.query);

  // You can add your logic here to handle the incoming call data
  // For example, saving to database, triggering other actions, etc.

  // Send a response back to Exotel
  res.status(200).json({ message: 'Webhook received successfully' });
});

module.exports = router;