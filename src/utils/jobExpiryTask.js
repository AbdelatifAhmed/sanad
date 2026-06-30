const JobPost = require("../models/jobPost.schema");
const { sendNotification } = require("../services/notificationService");

const getFirstShiftStartDateTime = (startDate, workingDays, startTime) => {
  const daysMap = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };
  const targetDayNumbers = workingDays.map(day => daysMap[day]);
  const start = new Date(startDate);
  const [hours, minutes] = startTime.split(':').map(Number);
  start.setHours(hours, minutes, 0, 0);

  for (let i = 0; i < 7; i++) {
    const checkDate = new Date(start);
    checkDate.setDate(start.getDate() + i);
    if (targetDayNumbers.includes(checkDate.getDay())) {
      return checkDate;
    }
  }
  return start;
};

const checkJobPostsExpiry = async (io) => {
  try {
    const now = new Date();
    const openPosts = await JobPost.find({ status: "open" });
    
    for (const post of openPosts) {
      if (!post.schedule || !post.schedule.workingDays || !post.schedule.startTime) continue;
      
      const firstShiftStart = getFirstShiftStartDateTime(
        post.startDate || post.createdAt, 
        post.schedule.workingDays, 
        post.schedule.startTime
      );
      
      const diffMs = firstShiftStart.getTime() - now.getTime();
      const diffMins = diffMs / (1000 * 60);
      
      if (diffMins < 15) {
        post.status = "canceled";
        await post.save();
        
        try {
          await sendNotification(
            post.familyId,
            post.familyId,
            "Job Post Canceled | إلغاء طلب العمل",
            `تم إلغاء طلب العمل "${post.title}" تلقائياً لاقتراب موعد المناوبة (أقل من 15 دقيقة) دون تعيين مرافق.`,
            "jobpost",
            io
          );
        } catch (err) {
          console.error("Failed to send job post cancellation notification:", err.message);
        }
      } else if (diffMins <= 30 && !post.warningSent) {
        post.warningSent = true;
        await post.save();
        
        try {
          await sendNotification(
            post.familyId,
            post.familyId,
            "Job Post Expiry Warning | تنبيه إلغاء الطلب",
            `تنبيه: سيتم إلغاء طلب العمل "${post.title}" تلقائياً بعد 30 دقيقة لعدم تعيين مرافق حتى الآن.`,
            "jobpost",
            io
          );
        } catch (err) {
          console.error("Failed to send job post cancellation warning:", err.message);
        }
      }
    }
  } catch (err) {
    console.error("Error in checkJobPostsExpiry:", err);
  }
};

const startExpiryTask = (io) => {
  checkJobPostsExpiry(io);
  setInterval(() => {
    checkJobPostsExpiry(io);
  }, 30000);
};

module.exports = {
  startExpiryTask,
  checkJobPostsExpiry,
  getFirstShiftStartDateTime
};
