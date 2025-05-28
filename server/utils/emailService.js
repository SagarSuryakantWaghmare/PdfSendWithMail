const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

// Function to send email with PDF attachment based on PAN number
const sendPdfByPan = async (emailId, name, panNo, res) => {
  // Create transporter for each request (as per your example)
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_ID,
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 10000,
  });

  // Find PDF file in pdfs folder
  const pdfsDir = path.join(__dirname, '..', 'pdfs');
  
  // Try different strategies to find the PDF
  let pdfPath = '';
  let pdfFileName = '';
  
  // Strategy 1: Try exact PAN.pdf
  if (fs.existsSync(path.join(pdfsDir, `${panNo}.pdf`))) {
    pdfFileName = `${panNo}.pdf`;
    pdfPath = path.join(pdfsDir, pdfFileName);
  }   // Strategy 2: The PAN is actually a filename (with or without extension)
  else {
    try {
      const files = fs.readdirSync(pdfsDir);
      console.log("Available PDF files:", files);
      
      // Look for different variations of the file
      const matchingFile = files.find(file => {
        const fileNameNoExt = file.replace('.pdf', '');
        const panNoTrimmed = panNo.trim();
        
        // Check exact match (case insensitive)
        if (fileNameNoExt.toLowerCase() === panNoTrimmed.toLowerCase()) {
          return true;
        }
        
        // Check if filename contains the PAN
        if (fileNameNoExt.toLowerCase().includes(panNoTrimmed.toLowerCase())) {
          return true;
        }
        
        // Check if PAN contains the filename
        if (panNoTrimmed.toLowerCase().includes(fileNameNoExt.toLowerCase())) {
          return true;
        }
        
        return false;
      });
      
      if (matchingFile) {
        console.log(`Found matching file: ${matchingFile} for PAN: ${panNo}`);
        pdfFileName = matchingFile;
        pdfPath = path.join(pdfsDir, matchingFile);
      }
    } catch (err) {
      console.error('Error reading directory:', err);
    }
  }
  
  // Check if PDF exists
  if (!pdfPath || !fs.existsSync(pdfPath)) {
    console.log(`PDF not found for PAN: ${panNo}`);
    return res.status(404).json({ message: `PDF not found for PAN: ${panNo}` });
  }

  // Mail subject and text
  const mailSubject = `PDF Document for ${name}`;
  const mailText = `Dear ${name},\n\nPlease find attached your PDF document related to PAN: ${panNo}.\n\nRegards,\nPDF Email Service`;

  // Create mail options object
  const mailOptions = {
    from: process.env.EMAIL_ID,
    to: emailId,
    subject: mailSubject,
    text: mailText,
    attachments: [
      {
        filename: pdfFileName,
        path: pdfPath
      }
    ]
  };
  
  console.log(mailOptions);
  
  // Send mail
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log("The Error is ", error);
      return res.json({ message: "Error Sending Mail!" });
    } else {
      console.log("Email sent : " + info.response);
      return res.json({ status: true, message: "Email Sent" });
    }
  });
};

// Simple mail sending without attachments (as per your example)
const sendMail = async (emailId, mailSubject, mailText, res) => {
  // Create transporter for each request
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_ID,
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 10000,
  });
  
  // Create mail options object
  const mailOptions = {
    from: process.env.EMAIL_ID,
    to: emailId,
    subject: mailSubject,
    text: mailText,
  };
  
  console.log(mailOptions);
  
  // Send mail
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log("The Error is ", error);
      return res.json({ message: "Error Sending Mail!" });
    } else {
      console.log("Email sent : " + info.response);
      return res.json({ status: true, message: "Email Sent" });
    }
  });
};

module.exports = {
  sendPdfByPan,
  sendMail
};
