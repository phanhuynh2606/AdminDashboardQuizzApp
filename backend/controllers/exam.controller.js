const Exam = require('../models/exam.model');
const { ExamQuestion } = require('../models/question.model');


const getExamData = async (req, res) => {
    try {
        const exams = await Exam.find()
            .populate('subjectId', 'subjectCode subjectName')
            .populate('examTypeId', 'typeCode typeName defaultDuration')
            .populate({
                path: 'examQuestions',
                populate: { path: 'questionBankId' }
            });
        if (!exams || exams.length === 0) {
            return res.status(404).json({ success: false, message: 'No exams found' });
        }
        return res.status(200).json({ success: true, data: exams });
    } catch (err) {
        console.error('Error in getExamData:', err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

const getExamById = async (req, res) => {
    try {
        const { examId } = req.params;
        if (!examId) {
            return res.status(400).json({ success: false, message: 'Exam ID is required' });
        }
        const exam = await Exam.findById(examId)
            .populate('subjectId', 'subjectCode subjectName')
            .populate('examTypeId', 'typeCode typeName defaultDuration')
            .populate({
                path: 'examQuestions',
                populate: { path: 'questionBankId' }
            });
        if (!exam) {
            return res.status(404).json({ success: false, message: 'Exam not found' });
        }
        return res.status(200).json({ success: true, data: exam });
    } catch (err) {
        console.error('Error in getExamById:', err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

const submitExam = async (req, res) => {
    try {
        const { examId } = req.params;
        const { userId, answers } = req.body;

        if (!examId || !userId || !Array.isArray(answers)) {
            return res.status(400).json({ success: false, message: 'Invalid request data' });
        }

        const exam = await Exam.findById(examId);
        if (!exam) {
            return res.status(404).json({ success: false, message: 'Exam not found' });
        }

        let totalScore = 0;
        let correctCount = 0;
        const detailResults = [];

        for (const ans of answers) {
            const eq = await ExamQuestion.findById(ans.examQuestionId).populate('questionBankId');
            if (!eq) continue;

            const question = eq.questionBankId;

            const correctAnswer = question.answers.find(a => a.isCorrect);
            const isCorrect = correctAnswer?.answerOrder === ans.selectedAnswer;

            if (isCorrect) {
                totalScore += question.defaultPoints || 1;
                correctCount++;
            }

            detailResults.push({
                examQuestionId: eq._id,
                questionText: question.questionText,
                selectedAnswer: ans.selectedAnswer,
                correctAnswer: correctAnswer?.answerOrder,
                isCorrect,
                points: isCorrect ? (question.defaultPoints || 1) : 0
            });
        }

        const result = new ExamResult({
            examId,
            userId,
            answers: detailResults.map(r => ({
                examQuestionId: r.examQuestionId,
                selectedAnswer: r.selectedAnswer
            })),
            score: totalScore,
            submittedAt: Date.now(),
            status: 'graded'
        });

        await result.save();

        res.status(201).json({
            success: true,
            message: 'Exam submitted and graded',
            resultId: result._id,
            score: totalScore,
            totalQuestions: detailResults.length,
            correctAnswers: correctCount,
            detail: detailResults
        });
    } catch (err) {
        console.error('Error in submitExam:', err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

module.exports = { getExamData, submitExam, getExamById };
