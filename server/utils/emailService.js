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
    } else {
      // Strategy 2: The PAN is actually a filename (with or without extension)
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
    } else {
      // Strategy 2: The PAN1 is actually a filename (with or without extension)
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
  
  // Make sure attachments have unique names even if the original files had the same name
  if (attachments.length === 2 && attachments[0].filename === attachments[1].filename) {
    attachments[0].filename = `PAN_${attachments[0].filename}`;
    attachments[1].filename = `PAN1_${attachments[1].filename}`;
  }  // Mail subject and text
  const mailSubject = `Your Form 16 for FY 2024-25`;
  let mailText = `Dear ${name},

Kindly download the attached Form 16 for the Financial Year 2024-25.

You are requested to file your Income Tax Return (ITR) within the due date, i.e., 31st July 2025, as per the Income Tax Department's guidelines.

Please ensure timely submission to avoid any penalties. For any assistance or clarification, feel free to get in touch.

Thanking you,

Regards,
Mr. Nitin Ghodke (Mobile-9028685994)
Accounts dept.
Deogiri Institute of Engineering and Management Studies, Chhatrapati Sambhajinagar`;

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

// Function to send email with pre-existing PDF attachment
const sendPdfEmail = async (from, to, subject, text, pdfPath, originalName) => {
  // Create transporter for email
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
  });  // Create professional email text
  const professionalText = `Dear Sir/Madam,

Kindly download the attached Form 16 for the Financial Year 2024-25.

You are requested to file your Income Tax Return (ITR) within the due date, i.e., 31st July 2025, as per the Income Tax Department's guidelines.

Please ensure timely submission to avoid any penalties. For any assistance or clarification, feel free to get in touch.

Thanking you,

Regards,
Mr. Nitin Ghodke (Mobile-9028685994)
Accounts dept.
Deogiri Institute of Engineering and Management Studies, Chhatrapati Sambhajinagar`;

  // Create mail options object
  const mailOptions = {
    from: from,
    to: to,
    subject: "Your Form 16 for FY 2024-25",
    text: professionalText,
    attachments: [
      {
        filename: originalName,
        path: pdfPath
      }
    ]
  };

  // Return a promise for the mail sending
  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log("Email error:", error);
        reject(error);
      } else {
        console.log("Email sent:", info.response);
        resolve(info);
      }
    });
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
  sendPdfEmail,
  sendMail
};
