import React, { useRef, useState, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as cocossd from '@tensorflow-models/coco-ssd';
import Webcam from 'react-webcam';
import { drawRect } from './utilities';
import { Box, Card } from '@mui/material';
import swal from 'sweetalert';

export default function Home({ cheatingLog, updateCheatingLog }) {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [isSpeechRecognitionSupported, setIsSpeechRecognitionSupported] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState('hi-IN'); // Default language Hindi

  // Initialize SpeechRecognition
  const recognition = useRef(null);

  const setupSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSpeechRecognitionSupported(false);
      return;
    }

    recognition.current = new SpeechRecognition();
    recognition.current.continuous = true;
    recognition.current.interimResults = true;

    recognition.current.lang = selectedLanguage; // Set the language based on user preference

    recognition.current.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      console.log('Recognized Speech:', transcript);
      handleVoiceCommands(transcript);
    };

    recognition.current.onstart = () => {
      console.log('Speech Recognition started');
    };

    recognition.current.onend = () => {
      console.log('Speech Recognition stopped');
    };

    recognition.current.onerror = (event) => {
      console.log('Speech Recognition error:', event.error);
    };
  };

  const handleVoiceCommands = (transcript) => {
    const command = transcript.toLowerCase().trim();
    console.log('Command received:', command);

    if (command.includes('pause')) {
      swal('Pause', 'Action has been recorded: Paused Video', 'info');
      // Pause functionality here
    } else if (command.includes('play')) {
      swal('Play', 'Action has been recorded: Play Video', 'info');
      // Play functionality here
    }
  };

  const runCoco = async () => {
    const net = await cocossd.load();
    console.log('AI model loaded.');

    setInterval(() => {
      detect(net);
    }, 1500);
  };

  const detect = async (net) => {
    if (
      typeof webcamRef.current !== 'undefined' &&
      webcamRef.current !== null &&
      webcamRef.current.video.readyState === 4
    ) {
      const video = webcamRef.current.video;
      const videoWidth = webcamRef.current.video.videoWidth;
      const videoHeight = webcamRef.current.video.videoHeight;

      webcamRef.current.video.width = videoWidth;
      webcamRef.current.video.height = videoHeight;

      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;

      const obj = await net.detect(video);
      const ctx = canvasRef.current.getContext('2d');

      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height); // Clear canvas before drawing
      drawRect(obj, ctx); // Use drawRect function to visualize detections

      let person_count = 0;
      let faceDetected = false;

      obj.forEach((element) => {
        console.log('Detected class:', element.class); // Log the class names for debugging

        if (element.class === 'cell phone') {
          updateCheatingLog((prevLog) => ({
            ...prevLog,
            cellPhoneCount: prevLog.cellPhoneCount + 1,
          }));
          swal('Cell Phone Detected', 'Action has been Recorded', 'error');
        }

        if (element.class === 'book') {
          updateCheatingLog((prevLog) => ({
            ...prevLog,
            ProhibitedObjectCount: prevLog.ProhibitedObjectCount + 1,
          }));
          swal('Prohibited Object Detected', 'Action has been Recorded', 'error');
        }

        if (element.class === 'person') {
          faceDetected = true; // Mark that face (person) is detected
          person_count++;

          if (person_count > 1) {
            updateCheatingLog((prevLog) => ({
              ...prevLog,
              multipleFaceCount: prevLog.multipleFaceCount + 1,
            }));
            swal('Multiple Faces Detected', 'Action has been Recorded', 'error');
            person_count = 0;
          }
        }
      });

      // Show 'Face Not Visible' if no face is detected
      if (!faceDetected) {
        updateCheatingLog((prevLog) => ({
          ...prevLog,
          noFaceCount: prevLog.noFaceCount + 1,
        }));
        swal('Face Not Visible', 'Action has been Recorded', 'error');
      }
    }
  };

  useEffect(() => {
    runCoco();
    setupSpeechRecognition();
    recognition.current.start();
  }, [selectedLanguage]); // Re-run when language is changed

  return (
    <Box>
      <Card variant="outlined">
        <Webcam
          ref={webcamRef}
          muted={true}
          style={{
            left: 0,
            right: 0,
            textAlign: 'center',
            zIndex: 9,
            width: '100%',
            height: '100%',
          }}
        />
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            marginLeft: 'auto',
            marginRight: 'auto',
            left: 0,
            right: 0,
            textAlign: 'center',
            zIndex: 8,
            width: 240,
            height: 240,
          }}
        />
      </Card>
      {!isSpeechRecognitionSupported && <p>Your browser does not support speech recognition.</p>}

      <div>
        <label>Select Language: </label>
        <select onChange={(e) => setSelectedLanguage(e.target.value)} value={selectedLanguage}>
          <option value="hi-IN">Hindi (India)</option>
          <option value="mr-IN">Marathi (India)</option>
        </select>
      </div>
    </Box>
  );
}
