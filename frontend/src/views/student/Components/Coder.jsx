import React, { useState } from 'react';
import { Editor } from '@monaco-editor/react';
import axios from 'axios';

export default function Coder() {
  const [code, setCode] = useState('// Write your code here...');
  const [output, setOutput] = useState('');
  const [language, setLanguage] = useState('javascript'); // Default to JavaScript

  const handleEditorChange = (value) => {
    setCode(value);
  };

  // Function to send code to the backend and get the output
  const runCode = async () => {
    let apiUrl;
    if (language === 'python') {
      apiUrl = '/run-python'; // Endpoint for Python
    } else if (language === 'java') {
      apiUrl = '/run-java'; // Endpoint for Java
    } else if (language === 'javascript') {
      apiUrl = '/run-javascript'; // Endpoint for JavaScript
    }

    try {
      const response = await axios.post(apiUrl, { code });
      setOutput(response.data);
    } catch (error) {
      setOutput(`Error: ${error.message}`);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <select onChange={(e) => setLanguage(e.target.value)} value={language}>
        <option value="javascript">JavaScript</option>
        <option value="python">Python</option>
        <option value="java">Java</option>
      </select>

      <Editor
        height="450px"
        language={language}
        value={code}
        onChange={handleEditorChange}
        theme="vs-dark"
      />
      <button onClick={runCode} style={{ marginTop: '20px', padding: '10px' }}>
        Run Code
      </button>

      <div style={{ marginTop: '20px', backgroundColor: '#f0f0f0', padding: '10px' }}>
        <strong>Output:</strong>
        <pre>{output}</pre>
      </div>
    </div>
  );
}
