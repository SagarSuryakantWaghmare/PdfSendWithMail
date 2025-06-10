const PdfDocument = require('../models/PdfDocument');
const fs = require('fs');
const path = require('path');
const emailService = require('../utils/emailService');

// Upload PDF file
exports.uploadPdf = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const newPdf = new PdfDocument({
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path,
      size: req.file.size,
      sender: req.user._id
    });

    await newPdf.save();
    
    res.status(201).json({
      message: 'File uploaded successfully',
      pdf: {
        id: newPdf._id,
        filename: newPdf.filename,
        originalName: newPdf.originalName,
        size: newPdf.size
      }
    });
  } catch (error) {
    console.error('PDF upload error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all PDFs uploaded by user
exports.getUserPdfs = async (req, res) => {
  try {
    const pdfs = await PdfDocument.find({ sender: req.user._id })
      .select('filename originalName size createdAt recipients')
      .sort({ createdAt: -1 });
    
    res.json(pdfs);
  } catch (error) {
    console.error('Get PDFs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Send PDF to email
exports.sendPdfEmail = async (req, res) => {
  try {
    const { pdfId, recipients } = req.body;
    
    const pdf = await PdfDocument.findOne({ 
      _id: pdfId,
      sender: req.user._id
    });
    
    if (!pdf) {
      return res.status(404).json({ message: 'PDF not found' });
    }
    
    if (!recipients || recipients.length === 0) {
      return res.status(400).json({ message: 'Recipients are required' });
    }
    
    const filePath = path.join(__dirname, '..', pdf.path);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'PDF file not found on server' });
    }
      const successRecipients = [];
    const failedRecipients = [];
    
    // Send emails to all recipients
    for (const recipient of recipients) {
      try {        const mailText = `Dear ${recipient.name || 'Sir/Madam'},

Kindly download the attached Form 16 for the Financial Year 2024-25.

You are requested to file your Income Tax Return (ITR) within the due date, i.e., 31st July 2025, as per the Income Tax Department's guidelines.

Please ensure timely submission to avoid any penalties. For any assistance or clarification, feel free to get in touch.

Thanking you,

Regards,
Mr. Nitin Ghodke (Mobile-9028685994)
Accounts dept.
Deogiri Institute of Engineering and Management Studies, Chhatrapati Sambhajinagar
        `;
          // Using our new email service
        await emailService.sendPdfEmail(
          process.env.EMAIL_ID,
          recipient.email,
          'Your Form 16 for FY 2024-25',
          mailText,
          filePath,
          pdf.originalName
        );
        
        successRecipients.push(recipient);
      } catch (error) {
        console.error(`Email sending error to ${recipient.email}:`, error);
        failedRecipients.push({
          ...recipient,
          error: error.message
        });
      }
    }
      // Update PDF document with recipients
    const recipientUpdates = successRecipients.map(recipient => ({
      email: recipient.email,
      name: recipient.name || '',
      pan: recipient.pan || '',
      pan1: recipient.pan1 || '',
      status: 'sent',
      sentAt: Date.now()
    }));
    
    if (recipientUpdates.length > 0) {
      pdf.recipients.push(...recipientUpdates);
      await pdf.save();
    }
    
    res.json({
      message: `PDF sent to ${successRecipients.length} recipients`,
      success: successRecipients,
      failed: failedRecipients
    });
  } catch (error) {
    console.error('Send PDF email error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get a single PDF by ID
exports.getPdfById = async (req, res) => {
  try {
    const pdf = await PdfDocument.findOne({
      _id: req.params.id,
      sender: req.user._id
    });
    
    if (!pdf) {
      return res.status(404).json({ message: 'PDF not found' });
    }
    
    res.json(pdf);
  } catch (error) {
    console.error('Get PDF error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a PDF
exports.deletePdf = async (req, res) => {
  try {
    const pdf = await PdfDocument.findOne({
      _id: req.params.id,
      sender: req.user._id
    });
    
    if (!pdf) {
      return res.status(404).json({ message: 'PDF not found' });
    }
    
    // Delete the file from storage
    const filePath = path.join(__dirname, '..', pdf.path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Delete the record from database
    await pdf.remove();
    
    res.json({ message: 'PDF deleted successfully' });
  } catch (error) {
    console.error('Delete PDF error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
