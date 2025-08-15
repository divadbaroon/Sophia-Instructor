"use server"

import { createClient } from '@/utils/supabase/server'

export async function getCodingTasksForLesson(lessonId: string) {
  const supabase = await createClient()
  
  try {
    // Get coding tasks with their examples and test cases
    const { data: tasks, error: tasksError } = await supabase
      .from('coding_tasks')
      .select(`
        *,
        examples:coding_task_examples(*),
        test_cases:coding_task_test_cases(*)
      `)
      .eq('lesson_id', lessonId)
      .order('task_order', { ascending: true })

    if (tasksError) {
      console.error('Error fetching coding tasks:', tasksError)
      return { data: null, error: tasksError.message }
    }

    // Transform to match the current TaskData structure
    const formattedTasks = tasks?.map(task => ({
      id: task.id,        
      title: task.title,
      difficulty: task.difficulty,
      description: task.description,
      method_name: task.method_name,
      examples: task.examples
        ?.sort((a: any, b: any) => a.example_order - b.example_order)
        .map((example: any) => ({
          input: example.input_data,
          output: example.expected_output
        })) || [],
      constraints: [] 
    })) || []

    // Create method templates object
    const methodTemplates: Record<string, string> = {}
    tasks?.forEach(task => {
      if (task.method_name && task.starter_code) {
        methodTemplates[task.method_name] = task.starter_code
      }
    })

    // Create test cases object
    const testCases: Record<string, any[]> = {}
    tasks?.forEach(task => {
      if (task.method_name && task.test_cases) {
        testCases[task.method_name] = task.test_cases
          .sort((a: any, b: any) => a.test_case_order - b.test_case_order)
          .map((testCase: any) => ({
            input: testCase.input_data,
            expected: testCase.expected_output,
            methodId: task.method_name
          }))
      }
    })

    // Create concept mappings
    const conceptMappings: Record<number, string[]> = {}
    tasks?.forEach((task, index) => {
      if (task.concepts) {
        conceptMappings[index] = Array.isArray(task.concepts) ? task.concepts : []
      }
    })

    return {
      data: {
        tasks: formattedTasks,
        methodTemplates,
        testCases,
        conceptMappings,
        system: "SOPHIA"
      },
      error: null
    }
  } catch (error) {
    console.error('Unexpected error fetching coding tasks:', error)
    return { data: null, error: 'Failed to fetch coding tasks' }
  }
}