import React, { useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';

/**
 * Komponent tła z animacją cząsteczek
 * 
 * @param {Object} props
 * @param {number} [props.zIndex=0] - z-index dla canvasu
 * @param {number} [props.particleCount=100] - liczba cząsteczek
 * @param {number} [props.minSize=2] - minimalna wielkość cząsteczek
 * @param {number} [props.maxSize=8] - maksymalna wielkość cząsteczek
 * @param {number} [props.speed=0.5] - bazowa prędkość cząsteczek (0-1)
 */
const ParticleBackground = ({ 
  zIndex = 0,
  particleCount = 100,
  minSize = 2,
  maxSize = 8,
  speed = 0.5
}) => {
  const { theme } = useTheme();
  const canvasRef = useRef(null);

  // Animation effect for background particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particles = [];
    
    // Set canvas to full window size with pixel ratio for retina displays
    const setCanvasSize = () => {
      const pixelRatio = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * pixelRatio;
      canvas.height = window.innerHeight * pixelRatio;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      // Reset any existing transforms before applying new scale to prevent accumulation
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(pixelRatio, pixelRatio);
    };
    
    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);
    
    // Create particles
    function createParticles() {
      particles = [];
      
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          size: Math.random() * (maxSize - minSize) + minSize,
          speedX: (Math.random() * speed) - (speed / 2),
          speedY: (Math.random() * speed) - (speed / 2),
          color: i % 2 === 0 ? theme.accent.primary : theme.accent.secondary
        });
      }
    }
    
    // Animation function
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update and draw particles
      particles.forEach(particle => {
        // Update position
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        
        // Bounce off edges
        if (particle.x <= 0 || particle.x >= window.innerWidth) {
          particle.speedX *= -1;
        }
        
        if (particle.y <= 0 || particle.y >= window.innerHeight) {
          particle.speedY *= -1;
        }
        
        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.fill();
      });
      
      animationFrameId = requestAnimationFrame(animate);
    }
    
    // Initialize and start animation
    createParticles();
    animate();
    
    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', setCanvasSize);
    };
  }, [theme, particleCount, minSize, maxSize, speed]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: zIndex,
        pointerEvents: 'none'
      }}
    />
  );
};

export default ParticleBackground; 