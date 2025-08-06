import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔄 Fetching agent configuration...');
    
    const agentId = process.env.NEXT_PUBLIC_TEACHER_AGENT_ID;
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!agentId) {
      return NextResponse.json(
        { error: 'Teacher agent ID not configured' },
        { status: 400 }
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: 'ElevenLabs API key not configured' },
        { status: 400 }
      );
    }

    const response = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
      method: 'GET',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    console.log(`📥 ElevenLabs API Response: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ ElevenLabs API Error: ${response.status} - ${errorText}`);
      return NextResponse.json(
        { error: `Failed to fetch agent config: ${response.statusText}` },
        { status: response.status }
      );
    }

    const agentData = await response.json();
    
    console.log('✅ Agent configuration fetched successfully:', {
      agentId: agentData.agent_id,
      name: agentData.name,
      hasPrompt: !!agentData.conversation_config?.agent?.prompt?.prompt
    });

    return NextResponse.json(agentData);

  } catch (error) {
    console.error('❌ Error in get agent config API:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { error: 'Failed to fetch agent configuration', details: errorMessage },
      { status: 500 }
    );
  }
}