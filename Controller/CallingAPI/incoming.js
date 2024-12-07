const express = require('express');
 
const router = express.Router();

// const moment = require('moment');
const CallLog  = require('../../models/CallLog');
const axios = require('axios');
const moment = require('moment-timezone'); // Ensure moment-timezone is required
const IncomingCall = require('../../models/IncomingCall');
const { Op } = require('sequelize');
const PostCallData = require('../../models/PostCallData');


// router.post('/webhook/pingback', async (req, res) => {
//   const data = req.body;
//   console.log(data, '------------------');

//   try {
//     // Extracting all relevant details from the webhook
//     const {
//       SERVICE_TYPE,
//       EVENT_TYPE,
//       CALL_ID,
//       DNI,
//       A_PARTY_NO,
//       CALL_START_TIME,
//       A_PARTY_DIAL_START_TIME,
//       A_PARTY_DIAL_END_TIME,
//       A_PARTY_CONNECTED_TIME,
//       A_DIAL_STATUS,
//       A_PARTY_END_TIME,
//       A_PARTY_RELEASE_REASON,
//       B_PARTY_NO,
//       B_PARTY_DIAL_START_TIME,
//       B_PARTY_DIAL_END_TIME,
//       B_PARTY_CONNECTED_TIME,
//       B_PARTY_END_TIME,
//       B_PARTY_RELEASE_REASON,
//       B_DIAL_STATUS,
//       C_PARTY_NO,
//       C_PARTY_DIAL_START_TIME,
//       C_PARTY_DIAL_END_TIME,
//       C_PARTY_CONNECTED_TIME,
//       C_PARTY_END_TIME,
//       C_PARTY_RELEASE_REASON,
//       C_DIAL_STATUS,
//       REF_ID,
//       RecordVoice,
//       DISCONNECTED_BY,
//     } = data;


//     // Function to parse date-time strings
//     // const parseDateTime = (dateTimeString) => {
//     //   return dateTimeString ? moment(dateTimeString, 'DDMMYYYYHHmmss').toDate() : null;
//     // };
//     const parseDateTime = (dateTimeString) => {
//       return dateTimeString 
//         ? moment.tz(dateTimeString, 'DDMMYYYYHHmmss', 'Asia/Kolkata').toDate() 
//         : null;
//     };


//     // Save the call log to the database
//     const callLog = await CallLog.create({
//       serviceType: SERVICE_TYPE,
//       eventType: EVENT_TYPE,
//       callId: CALL_ID,
//       dni: DNI,
//       aPartyNo: A_PARTY_NO,
//       callStartTime: parseDateTime(CALL_START_TIME),
//       aPartyDialStartTime: parseDateTime(A_PARTY_DIAL_START_TIME),
//       aPartyDialEndTime: parseDateTime(A_PARTY_DIAL_END_TIME),
//       aPartyConnectedTime: parseDateTime(A_PARTY_CONNECTED_TIME),
//       aDialStatus: A_DIAL_STATUS,
//       aPartyEndTime: parseDateTime(A_PARTY_END_TIME),
//       aPartyReleaseReason: A_PARTY_RELEASE_REASON,
//       bPartyNo: B_PARTY_NO,
//       bPartyDialStartTime: parseDateTime(B_PARTY_DIAL_START_TIME),
//       bPartyDialEndTime: parseDateTime(B_PARTY_DIAL_END_TIME),
//       bPartyConnectedTime: parseDateTime(B_PARTY_CONNECTED_TIME),
//       bPartyEndTime: parseDateTime(B_PARTY_END_TIME),
//       bPartyReleaseReason: B_PARTY_RELEASE_REASON,
//       bDialStatus: B_DIAL_STATUS,
//       cPartyNo: C_PARTY_NO,
//       cPartyDialStartTime: parseDateTime(C_PARTY_DIAL_START_TIME),
//       cPartyDialEndTime: parseDateTime(C_PARTY_DIAL_END_TIME),
//       cPartyConnectedTime: parseDateTime(C_PARTY_CONNECTED_TIME),
//       cPartyEndTime: parseDateTime(C_PARTY_END_TIME),
//       cPartyReleaseReason: C_PARTY_RELEASE_REASON,
//       cDialStatus: C_DIAL_STATUS,
//       refId: REF_ID,
//       recordVoice: RecordVoice,
//       disconnectedBy: DISCONNECTED_BY,
//     });

