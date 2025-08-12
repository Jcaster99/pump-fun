import React, { useRef, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';

const AnimatedLogo = ({ size = 40 }) => {
  const canvasRef = useRef(null);
  const { theme, darkMode } = useTheme();
  
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particles = [];
    
    // Set canvas dimensions with higher resolution for retina displays
    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = size * pixelRatio;
    canvas.height = size * pixelRatio;
    
    // Set the CSS size
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    
    // Scale the context
    ctx.scale(pixelRatio, pixelRatio);
    
    // Create particles
    function createParticles() {
      particles = [];
      
      for (let i = 0; i < 15; i++) {
        particles.push({
          x: Math.random() * size,
          y: Math.random() * size,
          size: Math.random() * 2 + 1,
          speedX: Math.random() * 0.5 - 0.25,
          speedY: Math.random() * 0.5 - 0.25,
          color: i % 2 === 0 ? theme.accent.primary : theme.accent.secondary
        });
      }
    }
    
    // Animation function
    function animate() {
      ctx.clearRect(0, 0, size, size);
      
      // Draw circle background
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.fillStyle = darkMode ? '#232330' : '#f5f5f8';
      ctx.fill();
      
      // Draw "0" in the center
      ctx.font = 'bold 16px Arial';
      ctx.fillStyle = theme.text.primary;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('ØG', size / 2, size / 2);
      
      // Update and draw particles
      particles.forEach(particle => {
        // Update position
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        
        // Bounce off edges
        if (particle.x <= 0 || particle.x >= size) {
          particle.speedX *= -1;
        }
        
        if (particle.y <= 0 || particle.y >= size) {
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
    };
  }, [size, theme, darkMode]);
  
  return (
    <canvas
      ref={canvasRef}
      style={{
        borderRadius: '50%',
        boxShadow: `0 0 10px ${theme.accent.primary}33`,
      }}
    />
  );
};

export default AnimatedLogo; 