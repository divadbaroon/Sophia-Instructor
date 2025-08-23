import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params
    
    console.log(`🎵 Simple fetch for conversation: ${conversationId}`)
    
    const apiKey = process.env.ELEVENLABS_API_KEY
    if (!apiKey) {
      console.error('❌ No API key')
      return NextResponse.json({ error: 'No API key' }, { status: 500 })
    }
    
    const url = `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}/audio`
    const options = {
      method: 'GET',
      headers: {
        'xi-api-key': apiKey
      }
    }
    
    console.log(`🎵 Calling: ${url}`)
    
    const response = await fetch(url, options)
    
    console.log(`🎵 Response: ${response.status} ${response.statusText}`)
    console.log(`🎵 Headers:`, Object.fromEntries(response.headers.entries()))
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ Error: ${response.status} - ${errorText}`)
      return NextResponse.json({ error: `API Error: ${response.status}` }, { status: response.status })
    }
    
    const audioBlob = await response.blob()
    console.log(`✅ Got blob: ${audioBlob.size} bytes, type: ${audioBlob.type}`)
    
    return new NextResponse(audioBlob, {
      status: 200,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'audio/mpeg',
      },
    })
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('💥 Error:', errorMessage)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}