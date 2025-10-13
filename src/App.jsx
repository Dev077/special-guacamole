import React, { useState } from 'react';

export default function AGIDiscussion() {
  const [isHovered, setIsHovered] = useState(false);
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date());

  return (
    <div 
      className="min-h-screen px-6 py-20"
      style={{ 
        backgroundColor: '#1a1a1a',
        fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
        color: '#d0c7b3',
        minHeight: '100vh',
        width: '100vw',
        boxSizing: 'border-box',
        display: 'flex',
        justifyContent: 'center'
      }}
    >
      <div className="max-w-3xl mx-auto" style={{ width: 'min(90vw, 960px)' }}>
        {/* Title */}
        <h1 
          className="mb-16"
          style={{
            fontSize: '64px',
            fontWeight: 'bold',
            lineHeight: '1.1',
            marginBottom: '48px',
            fontFamily: 'Georgia, "Times New Roman", serif',
            textAlign: 'center'
          }}
        >
          <span style={{ fontSize: '64px' }}>S</span>
          <span style={{ fontSize: '32px' }}>TATE</span>
          {' '}
          <span style={{ fontSize: '64px' }}>N</span>
          <span style={{ fontSize: '32px' }}>AVIGATION</span>
          {' '}
          <span style={{ fontSize: '64px' }}>G</span>
          <span style={{ fontSize: '32px' }}>ROUP</span>
        </h1>

        {/* Main content */}
        <div style={{ fontSize: '18px', lineHeight: '1.8', marginBottom: '48px' }}>
          <div style={{ marginBottom: '32px', textAlign: 'right' }}>
            <p style={{ margin: 0 }}>Western University</p>
            <p style={{ margin: 0 }}>London, Ontario</p>
            <p style={{ margin: 0 }}>{formattedDate}</p>
          </div>

          <p style={{ marginBottom: '24px' }}>Dear Scholars,</p>

          <p style={{ marginBottom: '24px' }}>
            We are holding an informal roundtable discussion at Western University on the topic of the feasibility and potential design of Artificial General Intelligence (AGI). AGI is a theoretical type of machine intelligence that possesses human-level intellectual capability—the critical ability to generalize knowledge, learn any new task, and solve any problem, rather than being specialized like current narrow LLMs.
          </p>

          <p style={{ marginBottom: '24px' }}>
            If you have any interest in AI, ML, neuroscience, or psychology, we would recommend joining this conversation as we explore the possibilities and challenges of AGI together.
          </p>
        </div>

        {/* CTA */}
        <div
          style={{
            marginTop: '64px',
            display: 'flex',
            justifyContent: 'flex-start'
          }}
        >
          <a
            href="https://form.typeform.com/to/nevqYTry"
            target="_blank"
            rel="noopener noreferrer"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
              display: 'inline-block',
              fontSize: '28px',
              fontWeight: 'normal',
              color: '#d0c7b3',
              textDecoration: 'none',
              cursor: 'pointer',
              fontFamily: 'Brush Script MT, cursive',
              fontStyle: 'italic',
              borderBottom: isHovered ? '2px solid #d0c7b3' : '1px solid #d0c7b3',
              paddingBottom: '4px',
              letterSpacing: isHovered ? '2px' : '0.5px',
              transform: isHovered ? 'translateX(10px)' : 'translateX(0)',
              transition: 'transform 0.3s ease, letter-spacing 0.3s ease, border-bottom 0.3s ease'
            }}
          >
            Join the Discussion
          </a>
        </div>
      </div>
    </div>
  );
}