import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const Canvas3DVisual = () => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const spiralGroupRef = useRef(null);
  const orbitalGroupRef = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 15;
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true 
    });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setClearColor(0x000000, 1);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create orbital rings structure
    const orbitalGroup = new THREE.Group();
    orbitalGroupRef.current = orbitalGroup;
    
    const ringCount = 12;
    for (let i = 0; i < ringCount; i++) {
      const radius = 2 + i * 0.8;
      const geometry = new THREE.RingGeometry(radius - 0.02, radius + 0.02, 64);
      const material = new THREE.MeshBasicMaterial({ 
        color: i % 3 === 0 ? 0x00ffff : 0xffffff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6
      });
      const ring = new THREE.Mesh(geometry, material);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = (i - ringCount / 2) * 0.8;
      orbitalGroup.add(ring);

      // Add numbered points
      const pointCount = 8 + i * 2;
      for (let j = 0; j < pointCount; j++) {
        const angle = (j / pointCount) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = (i - ringCount / 2) * 0.8;

        const pointGeometry = new THREE.SphereGeometry(0.08, 16, 16);
        const pointMaterial = new THREE.MeshBasicMaterial({ 
          color: 0x00ffff,
          transparent: true,
          opacity: 0.8
        });
        const point = new THREE.Mesh(pointGeometry, pointMaterial);
        point.position.set(x, y, z);
        orbitalGroup.add(point);
      }
    }

    // Add connecting vertical lines
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const points = [];
      for (let j = 0; j < ringCount; j++) {
        const radius = 2 + j * 0.8;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = (j - ringCount / 2) * 0.8;
        points.push(new THREE.Vector3(x, y, z));
      }
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const lineMaterial = new THREE.LineBasicMaterial({ 
        color: 0xffffff,
        transparent: true,
        opacity: 0.3
      });
      const line = new THREE.Line(lineGeometry, lineMaterial);
      orbitalGroup.add(line);
    }

    scene.add(orbitalGroup);

    // Create spiral helix structure
    const spiralGroup = new THREE.Group();
    spiralGroupRef.current = spiralGroup;
    spiralGroup.visible = false;

    const helixPoints = [];
    const helixCount = 200;
    for (let i = 0; i < helixCount; i++) {
      const t = (i / helixCount) * Math.PI * 8;
      const radius = 3 + Math.sin(t * 0.5) * 1.5;
      const x = Math.cos(t) * radius;
      const z = Math.sin(t) * radius;
      const y = (i / helixCount) * 12 - 6;
      helixPoints.push(new THREE.Vector3(x, y, z));

      // Add points along spiral
      if (i % 5 === 0) {
        const pointGeometry = new THREE.SphereGeometry(0.1, 16, 16);
        const pointMaterial = new THREE.MeshBasicMaterial({ 
          color: i % 15 === 0 ? 0x00ffff : 0xffffff,
          transparent: true,
          opacity: 0.7
        });
        const point = new THREE.Mesh(pointGeometry, pointMaterial);
        point.position.set(x, y, z);
        spiralGroup.add(point);
      }
    }

    const helixGeometry = new THREE.BufferGeometry().setFromPoints(helixPoints);
    const helixMaterial = new THREE.LineBasicMaterial({ 
      color: 0xffffff,
      transparent: true,
      opacity: 0.5
    });
    const helixLine = new THREE.Line(helixGeometry, helixMaterial);
    spiralGroup.add(helixLine);

    // Add cross-sectional rings on spiral
    for (let i = 0; i < 10; i++) {
      const y = (i / 10) * 12 - 6;
      const t = (i / 10) * Math.PI * 8;
      const baseRadius = 3 + Math.sin(t * 0.5) * 1.5;
      
      const ringGeometry = new THREE.RingGeometry(baseRadius - 0.05, baseRadius + 0.05, 32);
      const ringMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x00ffff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.4
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = y;
      spiralGroup.add(ring);
    }

    scene.add(spiralGroup);

    // Animation state
    let time = 0;
    const rotationSpeed = 0.002;
    const cycleDuration = 8; // seconds for complete cycle

    // Animation loop
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);

      time += 0.016; // roughly 60fps

      // Rotate structures
      if (orbitalGroup) {
        orbitalGroup.rotation.y += rotationSpeed;
        orbitalGroup.rotation.x += rotationSpeed * 0.3;
      }
      
      if (spiralGroup) {
        spiralGroup.rotation.y += rotationSpeed;
      }

      // Calculate which structure to show based on time
      const cyclePosition = (time % cycleDuration) / cycleDuration;
      
      if (orbitalGroup && spiralGroup) {
        if (cyclePosition < 0.5) {
          // Show orbital rings for first half of cycle
          orbitalGroup.visible = true;
          spiralGroup.visible = false;
        } else {
          // Show spiral for second half of cycle
          orbitalGroup.visible = false;
          spiralGroup.visible = true;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      if (!mountRef.current) return;
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div 
      ref={mountRef} 
      style={{ 
        width: '100%', 
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0
      }} 
    />
  );
};

