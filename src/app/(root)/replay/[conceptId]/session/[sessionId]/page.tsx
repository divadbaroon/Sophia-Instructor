'use client'

import React from 'react';

import ReplayWorkspaceLayout from "@/components/replay/replay-work-space/ReplayWorkSpace"
import ReplayProgressBar from "@/components/replay/replay-progress-bar/ReplayProgressBar"
import ReplayProvider from '@/lib/providers/replay-provider/ReplayProvider';

const ReplayPage = () => {
  return (
    <ReplayProvider>
      <div className="relative h-screen">
        <div className="h-full pb-24">
          <ReplayWorkspaceLayout />
        </div>
        
        <ReplayProgressBar />
      </div>
    </ReplayProvider>
  );
};

export default ReplayPage;