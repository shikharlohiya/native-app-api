const Notification = require('../../models/Notification');
const Employee = require('../../models/employee');
const LeadDetail = require('../../models/lead_detail');
const { Op } = require('sequelize');

// API to get notifications for an employee


// exports.getEmployeeNotifications = async function(req, res) {
//   try {
//     const { employeeId, limit = 10, offset = 0, showAll = false } = req.query;

//     if (!employeeId) {
//       return res.status(400).json({ error: 'Employee ID is required.' });
//     }

//     // Check if employee exists
//     const employee = await Employee.findByPk(employeeId);
//     if (!employee) {
//       return res.status(404).json({ error: 'Employee not found.' });
//     }

//     // Build query conditions
//     const queryConditions = {
//       employeeId: employeeId
//     };

//     // By default, only show unread notifications (isRead=0)
//     // unless showAll=true is explicitly specified
//     if (showAll !== 'true') {
//       queryConditions.isRead = false;
//     }

//     // Get total unread count for badge notifications
//     const totalUnread = await Notification.count({
//       where: {
//         employeeId: employeeId,
//         isRead: false
//       }
//     });

//     // Get notifications with pagination
//     const notifications = await Notification.findAll({
//       where: queryConditions,
//       attributes: ['id', 'employeeId', 'text', 'isRead', 'leadDetailId', 'createdAt', 'createdBy'],
//       order: [['createdAt', 'DESC']],
//       limit: parseInt(limit),
//       offset: parseInt(offset)
//     });

//     res.status(200).json({
//       notifications: notifications,
//       totalUnread: totalUnread
//     });
//   } catch (error) {
//     console.error('Error fetching employee notifications:', error);
//     res.status(500).json({ error: 'An error occurred while fetching notifications.' });
//   }
// };

exports.getEmployeeNotifications = async function(req, res) {
 try {
   const { employeeId, limit = 10, offset = 0, readStatus } = req.query;

   if (!employeeId) {
     return res.status(400).json({ error: 'Employee ID is required.' });
   }

   // Check if employee exists
   const employee = await Employee.findByPk(employeeId);
   if (!employee) {
     return res.status(404).json({ error: 'Employee not found.' });
   }

   // Build query conditions
   const queryConditions = {
     employeeId: employeeId
   };

   // Filter by read status if specified
   if (readStatus === 'read') {
     queryConditions.isRead = true;
   } else if (readStatus === 'unread') {
     queryConditions.isRead = false;
   }
   // If readStatus is not specified or has any other value, return all notifications

   // Get counts for both read and unread notifications
   const unreadCount = await Notification.count({
     where: {
       employeeId: employeeId,
       isRead: false
     }
   });

   const readCount = await Notification.count({
     where: {
       employeeId: employeeId,
       isRead: true
     }
   });

   // Get notifications with pagination
   const notifications = await Notification.findAll({
     where: queryConditions,
     attributes: ['id', 'employeeId', 'text', 'isRead', 'leadDetailId', 'createdAt', 'createdBy'],

     include: [
      {
        model: LeadDetail,
        as: 'leadDetail',
        attributes: ['id', 'CustomerName', 'MobileNo', 'InquiryType', 'Project']
      }
    ],


     order: [['createdAt', 'DESC']],
     limit: parseInt(limit),
     offset: parseInt(offset)
   });

   res.status(200).json({
     notifications: notifications,
     counts: {
       unread: unreadCount,
       read: readCount,
       total: unreadCount + readCount
     }
   });
 } catch (error) {
   console.error('Error fetching employee notifications:', error);
   res.status(500).json({ error: 'An error occurred while fetching notifications.' });
 }
};


// API to mark notifications as read
exports.updateNotificationReadStatus = async function(req, res) {
  try {
    const { notificationIds, isRead = true } = req.body;

    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      return res.status(400).json({ error: 'At least one notification ID is required.' });
    }

    // Update all specified notifications
    const updateResult = await Notification.update(
      { isRead: isRead, updatedAt: new Date() },
      { 
        where: { 
          id: { 
            [Op.in]: notificationIds 
          } 
        } 
      }
    );

    // Check if any notifications were updated
    if (updateResult[0] === 0) {
      return res.status(404).json({ error: 'No notifications were found with the provided IDs.' });
    }

    res.status(200).json({
      message: `Successfully ${isRead ? 'marked as read' : 'marked as unread'} ${updateResult[0]} notification(s).`,
      updatedCount: updateResult[0]
    });
  } catch (error) {
    console.error('Error updating notification read status:', error);
    res.status(500).json({ error: 'An error occurred while updating notification status.' });
  }
};

// API to mark all notifications as read for an employee
exports.markAllNotificationsAsRead = async function(req, res) {
  try {
    const { employeeId } = req.body;

    if (!employeeId) {
      return res.status(400).json({ error: 'Employee ID is required.' });
    }

    // Update all unread notifications for the employee
    const updateResult = await Notification.update(
      { isRead: true, updatedAt: new Date() },
      { 
        where: { 
          employeeId: employeeId,
          isRead: false
        } 
      }
    );

    res.status(200).json({
      message: `Successfully marked ${updateResult[0]} notification(s) as read.`,
      updatedCount: updateResult[0]
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'An error occurred while updating notification status.' });
  }
};





// API to mark a single notification as read
exports.updateSingleNotification = async function(req, res) {
 try {
   const { notificationId } = req.body;

   if (!notificationId) {
     return res.status(400).json({ error: 'Notification ID is required.' });
   }

   // Find the notification first to confirm it exists
   const notification = await Notification.findByPk(notificationId);
   
   if (!notification) {
     return res.status(404).json({ error: 'Notification not found.' });
   }

   // If notification is already read, no need to update
   if (notification.isRead) {
     return res.status(200).json({
       message: 'Notification was already marked as read.',
       notification: notification
     });
   }

   // Update the notification
   notification.isRead = true;
   notification.updatedAt = new Date();
   await notification.save();

   res.status(200).json({
     message: 'Notification marked as read successfully.',
     notification: notification
   });
 } catch (error) {
   console.error('Error updating single notification:', error);
   res.status(500).json({ error: 'An error occurred while updating the notification.' });
 }
};
