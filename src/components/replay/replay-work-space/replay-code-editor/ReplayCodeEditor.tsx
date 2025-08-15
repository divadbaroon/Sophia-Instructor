'use client'

import React, { useRef, useMemo, useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';

import SimulationDFSVisualizationOverlay from '@/components/replay/replay-work-space/replay-visualizations/ReplayDFSVisualization';
import SimulationHashTableVisualizationOverlay from '@/components/replay/replay-work-space/replay-visualizations/ReplayHashTableVisualization';
import SimulationBinaryTreeVisualizationOverlay from '@/components/replay/replay-work-space/replay-visualizations/ReplayBinaryTreeVisualization';

import { java } from '@codemirror/lang-java';
import { indentUnit } from '@codemirror/language';
import { EditorView, Decoration, DecorationSet } from '@codemirror/view' 
import { StateField, StateEffect } from '@codemirror/state';
import { vscodeLight } from '@uiw/codemirror-theme-vscode';

import { useSimulation } from "@/lib/providers/replay-provider/ReplayProvider";

import { createFontSizeExtension } from '@/utils/replay/replay-code-editor/replay-code-editor-utils';

interface SimulationCodeEditorProps {
  className?: string;
  terminalHeight?: number;
}

// Create highlight decoration with light yellow
const highlightMark = Decoration.line({
  attributes: { style: "background-color: #fff9c4; animation: highlightPersist 5s forwards;" }
});

// State effect to add highlight
const addHighlight = StateEffect.define<number>();

// State field to manage highlights
const highlightField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(highlights, tr) {
    highlights = highlights.map(tr.changes);
    
    for (const effect of tr.effects) {
      if (effect.is(addHighlight)) {
        const line = tr.state.doc.line(effect.value);
        highlights = highlights.update({
          add: [highlightMark.range(line.from, line.from)]
        });
      }
    }
    
    return highlights;
  },
  provide: f => EditorView.decorations.from(f)
});

