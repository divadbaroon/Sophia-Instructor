import { NextResponse } from "next/server";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { agentId, simulationSpecification, extraEvaluationCriteria } = body;

    if (!agentId) {
      return NextResponse.json(
        { error: "Agent ID is required" },
        { status: 400 }
      );
    }

    const client = new ElevenLabsClient({ 
      apiKey: process.env.ELEVENLABS_API_KEY 
    });

    const response = await client.conversationalAi.agents.simulateConversation(agentId, {
      simulationSpecification,
      extraEvaluationCriteria
    });

    console.log(JSON.stringify(response, null, 4));


    return NextResponse.json(response);
  } catch (error) {
    console.error("Simulation error:", error);
    return NextResponse.json(
      { error: "Failed to run simulation", details: error },
      { status: 500 }
    );
  }
}