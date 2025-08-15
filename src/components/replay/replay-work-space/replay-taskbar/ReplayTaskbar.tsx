'use client'

import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ArrowLeft, ArrowRight, Target, CheckCircle, Lock, Play } from "lucide-react"

import { useSimulation } from "@/lib/providers/replay-provider/ReplayProvider"

import { conceptIcons } from "@/lib/constants/conceptIcons"

export const SimulationTaskSidebar = () => {
  const {
    lessonStructure,
    activeTaskAtCurrentTime,
    taskProgressUpToCurrentTime,
    isLoadingTasks
  } = useSimulation()

  // Show loading state
  if (isLoadingTasks || !lessonStructure) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading lesson structure...</p>
        </div>
      </div>
    )
  }

  const currentMethodIndex = activeTaskAtCurrentTime ?? 0
  const currentTask = lessonStructure?.tasks[currentMethodIndex]
  const concepts = lessonStructure?.conceptMappings[currentMethodIndex] || []

  // Check if current task is completed based on timeline data
  const isCurrentTaskCompleted = taskProgressUpToCurrentTime.some(
    progress => progress.task_index === currentMethodIndex && progress.completed
  )

  // Check if current task is a visualization task (exactly like original)
  const getVisualizationAssets = (task: any) => {
    const assetMapping: { [key: string]: { video: string, thumbnail: string } } = {
      'dfs_visualization': {
        video: '/videos/GraphVisualizationSketchDemo.mp4',
        thumbnail: '/videos/GraphVisualizationSketchDemo.png'
      },
      'hash_visualization': {
        video: '/videos/HashTableVisualizationSketchDemo.mp4',
        thumbnail: '/videos/HashTableVisualizationSketchDemoThumbnail.png'
      },
      'tree_visualization': {
        video: '/videos/BinaryTreeSketchDemo.mp4',
        thumbnail: '/videos/BinaryTreeVisualizationSketchDemoThumbnail.png'
      }
    }
    
    // Check if this task is a visualization task based on method_name
    const methodName = task?.methods?.[0]?.method_name
    return assetMapping[methodName] || null
  }

  if (!currentTask) {
    return null
  }

  const visualizationAssets = getVisualizationAssets(currentTask)
  const isVisualizationTask = !!visualizationAssets

  return (
    <>
      <div className="h-screen flex flex-col bg-gradient-to-b from-background to-muted/20 transition-all duration-300 relative">
        {/* Header*/}
        <div className="flex-shrink-0 p-4 pt-12 mt-11 pb-3 border-b bg-background/80 backdrop-blur-sm">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2 flex-1">
              <h2 className="text-xl font-bold text-foreground">{currentTask.title}</h2>
              {isCurrentTaskCompleted && <CheckCircle className="h-5 w-5 text-green-600" />}
            </div>
          </div>

          {/* Concept badges*/}
          <div className="flex flex-wrap items-center gap-2">
            {concepts.map((concept: string) => {
              const conceptInfo = conceptIcons[concept]
              const Icon = conceptInfo?.icon
              return (
                <Badge
                  key={concept}
                  variant="secondary"
                  className={`text-xs font-medium flex items-center gap-1.5 px-3 py-1.5 ${conceptInfo?.className || "bg-primary/10 text-primary hover:bg-primary/20"}`}
                >
                  {Icon && <Icon className="h-3 w-3" />}
                  {concept}
                </Badge>
              )
            })}
          </div>
        </div>

        {/* Scrollable content area*/}
        <div className="flex-1 min-h-0 pb-28">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-6">
              {/* Description*/}
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  Task Description
                </h3>
                <Card className="p-4 bg-muted/30">
                  <p className="text-sm text-foreground leading-relaxed">{currentTask.description}</p>
                </Card>
              </div>

              <Separator />

              {/* Conditional content based on task type*/}
              {isVisualizationTask ? (
                /* Demo Video section for visualization tasks */
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Play className="h-4 w-4 text-primary" />
                    Demo Video
                  </h3>
                  <Card className="p-4 bg-muted/30">
                    <div className="relative aspect-video max-w-md mx-auto rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                      <video
                        className="w-full h-full object-cover"
                        controls
                        poster={visualizationAssets.thumbnail}
                      >
                        <source src={visualizationAssets.video} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      Watch this demo to see how to complete the visualization task
                    </p>
                  </Card>
                </div>
              ) : (
                /* Examples section for non-visualization tasks*/
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">Examples</h3>
                  <div className="space-y-3">
                    {currentTask.examples?.map((example: any, index: number) => (
                      <Card key={index} className="overflow-hidden border-0 shadow-sm bg-card">
                        <div className="bg-muted/50 px-4 py-2 border-b">
                          <h4 className="text-sm font-medium text-foreground">Example {index + 1}</h4>
                        </div>
                        <div className="p-4">
                          <pre className="text-xs bg-muted/30 p-3 rounded-lg font-mono border whitespace-pre-wrap break-words overflow-hidden">
                            <code className="text-foreground block">
                              {Object.entries(example.input).map(([key, value]) => {
                                return typeof value === "string"
                                  ? `Input: ${key} = "${value}"\n`
                                  : `Input: ${key} = ${JSON.stringify(value)}\n`
                              })}
                              <span className="text-green-600 font-medium">Output: {example.output}</span>
                            </code>
                          </pre>
                        </div>
                      </Card>
                    )) || (
                      <Card className="p-4 bg-muted/30">
                        <p className="text-sm text-muted-foreground text-center">No examples available for this task</p>
                      </Card>
                    )}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Navigation*/}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-background/95 backdrop-blur-sm space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Task Progress</span>
              <span>
                {currentMethodIndex + 1} of {lessonStructure?.tasks?.length || 0}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-not-allowed">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={true}
                      className="flex items-center gap-2 transition-all duration-300 pointer-events-none opacity-50"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Previous
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Navigation disabled in simulation mode</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-not-allowed">
                    <Button
                      variant="default"
                      size="sm"
                      disabled={true}
                      className={`flex items-center gap-2 transition-all duration-300 opacity-50 pointer-events-none ${
                        currentMethodIndex === (lessonStructure?.tasks?.length || 0) - 1 && isCurrentTaskCompleted ? "bg-green-600 hover:bg-green-700" : ""
                      }`}
                    >
                      {currentMethodIndex === (lessonStructure?.tasks?.length || 0) - 1 && isCurrentTaskCompleted ? (
                        <>
                          Finished
                          <CheckCircle className="h-4 w-4" />
                        </>
                      ) : (
                        <>
                          Next
                          {!isCurrentTaskCompleted ? (
                            <Lock className="h-4 w-4" />
                          ) : (
                            <ArrowRight className="h-4 w-4" />
                          )}
                        </>
                      )}
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Navigation disabled in simulation mode</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    </>
  )
}