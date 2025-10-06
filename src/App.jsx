import React, { useEffect, useRef, useState } from 'react';
import imageAssetURL from './assets/img.png';

// Perlin noise implementation
class PerlinNoise {
  constructor(seed = Math.random()) {
    this.grad3 = [[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],
                   [1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],
                   [0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]];
    this.p = [];
    for(let i=0; i<256; i++) {
      this.p[i] = Math.floor(Math.random() * 256);
    }
    this.perm = [];
    for(let i=0; i<512; i++) {
      this.perm[i] = this.p[i & 255];
    }
  }

  dot(g, x, y, z) {
    return g[0]*x + g[1]*y + g[2]*z;
  }

  mix(a, b, t) {
    return (1.0-t)*a + t*b;
  }

  fade(t) {
    return t*t*t*(t*(t*6.0-15.0)+10.0);
  }

  noise(x, y, z) {
    let X = Math.floor(x);
    let Y = Math.floor(y);
    let Z = Math.floor(z);
    
    x = x - X;
    y = y - Y;
    z = z - Z;
    
    X = X & 255;
    Y = Y & 255;
    Z = Z & 255;

    let gi000 = this.perm[X+this.perm[Y+this.perm[Z]]] % 12;
    let gi001 = this.perm[X+this.perm[Y+this.perm[Z+1]]] % 12;
    let gi010 = this.perm[X+this.perm[Y+1+this.perm[Z]]] % 12;
    let gi011 = this.perm[X+this.perm[Y+1+this.perm[Z+1]]] % 12;
    let gi100 = this.perm[X+1+this.perm[Y+this.perm[Z]]] % 12;
    let gi101 = this.perm[X+1+this.perm[Y+this.perm[Z+1]]] % 12;
    let gi110 = this.perm[X+1+this.perm[Y+1+this.perm[Z]]] % 12;
    let gi111 = this.perm[X+1+this.perm[Y+1+this.perm[Z+1]]] % 12;

    let n000= this.dot(this.grad3[gi000], x, y, z);
    let n100= this.dot(this.grad3[gi100], x-1, y, z);
    let n010= this.dot(this.grad3[gi010], x, y-1, z);
    let n110= this.dot(this.grad3[gi110], x-1, y-1, z);
    let n001= this.dot(this.grad3[gi001], x, y, z-1);
    let n101= this.dot(this.grad3[gi101], x-1, y, z-1);
    let n011= this.dot(this.grad3[gi011], x, y-1, z-1);
    let n111= this.dot(this.grad3[gi111], x-1, y-1, z-1);

    let u = this.fade(x);
    let v = this.fade(y);
    let w = this.fade(z);

    let nx00 = this.mix(n000, n100, u);
    let nx01 = this.mix(n001, n101, u);
    let nx10 = this.mix(n010, n110, u);
    let nx11 = this.mix(n011, n111, u);

    let nxy0 = this.mix(nx00, nx10, v);
    let nxy1 = this.mix(nx01, nx11, v);

    return this.mix(nxy0, nxy1, w);
  }
}

