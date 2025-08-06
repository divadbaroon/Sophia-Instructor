import { NextResponse } from "next/server";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text, voiceId } = body;

    if (!text) {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 }
      );
    }

    if (!voiceId) {
      return NextResponse.json(
        { error: "Voice ID is required" },
        { status: 400 }
      );
    }

    console.log(`🎵 Generating TTS for: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}" with voice ${voiceId}`);

    const client = new ElevenLabsClient({ 
      apiKey: process.env.ELEVENLABS_API_KEY 
    });

    const audio = await client.textToSpeech.convert(voiceId, {
      text: text,
      modelId: "eleven_multilingual_v2",
      outputFormat: "mp3_44100_128"
    });

    // Convert ReadableStream to buffer
    const reader = audio.getReader();
    const chunks = [];
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }
    
    const audioBuffer = Buffer.concat(chunks);
    
    // Convert to base64
    const base64Audio = audioBuffer.toString('base64');

    console.log(`✅ TTS generated successfully, audio size: ${audioBuffer.length} bytes`);

    return NextResponse.json({ 
      audioData: base64Audio,
      size: audioBuffer.length 
    });

  } catch (error) {
    console.error("TTS generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate TTS", details: error },
      { status: 500 }
    );
  }
}