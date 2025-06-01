const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

// Function to send email with PDF attachment based on PAN number
const sendPdfByPan = async (emailId, name, panNo, pan1No, res) => {
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

  // Try different strategies to find the PDF
  let attachments = [];
  
  // Process PAN number if provided
  if (panNo) {
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
        console.log("Available PDF files in pdfs folder:", files);
        
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
        console.error('Error reading pdfs directory:', err);
      }
    }
    
    // Check if PDF exists and add to attachments
    if (pdfPath && fs.existsSync(pdfPath)) {
      attachments.push({
        filename: pdfFileName,
        path: pdfPath
      });
    } else {
      console.log(`PDF not found for PAN: ${panNo}`);
    }
  }
  
  // Process PAN1 number if provided
  if (pan1No) {
    // Find PDF file in pdfs1 folder
    const pdfs1Dir = path.join(__dirname, '..', 'pdfs1');
    
    // Create pdfs1 directory if it doesn't exist
    if (!fs.existsSync(pdfs1Dir)) {
      try {
        fs.mkdirSync(pdfs1Dir);
        console.log('Created pdfs1 directory');
      } catch (err) {
        console.error('Error creating pdfs1 directory:', err);
      }
    }
    
    // Try different strategies to find the PDF
    let pdf1Path = '';
    let pdf1FileName = '';
    
    // Strategy 1: Try exact PAN1.pdf
    if (fs.existsSync(path.join(pdfs1Dir, `${pan1No}.pdf`))) {
      pdf1FileName = `${pan1No}.pdf`;
      pdf1Path = path.join(pdfs1Dir, pdf1FileName);
    }   // Strategy 2: The PAN1 is actually a filename (with or without extension)
    else {
      try {
        const files = fs.readdirSync(pdfs1Dir);
        console.log("Available PDF files in pdfs1 folder:", files);
        
        // Look for different variations of the file
        const matchingFile = files.find(file => {
          const fileNameNoExt = file.replace('.pdf', '');
          const pan1NoTrimmed = pan1No.trim();
          
          // Check exact match (case insensitive)
          if (fileNameNoExt.toLowerCase() === pan1NoTrimmed.toLowerCase()) {
            return true;
          }
          
          // Check if filename contains the PAN1
          if (fileNameNoExt.toLowerCase().includes(pan1NoTrimmed.toLowerCase())) {
            return true;
          }
          
          // Check if PAN1 contains the filename
          if (pan1NoTrimmed.toLowerCase().includes(fileNameNoExt.toLowerCase())) {
            return true;
          }
          
          return false;
        });
        
        if (matchingFile) {
          console.log(`Found matching file: ${matchingFile} for PAN1: ${pan1No}`);
          pdf1FileName = matchingFile;
          pdf1Path = path.join(pdfs1Dir, matchingFile);
        }
      } catch (err) {
        console.error('Error reading pdfs1 directory:', err);
      }
    }
    
    // Check if PDF exists and add to attachments
    if (pdf1Path && fs.existsSync(pdf1Path)) {
      attachments.push({
        filename: pdf1FileName,
        path: pdf1Path
      });
    } else {
      console.log(`PDF not found for PAN1: ${pan1No}`);
    }
  }
  
  // If no PDFs found, return error
  if (attachments.length === 0) {
    console.log(`No PDFs found for PAN: ${panNo} or PAN1: ${pan1No}`);
    return res.status(404).json({ message: `No PDFs found for PAN: ${panNo} or PAN1: ${pan1No}` });
  }

  // Mail subject and text
  const mailSubject = `PDF Document for ${name}`;
  let mailText = `Dear ${name},\n\nPlease find attached your PDF document(s)`;
  
  if (panNo) {
    mailText += ` related to PAN: ${panNo}`;
  }
  
  if (pan1No) {
    mailText += `${panNo ? ' and ' : ' related to '}PAN1: ${pan1No}`;
  }
  
  mailText += '.\n\nRegards,\nPDF Email Service';

  // Create mail options object
  const mailOptions = {
    from: process.env.EMAIL_ID,
    to: emailId,
    subject: mailSubject,
    text: mailText,
    attachments: attachments
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
