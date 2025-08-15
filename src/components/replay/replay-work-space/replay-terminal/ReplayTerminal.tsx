'use client'

import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Play } from "lucide-react"

import { useSimulation } from "@/lib/providers/replay-provider/ReplayProvider"

export const SimulationTerminal = () => {
  const { 
    testResultsUpToCurrentTime, 
    codeErrorsUpToCurrentTime,
    activeTaskAtCurrentTime,
    lessonStructure,
  } = useSimulation()

  // Get current task info
  const currentTask = lessonStructure?.tasks?.[activeTaskAtCurrentTime || 0]
  const activeMethodId = currentTask?.method_name

  // Check if current task is a visualization task
  const isVisualizationTask = activeMethodId === 'dfs_visualization' || 
                             activeMethodId === 'hash_visualization' || 
                             activeMethodId === 'tree_visualization'

  // Generate terminal output based on timeline-filtered data
  const terminalOutput = useMemo(() => {
    // Clear output when switching to visualization tasks or when no output exists
    if (isVisualizationTask || (testResultsUpToCurrentTime.length === 0 && codeErrorsUpToCurrentTime.length === 0)) {
      return ""
    }

    let output = ""
    
    // Combine and sort all events by timestamp
    const allEvents: Array<{
      type: 'error' | 'test'
      timestamp: string
      data: any
    }> = []

    // Add code errors
    codeErrorsUpToCurrentTime.forEach(error => {
      allEvents.push({
        type: 'error',
        timestamp: error.created_at,
        data: error
      })
    })

    // Add test results
    testResultsUpToCurrentTime.forEach(test => {
      allEvents.push({
        type: 'test',
        timestamp: test.created_at,
        data: test
      })
    })

    // Sort events chronologically
    const eventsToShow = allEvents.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )

    // Process events in chronological order (only events that have "happened")
    eventsToShow.forEach((event, index) => {
      if (index > 0) output += "\n\n"

      if (event.type === 'error') {
        // Show code errors
        output += "❌ Compilation Error:\n"
        output += event.data.error_message || "Unknown compilation error"
      } else if (event.type === 'test') {
        // Show test results
        const test = event.data
        if (test.passed) {
          output += "🎉 Correct!\n"
          if (test.test_name) {
            output += `Test: ${test.test_name}\n`
          }
          if (test.feedback) {
            output += test.feedback
          }
          output += "\n✅ All tests passed!"
        } else {
          output += "❌ Incorrect\n"
          if (test.test_name) {
            output += `Test: ${test.test_name}\n`
          }
          if (test.feedback) {
            output += test.feedback
          }
        }
      }
    })

    return output
  }, [testResultsUpToCurrentTime, codeErrorsUpToCurrentTime, isVisualizationTask])

  // Show if execution is "happening" (for realism during replay)
  const isExecuting = useMemo(() => {
    if (isVisualizationTask || testResultsUpToCurrentTime.length === 0) return false
    
    // Show "Running..." briefly before showing results (simulate execution time)
    const latestTest = testResultsUpToCurrentTime[testResultsUpToCurrentTime.length - 1]
    if (!latestTest) return false

    // This is a simple simulation - in reality you'd calculate if we're in the "execution window"
    return false // For now, just show results immediately
  }, [testResultsUpToCurrentTime, isVisualizationTask])

  return (
    <div className="h-full flex flex-col bg-background border-t">
      {/* Header with Run Tests button and compiler selection*/}
      <div className="flex items-center justify-between p-3 border-b bg-muted/30">
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2 font-medium opacity-75 cursor-not-allowed"
            disabled={true}
            title="Run Tests (disabled in simulation)"
          >
            <Play className="h-4 w-4" />
            {isExecuting ? "Running..." : "Run Tests"}
          </Button>
          
          <Select disabled value="java">
            <SelectTrigger className="w-32 h-8 text-xs opacity-75">
              <SelectValue placeholder="Java" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="java">Java</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Terminal output area*/}
      <div className="flex-1 p-3">
        <Textarea
          value={terminalOutput || "Output will be displayed here..."}
          readOnly
          className="h-full resize-none border-0 bg-transparent font-mono text-sm leading-relaxed focus-visible:ring-0 focus-visible:ring-offset-0"
          placeholder="Output will be displayed here..."
        />
      </div>

      {/* Status bar */}
      <div className="px-3 py-1 border-t bg-muted/20 text-xs text-muted-foreground">
        {isVisualizationTask ? (
          "Visualization task - no terminal output"
        ) : testResultsUpToCurrentTime.length === 0 && codeErrorsUpToCurrentTime.length === 0 ? (
          "No output yet"
        ) : (
          `${testResultsUpToCurrentTime.length} test results, ${codeErrorsUpToCurrentTime.length} errors`
        )}
      </div>
    </div>
  )
}