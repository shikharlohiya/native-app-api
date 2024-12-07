


const express = require('express');
 
const router = express.Router();

 
 
// POST endpoint for the webhook
router.post('/webhook/call-end', (req, res) => {
  console.log(req.body , '-----------------')

  console.log('Incoming API call received');
  console.log('Request body:', req.body);

  // You can process the incoming data here

  // Send a success response
  res.status(200).json({ message: 'Webhook received successfully' });
});

module.exports = router;



 