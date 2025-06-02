import React, { useState, useRef } from 'react'
import './App.css'
import { FaTrash, FaSpinner, FaFileCsv, FaFileImport, FaPlus } from 'react-icons/fa'

const App = () => {
  const [formData, setFormData] = useState([
    { email: '', name: '', pan: '', pan1: '' }
  ]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const fileInputRef = useRef(null);
  const tableRef = useRef(null);

  const handleInputChange = (index, field, value) => {
    const newData = [...formData];
    newData[index][field] = value;
    setFormData(newData);
  };

  const addRow = () => {
    setFormData([...formData, { email: '', name: '', pan: '', pan1: '' }]);
  };

  const removeRow = (index) => {
    const newData = [...formData];
    newData.splice(index, 1);
    setFormData(newData);
  };

  const sendEmails = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      // Validate all entries
      const invalidEntries = formData.filter(entry => 
        !entry.email || !entry.name || (!entry.pan && !entry.pan1)
      );
      
      if (invalidEntries.length > 0) {
        setMessage('Please fill in all fields in each row');
        setLoading(false);
        return;
      }
      
      // Send emails one by one
      const results = [];
      
      for (const entry of formData) {
        try {
          setMessage(`Sending email to ${entry.email} for PAN: ${entry.pan || 'N/A'}, PAN1: ${entry.pan1 || 'N/A'}...`);
          
          const response = await fetch('http://localhost:5000/api/email/send-pdf', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              email: entry.email.trim(),
              name: entry.name.trim(),
              panNo: entry.pan.trim(),
              pan1No: entry.pan1 ? entry.pan1.trim() : ''
            })
          });
          
          const data = await response.json();
          
          // Add detailed result
          results.push({
            ...entry,
            status: data.status ? 'Sent' : 'Failed',
            message: data.message
          });
          
          // Show immediate feedback
          if (data.status) {
            setMessage(prev => `${prev}\nEmail sent to ${entry.email} successfully.`);
          } else {
            setMessage(prev => `${prev}\nFailed to send email to ${entry.email}: ${data.message}`);
          }
          
        } catch (error) {
          results.push({
            ...entry,
            status: 'Error',
            message: error.message
          });
          setMessage(prev => `${prev}\nError sending to ${entry.email}: ${error.message}`);
        }
        
        // Small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Count successes and failures
      const successes = results.filter(r => r.status === 'Sent').length;
      const failures = results.length - successes;
      
      setMessage(prev => `${prev}\n\nSummary: ${successes} emails sent successfully. ${failures} emails failed.`);
      
      // If any failures, show details
      if (failures > 0) {
        const failedEntries = results.filter(r => r.status !== 'Sent');
        const failureDetails = failedEntries.map(entry => 
          `- ${entry.email} (PAN: ${entry.pan || 'N/A'}, PAN1: ${entry.pan1 || 'N/A'}): ${entry.message}`
        ).join('\n');
        
        setMessage(prev => `${prev}\n\nFailure details:\n${failureDetails}`);
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Export table data to CSV
  const exportToCSV = () => {
    const headers = ['Email', 'Name', 'PAN', 'PAN1'];
    const csvRows = [
      headers.join(','),
      ...formData.map(row => [row.email, row.name, row.pan, row.pan1].join(','))
    ];
    
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'email_data.csv');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Import data from CSV
  const importFromCSV = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const csv = e.target.result;
      const lines = csv.split('\n');
      
      // Skip header row and map remaining rows
      const newData = lines.slice(1).map(line => {
        const values = line.split(',');
        return {
          email: (values[0] || '').trim(),
          name: (values[1] || '').trim(),
          pan: (values[2] || '').trim(),
          pan1: (values[3] || '').trim()
        };
      }).filter(row => row.email || row.name || row.pan || row.pan1); // Filter out empty rows
      
      setFormData(newData.length ? newData : [{ email: '', name: '', pan: '', pan1: '' }]);
    };
    reader.readAsText(file);
  };

  return (
    <div className="app-container">
      <h1 className="heading">PDF Email Sender</h1>
      <div className="instructions">
        <p>Enter recipient details below. PDF files will be retrieved based on PAN and PAN1 numbers.</p>
        <p>Make sure PDF files named as [PAN].pdf exist in the server's pdfs folder and [PAN1].pdf exist in the pdfs1 folder.</p>
      </div>
      
      <div className="actions">
        <button onClick={exportToCSV}>Export to CSV</button>
        <input 
          type="file" 
          accept=".csv" 
          onChange={importFromCSV} 
          style={{ display: 'none' }} 
          id="csv-upload" 
        />
        <label htmlFor="csv-upload" className="button">Import from CSV</label>
      </div>
      
      <div className="table-container">
        <table ref={tableRef}>
          <thead>
            <tr>
              <th>Email</th>
              <th>Name</th>
              <th>PAN</th>
              <th>PAN1</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {formData.map((row, index) => (
              <tr key={index}>
                <td>
                  <input
                    type="email"
                    value={row.email}
                    onChange={(e) => handleInputChange(index, 'email', e.target.value)}
                    placeholder="Email"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={row.name}
                    onChange={(e) => handleInputChange(index, 'name', e.target.value)}
                    placeholder="Name"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={row.pan}
                    onChange={(e) => handleInputChange(index, 'pan', e.target.value)}
                    placeholder="PAN Number"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={row.pan1}
                    onChange={(e) => handleInputChange(index, 'pan1', e.target.value)}
                    placeholder="PAN1 Number"
                  />
                </td>
                <td>
                  <button onClick={() => removeRow(index)} disabled={formData.length === 1}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="actions">
        <button onClick={addRow}>Add Row</button>
        <button 
          onClick={sendEmails} 
          disabled={loading}
          className="send-button"
        >
          {loading ? 'Sending...' : 'Send PDFs'}
        </button>
      </div>
      
      {message && <div className="message">{message}</div>}
    </div>
  );
};

export default App;