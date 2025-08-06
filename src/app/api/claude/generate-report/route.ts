import { NextRequest, NextResponse } from 'next/server';
import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { Session } from '@/types';

const REPORT_SYSTEM_PROMPT = `You are an expert AI education analyst. Your task is to analyze evaluation criteria results from teaching agent simulations and generate a report.

You will receive session data with evaluation criteria results. Generate a report with these sections:

**Overview**: 2-3 sentences analyzing the teaching agent's performance patterns and areas needing improvement.

**Specific Issues**: Extract instances where evaluation criteria FAILED (result !== "success"). For each failure, provide session name, issue description, and criterion name.

**Prompt Suggestions**: Provide complete section updates for the agent prompt to address failures.

IMPORTANT: Return ONLY a valid JSON object with this exact structure:
{
 "overview": "string description of performance",
 "specificIssues": [
   {
     "sessionName": "string",
     "issue": "string", 
     "criteriaFailed": "string"
   }
 ],
 "promptSuggestions": [
   {
     "sectionTitle": "string",
     "currentSection": "string or null",
     "updatedSection": "string",
     "changeType": "add",
     "addedText": ["string"],
     "removedText": ["string"],
     "reason": "string"
   }
 ]
}

If no criteria failed, return empty arrays for specificIssues and promptSuggestions.
Do not include any explanatory text, markdown formatting, or code blocks. Return only the JSON object.`;

export async function POST(req: NextRequest) {
 try {
   const body = await req.json();
   const { sessions, currentPrompt } = body;

   if (!sessions || !Array.isArray(sessions)) {
     return NextResponse.json(
       { error: 'Sessions array is required' },
       { status: 400 }
     );
   }

   if (!currentPrompt) {
     return NextResponse.json(
       { error: 'Current prompt is required' },
       { status: 400 }
     );
   }

   // Filter completed sessions
   const completedSessions = sessions.filter((session: Session) => 
     session.status === "completed" && session.simulationResult
   );

   if (completedSessions.length === 0) {
     return NextResponse.json(
       { error: 'No completed sessions found' },
       { status: 400 }
     );
   }

   // Build the user prompt
   const userPrompt = buildUserPrompt(completedSessions, currentPrompt);

   // Call Claude API
   const result = await generateText({
     model: anthropic('claude-3-5-sonnet-20241022'),
     system: REPORT_SYSTEM_PROMPT,
     prompt: userPrompt,
     temperature: 0.3,
   });

   // Parse response
   let jsonText = result.text.trim();
   
   if (jsonText.startsWith('```json')) {
     jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
   } else if (jsonText.startsWith('```')) {
     jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
   }

   let response;
   try {
     response = JSON.parse(jsonText);
   } catch {
     // Return fallback response structure
     response = {
       overview: "Unable to parse analysis results. Please regenerate the report.",
       specificIssues: [],
       promptSuggestions: []
     };
   }

   return NextResponse.json(response);

 } catch (error) {
   const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
   
   return NextResponse.json(
     { error: 'Failed to generate report', details: errorMessage },
     { status: 500 }
   );
 }
}

function buildUserPrompt(sessions: Session[], currentPrompt: string): string {
 let prompt = `Current Agent Prompt:\n${currentPrompt}\n\n`;
 
 prompt += `Analyze these ${sessions.length} simulation sessions:\n\n`;

 let totalFailures = 0;

 sessions.forEach((session, index) => {
   prompt += `Session ${index + 1}: ${session.studentName}\n`;
   prompt += `Subject: ${session.subject} | Difficulty: ${session.difficulty}\n`;
   prompt += `Description: ${session.description}\n`;

   // Add evaluation results
   if (session.simulationResult?.analysis?.evaluationCriteriaResults) {
     prompt += `Evaluation Results:\n`;
     Object.entries(session.simulationResult.analysis.evaluationCriteriaResults).forEach(([criterionId, result]) => {
       prompt += `- ${result.name || criterionId}: ${result.result}\n`;
       if (result.rationale) {
         prompt += `  ${result.rationale}\n`;
       }
       
       if (result.result !== "success") {
         totalFailures++;
       }
     });
   }
   prompt += `\n`;
 });

 if (totalFailures === 0) {
   prompt += `\nAll criteria passed. Return empty arrays for specificIssues and promptSuggestions.`;
 } else {
   prompt += `\n${totalFailures} criteria failed. Focus analysis on these failures only.`;
 }

 return prompt;
}