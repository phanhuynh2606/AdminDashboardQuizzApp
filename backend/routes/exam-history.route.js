// routes/practiceHistory.js
const express = require('express');
const router = express.Router();
const PracticeHistory = require('../models/practiceHistory.model');


// GET: Lấy danh sách lịch sử làm bài với phân trang và filter
router.get('/', async (req, res) => {
  try {
    console.log('GET /practice-history - Query params:', req.query);
    
    const {
      page = 1,
      pageSize = 10,
      userSessionId,
      subjectCode,
      examTypeCode,
      isCompleted,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Tạo query filter
    const filter = {};
    if (userSessionId) filter.userSessionId = userSessionId;
    if (subjectCode) filter.subjectCode = subjectCode;
    if (examTypeCode) filter.examTypeCode = examTypeCode;
    if (isCompleted !== undefined && isCompleted !== '') {
      filter.isCompleted = isCompleted === 'true';
    }
    
    // Filter theo khoảng thời gian
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        // Thêm 23:59:59 cho endDate để bao gồm cả ngày
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = endOfDay;
      }
    }

    console.log('MongoDB filter:', filter);

    // Tính toán phân trang
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Truy vấn dữ liệu
    const [histories, total, subjects, examTypes] = await Promise.all([
      PracticeHistory.find(filter)
        .populate('examId', 'title description duration')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(pageSize))
        .lean(),
      PracticeHistory.countDocuments(filter),
      // Lấy danh sách subjects từ toàn bộ data (không áp dụng filter để có đầy đủ options)
      PracticeHistory.distinct('subjectCode'),
      // Lấy danh sách exam types từ toàn bộ data
      PracticeHistory.distinct('examTypeCode')
    ]);

    console.log(`Found ${total} total records, returning ${histories.length} records`);
    console.log('Available subjects:', subjects);
    console.log('Available exam types:', examTypes);

    // Tính toán thống kê
    const stats = await PracticeHistory.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalAttempts: { $sum: 1 },
          completedAttempts: { $sum: { $cond: ['$isCompleted', 1, 0] } },
          averageScore: { $avg: '$score' },
          totalTimeSpent: { $sum: '$timeSpent' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        histories,
        pagination: {
          current: parseInt(page),
          pageSize: parseInt(pageSize),
          total,
          pages: Math.ceil(total / parseInt(pageSize))
        },
        stats: stats[0] || {
          totalAttempts: 0,
          completedAttempts: 0,
          averageScore: 0,
          totalTimeSpent: 0
        },
        // Thêm danh sách subjects và exam types
        subjects: subjects.filter(code => code), // Loại bỏ null/undefined
        examTypes: examTypes.filter(code => code) // Loại bỏ null/undefined
      }
    });
  } catch (error) {
    console.error('Error fetching practice history:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy lịch sử làm bài',
      error: error.message
    });
  }
});

// GET: Lấy chi tiết một lần làm bài
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const history = await PracticeHistory.findById(id)
      .populate('examId', 'examTitle description duration questions')
      .populate('answers.questionId', 'content options correctAnswer explanation')
      .lean();

    if (!history) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch sử làm bài'
      });
    }

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Error fetching practice history detail:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy chi tiết lịch sử làm bài',
      error: error.message
    });
  }
});

// POST: Tạo mới lịch sử làm bài (bắt đầu làm bài)
router.post('/', async (req, res) => {
  try {
    const {
      examId,
      subjectCode,
      examTypeCode,
      userSessionId,
      totalQuestions
    } = req.body;

    const newHistory = new PracticeHistory({
      examId,
      subjectCode,
      examTypeCode,
      userSessionId,
      totalQuestions,
      startTime: new Date(),
      answers: [],
      isCompleted: false
    });

    await newHistory.save();

    res.status(201).json({
      success: true,
      data: newHistory,
      message: 'Đã tạo lịch sử làm bài thành công'
    });
  } catch (error) {
    console.error('Error creating practice history:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo lịch sử làm bài',
      error: error.message
    });
  }
});

// PUT: Cập nhật lịch sử làm bài (submit bài làm)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      answers,
      endTime,
      timeSpent,
      isCompleted = true
    } = req.body;

    // Tính điểm số
    const correctAnswers = answers.filter(answer => answer.isCorrect).length;
    const score = answers.length > 0 ? Math.round((correctAnswers / answers.length) * 100) : 0;

    const updatedHistory = await PracticeHistory.findByIdAndUpdate(
      id,
      {
        answers,
        endTime: endTime || new Date(),
        timeSpent,
        correctAnswers,
        score,
        isCompleted
      },
      { new: true }
    ).populate('examId', 'title description');

    if (!updatedHistory) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch sử làm bài'
      });
    }

    res.json({
      success: true,
      data: updatedHistory,
      message: 'Đã cập nhật lịch sử làm bài thành công'
    });
  } catch (error) {
    console.error('Error updating practice history:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật lịch sử làm bài',
      error: error.message
    });
  }
});

// DELETE: Xóa lịch sử làm bài
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedHistory = await PracticeHistory.findByIdAndDelete(id);

    if (!deletedHistory) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch sử làm bài'
      });
    }

    res.json({
      success: true,
      message: 'Đã xóa lịch sử làm bài thành công'
    });
  } catch (error) {
    console.error('Error deleting practice history:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa lịch sử làm bài',
      error: error.message
    });
  }
});

// GET: Thống kê tổng quan
router.get('/stats/overview', async (req, res) => {
  try {
    const { userSessionId, subjectCode, examTypeCode } = req.query;
    
    const filter = {};
    if (userSessionId) filter.userSessionId = userSessionId;
    if (subjectCode) filter.subjectCode = subjectCode;
    if (examTypeCode) filter.examTypeCode = examTypeCode;

    const stats = await PracticeHistory.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalAttempts: { $sum: 1 },
          completedAttempts: { $sum: { $cond: ['$isCompleted', 1, 0] } },
          averageScore: { $avg: '$score' },
          bestScore: { $max: '$score' },
          totalTimeSpent: { $sum: '$timeSpent' },
          averageTimeSpent: { $avg: '$timeSpent' }
        }
      }
    ]);

    // Thống kê theo môn học
    const subjectStats = await PracticeHistory.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$subjectCode',
          attempts: { $sum: 1 },
          averageScore: { $avg: '$score' },
          bestScore: { $max: '$score' }
        }
      },
      { $sort: { attempts: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        overview: stats[0] || {
          totalAttempts: 0,
          completedAttempts: 0,
          averageScore: 0,
          bestScore: 0,
          totalTimeSpent: 0,
          averageTimeSpent: 0
        },
        subjectStats
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê',
      error: error.message
    });
  }
});

module.exports = router;