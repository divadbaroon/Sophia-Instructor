import { NextRequest, NextResponse } from 'next/server';
import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';

const CRITERIA_GENERATION_PROMPT = `You are an expert in educational assessment and AI agent evaluation. Your task is to generate comprehensive evaluation criteria for a teaching/tutoring AI agent based on its prompt and configuration.

You will receive:
1. The AI agent's system prompt
2. The agent's name and first message (if provided)

Generate 4-6 evaluation criteria that would be most relevant for assessing this specific agent's performance. Each criterion should:
- Be specific to the agent's role and teaching approach
- Focus on measurable aspects of conversation quality
- Cover different dimensions of effective teaching/interaction
- Be clear and actionable for evaluation

For each criterion, provide:
- A clear, descriptive name (2-4 words)
- A detailed description that explains what should be evaluated

IMPORTANT: Return ONLY a valid JSON array with this exact structure:
[
 {
   "name": "Teaching Clarity",
   "conversationGoalPrompt": "The agent explains concepts clearly, uses appropriate examples, and ensures the student understands before moving on to new topics."
 },
 {
   "name": "Student Engagement", 
   "conversationGoalPrompt": "The agent actively engages the student through questions, encourages participation, and maintains an interactive dialogue rather than lecturing."
 }
]

Do not include any explanatory text, markdown formatting, or code blocks. Return only the JSON array.`;

export async function POST(req: NextRequest) {
 try {
   const body = await req.json();
   const { agentPrompt, firstMessage } = body;

   if (!agentPrompt || typeof agentPrompt !== 'string') {
     return NextResponse.json(
       { error: 'Agent prompt is required' },
       { status: 400 }
     );
   }

   // Build the user prompt with agent information
   let userPrompt = `Please generate evaluation criteria for this AI teaching agent:\n\n`;
   
   if (firstMessage) {
     userPrompt += `**First Message:** ${firstMessage}\n\n`;
   }
   
   userPrompt += `**System Prompt:**\n${agentPrompt}\n\n`;
   userPrompt += `Based on this agent's configuration, generate 4-6 specific evaluation criteria that would best assess its teaching effectiveness and conversation quality.`;

   // Call Claude API
   const result = await generateText({
     model: anthropic('claude-3-5-sonnet-20241022'),
     system: CRITERIA_GENERATION_PROMPT,
     prompt: userPrompt,
     temperature: 0.3,
   });

   // Parse response
   let jsonText = result.text.trim();
   
   // Remove markdown code blocks if present
   if (jsonText.startsWith('```json')) {
     jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
   } else if (jsonText.startsWith('```')) {
     jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
   }

   let criteria;
   try {
     criteria = JSON.parse(jsonText);
   } catch {
     // Return fallback criteria
     criteria = [
       {
         name: "Teaching Clarity",
         conversationGoalPrompt: "The agent explains concepts clearly and uses appropriate examples."
       },
       {
         name: "Student Engagement",
         conversationGoalPrompt: "The agent actively engages students through questions and dialogue."
       }
     ];
   }

   // Validate the response structure
   if (!Array.isArray(criteria)) {
     throw new Error('Invalid response format: expected array');
   }

   // Add unique IDs to each criterion
   const criteriaWithIds = criteria.map((criterion, index) => ({
     id: `generated_criterion_${Date.now()}_${index}`,
     name: criterion.name || `Criterion ${index + 1}`,
     conversationGoalPrompt: criterion.conversationGoalPrompt || 'No description provided'
   }));

   return NextResponse.json({
     criteria: criteriaWithIds,
     count: criteriaWithIds.length
   });

 } catch (error) {
   const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
   
   return NextResponse.json(
     { error: 'Failed to generate evaluation criteria', details: errorMessage },
     { status: 500 }
   );
 }
}