//     console.log('Call log saved:', callLog.id);

//     // Send a response back to acknowledge receipt of the webhook
//     res.status(200).json({ message: 'PingBack API Run Successfully', callLogId: callLog.id });
//   } catch (error) {
//     console.error('Error processing webhook:', error);
//     res.status(500).json({ message: 'Error processing webhook', error: error.message });
//   }
// });




// router.post('/webhook/pingback', async (req, res) => {
//   const data = req.body;
//   console.log('Webhook data received:', data);

//   try {
//     // Parse datetime helper function
//     const parseDateTime = (dateTimeString) => {
//       return dateTimeString 
//         ? moment.tz(dateTimeString, 'DDMMYYYYHHmmss', 'Asia/Kolkata').toDate() 
//         : null;
//     };

//     // Create call log
//     const callLog = await CallLog.create({
//       serviceType: data.SERVICE_TYPE,
//       eventType: data.EVENT_TYPE,
//       callId: data.CALL_ID,
//       dni: data.DNI,
//       aPartyNo: data.A_PARTY_NO,
//       callStartTime: parseDateTime(data.CALL_START_TIME),
//       aPartyDialStartTime: parseDateTime(data.A_PARTY_DIAL_START_TIME),
//       aPartyDialEndTime: parseDateTime(data.A_PARTY_DIAL_END_TIME),
//       aPartyConnectedTime: parseDateTime(data.A_PARTY_CONNECTED_TIME),
//       aDialStatus: data.A_DIAL_STATUS,
//       aPartyEndTime: parseDateTime(data.A_PARTY_END_TIME),
//       aPartyReleaseReason: data.A_PARTY_RELEASE_REASON,
//       bPartyNo: data.B_PARTY_NO,
//       bPartyDialStartTime: parseDateTime(data.B_PARTY_DIAL_START_TIME),
//       bPartyDialEndTime: parseDateTime(data.B_PARTY_DIAL_END_TIME),
//       bPartyConnectedTime: parseDateTime(data.B_PARTY_CONNECTED_TIME),
//       bPartyEndTime: parseDateTime(data.B_PARTY_END_TIME),
//       bPartyReleaseReason: data.B_PARTY_RELEASE_REASON,
//       bDialStatus: data.B_DIAL_STATUS,
//       cPartyNo: data.C_PARTY_NO,
//       cPartyDialStartTime: parseDateTime(data.C_PARTY_DIAL_START_TIME),
//       cPartyDialEndTime: parseDateTime(data.C_PARTY_DIAL_END_TIME),
//       cPartyConnectedTime: parseDateTime(data.C_PARTY_CONNECTED_TIME),
//       cPartyEndTime: parseDateTime(data.C_PARTY_END_TIME),
//       cPartyReleaseReason: data.C_PARTY_RELEASE_REASON,
//       cDialStatus: data.C_DIAL_STATUS,
//       refId: data.REF_ID,
//       recordVoice: data.RecordVoice,
//       disconnectedBy: data.DISCONNECTED_BY,
//     });

//     // Get socket ID for this call
//     const socketId = req.activeCallSockets.get(data.CALL_ID);
//     if (socketId) {
//       // Prepare event data based on event type
//       let eventData = {
//         eventType: data.EVENT_TYPE,
//         callId: data.CALL_ID,
//         timestamp: new Date().toISOString()
//       };

