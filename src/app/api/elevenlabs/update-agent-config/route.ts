import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(req: NextRequest) {
  try {
    console.log('💾 Updating agent configuration...');
    
    const body = await req.json();
    const { name, prompt, first_message, voice_id } = body;

    if (!name || !prompt) {
      return NextResponse.json(
        { error: 'Name and prompt are required' },
        { status: 400 }
      );
    }

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

    const updatePayload = {
      name: name,
      conversation_config: {
        agent: {
          first_message: first_message || "",
          prompt: {
            prompt: prompt
          }
        },
        tts: {
          voice_id: voice_id || ""
        }
      }
    };

    console.log('📤 Sending update to ElevenLabs:', {
      agentId,
      nameLength: name.length,
      promptLength: prompt.length,
      hasFirstMessage: !!first_message,
      hasVoiceId: !!voice_id
    });

    const response = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
      method: 'PATCH',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatePayload)
    });

    console.log(`📥 ElevenLabs API Response: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ ElevenLabs API Error: ${response.status} - ${errorText}`);
      return NextResponse.json(
        { error: `Failed to update agent config: ${response.statusText}` },
        { status: response.status }
      );
    }

    const updatedAgentData = await response.json();
    
    console.log('✅ Agent configuration updated successfully:', {
      agentId: updatedAgentData.agent_id,
      name: updatedAgentData.name,
      hasPrompt: !!updatedAgentData.conversation_config?.agent?.prompt?.prompt
    });

    return NextResponse.json(updatedAgentData);

  } catch (error) {
    console.error('❌ Error in update agent config API:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { error: 'Failed to update agent configuration', details: errorMessage },
      { status: 500 }
    );
  }
}