export const SimulationCodeEditor = ({ 
  className = '', 
  terminalHeight = 50 
}: SimulationCodeEditorProps) => {
  const { 
    codeAtCurrentTime,
    activeTaskAtCurrentTime,
    lessonStructure,
    sophiaStateAtCurrentTime,
    sessionId,
    lessonId,
    strokesUpToCurrentTime
  } = useSimulation();

  const editorViewRef = useRef<EditorView | null>(null);
  const editorContainerRef = useRef<HTMLDivElement | null>(null);

  // Get current task from lesson structure
  const currentTask = lessonStructure?.tasks?.[activeTaskAtCurrentTime || 0];
  const activeMethodId = currentTask?.method_name;

  // Get the method template from methodTemplates object
  const currentMethodTemplate = activeMethodId && lessonStructure?.methodTemplates?.[activeMethodId] 
    ? lessonStructure.methodTemplates[activeMethodId] 
    : '';

  console.log('🎯 Current task:', currentTask);
  console.log('🎯 Active method ID:', activeMethodId);
  console.log('🎯 Method template preview:', currentMethodTemplate?.substring(0, 100));

  // Fixed font size for consistency
  const fontSize = 14;

  // Memoize custom extensions
  const customExtensions = useMemo(() => [
    java(),
    createFontSizeExtension(fontSize),
    indentUnit.of("    "),
    highlightField
  ], [fontSize]);

  // Get code to display 
  const displayCode = codeAtCurrentTime || currentMethodTemplate || `// ${currentTask?.title || 'Task'} - Loading...

public class Solution {
    // Student code will appear here...
}`;

  // Show Sophia highlights at current time 
  useEffect(() => {
    const highlights = sophiaStateAtCurrentTime.highlights;
    const latestHighlight = highlights[highlights.length - 1];
    
    if (latestHighlight && editorViewRef.current) {
      const lineNumber = latestHighlight.line_number;
      console.log("🔆 Simulation: Highlighting line:", lineNumber);
      
      try {
        // Add highlight to the line
        editorViewRef.current.dispatch({
          effects: addHighlight.of(lineNumber)
        });
      } catch (error) {
        console.error("❌ Error applying highlight:", error);
      }
    }
  }, [sophiaStateAtCurrentTime.highlights]);

  // Handle visualization tasks - use simulation components with stroke data
  if (activeMethodId === 'dfs_visualization') {
    console.log('🎯 Rendering DFS simulation visualization with', strokesUpToCurrentTime.length, 'strokes')
    return (
      <div className={`h-full flex flex-col relative ${className}`}>
        <SimulationDFSVisualizationOverlay 
          onInteraction={() => {}} // Read-only in simulation
          terminalHeight={terminalHeight}
          sessionId={sessionId || 'simulation'}    
          lessonId={lessonId || 'simulation'}
          strokesData={strokesUpToCurrentTime} // Pass timeline-filtered strokes
        />
      </div>
    );
  }

  if (activeMethodId === 'hash_visualization') {
    console.log('🎯 Rendering HashTable simulation visualization with', strokesUpToCurrentTime.length, 'strokes')
    return (
      <div className={`h-full flex flex-col relative ${className}`}>
        <SimulationHashTableVisualizationOverlay 
          onInteraction={() => {}} // Read-only in simulation
          terminalHeight={terminalHeight}
          sessionId={sessionId || 'simulation'}     
          lessonId={lessonId || 'simulation'}
          strokesData={strokesUpToCurrentTime} // Pass timeline-filtered strokes
        />
      </div>
    );
  }

  if (activeMethodId === 'tree_visualization') {
    console.log('🎯 Rendering BinaryTree simulation visualization with', strokesUpToCurrentTime.length, 'strokes')
    return (
      <div className={`h-full flex flex-col relative ${className}`}>
        <SimulationBinaryTreeVisualizationOverlay 
          onInteraction={() => {}}
          terminalHeight={terminalHeight}
          sessionId={sessionId || 'simulation'}     
          lessonId={lessonId || 'simulation'}
          strokesData={strokesUpToCurrentTime} // Pass timeline-filtered strokes
        />
      </div>
    );
  }

  console.log('🎯 Rendering CodeMirror for activeMethodId:', activeMethodId);

  return (
    <>
      <style jsx global>{`
        .cm-editor,
        .cm-editor.cm-focused {
          border-top: none !important;
          outline: none !important;
          border: none !important;
        }
        
        .cm-editor .cm-scroller {
          border-top: none !important;
          /* 🎯 Dynamic padding based on terminal height */
          padding-bottom: ${terminalHeight}vh !important;
        }
        
        .cm-content {
          border-top: none !important;
          /* 🎯 Dynamic padding based on terminal height */
          padding-bottom: ${terminalHeight}vh !important;
        }

        /* Highlight animation - persist for 5 seconds then fade */
        @keyframes highlightPersist {
          0% { background-color: #fff9c4; }
          80% { background-color: #fff9c4; }
          100% { background-color: transparent; }
        }

        /* Add simulation overlay for read-only indication */
        .simulation-readonly-overlay {
          position: absolute;
          top: 8px;
          right: 8px;
          background: rgba(59, 130, 246, 0.9);
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          z-index: 1000;
          pointer-events: none;
        }
      `}</style>
      
      <div 
        className={`h-full flex flex-col relative ${className}`}
        ref={editorContainerRef}
      >
        <CodeMirror
          key={`simulation-${sessionId}-${activeMethodId}`}
          value={displayCode}
          height="640px"
          theme={vscodeLight}
          extensions={customExtensions}
          onChange={() => {}} // Read-only in simulation
          onUpdate={(viewUpdate) => {
            // Store the editor view reference for highlighting
            if (viewUpdate.view !== editorViewRef.current) {
              editorViewRef.current = viewUpdate.view;
            }
          }}
          readOnly={true} // Always read-only in simulation
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: false,
            highlightSpecialChars: true,
            history: true,
            foldGutter: true,
            drawSelection: true,
            dropCursor: true,
            allowMultipleSelections: true,
            indentOnInput: true,
            syntaxHighlighting: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: true,
            rectangularSelection: true,
            crosshairCursor: true,
            highlightActiveLine: false,
            highlightSelectionMatches: true,
            closeBracketsKeymap: true,
            defaultKeymap: true,
            searchKeymap: true,
            historyKeymap: true,
            foldKeymap: true,
            completionKeymap: true,
            lintKeymap: true,
          }}
        />
      </div>
    </>
  );
}