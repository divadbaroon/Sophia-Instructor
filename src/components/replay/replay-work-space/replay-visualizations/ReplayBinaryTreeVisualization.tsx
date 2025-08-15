'use client'

import React, { useRef, useEffect, useCallback } from 'react';

interface SimulationBinaryTreeVisualizationOverlayProps {
  onInteraction: () => void; // Dummy function for replay
  terminalHeight?: number;
  sessionId: string | null;    
  lessonId: string | null; 
  strokesData?: Array<{
    zone: string;
    complete_points: Array<{x: number, y: number}>;
  }>; // Optional stroke data for replay
}

const SimulationBinaryTreeVisualizationOverlay: React.FC<SimulationBinaryTreeVisualizationOverlayProps> = ({ 
  terminalHeight = 50,
  strokesData = []
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawVisualization = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw binary tree
    ctx.strokeStyle = '#333';
    ctx.fillStyle = '#333';
    ctx.font = '18px Arial';
    ctx.lineWidth = 2;

    // Draw edges
    ctx.beginPath();
    ctx.moveTo(375, 75); ctx.lineTo(175, 175); // A-B
    ctx.moveTo(375, 75); ctx.lineTo(475, 175); // A-C
    ctx.moveTo(175, 175); ctx.lineTo(125, 275); // B-D
    ctx.moveTo(175, 175); ctx.lineTo(225, 275); // B-E
    ctx.moveTo(475, 175); ctx.lineTo(525, 275); // C-F
    ctx.stroke();

    // Draw nodes
    const nodes = [
      { label: 'A', x: 375, y: 75 },
      { label: 'B', x: 175, y: 175 },
      { label: 'C', x: 475, y: 175 },
      { label: 'D', x: 125, y: 275 },
      { label: 'E', x: 225, y: 275 },
      { label: 'F', x: 525, y: 275 }
    ];

    nodes.forEach(node => {
      ctx.beginPath();
      ctx.arc(node.x, node.y, 25, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.fillStyle = '#f8f9fa';
      ctx.fill();
      ctx.fillStyle = '#333';
      ctx.fillText(node.label, node.x - 8, node.y + 6);
    });

    // Draw replay strokes (if any)
    if (strokesData && strokesData.length > 0) {
      ctx.strokeStyle = '#ff4757';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      strokesData.forEach(stroke => {
        const points = stroke.complete_points;
        if (points && points.length > 1) {
          ctx.beginPath();
          ctx.moveTo(points[0].x, points[0].y);
          for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
          }
          ctx.stroke();
        }
      });
    }
  }, [strokesData]);

  // Redraw when stroke data changes
  useEffect(() => {
    drawVisualization();
  }, [drawVisualization]);

  return (
    <div className="h-full flex items-center justify-center bg-white" style={{ paddingBottom: `${terminalHeight}vh` }}>
      <div className="text-center max-w-4xl mx-auto p-6">
        <p className="text-gray-600 mb-6">
          Number the nodes in postorder traversal order using the draw tool above.
          <br />
        </p>
        
        <canvas 
          ref={canvasRef}
          width={800} 
          height={400}
          className="border-2 border-gray-300 rounded-lg shadow-sm mx-auto cursor-default opacity-90"
          style={{ 
            maxWidth: '100%',
            display: 'block' // Ensure consistent positioning
          }}
        />
        
        {/* Debug info */}
        <div className="mt-2 text-xs text-gray-500">
          Replaying {strokesData.length} strokes
        </div>
      </div>
    </div>
  );
};

export default SimulationBinaryTreeVisualizationOverlay;