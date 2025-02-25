// // process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
// const express = require('express')
// var bodyParser = require('body-parser')
// const app = express()
// // require('./models/index.js')
// const models = require('./models/models.js');
// const PincodeRoutes = require('./Routes/Pincode.js');
// const authRoutes = require('./Routes/authRoutes.js');
// const AgentRoutes = require('./Routes/Agent/AgentRoute.js');
// const BDMRoutes = require('./Routes/BDM/BdmRoute.js');
// const ActionRoutes = require('./Routes/Actions/lead_meeting.js')
// const LeadUpdate = require('./Routes/Actions/lead_update.js');
// const ActionSiteVisit = require('./Routes/Actions/site_visit.js');
// const Estimation = require('./Routes/Actions/estimation.js');
// const Confirmation = require('./Routes/Actions/confirmation.js');
// const SuperViser = require('./Routes/SuperViser/super_viser.js');
// const Audit = require('./Routes/AuditLeadRoutes/AuditLeadRoutes.js')
// const exotelRoutes = require('./Routes/exotel.js');
// const Region = require('./Routes/Region/RegionRoute.js');
// const Incoming = require('./Controller/CallingAPI/incoming.js');
// const EndCall = require('./Controller/CallingAPI/CallEndApi.js');
// const lead_converted = require('./Routes/Actions/lead_converted.js');
// const OnCallDiscussion = require('./Routes/Actions/on_call_discussion.js')
// const TimeLine = require('./Routes/TimeLine.js')
// const Attendance = require('./Routes/Attendence/Attendence.js');
// const BiRoutes = require('./Routes/BiRoutes/BiRoutes.js');
 

// const cors = require('cors');
 

// app.use(bodyParser.json())
// app.use(express.urlencoded({ extended: true }));

// app.use(cors());
// app.use(function (req, res, next) {
//   res.header("Access-Control-Allow-Origin", "*");
//   res.header("Access-Control-Allow-Methods", 'DELETE, PUT, GET, POST');
//   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//   next();
// });


// app.use('/api/auth' ,authRoutes)
// app.use('/api', exotelRoutes);
// app.use('/api',AgentRoutes);
// app.use('/api',BDMRoutes );
// app.use('/api' ,ActionRoutes);
// app.use('/api', LeadUpdate);
// app.use('/api', ActionSiteVisit);
// app.use('/api' ,Estimation);
// app.use('/api' , Confirmation);
// app.use('/api', SuperViser);
// app.use('/api', Audit);
// app.use('/api',Region);
// app.use('/api',Incoming);
// app.use('/api' ,EndCall );
// app.use('/api', lead_converted);
// app.use('/api',OnCallDiscussion);
// app.use('/api',TimeLine );
// app.use('/api',Attendance);
// app.use('/api' ,BiRoutes )

 





// app.get('/', function (req, res) {
//   res.send('Parivartan API')
// })

// app.use('/api', PincodeRoutes);
 

// app.listen(3002 , ()=>{
//     console.log('App will run on : http://0.0.0.0:3002')
// })














// process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');


// Initialize express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*", // Configure according to your security needs
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Store active call connections
const activeCallSockets = new Map();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Handle call registration
  socket.on('registerCall', (callId) => {
    activeCallSockets.set(callId, socket.id);
    console.log(`Registered call ${callId} with socket ${socket.id}`);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    for (const [callId, socketId] of activeCallSockets.entries()) {
      if (socketId === socket.id) {
        activeCallSockets.delete(callId);
        console.log(`Unregistered call ${callId}`);
      }
    }
  });
});

// Make io instance available to routes
app.set('io', io);
app.set('activeCallSockets', activeCallSockets);

// Import models and routes
const models = require('./models/models.js');
const PincodeRoutes = require('./Routes/Pincode.js');
const authRoutes = require('./Routes/authRoutes.js');
const AgentRoutes = require('./Routes/Agent/AgentRoute.js');
const BDMRoutes = require('./Routes/BDM/BdmRoute.js');
const ActionRoutes = require('./Routes/Actions/lead_meeting.js');
const LeadUpdate = require('./Routes/Actions/lead_update.js');
const ActionSiteVisit = require('./Routes/Actions/site_visit.js');
const Estimation = require('./Routes/Actions/estimation.js');
const Confirmation = require('./Routes/Actions/confirmation.js');
const SuperViser = require('./Routes/SuperViser/super_viser.js');
const Audit = require('./Routes/AuditLeadRoutes/AuditLeadRoutes.js');
const exotelRoutes = require('./Routes/exotel.js');
const Region = require('./Routes/Region/RegionRoute.js');
const Incoming = require('./Controller/CallingAPI/incoming.js');
const EndCall = require('./Controller/CallingAPI/CallEndApi.js');
const lead_converted = require('./Routes/Actions/lead_converted.js');
const OnCallDiscussion = require('./Routes/Actions/on_call_discussion.js');
const TimeLine = require('./Routes/TimeLine.js');
const Attendance = require('./Routes/Attendence/Attendence.js');
const BiRoutes = require('./Routes/BiRoutes/BiRoutes.js');
const customerLeadRoutes = require('./Routes/Customer/Customer.js');
const masterRoutes = require('./Routes/Master/MasterRoute.js');
const AuditReport = require('./Routes/AuditLeadRoutes/AuditReportRoutes.js');
const ParivartanDashboard = require('./Routes/ParivartanDashboard/ParivartanDashboard.js')
const path = require('path');


// Middleware
app.use(bodyParser.json()); 
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// CORS configuration
app.use(cors());
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", 'DELETE, PUT, GET, POST');
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// Middleware to attach socket utilities to each request
app.use((req, res, next) => {
  req.io = io;
  req.activeCallSockets = activeCallSockets;
  next();
});


app.set('view engine', 'ejs');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', exotelRoutes);
app.use('/api', AgentRoutes);
app.use('/api', BDMRoutes);
app.use('/api', ActionRoutes);
app.use('/api', LeadUpdate);
app.use('/api', ActionSiteVisit);
app.use('/api', Estimation);
app.use('/api', Confirmation);
app.use('/api', SuperViser);
app.use('/api', Audit);
app.use('/api', Region);
app.use('/api', Incoming);
app.use('/api', EndCall);
app.use('/api', lead_converted);
app.use('/api', OnCallDiscussion);
app.use('/api', TimeLine);
app.use('/api', Attendance);
app.use('/api', BiRoutes);
app.use('/api', PincodeRoutes);
app.use('/api', customerLeadRoutes);
app.use('/api', masterRoutes);
app.use('/api',AuditReport )
app.use('/api', ParivartanDashboard);

// Root route
app.get('/', function (req, res) {
  res.send('Parivartan API');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Start server
const PORT = process.env.PORT || 3003; 
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log('WebSocket server is ready for connections');
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});



module.exports = { app, io, activeCallSockets };