//       // Add specific data based on event type
//       switch (data.EVENT_TYPE) {
//         case 'B party Connected/Notconnected':
//           eventData = {
//             ...eventData,
//             status: data.B_DIAL_STATUS,
//             bPartyNo: data.B_PARTY_NO,
//             bPartyConnectedTime: data.B_PARTY_CONNECTED_TIME,
//             bPartyDialStartTime: data.B_PARTY_DIAL_START_TIME
//           };
//           break;

//         case 'Call End':
//           eventData = {
//             ...eventData,
//             disconnectedBy: data.DISCONNECTED_BY,
//             endTime: data.B_PARTY_END_TIME || data.A_PARTY_END_TIME,
//             releaseReason: data.B_PARTY_RELEASE_REASON || data.A_PARTY_RELEASE_REASON
//           };
//           break;

//         case 'Call Initiated':
//           eventData = {
//             ...eventData,
//             aPartyNo: data.A_PARTY_NO,
//             bPartyNo: data.B_PARTY_NO,
//             startTime: data.CALL_START_TIME
//           };
//           break;
//       }

//       // Emit event to the specific client
//       req.io.to(socketId).emit('callStatusUpdate', eventData);
//     }

//     res.status(200).json({ 
//       message: 'Webhook processed successfully', 
//       callLogId: callLog.id 
//     });
//   } catch (error) {
//     console.error('Error processing webhook:', error);
//     res.status(500).json({ error: error.message });
//   }
// });





// router.post('/webhook/pingback', async (req, res) => {
//   const data = req.body;
//   console.log('Webhook data received:', data);

//   try {
//     // Emit the raw webhook data to all connected clients
//     // Make sure io is properly initialized and accessible
//     req.io.emit('callStatusUpdate', data);

//     res.status(200).json({ 
//       message: 'Webhook processed successfully'
//     });
//   } catch (error) {
//     console.error('Error processing webhook:', error);
//     res.status(500).json({ error: error.message });
//   }
// });