const App = () => {
  const canvasRef = useRef(null);
  const animationFrameRef = useRef();
  const [imageData, setImageData] = useState(null);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [textVisible, setTextVisible] = useState(false);
  const noiseRef = useRef(new PerlinNoise());
  const noiseTimeRef = useRef(0);
  const DOT_SPACING = 0.5;
  const MAX_DOT_SIZE = 0.4;
  const ANIMATION_DURATION = 2000; // 2 seconds
  const NOISE_SCALE = 0.08; // Scale for noise sampling (smaller = larger waves)
  const NOISE_SPEED = 0.07; // Speed of noise animation

  // Draw dots function with progress parameter (0-1) for animation
  const drawDots = (progress = 1, noiseTime = 0) => {
    if (!imageData || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
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
    
    // Calculate center point for ripple effect
    const centerX = dotsX / 2;
    const centerY = dotsY / 2;
    const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);
    
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
        // Calculate distance from center for ripple effect
        const dx = x - centerX;
        const dy = y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const normalizedDistance = distance / maxDistance;
        
        // Only draw dots that should be visible based on animation progress
        if (normalizedDistance > progress) continue;
        
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
        
        // Get Perlin noise value for this dot position (shifts over time)
        const noiseValue = noiseRef.current.noise(
          x * NOISE_SCALE,
          y * NOISE_SCALE,
          noiseTime
        );
        // Scale noise from [-1, 1] to [0.7, 1.0]
        const noiseMultiplier = 0.5 + (noiseValue + 1) * 0.15;
        
        // Calculate dot size based on brightness (brighter = larger dot)
        const dotSizePx = brightness * maxDotSizePx * noiseMultiplier;
        
        // Calculate position with centering
        const posX = x * dotSpacingPx + dotSpacingPx / 2;
        const posY = y * dotSpacingPx + dotSpacingPx / 2;
        
        // Apply ripple animation only during initial load (progress < 1)
        let finalDotSize = dotSizePx;
        if (progress < 1) {
          // Slower, more gradual ease-in with wider transition zone
          const dotProgress = Math.min(1, Math.max(0, (progress - normalizedDistance) / 0.4));
          // Smoother easing function (ease-out cubic)
          const easedProgress = 1 - Math.pow(1 - dotProgress, 3);
          finalDotSize = dotSizePx * easedProgress;
        }
        
        // Draw dot
        ctx.beginPath();
        ctx.arc(posX, posY, finalDotSize / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  // Load image and set up canvas
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      // Create offscreen canvas to get image data
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = img.width;
      tempCanvas.height = img.height;
      const tempCtx = tempCanvas.getContext('2d');
      
      // Draw image to canvas
      tempCtx.drawImage(img, 0, 0, img.width, img.height);
      
      // Get image data
      const imageData = tempCtx.getImageData(0, 0, img.width, img.height);
      setImageData(imageData);
    };
    
    img.src = imageAssetURL;
  }, []);

  // Handle canvas resize and animation
  useEffect(() => {
    if (!imageData) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      drawDots(1, noiseTimeRef.current);
    };

    // Initial setup
    resizeCanvas();
    
    // Handle window resize
    window.addEventListener('resize', resizeCanvas);
    
    // Initial ripple animation setup
    let animationStart = null;
    let rippleComplete = false;
    
    const animate = (timestamp) => {
      if (!animationStart) animationStart = timestamp;
      
      const elapsed = timestamp - animationStart;
      const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
      
      // Update noise time for continuous animation
      noiseTimeRef.current += NOISE_SPEED;
      
      if (progress < 1) {
        // During ripple animation
        setAnimationProgress(progress);
        drawDots(progress, noiseTimeRef.current);
        animationFrameRef.current = requestAnimationFrame(animate);
      } else if (!rippleComplete) {
        // Ripple complete, switch to continuous noise animation and show text
        rippleComplete = true;
        setAnimationProgress(1);
        setTextVisible(true);
        animationFrameRef.current = requestAnimationFrame(continuousAnimate);
      }
    };
    
    const continuousAnimate = (timestamp) => {
      // Update noise time for continuous animation
      noiseTimeRef.current += NOISE_SPEED;
      drawDots(1, noiseTimeRef.current);
      animationFrameRef.current = requestAnimationFrame(continuousAnimate);
    };
    
    // Start initial ripple animation
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(animate);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [imageData]);

  return (
    <div className="app" style={{ position: 'relative' }}>
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100vw',
          height: '100vh'
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '40vw',
          color: 'white',
          fontFamily: "'Georgia', serif",
          textAlign: 'center',
          pointerEvents: 'none',
          userSelect: 'none',
          opacity: textVisible ? 1 : 0,
          transition: 'opacity 1.5s ease-in-out'
        }}
      >
        <div
          style={{
            width: '100%',
            height: '1px',
            backgroundColor: 'white',
            marginTop: '-10vh',
            marginBottom: '1.5rem'
          }}
        />
        <h1
          style={{
            fontSize: '4rem',
            fontWeight: 'normal',
            fontStyle: 'normal',
            marginBottom: '1.5rem',
            marginTop: '0'
          }}
        >
          AGI Discussion
        </h1>
        <div
          style={{
            width: '100%',
            height: '1px',
            backgroundColor: 'white',
            marginBottom: '2rem'
          }}
        />
        <p
          style={{
            fontSize: '1.2rem',
            lineHeight: '1.8',
            fontWeight: '300'
          }}
        >
          We are holding an informal roundtable discussion at Western University on the topic of the feasibility and potential design of Artificial General Intelligence (AGI). AGI is a theoretical type of machine intelligence that possesses human-level intellectual capability - the critical ability to generalize knowledge, learn any new task, and solve any problem, rather than being specialized for only one function like the narrower LLMs today.
        </p>
        <div
          style={{
            marginTop: '2rem'
          }}
        >
          <a
            href="https://form.typeform.com/to/nevqYTry"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              padding: '1rem 2rem',
              border: '2px solid white',
              color: 'white',
              backgroundColor: 'transparent',
              textDecoration: 'none',
              fontSize: '1.2rem',
              fontWeight: '400',
              fontFamily: "'Georgia', serif",
              transition: 'background-color 0.3s ease, color 0.3s ease',
              textAlign: 'center',
              pointerEvents: 'auto',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.color = 'black';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'white';
            }}
          >
            Join the Discussion
          </a>
        </div>
      </div>
    </div>
  );
};

export default App;
