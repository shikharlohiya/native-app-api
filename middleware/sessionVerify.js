// middleware/sessionVerify.js
const jwt = require("jsonwebtoken");
const { Employee } = require("../models/models");
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

const verifySession = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get employee from database
    const employee = await Employee.findOne({
      where: { EmployeeId: decoded.EmployeeId }
    });
    
    if (!employee) {
      return res.status(401).json({ message: "Employee not found" });
    }
    
    // Check if session ID matches
    if (employee.sessionId !== decoded.sessionId) {
      return res.status(401).json({ 
        message: "Your session has expired because you logged in from another device",
        code: "SESSION_EXPIRED"
      });
    }
    
    // Check if user is still active
    if (employee.is_active === false) {
      return res.status(403).json({ message: "User account is inactive" });
    }
    
    // Add employee to request
    req.employee = decoded;
    next();
  } catch (error) {
    console.error("Session verification error:", error);
    
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ 
        message: "Token expired",
        code: "TOKEN_EXPIRED"
      });
    }
    
    return res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = verifySession;