import React, { useState } from 'react';

function GenerateFromSample() {
  // State to hold the selected file
  const [selectedFile, setSelectedFile] = useState(null);
  // State to show messages to the user (e.g., success or error)
  const [message, setMessage] = useState('');
  // State to track loading status
  const [isLoading, setIsLoading] = useState(false);

  // Function to handle file selection from the input
  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    setMessage(''); // Clear previous messages
  };

  // Function to handle the form submission
  const handleSubmit = async (event) => {
    event.preventDefault(); // Prevent the default browser form submission

    if (!selectedFile) {
      setMessage('Please select a file first.');
      return;
    }

    setIsLoading(true);
    setMessage('Generating data... this may take a moment.');

    // Create a FormData object to send the file
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      // Make the API call to your FastAPI backend
      const response = await fetch('/generate-from-sample/', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        // If the server returns an error, display it
        throw new Error(data.detail || 'Something went wrong');
      }

      // On success, display a success message
      setMessage(`Success! Synthetic data saved to: ${data.output_file}`);

    } catch (error) {
      // On failure, display an error message
      setMessage(`Error: ${error.message}`);
    } finally {
      // Reset loading state regardless of outcome
      setIsLoading(false);
    }
  };

  return (
    <section className="card">
      <h2>1. Generate from Sample Data</h2>
      <p>Upload a sample CSV file. The system will learn its patterns and generate new synthetic data that mimics the original.</p>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="file-upload">Upload CSV File:</label>
          <input 
            id="file-upload" 
            type="file" 
            accept=".csv" 
            onChange={handleFileChange} 
          />
        </div>
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Generating...' : 'Generate Synthetic Data'}
        </button>
      </form>

      {/* Display messages to the user */}
      {message && <p className="message">{message}</p>}
    </section>
  );
}

export default GenerateFromSample;
