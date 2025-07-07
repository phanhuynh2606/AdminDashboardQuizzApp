const express = require('express');
const router = express.Router();

// Placeholder student list
const students = [];

router.get('/', (req, res) => {
  res.json(students);
});

router.post('/', (req, res) => {
  const student = { id: Date.now().toString(), ...req.body };
  students.push(student);
  res.status(201).json(student);
});

module.exports = router;
