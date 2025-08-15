import { useState, useEffect } from 'react';


import { getCodingTasksForLesson } from '@/lib/actions/coding-tasks-actions';

import { UseSessionDataReturn } from './types'
import { TaskData } from '@/types';

export const useSessionData = (lessonId: string): UseSessionDataReturn => {
  const [sessionData, setSessionData] = useState<TaskData | null>(null);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);

  // Load coding tasks 
  useEffect(() => {
    const loadCodingTasks = async () => {
      if (!lessonId) {
        setIsLoadingTasks(false);
        return;
      }
      
      setIsLoadingTasks(true);
      
      try {
        const result = await getCodingTasksForLesson(lessonId);
        
        if (result.data) {
          const taskData: TaskData = {
            tasks: result.data.tasks,
            methodTemplates: result.data.methodTemplates,
            testCases: result.data.testCases,
            conceptMappings: result.data.conceptMappings,
            system: result.data.system
          };
          
          setSessionData(taskData);
          console.log('✅ Session data loaded successfully');
        } else {
          console.error('Failed to load coding tasks:', result.error);
          setSessionData(null);
        }
      } catch (error) {
        console.error('Error loading coding tasks:', error);
        setSessionData(null);
      } finally {
        setIsLoadingTasks(false);
      }
    };

    loadCodingTasks();
  }, [lessonId]);

  return { sessionData, isLoadingTasks };
};