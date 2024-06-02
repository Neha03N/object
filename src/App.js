// Import dependencies
import React, { useRef, useState, useEffect } from "react";
import * as tf from "@tensorflow/tfjs";
import * as cocossd from "@tensorflow-models/coco-ssd";
import Webcam from "react-webcam";
import "./App.css";
import { drawRect } from "./utilities";
import { speak } from './utilities';

// const ObjectDetection = App;
function ObjectDetection() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [lastDetectedObject, setLastDetectedObject] = useState(null);
  const [cameraFacingMode, setCameraFacingMode] = useState("environment"); 
  const [isCameraRunning, setIsCameraRunning] = useState(true);
  const [intervalId, setIntervalId] = useState(null);

  const runCoco = async () => {
    const net = await cocossd.load();
    console.log("Coco-SSD model loaded.");
    const id = setInterval(() => {
      detect(net);
    }, 10);
    setIntervalId(id); // Save the interval ID
  };

  const detect = async (net) => {
    // Check data is available
    if (
      typeof webcamRef.current !== "undefined" &&
      webcamRef.current !== null &&
      webcamRef.current.video.readyState === 4
    ) {
      // Get Video Properties
      const video = webcamRef.current.video;
      const videoWidth = webcamRef.current.video.videoWidth;
      const videoHeight = webcamRef.current.video.videoHeight;

      // Set video width
      webcamRef.current.video.width = videoWidth;
      webcamRef.current.video.height = videoHeight;

      // Set canvas height and width
      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;

      // Make Detections
      const obj = await net.detect(video);

      // Draw mesh
      const ctx = canvasRef.current.getContext("2d");
      drawRect(obj, ctx); 

      // Get the name of the first detected object
      const detectedObjectName = obj.length > 0 ? obj[0].class : null;

      // Speak and update state only if a new object is detected
      if (detectedObjectName && detectedObjectName !== lastDetectedObject) {
        speak(detectedObjectName); // Speak the detected object name
        setLastDetectedObject(detectedObjectName); // Update state with the detected object name
      }
    }
  };

  
  const startCamera = async (facingMode) => {
    try {
      console.log("Starting camera with facing mode:", facingMode);
      const devices = await navigator.mediaDevices.enumerateDevices();
      let selectedDeviceId = null;
  
      // Find the back camera device ID
      devices.forEach(device => {
        if (device.kind === 'videoinput' && device.label.includes('back')) {
          selectedDeviceId = device.deviceId;
        }
      });
  
      const constraints = {
        video: {
          deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
          facingMode: facingMode,
        },
      };
      console.log('Selected Device ID:', selectedDeviceId);
  
      // Check if camera devices are available
      if (devices.some(device => device.kind === 'videoinput')) {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        webcamRef.current.srcObject = stream;
        console.log("Camera started with facing mode:", facingMode);
      } else {
        console.error("No camera devices available.");
        alert("No camera devices available.");
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert("Error accessing camera. Please make sure your camera is enabled and try again.");
    }
  };
  
  
  
   const switchCamera = () => {
    const newFacingMode = cameraFacingMode === "user" ? "environment" : "user"; 
    setCameraFacingMode(newFacingMode); 
    startCamera(newFacingMode); 
  };
  
  const stopCamera = () => {
    if (webcamRef.current && webcamRef.current.srcObject) {
      const tracks = webcamRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      webcamRef.current.srcObject = null;
      setLastDetectedObject(null); 
      setIsCameraRunning(false);

      if (intervalId) {
        clearInterval(intervalId);
        setIntervalId(null);
      }

      window.speechSynthesis.cancel(); // Stop any ongoing speech
    }
  };
  const handleToggleCamera = () => {
    if (isCameraRunning) {
      stopCamera();
    } else {
      startCamera(cameraFacingMode);
      runCoco();
      setIsCameraRunning(true);
    }
  };

  //useEffect(()=>{runCoco()},[]);
  useEffect(() => {
    console.log("Running useEffect");
    runCoco(); 
    startCamera(cameraFacingMode); 

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      window.speechSynthesis.cancel(); // Stop any ongoing speech when the component unmounts
    };
  }, []);
  return (
    <div className="App">
      <header className="App-header">
      <nav className="navbar">
          <h1 className="navbar-title">Sight_Guide</h1>
        </nav>

      {isCameraRunning && (

        <Webcam
          ref={webcamRef}
          muted={true} 
          style={{
            position: "absolute",
            marginLeft: "auto",
            marginRight: "auto",
            left: 0,
            right: 0,
            textAlign: "center",
            zindex: 9,
            // width: 640,
            // height: 480,
            width: "90%", 
              maxWidth: "640px", 
              height: "auto", 
              top: "80px", 
          }}
        />
      )}

      {isCameraRunning && (
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            marginLeft: "auto",
            marginRight: "auto",
            left: 0,
            right: 0,
            textAlign: "center",
            zindex: 8,
            // width: 640,
            // height: 480,
            width: "90%", 
            maxWidth: "640px", 
            height: "auto", 
            top: "80px", 
          }}
        />
      )}

        {lastDetectedObject && (
          <div
            style={{
              position: "absolute",
              bottom: 80,
              left: "50%",
              transform: "translateX(-50%)",
              color: "white",
              padding: "10px 10px",
              borderRadius: 2,
            }}
          >
            Detected Object: {lastDetectedObject}
          </div>
        )}
         <button className="button" onClick={switchCamera}>
         Switch Camera
        </button>
        <button className="stop-button" onClick={handleToggleCamera}>
        {isCameraRunning ? "Close Camera" : "Open Camera"}
        </button>
        
      </header>
    </div>
  );
}

export default ObjectDetection; 
