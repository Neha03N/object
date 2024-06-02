export const speak = (text) => {
  const utterance = new SpeechSynthesisUtterance(text);
  window.speechSynthesis.speak(utterance);
}

export const drawRect = (detections, ctx) => {
  // Variable to keep track of whether any detections are present
  let detectionsPresent = false;

  // Loop through each prediction
  detections.forEach(prediction => {
    // Extract boxes and classes
    const [x, y, width, height] = prediction['bbox']; 
    const text = prediction['class']; 

    // Set styling
    const color = Math.floor(Math.random()*16777215).toString(16);
    ctx.strokeStyle = '#' + color
    ctx.font = '18px Arial';

    // Draw rectangles and text
    ctx.beginPath();   
    ctx.fillStyle = '#' + color
    ctx.fillText(text, x, y);
    ctx.rect(x, y, width, height); 
    ctx.stroke();

    // Set detectionsPresent to true if any detections are found
    detectionsPresent = true;

    // Convert text to speech
    speak(text);
  });

  // If no detections are present, stop speech synthesis
  if (!detectionsPresent) {
    stopSpeech();
  }
}

// Function to stop speech synthesis
const stopSpeech = () => {
  window.speechSynthesis.cancel(); // Stop any ongoing speech
};

