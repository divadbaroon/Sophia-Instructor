'use client'

import React, { useRef, useEffect, useCallback } from 'react';

interface SimulationHashTableVisualizationOverlayProps {
  onInteraction: () => void; // Dummy function for replay
  terminalHeight?: number;
  sessionId: string | null;    
  lessonId: string | null; 
  strokesData?: Array<{
    zone: string;
    complete_points: Array<{x: number, y: number}>;
  }>; // Optional stroke data for replay
}

const SimulationHashTableVisualizationOverlay: React.FC<SimulationHashTableVisualizationOverlayProps> = ({ 
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
    
    // Draw hash table slots with linked chain visualization 
    ctx.font = '14px Arial';
    ctx.lineWidth = 2;

    // Draw hash table slots (left column with rounded corners)
    for (let i = 0; i <= 10; i++) {
      const x = 50;
      const y = 30 + i * 32;
      
      // All slots have white background
      ctx.fillStyle = 'white';
      
      // Draw rounded rectangle for slot
      ctx.beginPath();
      ctx.roundRect(x, y, 50, 28, 4);
      ctx.fill();
      ctx.strokeStyle = '#333';
      ctx.stroke();
      
      // Draw slot number in black
      ctx.fillStyle = 'black';
      ctx.fillText(i.toString(), x + 20, y + 18);
    }

    // Draw existing chains with proper linked list style and arrow heads
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    
    // Slot 1 -> 12 (with arrowhead)
    const slot1Y = 30 + 1 * 32;
    // Arrow from slot
    ctx.beginPath();
    ctx.moveTo(100, slot1Y + 14);
    ctx.lineTo(195, slot1Y + 14);
    ctx.stroke();
    // Draw arrowhead
    ctx.beginPath();
    ctx.moveTo(195, slot1Y + 14);
    ctx.lineTo(190, slot1Y + 9);
    ctx.moveTo(195, slot1Y + 14);
    ctx.lineTo(190, slot1Y + 19);
    ctx.stroke();
    // Draw 12 node
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.roundRect(200, slot1Y + 2, 50, 24, 3);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'black';
    ctx.fillText('12', 220, slot1Y + 16);

    // Slot 7 -> 18 (with arrowhead)
    const slot7Y = 30 + 7 * 32;
    // Arrow from slot
    ctx.beginPath();
    ctx.moveTo(100, slot7Y + 14);
    ctx.lineTo(195, slot7Y + 14);
    ctx.stroke();
    // Draw arrowhead
    ctx.beginPath();
    ctx.moveTo(195, slot7Y + 14);
    ctx.lineTo(190, slot7Y + 9);
    ctx.moveTo(195, slot7Y + 14);
    ctx.lineTo(190, slot7Y + 19);
    ctx.stroke();
    // Draw 18 node
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.roundRect(200, slot7Y + 2, 50, 24, 3);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'black';
    ctx.fillText('18', 220, slot7Y + 16);

    // Slot 4 chain: 26 -> 4 (existing chain with arrowheads)
    const slot4Y = 30 + 4 * 32;
    
    // Arrow from slot 4 to 26 (with arrowhead)
    ctx.beginPath();
    ctx.moveTo(100, slot4Y + 14);
    ctx.lineTo(345, slot4Y + 14);
    ctx.stroke();
    // Draw arrowhead
    ctx.beginPath();
    ctx.moveTo(345, slot4Y + 14);
    ctx.lineTo(340, slot4Y + 9);
    ctx.moveTo(345, slot4Y + 14);
    ctx.lineTo(340, slot4Y + 19);
    ctx.stroke();
    
    // Draw 26 node
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.roundRect(350, slot4Y + 2, 50, 24, 3);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'black';
    ctx.fillText('26', 370, slot4Y + 16);
    
    // Arrow from 26 to 4 (with arrowhead)
    ctx.beginPath();
    ctx.moveTo(400, slot4Y + 14);
    ctx.lineTo(515, slot4Y + 14);
    ctx.stroke();
    // Draw arrowhead
    ctx.beginPath();
    ctx.moveTo(515, slot4Y + 14);
    ctx.lineTo(510, slot4Y + 9);
    ctx.moveTo(515, slot4Y + 14);
    ctx.lineTo(510, slot4Y + 19);
    ctx.stroke();
    
    // Draw 4 node
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.roundRect(520, slot4Y + 2, 50, 24, 3);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'black';
    ctx.fillText('4', 540, slot4Y + 16);

    // Add helpful annotations
    ctx.fillStyle = '#007bff';
    ctx.font = '14px Arial';

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
          Draw a circle where the value 15 should be inserted using collision chaining.
          <br />
        </p>
        
        <canvas 
          ref={canvasRef}
          width={800} 
          height={420}
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

export default SimulationHashTableVisualizationOverlay;