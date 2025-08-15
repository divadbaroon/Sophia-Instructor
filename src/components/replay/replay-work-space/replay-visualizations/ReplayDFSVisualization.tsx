'use client'

import React, { useRef, useEffect, useCallback } from 'react';

interface SimulationDFSVisualizationOverlayProps {
  onInteraction: () => void; // Dummy function for replay
  terminalHeight?: number;
  sessionId: string | null;    
  lessonId: string | null; 
  strokesData?: Array<{
    zone: string;
    complete_points: Array<{x: number, y: number}>;
  }>; // Optional stroke data for replay
}

const SimulationDFSVisualizationOverlay: React.FC<SimulationDFSVisualizationOverlayProps> = ({ 
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
    
    // Draw DFS graph
    ctx.strokeStyle = '#333';
    ctx.fillStyle = '#333';
    ctx.font = '20px Arial';
    ctx.lineWidth = 2;

    // Draw edges
    ctx.beginPath();
    ctx.moveTo(400, 75); ctx.lineTo(300, 175); // 1-2
    ctx.moveTo(400, 75); ctx.lineTo(500, 175); // 1-3
    ctx.moveTo(300, 175); ctx.lineTo(200, 275); // 2-5
    ctx.moveTo(300, 175); ctx.lineTo(400, 275); // 2-6
    ctx.stroke();

    // Draw nodes
    const nodes = [
      { id: '1', x: 400, y: 75 },
      { id: '2', x: 300, y: 175 },
      { id: '3', x: 500, y: 175 },
      { id: '5', x: 200, y: 275 },
      { id: '6', x: 400, y: 275 }
    ];

    nodes.forEach(node => {
      ctx.beginPath();
      ctx.arc(node.x, node.y, 25, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.fillStyle = '#f8f9fa';
      ctx.fill();
      ctx.fillStyle = '#333';
      ctx.fillText(node.id, node.x - 8, node.y + 7);
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
          Number the nodes in the order that Depth-First Search would visit them using the draw tool above.
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

export default SimulationDFSVisualizationOverlay;