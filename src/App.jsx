import React, { useEffect, useRef, useState } from 'react';
import imageAssetURL from './assets/img.png';

const App = () => {
  const canvasRef = useRef(null);
  const [imageData, setImageData] = useState(null);
  const DOT_SPACING = 0.7; // 2rem
  const MAX_DOT_SIZE = 0.5; // 0.8rem

  // Load and process the image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Set canvas size to match the image
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw image to canvas
      ctx.drawImage(img, 0, 0, img.width, img.height);
      
      // Get image data
      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      setImageData(imageData);
    };
    
    img.src = imageAssetURL;
  }, []);

  useEffect(() => {
    if (!imageData) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      drawDots();
    };

    const drawDots = () => {
      if (!imageData) return;
      
      // Clear the canvas
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Set dot style
      ctx.fillStyle = 'white';
      
      // Convert rem to pixels
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
      const dotSpacingPx = DOT_SPACING * rem;
      const maxDotSizePx = MAX_DOT_SIZE * rem;
      
      // Calculate number of dots that can fit
      const dotsX = Math.ceil(canvas.width / dotSpacingPx);
      const dotsY = Math.ceil(canvas.height / dotSpacingPx);
      
      // Calculate scale to maintain aspect ratio and crop
      const imageAspect = imageData.width / imageData.height;
      const gridAspect = dotsX / dotsY;
      
      let scale, imgWidth, imgHeight, offsetX = 0, offsetY = 0;
      
      if (imageAspect > gridAspect) {
        // Image is wider than grid, scale by height and crop width
        scale = imageData.height / dotsY;
        imgWidth = Math.ceil(dotsX * scale);
        imgHeight = imageData.height;
        offsetX = Math.floor((imageData.width - imgWidth) / 2);
      } else {
        // Image is taller than grid, scale by width and crop height
        scale = imageData.width / dotsX;
        imgWidth = imageData.width;
        imgHeight = Math.ceil(dotsY * scale);
        offsetY = Math.floor((imageData.height - imgHeight) / 2);
      }
      
      // Draw dots
      for (let y = 0; y < dotsY; y++) {
        for (let x = 0; x < dotsX; x++) {
          // Calculate position in the image with proper scaling and centering
          const imgX = Math.min(offsetX + Math.floor(x * scale), imageData.width - 1);
          const imgY = Math.min(offsetY + Math.floor(y * scale), imageData.height - 1);
          
          // Get pixel data
          const pixelIndex = (imgY * imageData.width + imgX) * 4;
          const r = imageData.data[pixelIndex];
          const g = imageData.data[pixelIndex + 1];
          const b = imageData.data[pixelIndex + 2];
          
          // Calculate brightness (0-1)
          const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          
          // Skip transparent or very dark pixels
          if (brightness < 0.05) continue;
          
          // Calculate dot size based on brightness
          const dotSizePx = brightness * maxDotSizePx;
          
          // Calculate position on canvas
          const posX = x * dotSpacingPx + dotSpacingPx / 2;
          const posY = y * dotSpacingPx + dotSpacingPx / 2;
          
          // Draw dot
          ctx.beginPath();
          ctx.arc(posX, posY, dotSizePx / 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    // Initial setup
    resizeCanvas();
    
    // Handle window resize
    window.addEventListener('resize', resizeCanvas);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [imageData]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        backgroundColor: 'black',
        width: '100vw',
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0
      }}
    />
  );
};

export default App;