const App = () => {
  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      backgroundColor: '#000000',
      color: '#ffffff',
      overflow: 'hidden',
      position: 'relative',
      fontFamily: "'Courier New', monospace"
    }}>
      {/* Grid Overlay Background */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundImage: `
          linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px',
        zIndex: 1,
        pointerEvents: 'none'
      }} />

      {/* Corner Crosshairs */}
      <svg style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 2,
        pointerEvents: 'none'
      }}>
        {/* Top Left */}
        <line x1="30" y1="30" x2="80" y2="30" stroke="rgba(0, 255, 255, 0.5)" strokeWidth="1" />
        <line x1="30" y1="30" x2="30" y2="80" stroke="rgba(0, 255, 255, 0.5)" strokeWidth="1" />
        <circle cx="30" cy="30" r="3" fill="none" stroke="#00ffff" strokeWidth="1" />
        
        {/* Top Right */}
        <line x1="calc(100% - 30px)" y1="30" x2="calc(100% - 80px)" y2="30" stroke="rgba(0, 255, 255, 0.5)" strokeWidth="1" />
        <line x1="calc(100% - 30px)" y1="30" x2="calc(100% - 30px)" y2="80" stroke="rgba(0, 255, 255, 0.5)" strokeWidth="1" />
        <circle cx="calc(100% - 30px)" cy="30" r="3" fill="none" stroke="#00ffff" strokeWidth="1" />
        
        {/* Bottom Left */}
        <line x1="30" y1="calc(100% - 30px)" x2="80" y2="calc(100% - 30px)" stroke="rgba(0, 255, 255, 0.5)" strokeWidth="1" />
        <line x1="30" y1="calc(100% - 30px)" x2="30" y2="calc(100% - 80px)" stroke="rgba(0, 255, 255, 0.5)" strokeWidth="1" />
        <circle cx="30" cy="calc(100% - 30px)" r="3" fill="none" stroke="#00ffff" strokeWidth="1" />
        
        {/* Bottom Right */}
        <line x1="calc(100% - 30px)" y1="calc(100% - 30px)" x2="calc(100% - 80px)" y2="calc(100% - 30px)" stroke="rgba(0, 255, 255, 0.5)" strokeWidth="1" />
        <line x1="calc(100% - 30px)" y1="calc(100% - 30px)" x2="calc(100% - 30px)" y2="calc(100% - 80px)" stroke="rgba(0, 255, 255, 0.5)" strokeWidth="1" />
        <circle cx="calc(100% - 30px)" cy="calc(100% - 30px)" r="3" fill="none" stroke="#00ffff" strokeWidth="1" />

        {/* Center crosshair */}
        <line x1="50%" y1="calc(50% - 40px)" x2="50%" y2="calc(50% + 40px)" stroke="rgba(0, 255, 255, 0.2)" strokeWidth="1" />
        <line x1="calc(50% - 40px)" y1="50%" x2="calc(50% + 40px)" y2="50%" stroke="rgba(0, 255, 255, 0.2)" strokeWidth="1" />
        <circle cx="50%" cy="50%" r="30" fill="none" stroke="rgba(0, 255, 255, 0.2)" strokeWidth="1" />
        <circle cx="50%" cy="50%" r="3" fill="#00ffff" />

        {/* Measurement lines on sides */}
        <line x1="0" y1="50%" x2="100" y2="50%" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="1" strokeDasharray="5,5" />
        <line x1="calc(100% - 100px)" y1="50%" x2="100%" y2="50%" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="1" strokeDasharray="5,5" />
      </svg>

      {/* Technical Annotations */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        fontSize: '0.7rem',
        color: 'rgba(255, 255, 255, 0.4)',
        textAlign: 'right',
        fontFamily: "'Courier New', monospace",
        zIndex: 5,
        pointerEvents: 'none',
        letterSpacing: '0.1rem'
      }}>
        <div>FILE: AGI-001</div>
        <div>REF: ER/5-98J</div>
        <div>DATE: 2025.10.06</div>
        <div style={{ marginTop: '0.5rem', color: 'rgba(0, 255, 255, 0.5)' }}>SYSTEM: ACTIVE</div>
      </div>

      {/* Bottom left technical info */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        fontSize: '0.7rem',
        color: 'rgba(255, 255, 255, 0.3)',
        fontFamily: "'Courier New', monospace",
        zIndex: 5,
        pointerEvents: 'none',
        letterSpacing: '0.1rem'
      }}>
        <div>COORDINATES: 43.0096°N, 81.2737°W</div>
        <div>LOCATION: WESTERN UNIVERSITY</div>
      </div>

      {/* Background Canvas */}
      <Canvas3DVisual />

      {/* Content Overlay */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '3rem',
        pointerEvents: 'none'
      }}>
        {/* Hero Section */}
        <div style={{
          textAlign: 'center',
          position: 'relative'
        }}>
          {/* Top measurement line */}
          <div style={{
            position: 'absolute',
            top: '0',
            left: '20%',
            right: '20%',
            height: '1px',
            background: 'rgba(0, 255, 255, 0.3)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ width: '8px', height: '8px', background: '#00ffff', transform: 'rotate(45deg)' }} />
            <div style={{ width: '8px', height: '8px', background: '#00ffff', transform: 'rotate(45deg)' }} />
            <div style={{ width: '8px', height: '8px', background: '#00ffff', transform: 'rotate(45deg)' }} />
          </div>
          
          {/* Technical label above title */}
          <div style={{
            fontSize: '0.75rem',
            letterSpacing: '0.3rem',
            color: 'rgba(0, 255, 255, 0.6)',
            marginBottom: '0.5rem',
            marginTop: '3rem'
          }}>
            PROJECT DESIGNATION
          </div>

          <h1 style={{
            fontSize: '4rem',
            fontWeight: '300',
            letterSpacing: '0.5rem',
            margin: '0',
            textTransform: 'uppercase',
            color: '#ffffff',
            textShadow: '0 0 10px rgba(0, 255, 255, 0.5)',
            position: 'relative'
          }}>
            AGI Discussion
            
            {/* Underline with measurements */}
            <div style={{
              position: 'absolute',
              bottom: '-15px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '70%',
              height: '1px',
              background: 'linear-gradient(90deg, transparent, #00ffff, transparent)'
            }} />
          </h1>
          
          <div style={{
            fontSize: '0.9rem',
            letterSpacing: '0.2rem',
            marginTop: '1.5rem',
            color: '#00ffff',
            opacity: 0.7,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem'
          }}>
            <span style={{ width: '30px', height: '1px', background: 'rgba(0, 255, 255, 0.5)' }} />
            WESTERN UNIVERSITY
            <span style={{ width: '30px', height: '1px', background: 'rgba(0, 255, 255, 0.5)' }} />
          </div>
        </div>

        {/* Content Section */}
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          background: 'rgba(0, 0, 0, 0.85)',
          padding: '2.5rem',
          border: '1px solid rgba(0, 255, 255, 0.3)',
          position: 'relative',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 0 30px rgba(0, 255, 255, 0.1)'
        }}>
          {/* Corner markers - enhanced */}
          <div style={{
            position: 'absolute',
            top: '-1px',
            left: '-1px',
            width: '25px',
            height: '25px',
            borderTop: '2px solid #00ffff',
            borderLeft: '2px solid #00ffff'
          }}>
            <div style={{
              position: 'absolute',
              top: '-8px',
              left: '-8px',
              width: '4px',
              height: '4px',
              background: '#00ffff',
              borderRadius: '50%'
            }} />
          </div>
          <div style={{
            position: 'absolute',
            top: '-1px',
            right: '-1px',
            width: '25px',
            height: '25px',
            borderTop: '2px solid #00ffff',
            borderRight: '2px solid #00ffff'
          }}>
            <div style={{
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              width: '4px',
              height: '4px',
              background: '#00ffff',
              borderRadius: '50%'
            }} />
          </div>
          <div style={{
            position: 'absolute',
            bottom: '-1px',
            left: '-1px',
            width: '25px',
            height: '25px',
            borderBottom: '2px solid #00ffff',
            borderLeft: '2px solid #00ffff'
          }}>
            <div style={{
              position: 'absolute',
              bottom: '-8px',
              left: '-8px',
              width: '4px',
              height: '4px',
              background: '#00ffff',
              borderRadius: '50%'
            }} />
          </div>
          <div style={{
            position: 'absolute',
            bottom: '-1px',
            right: '-1px',
            width: '25px',
            height: '25px',
            borderBottom: '2px solid #00ffff',
            borderRight: '2px solid #00ffff'
          }}>
            <div style={{
              position: 'absolute',
              bottom: '-8px',
              right: '-8px',
              width: '4px',
              height: '4px',
              background: '#00ffff',
              borderRadius: '50%'
            }} />
          </div>

          {/* Section header */}
          <div style={{
            fontSize: '0.7rem',
            letterSpacing: '0.2rem',
            color: 'rgba(0, 255, 255, 0.7)',
            marginBottom: '1rem',
            paddingBottom: '0.5rem',
            borderBottom: '1px solid rgba(0, 255, 255, 0.2)',
            display: 'flex',
            justifyContent: 'space-between'
          }}>
            <span>RESEARCH BRIEF</span>
            <span>SECTION 1.0</span>
          </div>

          <p style={{
            fontSize: '1.1rem',
            lineHeight: '1.8',
            textAlign: 'justify',
            margin: '0',
            color: '#e0e0e0',
            fontFamily: "'Arial', sans-serif"
          }}>
            We are holding an informal roundtable discussion at Western University on the topic of the feasibility and potential design of Artificial General Intelligence (AGI). AGI is a theoretical type of machine intelligence that possesses human-level intellectual capability - the critical ability to generalize knowledge, learn any new task, and solve any problem, rather than being specialized like current narrow LLMs. If you have any interest in AI, ML, neuroscience, or psychology, we would recommend joining.
          </p>

          {/* Bottom annotation line */}
          <div style={{
            marginTop: '1.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            fontSize: '0.65rem',
            color: 'rgba(255, 255, 255, 0.3)',
            display: 'flex',
            justifyContent: 'space-between',
            fontFamily: "'Courier New', monospace"
          }}>
            <span>CLASSIFICATION: PUBLIC</span>
            <span>REV: 001</span>
          </div>
        </div>

        {/* CTA Section */}
        <div style={{
          textAlign: 'center',
          paddingBottom: '2rem'
        }}>
          <a
            href="https://form.typeform.com/to/nevqYTry"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              padding: '1rem 3rem',
              border: '2px solid #00ffff',
              color: '#00ffff',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              textDecoration: 'none',
              fontSize: '1.1rem',
              fontWeight: '400',
              letterSpacing: '0.2rem',
              transition: 'all 0.3s ease',
              textTransform: 'uppercase',
              pointerEvents: 'auto',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              backdropFilter: 'blur(10px)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#00ffff';
              e.currentTarget.style.color = '#000000';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 255, 255, 0.8)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
              e.currentTarget.style.color = '#00ffff';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            Join Discussion
          </a>
        </div>
      </div>
    </div>
  );
};

export default App;