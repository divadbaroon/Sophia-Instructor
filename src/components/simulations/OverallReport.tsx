import { useState, useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, TrendingUp, Users, Plus, X } from "lucide-react";
import { Session } from "@/types";

interface OverallReportProps {
  sessions: Session[];
  currentPrompt?: string;
  onPromptUpdate?: (newPrompt: string) => void;
  currentAgentInfo?: {
    name: string;
    first_message: string;
    voice_id: string;
  };
}

interface PromptSuggestion {
  sectionTitle: string;
  currentSection: string | null;
  updatedSection: string;
  changeType: "add" | "modify" | "replace";
  addedText: string[];
  removedText: string[];
  reason: string;
}

interface ReportData {
  overview: string;
  specificIssues: Array<{
    sessionName: string;
    issue: string;
    criteriaFailed: string;
  }>;
  promptSuggestions: PromptSuggestion[];
}

export function OverallReport({ sessions, currentPrompt, onPromptUpdate, currentAgentInfo }: OverallReportProps) {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Track which simulation run the report was generated for
  const [lastReportSessionIds, setLastReportSessionIds] = useState<string>('');
  // Track processed suggestions for user reference
  const [processedSuggestions, setProcessedSuggestions] = useState<Set<number>>(new Set());
  const [isApplyingUpdate, setIsApplyingUpdate] = useState<number | null>(null);

  // Calculate real metrics from sessions data - memoized to prevent unnecessary recalculations
  const performanceMetrics = useMemo(() => {
    const completedSessions = sessions.filter(session => session.status === "completed");
    const totalSessions = sessions.length;
    
    if (completedSessions.length === 0) {
      return {
        overallSuccessRate: 0,
        totalCriteriaPassed: 0,
        totalCriteriaEvaluated: 0,
        completedSessions: 0,
        totalSessions,
        completedSessionIds: ''
      };
    }

    // Aggregate all evaluation criteria results across sessions
    let totalPassed = 0;
    let totalEvaluated = 0;

    completedSessions.forEach(session => {
      if (session.simulationResult?.analysis?.evaluationCriteriaResults) {
        const results = Object.values(session.simulationResult.analysis.evaluationCriteriaResults);
        totalEvaluated += results.length;
        totalPassed += results.filter(result => result.result === "success").length;
      }
    });

    const overallSuccessRate = totalEvaluated > 0 ? Math.round((totalPassed / totalEvaluated) * 100) : 0;

    // Create a unique identifier for this set of completed sessions
    const completedSessionIds = completedSessions
      .map(s => s.id)
      .sort()
      .join(',');

    return {
      overallSuccessRate,
      totalCriteriaPassed: totalPassed,
      totalCriteriaEvaluated: totalEvaluated,
      completedSessions: completedSessions.length,
      totalSessions,
      completedSessionIds
    };
  }, [sessions]);

  const hasCompletedSessions = performanceMetrics.completedSessions > 0;

  // Generate report from API
  const generateReport = async () => {
    if (!hasCompletedSessions) return;

    setIsGenerating(true);
    setError(null);
    setProcessedSuggestions(new Set()); // Reset processed suggestions

    try {
      console.log('🚀 Generating report for', performanceMetrics.completedSessions, 'sessions');
      
      const response = await fetch('/api/claude/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessions: sessions,
          currentPrompt: currentPrompt
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate report');
      }

      const data = await response.json();
      setReportData(data);
      setLastReportSessionIds(performanceMetrics.completedSessionIds);
      console.log('✅ Report generated successfully');

    } catch (error) {
      console.error('❌ Error generating report:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  // Only auto-generate report when the set of completed sessions actually changes
  useEffect(() => {
    if (hasCompletedSessions && 
        performanceMetrics.completedSessionIds !== lastReportSessionIds && 
        !isGenerating) {
      generateReport();
    }
  }, [performanceMetrics.completedSessionIds, hasCompletedSessions]);

  const getPerformanceColor = (rate: number) => {
    if (rate >= 80) return "text-green-600";
    if (rate >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  // Check if we have a report for the current set of sessions
  const hasCurrentReport = reportData && lastReportSessionIds === performanceMetrics.completedSessionIds;

  // Handle applying section update to the agent prompt
  const handleApplyUpdate = async (suggestion: PromptSuggestion, index: number) => {
    if (!currentPrompt || !onPromptUpdate || !currentAgentInfo) {
      console.error('❌ Cannot apply update: missing required data');
      return;
    }

    setIsApplyingUpdate(index);

    try {
      let updatedPrompt = currentPrompt;

      if (suggestion.changeType === "add") {
        // Add new section at the end
        updatedPrompt = currentPrompt + "\n\n# " + suggestion.sectionTitle + "\n" + suggestion.updatedSection;
      } else if (suggestion.changeType === "modify" || suggestion.changeType === "replace") {
        if (suggestion.currentSection) {
          // Replace the current section with the updated one
          updatedPrompt = currentPrompt.replace(suggestion.currentSection, suggestion.updatedSection);
        } else {
          // If no current section found, append as new section
          updatedPrompt = currentPrompt + "\n\n# " + suggestion.sectionTitle + "\n" + suggestion.updatedSection;
        }
      }

      console.log('🔄 Applying prompt update...');

      // Call the API to update the agent configuration
      const response = await fetch('/api/elevenlabs/update-agent-config', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: currentAgentInfo.name,
          prompt: updatedPrompt,
          first_message: currentAgentInfo.first_message,
          voice_id: currentAgentInfo.voice_id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update agent configuration');
      }

      // Update the local prompt state
      onPromptUpdate(updatedPrompt);
      
      // Mark this suggestion as processed
      setProcessedSuggestions(prev => new Set(prev).add(index));

      console.log('✅ Prompt update applied successfully');

    } catch (error) {
      console.error('❌ Error applying prompt update:', error);
      // Could add error state/toast notification here
    } finally {
      setIsApplyingUpdate(null);
    }
  };

  // Handle dismissing a suggestion
  const handleDismissSuggestion = (index: number) => {
    setProcessedSuggestions(prev => new Set(prev).add(index));
  };

  return (
    <div className="space-y-6">
      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Performance Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Sessions Completed */}
            <div className="p-6 rounded-lg bg-gray-50 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-600">Sessions Completed</span>
                <Users className="w-5 h-5 text-gray-500" />
              </div>
              <div className="text-3xl font-bold text-gray-700">
                {performanceMetrics.completedSessions}/{performanceMetrics.totalSessions}
              </div>
              <div className="text-sm text-gray-500 mt-1">simulation sessions</div>
            </div>

            {/* Overall Success Rate */}
            <div className="p-6 rounded-lg bg-gray-50 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-600">Overall Success Rate</span>
                {hasCompletedSessions ? (
                  <div className={`w-3 h-3 rounded-full ${
                    performanceMetrics.overallSuccessRate >= 80 ? 'bg-green-500' :
                    performanceMetrics.overallSuccessRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></div>
                ) : (
                  <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                )}
              </div>
              {hasCompletedSessions ? (
                <>
                  <div className={`text-3xl font-bold ${getPerformanceColor(performanceMetrics.overallSuccessRate)}`}>
                    {performanceMetrics.overallSuccessRate}%
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {performanceMetrics.totalCriteriaPassed}/{performanceMetrics.totalCriteriaEvaluated} criteria passed
                  </div>
                </>
              ) : (
                <>
                  <div className="text-3xl font-bold text-gray-400">
                    N/A
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Run simulations to populate
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Overview */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">Overview</h4>
              {hasCompletedSessions && !hasCurrentReport && !isGenerating && (
                <Button
                  onClick={generateReport}
                  variant="outline"
                  size="sm"
                >
                  Generate Report
                </Button>
              )}
            </div>
            
            {!hasCompletedSessions ? (
              <p className="text-gray-500 italic">Run simulations to generate analysis</p>
            ) : isGenerating ? (
              <div className="flex items-center gap-2 py-4">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-gray-600">Generating Overview...</span>
              </div>
            ) : error ? (
              <div className="text-red-600 text-sm">
                Error: {error}
                <Button
                  onClick={generateReport}
                  variant="outline"
                  size="sm"
                  className="ml-2"
                >
                  Retry
                </Button>
              </div>
            ) : hasCurrentReport ? (
              <p className="text-gray-700 leading-relaxed">{reportData.overview}</p>
            ) : (
              <p className="text-gray-500 italic">Click &quot;Generate Report&quot; to analyze sessions</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Specific Issues */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Specific Issues Found
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!hasCompletedSessions ? (
            <p className="text-gray-500 italic text-center py-8">
              Run simulations to identify specific issues
            </p>
          ) : isGenerating ? (
            <div className="flex items-center justify-center gap-2 py-8">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-gray-600">Analyzing issues...</span>
            </div>
          ) : error ? (
            <p className="text-red-500 text-center py-8">
              Failed to load issues. Click &quot;Generate Report&quot; above to try again.
            </p>
          ) : hasCurrentReport && reportData.specificIssues && reportData.specificIssues.length > 0 ? (
            <div className="space-y-4">
              {reportData.specificIssues.map((issue, index) => (
                <div key={index} className="border-l-4 border-red-300 pl-4 py-2">
                  <div className="flex items-start justify-between mb-1">
                    <span className="font-medium text-sm text-gray-900">{issue.sessionName}</span>
                    <Badge variant="secondary" className="bg-red-100 text-red-800 text-xs">
                      {issue.criteriaFailed}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{issue.issue}</p>
                </div>
              ))}
            </div>
          ) : hasCurrentReport ? (
            <p className="text-green-600 text-center py-8 font-medium">
              🎉 No issues found! All evaluation criteria passed successfully.
            </p>
          ) : (
            <p className="text-gray-500 text-center py-8">
              Generate a report to see specific issues.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Prompt Section Updates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-blue-500" />
            Prompt Section Updates
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!hasCompletedSessions ? (
            <p className="text-gray-500 italic text-center py-8">
              Run simulations to generate prompt updates
            </p>
          ) : isGenerating ? (
            <div className="flex items-center justify-center gap-2 py-8">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-gray-600">Generating section updates...</span>
            </div>
          ) : error ? (
            <p className="text-red-500 text-center py-8">
              Failed to load suggestions. Click &quot;Generate Report&quot; above to try again.
            </p>
          ) : hasCurrentReport && reportData.promptSuggestions && reportData.promptSuggestions.length > 0 ? (
            <div className="space-y-6">
              {reportData.promptSuggestions.map((suggestion, index) => {
                const isProcessed = processedSuggestions.has(index);
                
                return (
                  <div key={index} className="border border-gray-200 rounded-lg p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900">
                          {suggestion.sectionTitle}
                        </h4>
                        <Badge variant="secondary" className="text-xs">
                          {suggestion.changeType === "add" ? "New Section" : "Update Section"}
                        </Badge>
                        {isProcessed && (
                          <Badge variant="secondary" className="bg-gray-100 text-gray-800 text-xs">
                            Processed
                          </Badge>
                        )}
                      </div>
                      
                      {!isProcessed && (
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleApplyUpdate(suggestion, index)}
                            size="sm"
                            disabled={isApplyingUpdate === index}
                            className="h-7 px-3 bg-green-600 hover:bg-green-700"
                          >
                            {isApplyingUpdate === index ? (
                              <>
                                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin mr-1" />
                                Adding...
                              </>
                            ) : (
                              <>
                                <Plus className="w-3 h-3 mr-1" />
                                Add
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={() => handleDismissSuggestion(index)}
                            variant="outline"
                            size="sm"
                            className="h-7 px-3"
                          >
                            <X className="w-3 h-3 mr-1" />
                            Dismiss
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Current Section (if exists) */}
                    {suggestion.currentSection && suggestion.changeType !== "add" && (
                      <div className="mb-4">
                        <div className="text-xs font-medium text-gray-600 mb-2">CURRENT SECTION:</div>
                        <div className="p-3 bg-gray-50 rounded border border-gray-200">
                          <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                            {suggestion.currentSection}
                          </pre>
                        </div>
                      </div>
                    )}

                    {/* Updated Section */}
                    <div className="mb-4">
                      <div className="text-xs font-medium text-green-700 mb-2">
                        {suggestion.changeType === "add" ? "NEW SECTION:" : "UPDATED SECTION:"}
                      </div>
                      <div className="p-3 bg-green-50 rounded border border-green-200">
                        <pre className="text-sm text-green-800 whitespace-pre-wrap font-mono">
                          {suggestion.updatedSection}
                        </pre>
                      </div>
                    </div>

                    {/* Changes Summary */}
                    {(suggestion.addedText.length > 0 || suggestion.removedText.length > 0) && (
                      <div className="mb-4 space-y-2">
                        {suggestion.addedText.length > 0 && (
                          <div>
                            <div className="text-xs font-medium text-green-700 mb-1">ADDITIONS:</div>
                            <div className="pl-3 border-l-2 border-green-300">
                              {suggestion.addedText.map((added, i) => (
                                <div key={i} className="text-sm text-green-800 bg-green-50 px-2 py-1 rounded mb-1">
                                  + {added}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {suggestion.removedText.length > 0 && (
                          <div>
                            <div className="text-xs font-medium text-red-700 mb-1">REMOVALS:</div>
                            <div className="pl-3 border-l-2 border-red-300">
                              {suggestion.removedText.map((removed, i) => (
                                <div key={i} className="text-sm text-red-800 bg-red-50 px-2 py-1 rounded mb-1 line-through">
                                  - {removed}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Reason */}
                    <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded">
                      <span className="font-medium">Why this helps:</span> {suggestion.reason}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : hasCurrentReport ? (
            <p className="text-green-600 text-center py-8 font-medium">
              🎉 No prompt changes needed! All evaluation criteria passed successfully.
            </p>
          ) : (
            <p className="text-gray-500 text-center py-8">
              Generate a report to see section updates.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}