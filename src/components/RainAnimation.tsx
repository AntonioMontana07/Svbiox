
import React, { useEffect, useRef } from 'react';

const RainAnimation: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const raindrops: Array<{
      x: number;
      y: number;
      speed: number;
      opacity: number;
      length: number;
    }> = [];

    // Crear más gotas de lluvia para mejor efecto
    for (let i = 0; i < 150; i++) {
      raindrops.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speed: Math.random() * 4 + 3,
        opacity: Math.random() * 0.8 + 0.2,
        length: Math.random() * 15 + 10
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      raindrops.forEach(drop => {
        ctx.beginPath();
        // Cambiar color a morado con diferentes tonalidades
        const purpleShades = [
          `rgba(147, 51, 234, ${drop.opacity})`, // purple-600
          `rgba(126, 34, 206, ${drop.opacity})`, // purple-700
          `rgba(168, 85, 247, ${drop.opacity})`, // purple-500
          `rgba(196, 181, 253, ${drop.opacity})` // purple-300
        ];
        ctx.strokeStyle = purpleShades[Math.floor(Math.random() * purpleShades.length)];
        ctx.lineWidth = Math.random() * 2 + 1;
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x - 2, drop.y + drop.length); // Ligera inclinación
        ctx.stroke();

        drop.y += drop.speed;

        if (drop.y > canvas.height + drop.length) {
          drop.y = -drop.length;
          drop.x = Math.random() * canvas.width;
        }
      });

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ 
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 30%, #4c1d95 70%, #581c87 100%)' 
      }}
    />
  );
};

export default RainAnimation;
