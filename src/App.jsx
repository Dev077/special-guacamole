import React, { useEffect, useRef, useState } from 'react';
import forestImageURL from './assets/img.png';
import eveImageURL from './assets/eve.webp';

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

const DualImageDotMatrix = () => {
  const canvasRef = useRef(null);
  const animationFrameRef = useRef();
  const [backgroundImageData, setBackgroundImageData] = useState(null);
  const [centerImageData, setCenterImageData] = useState(null);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [textVisible, setTextVisible] = useState(false);
  const noiseRef = useRef(new PerlinNoise());
  const bgNoiseTimeRef = useRef(0); // Separate time for background noise
  const centerNoiseTimeRef = useRef(0); // Separate time for center noise
  
  const DOT_SPACING = 0.10; // Dense dots for center image
  const MAX_DOT_SIZE = 0.10; // Small dots for center
  
  // Background uses larger, more spaced dots for dramatic effect
  const BG_DOT_SPACING = 0.9; // Original spacing - larger gaps
  const BG_MAX_DOT_SIZE = 0.7; // Original size - bigger dots
  
  const ANIMATION_DURATION = 2000;
  
  // Background (forest/cave) noise settings - dramatic wavy effect
  const BG_NOISE_SCALE = 0.08;
  const BG_NOISE_SPEED = 0.08;
  const BG_NOISE_MIN = 0.3; // Wider range for more dramatic dark/light waves (30% to 100%)
  const BG_NOISE_RANGE = 0.35; // 70% variation total
  
  // Center (Eve) noise settings - minimal for clarity
  const CENTER_NOISE_SCALE = 0.01;
  const CENTER_NOISE_SPEED = 0.005;
  const CENTER_NOISE_MIN = 0.99; // Minimal range 0.99 to 1.0
  const CENTER_NOISE_RANGE = 0.005;
  
  const CENTER_IMAGE_SIZE = 0.45; // Size of Eve painting in center (35% of canvas)

  // Draw dots function
  const drawDots = (progress = 1, bgNoiseTime = 0, centerNoiseTime = 0) => {
    if (!backgroundImageData || !centerImageData || !canvasRef.current) {
      console.log('drawDots called but missing data:', {
        bg: !!backgroundImageData,
        center: !!centerImageData,
        canvas: !!canvasRef.current
      });
      return;
    }
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const dotSpacingPx = DOT_SPACING * rem;
    const maxDotSizePx = MAX_DOT_SIZE * rem;
    
    const dotsX = Math.ceil(canvas.width / dotSpacingPx);
    const dotsY = Math.ceil(canvas.height / dotSpacingPx);
    
    const centerX = dotsX / 2;
    const centerY = dotsY / 2;
    const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);
    
    // Calculate center image bounds in dot coordinates
    const centerImageWidthDots = Math.floor(dotsX * CENTER_IMAGE_SIZE);
    const centerImageAspect = centerImageData.width / centerImageData.height;
    const centerImageHeightDots = Math.floor(centerImageWidthDots / centerImageAspect);
    const centerImageLeft = Math.floor((dotsX - centerImageWidthDots) / 2);
    const centerImageTop = Math.floor((dotsY - centerImageHeightDots) / 2);
    const centerImageRight = centerImageLeft + centerImageWidthDots;
    const centerImageBottom = centerImageTop + centerImageHeightDots;
    
    // Background image scaling - fill canvas
    const bgAspect = backgroundImageData.width / backgroundImageData.height;
    const gridAspect = dotsX / dotsY;
    
    let bgScale, bgWidth, bgHeight, bgOffsetX = 0, bgOffsetY = 0;
    
    if (bgAspect > gridAspect) {
      bgScale = backgroundImageData.height / dotsY;
      bgWidth = Math.ceil(dotsX * bgScale);
      bgHeight = backgroundImageData.height;
      bgOffsetX = Math.floor((backgroundImageData.width - bgWidth) / 2);
    } else {
      bgScale = backgroundImageData.width / dotsX;
      bgWidth = backgroundImageData.width;
      bgHeight = Math.ceil(dotsY * bgScale);
      bgOffsetY = Math.floor((backgroundImageData.height - bgHeight) / 2);
    }
    
    // Center image scaling
    const centerScale = centerImageData.width / centerImageWidthDots;
    
    // Draw dots
    for (let y = 0; y < dotsY; y++) {
      for (let x = 0; x < dotsX; x++) {
        const dx = x - centerX;
        const dy = y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const normalizedDistance = distance / maxDistance;
        
        if (normalizedDistance > progress) continue;
        
        // Determine if this dot is in the center image region
        const isInCenter = x >= centerImageLeft && x < centerImageRight && 
                          y >= centerImageTop && y < centerImageBottom;
        
        let brightness;
        let noiseMultiplier;
        
        if (isInCenter) {
          // Sample from center image (Eve) with minimal noise
          const relX = x - centerImageLeft;
          const relY = y - centerImageTop;
          const imgX = Math.min(Math.max(0, Math.floor(relX * centerScale)), centerImageData.width - 1);
          const imgY = Math.min(Math.max(0, Math.floor(relY * centerScale)), centerImageData.height - 1);
          
          const pixelIndex = (imgY * centerImageData.width + imgX) * 4;
          const r = centerImageData.data[pixelIndex];
          const g = centerImageData.data[pixelIndex + 1];
          const b = centerImageData.data[pixelIndex + 2];
          
          brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          
          // Center noise - very subtle for clarity
          const centerNoiseValue = noiseRef.current.noise(
            x * CENTER_NOISE_SCALE,
            y * CENTER_NOISE_SCALE,
            centerNoiseTime
          );
          noiseMultiplier = CENTER_NOISE_MIN + (centerNoiseValue + 1) * CENTER_NOISE_RANGE;
        } else {
          // Sample from background image (forest/cave) with dramatic noise
          const imgX = Math.min(bgOffsetX + Math.floor(x * bgScale), backgroundImageData.width - 1);
          const imgY = Math.min(bgOffsetY + Math.floor(y * bgScale), backgroundImageData.height - 1);
          
          const pixelIndex = (imgY * backgroundImageData.width + imgX) * 4;
          const r = backgroundImageData.data[pixelIndex];
          const g = backgroundImageData.data[pixelIndex + 1];
          const b = backgroundImageData.data[pixelIndex + 2];
          
          brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          
          // Background noise - original dramatic effect
          const bgNoiseValue = noiseRef.current.noise(
            x * BG_NOISE_SCALE,
            y * BG_NOISE_SCALE,
            bgNoiseTime
          );
          noiseMultiplier = BG_NOISE_MIN + (bgNoiseValue + 1) * BG_NOISE_RANGE;
        }
        
        const dotSizePx = brightness * maxDotSizePx * noiseMultiplier;
        
        const posX = x * dotSpacingPx + dotSpacingPx / 2;
        const posY = y * dotSpacingPx + dotSpacingPx / 2;
        
        let finalDotSize = dotSizePx;
        if (progress < 1) {
          const dotProgress = Math.min(1, Math.max(0, (progress - normalizedDistance) / 0.4));
          const easedProgress = 1 - Math.pow(1 - dotProgress, 3);
          finalDotSize = dotSizePx * easedProgress;
        }
        
        ctx.beginPath();
        ctx.arc(posX, posY, finalDotSize / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  // Load images
  useEffect(() => {
    const loadImage = (url) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          console.log('Image loaded successfully:', img.width, 'x', img.height);
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = img.width;
          tempCanvas.height = img.height;
          const tempCtx = tempCanvas.getContext('2d');
          tempCtx.drawImage(img, 0, 0, img.width, img.height);
          const imageData = tempCtx.getImageData(0, 0, img.width, img.height);
          resolve(imageData);
        };
        img.onerror = (error) => {
          console.error('Image failed to load:', error);
          reject(error);
        };
        console.log('Attempting to load image from:', url);
        img.src = url;
      });
    };

    Promise.all([
      loadImage(forestImageURL),
      loadImage(eveImageURL)
    ]).then(([bgData, centerData]) => {
      console.log('Both images loaded');
      setBackgroundImageData(bgData);
      setCenterImageData(centerData);
    }).catch(error => {
      console.error('Error loading images:', error);
    });
  }, []);

  // Animation loop
  useEffect(() => {
    if (!backgroundImageData || !centerImageData) {
      console.log('Waiting for images...', { 
        background: !!backgroundImageData, 
        center: !!centerImageData 
      });
      return;
    }
    
    console.log('Starting animation with both images loaded');
    
    const canvas = canvasRef.current;
    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      drawDots(1, bgNoiseTimeRef.current, centerNoiseTimeRef.current);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    let animationStart = null;
    let rippleComplete = false;
    
    const animate = (timestamp) => {
      if (!animationStart) animationStart = timestamp;
      
      const elapsed = timestamp - animationStart;
      const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
      
      // Update noise times separately
      bgNoiseTimeRef.current += BG_NOISE_SPEED;
      centerNoiseTimeRef.current += CENTER_NOISE_SPEED;
      
      if (progress < 1) {
        setAnimationProgress(progress);
        drawDots(progress, bgNoiseTimeRef.current, centerNoiseTimeRef.current);
        animationFrameRef.current = requestAnimationFrame(animate);
      } else if (!rippleComplete) {
        rippleComplete = true;
        setAnimationProgress(1);
        setTextVisible(true);
        animationFrameRef.current = requestAnimationFrame(continuousAnimate);
      }
    };
    
    const continuousAnimate = () => {
      bgNoiseTimeRef.current += BG_NOISE_SPEED;
      centerNoiseTimeRef.current += CENTER_NOISE_SPEED;
      drawDots(1, bgNoiseTimeRef.current, centerNoiseTimeRef.current);
      animationFrameRef.current = requestAnimationFrame(continuousAnimate);
    };
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [backgroundImageData, centerImageData]);

  return (
    <div style={{ position: 'relative' }}>
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
          fontFamily: "'Calibri', serif",
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
            textAlign: 'justify',
            lineHeight: '1.8',
            fontWeight: '300'
          }}
        >
          We are holding an informal roundtable discussion at Western University on the topic of the feasibility and potential design of Artificial General Intelligence (AGI). AGI is a theoretical type of machine intelligence that possesses human-level intellectual capability - the critical ability to generalize knowledge, learn any new task, and solve any problem, rather than being specialized like current narrow LLMs. If you have any interest in AI, ML, neuroscience, or psychology, we would recommend joining.
        </p>
        <div style={{ marginTop: '2rem' }}>
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
              transition: 'background-color 0.3s ease, color 0.3s ease',
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

export default DualImageDotMatrix;