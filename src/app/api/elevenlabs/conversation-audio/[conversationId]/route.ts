import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params
    
    console.log(`🎵 Fetching ElevenLabs audio for conversation: ${conversationId}`)
    
    const apiKey = process.env.ELEVENLABS_API_KEY
    if (!apiKey) {
      console.error('❌ ELEVENLABS_API_KEY not found')
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
    }
    
    // Follow ElevenLabs documentation exactly
    const url = `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}/audio`
    const options = {
      method: 'GET', 
      headers: {
        'xi-api-key': apiKey
      }
    }
    
    const response = await fetch(url, options)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ ElevenLabs API error (${response.status}):`, errorText)
      return NextResponse.json({ error: `ElevenLabs API error: ${response.status}` }, { status: response.status })
    }
    
    // Return the audio blob directly
    const audioBlob = await response.blob()
    console.log(`✅ Audio fetched successfully (${audioBlob.size} bytes)`)
    
    return new NextResponse(audioBlob, {
      status: 200,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'audio/mpeg',
        'Cache-Control': 'public, max-age=3600',
      },
    })
    
  } catch (error) {
    console.error('💥 Error in conversation audio API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}