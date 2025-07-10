import React, { useRef, useEffect } from 'react';
import { useVideoAspectRatio } from '../../hooks/useVideoAspectRatio';

/**
 * Test component to verify dynamic aspect ratio functionality
 * This can be used for testing different video aspect ratios
 */
const AspectRatioTest = () => {
  const containerRef = useRef(null);
  const { aspectRatio, attachVideoElement } = useVideoAspectRatio(true);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.style.setProperty(
        '--local-video-aspect-ratio', 
        aspectRatio.toString()
      );
    }
  }, [aspectRatio]);

  const createTestVideo = (width, height, label) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#4a90e2';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(label, width/2, height/2);
    ctx.fillText(`${width}x${height}`, width/2, height/2 + 30);
    ctx.fillText(`${(width/height).toFixed(2)}:1`, width/2, height/2 + 60);

    return canvas.captureStream();
  };

  const testAspectRatio = (width, height, label) => {
    const video = document.querySelector('#test-video');
    if (video) {
      const stream = createTestVideo(width, height, label);
      video.srcObject = stream;
      attachVideoElement(video);
    }
  };

  return (
    <div style={{ padding: '20px', background: '#f0f0f0', minHeight: '100vh' }}>
      <h2>Dynamic Aspect Ratio Test</h2>
      <p>Current aspect ratio: {aspectRatio.toFixed(3)}</p>
      
      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => testAspectRatio(1920, 1080, '16:9 HD')} style={{ margin: '5px' }}>
          Test 16:9 (1920x1080)
        </button>
        <button onClick={() => testAspectRatio(1280, 960, '4:3 Classic')} style={{ margin: '5px' }}>
          Test 4:3 (1280x960)
        </button>
        <button onClick={() => testAspectRatio(1080, 1080, '1:1 Square')} style={{ margin: '5px' }}>
          Test 1:1 (1080x1080)
        </button>
        <button onClick={() => testAspectRatio(1080, 1920, '9:16 Portrait')} style={{ margin: '5px' }}>
          Test 9:16 (1080x1920)
        </button>
        <button onClick={() => testAspectRatio(2560, 1080, '21:9 Ultrawide')} style={{ margin: '5px' }}>
          Test 21:9 (2560x1080)
        </button>
      </div>

      <div style={{ marginBottom: '20px', padding: '15px', background: '#e3f2fd', borderRadius: '8px' }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>Mobile Testing Instructions:</h4>
        <p style={{ margin: '0', fontSize: '14px', color: '#424242' }}>
          📱 <strong>On Mobile Portrait (≤480px):</strong> Aspect ratio is forced to 9:16 regardless of video source<br/>
          📱 <strong>On Mobile Landscape (≤768px):</strong> Aspect ratio switches to 16:9 for better viewing<br/>
          💻 <strong>On Desktop (&gt;768px):</strong> Dynamic aspect ratio detection based on actual video dimensions
        </p>
      </div>

      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        <div>
          <h3>Test Video</h3>
          <video 
            id="test-video"
            autoPlay 
            muted 
            style={{ 
              width: '400px', 
              height: 'auto', 
              border: '2px solid #ccc',
              borderRadius: '8px'
            }}
          />
        </div>

        <div>
          <h3>Floating Participant Preview</h3>
          <div 
            ref={containerRef}
            className="floating-local-participant"
            style={{ 
              position: 'relative',
              top: 'auto',
              right: 'auto',
              margin: '0'
            }}
          >
            <div className="floating-participant-video">
              <video 
                autoPlay 
                muted 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover',
                  borderRadius: '12px'
                }}
                ref={(video) => {
                  if (video) {
                    const testVideo = document.querySelector('#test-video');
                    if (testVideo && testVideo.srcObject) {
                      video.srcObject = testVideo.srcObject;
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '20px', padding: '15px', background: 'white', borderRadius: '8px' }}>
        <h4>Implementation Details:</h4>
        <ul>
          <li>✅ Dynamic aspect ratio detection using useVideoAspectRatio hook</li>
          <li>✅ CSS custom properties for smooth transitions</li>
          <li>✅ Aspect ratio constraints (0.5 to 3.0) to prevent extreme sizes</li>
          <li>✅ Height constraints (80px to 280px) for floating participant</li>
          <li>✅ Automatic video element monitoring with ResizeObserver</li>
          <li>✅ Graceful fallback to 16:9 when camera is off</li>
        </ul>
      </div>
    </div>
  );
};

export default AspectRatioTest;
