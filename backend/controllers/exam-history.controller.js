
const getExamsHistory = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const activities = await ActivityLog.getRecentActivities(parseInt(limit));
    
    if (!activities || activities.length === 0) {
      return res.status(404).json({ success: false, message: 'No exam history found.' });
    }

    return res.status(200).json({ success: true, data: activities });
  } catch (error) {
    console.error('Error fetching exam history:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }

}

module.exports = {
  getExamsHistory,  
  // other exports...
};