router.post('/webhook/pingback', async (req, res) => {
  const data = req.body;
  console.log('Webhook data received:', data);

  try {
    // First emit the data immediately
    req.io.emit('callStatusUpdate', data);

    // Send response immediately
    res.status(200).json({
      message: 'Webhook processed successfully'
    });

    // Then save to database asynchronously
    const parseDateTime = (dateTimeString) => {
      return dateTimeString
        ? moment.tz(dateTimeString, 'DDMMYYYYHHmmss', 'Asia/Kolkata').toDate()
        : null;
    };

    // Save to database after sending response
    await CallLog.create({
      serviceType: data.SERVICE_TYPE,
      eventType: data.EVENT_TYPE,
      callId: data.CALL_ID,
      dni: data.DNI,
      aPartyNo: data.A_PARTY_NO,
      callStartTime: parseDateTime(data.CALL_START_TIME),
      aPartyDialStartTime: parseDateTime(data.A_PARTY_DIAL_START_TIME),
      aPartyDialEndTime: parseDateTime(data.A_PARTY_DIAL_END_TIME),
      aPartyConnectedTime: parseDateTime(data.A_PARTY_CONNECTED_TIME),
      aDialStatus: data.A_DIAL_STATUS,
      aPartyEndTime: parseDateTime(data.A_PARTY_END_TIME),
      aPartyReleaseReason: data.A_PARTY_RELEASE_REASON,
      bPartyNo: data.B_PARTY_NO,
      bPartyDialStartTime: parseDateTime(data.B_PARTY_DIAL_START_TIME),
      bPartyDialEndTime: parseDateTime(data.B_PARTY_DIAL_END_TIME),
      bPartyConnectedTime: parseDateTime(data.B_PARTY_CONNECTED_TIME),
      bPartyEndTime: parseDateTime(data.B_PARTY_END_TIME),
      bPartyReleaseReason: data.B_PARTY_RELEASE_REASON,
      bDialStatus: data.B_DIAL_STATUS,
      cPartyNo: data.C_PARTY_NO,
      cPartyDialStartTime: parseDateTime(data.C_PARTY_DIAL_START_TIME),
      cPartyDialEndTime: parseDateTime(data.C_PARTY_DIAL_END_TIME),
      cPartyConnectedTime: parseDateTime(data.C_PARTY_CONNECTED_TIME),
      cPartyEndTime: parseDateTime(data.C_PARTY_END_TIME),
      cPartyReleaseReason: data.C_PARTY_RELEASE_REASON,
      cDialStatus: data.C_DIAL_STATUS,
      refId: data.REF_ID,
      recordVoice: data.RecordVoice,
      disconnectedBy: data.DISCONNECTED_BY,
    }).catch(error => {
      // Log database errors but don't affect the response
      console.error('Error saving call log:', error);
    });

  } catch (error) {
    console.error('Error processing webhook:', error);
    // Only send error response if we haven't sent the success response
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
});



router.get('/call-logs/:callId/b-party-connection', async (req, res) => {
  try {
    const { callId } = req.params;

    // Find the call log entry with the specified callId and eventType
    const callLog = await CallLog.findOne({
      where: {
        callId: callId,
        eventType: 'B party Connected/Notconnected'
      }
    });

    if (!callLog) {
      return res.status(201).json({ message: 'B party connecting' });
    }

    // Extract relevant information
    const response = {
      callId: callLog.callId,
      eventType: callLog.eventType,
      aPartyNo: callLog.aPartyNo,
      bPartyNo: callLog.bPartyNo,
      bPartyDialStartTime: callLog.bPartyDialStartTime,
      bPartyDialEndTime: callLog.bPartyDialEndTime,
      bPartyConnectedTime: callLog.bPartyConnectedTime,
      bDialStatus: callLog.bDialStatus,
      bPartyReleaseReason: callLog.bPartyReleaseReason
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching B party connection event:', error);
    res.status(500).json({ message: 'Error fetching B party connection event', error: error.message });
  }
});





router.get('/call-logs/:callId/call-end', async (req, res) => {
  try {
    const { callId } = req.params;

    // Find the call log entry with the specified callId and eventType
    const callLog = await CallLog.findOne({
      where: {
        callId: callId,
        eventType: 'Call End'
      }
    });

    if (!callLog) {
      return res.status(201).json({ message: 'Call is still ongoing or not found' });
    }

    // Extract relevant information
    const response = {
      callId: callLog.callId,
      eventType: callLog.eventType,
      aPartyNo: callLog.aPartyNo,
      bPartyNo: callLog.bPartyNo,
      callStartTime: callLog.callStartTime,
      aPartyEndTime: callLog.aPartyEndTime,
      bPartyEndTime: callLog.bPartyEndTime,
      aPartyReleaseReason: callLog.aPartyReleaseReason,
      bPartyReleaseReason: callLog.bPartyReleaseReason,
      recordVoice: callLog.recordVoice,
      disconnectedBy: callLog.disconnectedBy
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching Call End event:', error);
    res.status(500).json({ message: 'Error fetching Call End event', error: error.message });
  }
});


// router.post('/incoming-call', async (req, res) => {
//   try {
//     const {
//       event,
//       callid,
//       ivr_number,
//       caller_no,
//       agent_number
//     } = req.body;

//     console.log('Incoming call data:', req.body);

//     // Create a new call record
//     const call = await IncomingCall.create({
//       callId: callid,
//       event: event,
//       ivrNumber: ivr_number,
//       callerNumber: caller_no,
//       agentNumber: agent_number
//       // Note: agentNumber and connectedAt are not set at this stage
//     });

//     return res.status(200).json({
//       success: true,
//       message: 'Incoming call data received and processed',
//       callId: call.id
//     });

//   } catch (error) {
//     console.error('Error processing incoming call data:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Error processing incoming call data',
//       error: error.message
//     });
//   }
// });


router.post('/incoming-call', async (req, res) => {
  try {
    const {
      event,
      callid,
      ivr_number,
      caller_no,
      agent_number
    } = req.body;

    console.log('Incoming call data:', req.body);

    // Create a new call record
    const call = await IncomingCall.create({
      callId: callid,
      event: event,
      ivrNumber: ivr_number,
      callerNumber: caller_no,
      agentNumber: agent_number
    });

    // Emit socket event for incoming call
    if (event === 'on_call_initiate') {
      // Prepare the data to emit
      const incomingCallData = {
        eventType: 'incoming_call',
        callId: callid,
        callerNumber: caller_no,
        agentNumber: agent_number,
        timestamp: new Date().toISOString()
      };

      // Emit to all connected clients (they will filter based on agent number)
      req.io.emit('incomingCall', incomingCallData);
    }

    return res.status(200).json({
      success: true,
      message: 'Incoming call data received and processed',
      callId: call.id
    });
  } catch (error) {
    console.error('Error processing incoming call data:', error);
    return res.status(500).json({
      success: false,
      message: 'Error processing incoming call data',
      error: error.message
    });
  }
});       


// router.post('/incoming-call/connect', async (req, res) => {
//   try {
//     const {
//       event,
//       callid,
//       ivr_number,
//       caller_no,
//       agent_number
//     } = req.body;

//     console.log('Incoming call connect data:', req.body);

//     // Find or create the call record
//     const [call, created] = await IncomingCall.findOrCreate({
//       where: { callId: callid },
//       defaults: {
//         event: event,
//         ivrNumber: ivr_number,
//         callerNumber: caller_no,
//         agentNumber: agent_number,
//         connectedAt: new Date()
//       }
//     });

//     if (!created) {
//       // If the record already existed, update it
//       await call.update({
//         event: event,
//         ivrNumber: ivr_number,
//         callerNumber: caller_no,
//         agentNumber: agent_number,
//         connectedAt: new Date()
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: 'Call connect data received and processed',
//       callId: call.id,
//       isNewCall: created
//     });

//   } catch (error) {
//     console.error('Error processing incoming call connect data:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Error processing incoming call connect data',
//       error: error.message
//     });
//   }
// });


router.post('/incoming-call/connect', async (req, res) => {
  try {
    const {
      event,
      callid,
      ivr_number,
      caller_no,
      agent_number
    } = req.body;

    console.log('Incoming call connect data:', req.body);

    // Find or create the call record
    const [call, created] = await IncomingCall.findOrCreate({
      where: { callId: callid },
      defaults: {
        event: event,
        ivrNumber: ivr_number,
        callerNumber: caller_no,
        agentNumber: agent_number,
        connectedAt: new Date()
      }
    });

    if (!created) {
      // If the record already existed, update it
      await call.update({
        event: event,
        ivrNumber: ivr_number,
        callerNumber: caller_no,
        agentNumber: agent_number,
        connectedAt: new Date()
      });
    }

    // Emit socket event based on event type
    if (event === 'oncallconnect') {
      req.io.emit('incomingCallStatus', {
        eventType: 'oncallconnect',
        callId: callid,
        callerNumber: caller_no,
        agentNumber: agent_number,
        timestamp: new Date().toISOString()
      });
    } else if (event === 'call_ended') {
      req.io.emit('incomingCallStatus', {
        eventType: 'call_ended',
        callId: callid,
        agentNumber: agent_number,
        timestamp: new Date().toISOString()
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Call connect data received and processed',
      callId: call.id,
      isNewCall: created
    });
  } catch (error) {
    console.error('Error processing incoming call connect data:', error);
    return res.status(500).json({
      success: false,
      message: 'Error processing incoming call connect data',
      error: error.message
    });
  }
});



//post call incoming 
router.post('/Data/json', async (req, res) => {
  try {
    const {
      callid,
      event,
      ivr_number,
      caller_no,
      call_start_time,
      call_end_time,
      dtmf,
      og_start_time,
      og_end_time,
      og_call_status,
      agent_number,
      total_call_duration,
      voice_recording
    } = req.body;

    console.log('Post-call data:', req.body);

    // DateTime parsing function
    const parseDateTime = (dateTimeString) => {
      return dateTimeString
        ? moment.tz(dateTimeString, 'DDMMYYYYHHmmss', 'Asia/Kolkata').toDate()
        : null;
    };

    // Check if the call exists in IncomingCall
    let incomingCall = await IncomingCall.findOne({ where: { callId: callid } });

    if (!incomingCall) {
      console.log(`No matching incoming call found for callId: ${callid}`);
    }

    // Create a new PostCallData record using parseDateTime
    const postCallData = await PostCallData.create({
      callId: callid,
      event: event,
      ivrNumber: ivr_number,
      callerNumber: caller_no,
      callStartTime: parseDateTime(call_start_time),
      callEndTime: parseDateTime(call_end_time),
      dtmf: dtmf,
      ogStartTime: parseDateTime(og_start_time),
      ogEndTime: parseDateTime(og_end_time),
      ogCallStatus: og_call_status,
      agentNumber: agent_number,
      totalCallDuration: parseInt(total_call_duration),
      voiceRecording: voice_recording
    });

    // If IncomingCall exists, update its status
    if (incomingCall) {
      await incomingCall.update({
        event: 'call_ended',
        endedAt: parseDateTime(call_end_time)
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Post-call data received and processed',
      postCallDataId: postCallData.id
    });

  } catch (error) {
    console.error('Error processing post-call data:', error);
    return res.status(500).json({
      success: false,
      message: 'Error processing post-call data',
      error: error.message
    });
  }
});


//auth-token
router.post('/get-auth-token', async (req, res) => {
  try {
    const vodafoneAuthUrl = 'https://cts.myvi.in:8443/Cpaas/api/clicktocall/AuthToken';
    const authBody = {
      username: process.env.VODAFONE_USERNAME || 'ABIS123',
      password: process.env.VODAFONE_PASSWORD || 'ABIS@123'
    };

    const response = await axios.post(vodafoneAuthUrl, authBody, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Assuming the Vodafone API returns the token in the response
    const token = response.data; // Adjust this based on the actual response structure
    console.log(token, "----------------");
    

    res.json({ token });
  } catch (error) {
    console.error('Error obtaining auth token:', error);
    res.status(500).json({ message: 'Error obtaining auth token', error: error.message });
  }
});



//call initiate
router.post('/initiate-call', async (req, res) => {
  try {
    // Extract the bearer token from the request headers
    const bearerToken = req.headers.authorization;

    if (!bearerToken || !bearerToken.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No bearer token provided' });
    }

    const token = bearerToken.split(' ')[1];

    // The URL of the Vodafone Click-to-Call API
    const vodafoneApiUrl = 'https://cts.myvi.in:8443/Cpaas/api/clicktocall/initiate-call';

    // Forward the request body to the Vodafone API
    const vodafoneResponse = await axios.post(vodafoneApiUrl, req.body, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    // Send the Vodafone API response back to the client
    res.status(vodafoneResponse.status).json(vodafoneResponse.data);

  } catch (error) {
    console.error('Error initiating call:', error);
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      res.status(error.response.status).json(error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      res.status(500).json({ message: 'No response received from Vodafone API' });
    } else {
      // Something happened in setting up the request that triggered an Error
      res.status(500).json({ message: 'Error setting up the request', error: error.message });
    }
  }
});



//holdORresume 
router.post('/hold-or-resume', async (req, res) => {
  try {
    // Extract the bearer token from the request headers
    const bearerToken = req.headers.authorization;

    if (!bearerToken || !bearerToken.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No bearer token provided' });
    }

    const token = bearerToken.split(' ')[1];

    // The URL of the Vodafone Hold or Resume API
    const vodafoneApiUrl = 'https://cts.myvi.in:8443/Cpaas/api/clicktocall/HoldorResume';

    // Forward the request body to the Vodafone API
    const vodafoneResponse = await axios.post(vodafoneApiUrl, req.body, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    // Send the Vodafone API response back to the client
    res.status(vodafoneResponse.status).json(vodafoneResponse.data);

  } catch (error) {
    console.error('Error in Hold or Resume operation:', error);
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      res.status(error.response.status).json(error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      res.status(500).json({ message: 'No response received from Vodafone API' });
    } else {
      // Something happened in setting up the request that triggered an Error
      res.status(500).json({ message: 'Error setting up the request', error: error.message });
    }
  }
});


//call-End
router.post('/call-disconnection', async (req, res) => {
  try {
    // Extract the bearer token from the request headers
    const bearerToken = req.headers.authorization;

    if (!bearerToken || !bearerToken.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No bearer token provided' });
    }

    const token = bearerToken.split(' ')[1];

    // The URL of the Vodafone Call Disconnection API
    const vodafoneApiUrl = 'https://cts.myvi.in:8443/Cpaas/api/clicktocall/CallDisconnection';

    // Forward the request body to the Vodafone API
    const vodafoneResponse = await axios.post(vodafoneApiUrl, req.body, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    // Send the Vodafone API response back to the client
    res.status(vodafoneResponse.status).json(vodafoneResponse.data);

  } catch (error) {
    console.error('Error in Call Disconnection operation:', error);
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      res.status(error.response.status).json(error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      res.status(500).json({ message: 'No response received from Vodafone API' });
    } else {
      // Something happened in setting up the request that triggered an Error
      res.status(500).json({ message: 'Error setting up the request', error: error.message });
    }
  }
});

///
// router.get('/call-statistics/:aPartyNo', async (req, res) => {
//   try {
//     const { aPartyNo } = req.params;

//     // Fetch all call logs for the given A-party number
//     const callLogs = await CallLog.findAll({
//       where: { aPartyNo },
//       order: [['callStartTime', 'DESC']]
//     });

//     let connectedCalls = 0;
//     let notConnectedCalls = 0;
//     let totalDuration = 0;

//     const callDetails = callLogs.map(call => {
//       const startTime = new Date(call.callStartTime);
//       const endTime = new Date(call.aPartyEndTime);
//       const duration = (endTime - startTime) / 1000; // duration in seconds

//       if (call.aDialStatus === 'Connected') {
//         connectedCalls++;
//         totalDuration += duration;
//       } else {
//         notConnectedCalls++;
//       }

//       return {
//         callId: call.callId,
//         startTime: call.callStartTime,
//         duration: duration,
//         status: call.aDialStatus
//       };
//     });

//     const totalCalls = connectedCalls + notConnectedCalls;
//     const averageDuration = connectedCalls > 0 ? totalDuration / connectedCalls : 0;

//     const response = {
//      "AgentNo": aPartyNo,
//       totalCalls,
//       connectedCalls,
//       notConnectedCalls,
//       totalDuration,
//       averageDuration,
//       callDetails
//     };

//     res.status(200).json(response);
//   } catch (error) {
//     console.error('Error fetching call statistics:', error);
//     res.status(500).json({ message: 'Error fetching call statistics', error: error.message });
//   }
// });



router.get('/call-statistics/:aPartyNo', async (req, res) => {
  try {
    const { aPartyNo } = req.params;

    // Get connected calls count
    const connectedCallsCount = await CallLog.count({
      where: {
        aPartyNo,
        eventType: 'Call End',
        bDialStatus: 'connected'
      }
    });

    // Get not connected calls count
    const notConnectedCallsCount = await CallLog.count({
      where: {
        aPartyNo,
        eventType: 'Call End',
        bDialStatus: {
           [Op.ne]: 'connected'
        }
      }
    });

    res.status(200).json({
      success: true,
      data: {
        aPartyNo,
        connectedCalls: connectedCallsCount,
        notConnectedCalls: notConnectedCallsCount,
        totalCalls: connectedCallsCount + notConnectedCallsCount
      }
    });

  } catch (error) {
    console.error('Error retrieving call counts:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});



//
router.get('/latest-agent-call/:agentNumber', async (req, res) => {
  try {
    const { agentNumber } = req.params;

    console.log(agentNumber, '-----------------');
    

    const latestCall = await IncomingCall.findOne({
      where: {
        agentNumber: agentNumber,
        event: 'oncallconnect',
        connectedAt: { [Op.not]: null }
      },
      order: [['connectedAt', 'DESC']]
    });

    if (!latestCall) {
      return res.status(404).json({
        success: false,
        message: 'No connected calls found for this agent'
      });
    }

    res.status(200).json({
      success: true,
      data: latestCall
    });

  } catch (error) {
    console.error('Error fetching latest agent call detail:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching latest agent call detail',
      error: error.message
    });
  }
});







router.post('/merge-call', async (req, res) => {
  try {
    // Extract the bearer token from the request headers
    const bearerToken = req.headers.authorization;

    if (!bearerToken || !bearerToken.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No bearer token provided' });
    }

    const token = bearerToken.split(' ')[1];

    // The URL of the Vodafone Call Conference API
    const vodafoneApiUrl = 'https://cts.myvi.in:8443/Cpaas/api/clicktocall/callConference';

    // Forward the request body to the Vodafone API
    const vodafoneResponse = await axios.post(vodafoneApiUrl, req.body, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    // Send the Vodafone API response back to the client
    res.status(vodafoneResponse.status).json(vodafoneResponse.data);

  } catch (error) {
    console.error('Error in Merge Call operation:', error);
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      res.status(error.response.status).json(error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      res.status(500).json({ message: 'No response received from Vodafone API' });
    } else {
      // Something happened in setting up the request that triggered an Error
      res.status(500).json({ message: 'Error setting up the request', error: error.message });
    }
  }
});





// router.post('/merge-call', async (req, res) => {
//   try {
//     // Extract the bearer token from the request headers
//     const bearerToken = req.headers.authorization;

//     if (!bearerToken || !bearerToken.startsWith('Bearer ')) {
//       return res.status(401).json({ message: 'No bearer token provided' });
//     }

//     const token = bearerToken.split(' ')[1];

//     // The URL of the Vodafone Call Conference API
//     const vodafoneApiUrl = 'https://cts.myvi.in:8443/Cpaas/api/clicktocall/callConference';

//     // Forward the request body to the Vodafone API
//     const vodafoneResponse = await axios.post(vodafoneApiUrl, req.body, {
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${token}`
//       }
//     });

//     // After successful merge call, update the call log
//     if (vodafoneResponse.status === 200 && req.body.call_id && req.body.cparty_number) {
//       try {
//         const existingCall = await CallLog.findOne({
//           where: { callId: req.body.call_id }
//         });

//         if (existingCall) {
//           // Update the existing call with C-party information
//           await existingCall.update({
//             cPartyNo: req.body.cparty_number,
//             // Set initial C-party status
//             cDialStatus: 'Initiated',
//             // Update the event type to reflect merge call
//             eventType: 'Conference Initiated'
//           });

//           console.log('CallLog updated with C-party information:', {
//             callId: req.body.call_id,
//             cPartyNo: req.body.cparty_number
//           });
//         } else {
//           console.log('No existing call found with ID:', req.body.call_id);
//         }
//       } catch (dbError) {
//         // Log database error but don't affect the API response
//         console.error('Error updating CallLog:', dbError);
//       }
//     }

//     // Send the Vodafone API response back to the client
//     res.status(vodafoneResponse.status).json(vodafoneResponse.data);

//   } catch (error) {
//     console.error('Error in Merge Call operation:', error);

//     if (error.response) {
//       // The request was made and the server responded with a status code
//       // that falls out of the range of 2xx
//       res.status(error.response.status).json(error.response.data);
//     } else if (error.request) {
//       // The request was made but no response was received
//       res.status(500).json({ message: 'No response received from Vodafone API' });
//     } else {
//       // Something happened in setting up the request that triggered an Error
//       res.status(500).json({ 
//         message: 'Error setting up the request', 
//         error: error.message 
//       });
//     }
//   }
// });





 
module.exports = router;



 