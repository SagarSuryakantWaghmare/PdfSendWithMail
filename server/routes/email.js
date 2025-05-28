const express = require('express');
const router = express.Router();
const { sendMail, sendPdfByPan } = require('../utils/emailService');

// Simple email route
router.post('/send', (req, res) => {
  const { email, subject, text } = req.body;
  
  if (!email || !subject || !text) {
    return res.status(400).json({ message: 'Email, subject, and text are required' });
  }
  
  sendMail(email, subject, text, res);
  // Note: sendMail directly sends the response, so we don't need to add another response here
});

// Send PDF by PAN number
router.post('/send-pdf', (req, res) => {
  let { email, name, panNo } = req.body;
  
  // Trim whitespace from inputs
  email = email?.trim();
  name = name?.trim();
  panNo = panNo?.trim();
  
  if (!email || !name || !panNo) {
    return res.status(400).json({ message: 'Email, name, and PAN number are required' });
  }
  
  sendPdfByPan(email, name, panNo, res);
  // Note: sendPdfByPan directly sends the response, so we don't need to add another response here
});

module.exports = router;
