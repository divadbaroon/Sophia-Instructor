export interface UseSessionUrlReturn {
  sessionId: string;
  lessonId: string;
}

export interface UseSessionDataReturn {
  sessionData: TaskData | null;
  isLoadingTasks: boolean;
}