import React, { useState, useEffect } from 'react';
import { Editor } from '@monaco-editor/react';
import axios from 'axios';
import Webcam from '../student/Components/WebCam';
import { Button } from '@mui/material';
import { useSaveCheatingLogMutation } from 'src/slices/cheatingLogApiSlice'; // Adjust the import path
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { useNavigate, useParams } from 'react-router';

export default function Coder() {
  const [code, setCode] = useState('// Write your code here...');
  const [language, setLanguage] = useState('javascript');
  const [output, setOutput] = useState('');
  const { examId } = useParams();
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);
  const [cheatingLog, setCheatingLog] = useState({
    noFaceCount: 0,
    multipleFaceCount: 0,
    cellPhoneCount: 0,
    prohibitedObjectCount: 0,
    examId: examId,
    username: '',
    email: '',
  });

  const [saveCheatingLogMutation] = useSaveCheatingLogMutation();

  useEffect(() => {
    setCheatingLog((prevLog) => ({
      ...prevLog,
      username: userInfo.name,
      email: userInfo.email,
    }));
  }, [userInfo]);

  const runCode = async () => {
    let apiUrl;
    switch (language) {
      case 'python':
        apiUrl = '/run-python';
        break;
      case 'java':
        apiUrl = '/run-java';
        break;
      case 'javascript':
        apiUrl = '/run-javascript';
        break;
      default:
        return;
    }

    try {
      const response = await axios.post(apiUrl, { code });
      console.log('API Response:', response.data); // Log the response for debugging
      setOutput(response.data); // Adjust based on actual response structure
    } catch (error) {
      console.error('Error running code:', error);
      setOutput('Error running code.'); // Display error message
    }
  };

  const handleSubmit = async () => {
    try {
      await saveCheatingLogMutation(cheatingLog).unwrap();
      toast.success('User Logs Saved!!');
      navigate('/success');
    } catch (error) {
      console.error('Error saving cheating log:', error);
      toast.error('Failed to save logs.');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <select onChange={(e) => setLanguage(e.target.value)} value={language}>
        <option value="javascript">JavaScript</option>
        <option value="python">Python</option>
        <option value="java">Java</option>
      </select>

      <div style={{ display: 'flex', position: 'relative' }}>
        <Editor
          height="450px"
          width="900px"
          language={language}
          value={code}
          onChange={(value) => setCode(value)}
          theme="vs-dark"
        />
        <div style={{ position: 'absolute', right: '10px' }}>
          <Webcam
            style={{ height: '400px', width: '400px' }}
            cheatingLog={cheatingLog}
            updateCheatingLog={setCheatingLog}
          />
        </div>
      </div>

      <Button variant="contained" onClick={runCode} style={{ marginTop: '20px', padding: '10px' }}>
        Run Code
      </Button>

      <Button
        variant="contained"
        onClick={handleSubmit}
        style={{ marginTop: '20px', padding: '10px' }}
      >
        Submit Test
      </Button>

      <div style={{ marginTop: '20px', backgroundColor: '#f0f0f0', padding: '10px' }}>
        <h4>Output:</h4>
        <pre>{output}</pre> {/* Display the output of the executed code */}
      </div>
    </div>
  );
}
