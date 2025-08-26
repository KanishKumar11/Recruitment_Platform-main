const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/recruitment-platform';

// Notification schema
const NotificationSchema = new mongoose.Schema({
  recipientId: { type: mongoose.Schema.Types.ObjectId, required: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
  resumeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume' },
  candidateName: String,
  jobTitle: String,
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);

(async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    
    // Check for notifications without title
    const notificationsWithoutTitle = await Notification.find({
      $or: [
        { title: { $exists: false } },
        { title: null },
        { title: '' }
      ]
    }).limit(10);
    
    console.log('Notifications without title:', JSON.stringify(notificationsWithoutTitle, null, 2));
    
    const totalCount = await Notification.countDocuments({
      $or: [
        { title: { $exists: false } },
        { title: null },
        { title: '' }
      ]
    });
    
    console.log('Total notifications without title:', totalCount);
    
    // Also check all notifications to see their structure
    const allNotifications = await Notification.find({}).limit(5).select('title type message createdAt');
    console.log('Sample notifications:', JSON.stringify(allNotifications, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();