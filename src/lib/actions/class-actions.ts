'use server'

import { createClient } from '@/utils/supabase/server'

export async function getUserClasses() {
  const supabase = await createClient()
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    return { data: null, error: 'User not authenticated' }
  }

  // Get classes the user is enrolled in
  const { data: enrollments, error } = await supabase
    .from('class_enrollments')
    .select(`
      class_id,
      classes (
        id,
        class_code,
        name,
        created_at
      )
    `)
    .eq('user_id', user.id)

  if (error) {
    return { data: null, error: error.message }
  }

  // Extract the classes from the enrollments
  const classes = enrollments?.map(enrollment => enrollment.classes).filter(Boolean) || []
  
  return { data: classes, error: null }
}

export async function enrollInClass(classCode: string) {
  const supabase = await createClient()

  console.log('Looking for class code:', classCode)

  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    return { success: false, error: 'User not authenticated' }
  }

  try {
    // First, find the class by class_code
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('id, name, class_code')
      .eq('class_code', classCode)
      .single()

    if (classError || !classData) {
      return { success: false, error: 'Class not found. Please check the class code.' }
    }

    // Check if user is already enrolled
    const { data: existingEnrollment } = await supabase
      .from('class_enrollments')
      .select('id')
      .eq('user_id', user.id)
      .eq('class_id', classData.id)
      .single()

    if (existingEnrollment) {
      return { 
        success: true, 
        message: 'Already enrolled in this class',
        classData: classData 
      }
    }

    // Enroll the user in the class
    const { error: enrollError } = await supabase
      .from('class_enrollments')
      .insert({
        user_id: user.id,
        class_id: classData.id
      })

    if (enrollError) {
      return { success: false, error: 'Failed to enroll in class' }
    }

    return { 
      success: true, 
      message: `Successfully enrolled in ${classData.name}!`,
      classData: classData 
    }

  } catch (error) {
    console.error('Enrollment error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}