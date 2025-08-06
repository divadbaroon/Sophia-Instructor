import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { enrollInClass } from '@/lib/actions/class-actions'
import { redirect } from 'next/navigation'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const classCode = searchParams.get('classCode')
  const next = searchParams.get('next') ?? '/'

  if (token_hash && type) {
    const supabase = await createClient()

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    
    if (!error) {
      // If there's a class code, enroll the user in the class
      if (classCode) {
        try {
          const result = await enrollInClass(classCode)
          if (result.success) {
            // Redirect to concepts page after successful enrollment
            redirect('/concepts')
          } else {
            // Enrollment failed, redirect with error
            redirect(`/invitation/${classCode}?message=${encodeURIComponent(result.error || 'Failed to enroll in class')}`)
          }
        } catch (error) {
          console.log(error)
          // Enrollment error, redirect to home
          redirect(`/`)
        }
      } else {
        // No class code, redirect to normal next page
        redirect(next)
      }
    }
  }

  // If there's a class code but verification failed, redirect back to invitation
  if (classCode) {
    redirect(`/invitation/${classCode}?message=${encodeURIComponent('Email verification failed. Please try again.')}`)
  }

  // redirect the user to the home page
  redirect('/')
}