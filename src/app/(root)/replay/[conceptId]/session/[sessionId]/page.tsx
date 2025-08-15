'use client'

import React from 'react';

import { SimulationWorkspaceLayout } from "@/components/replay/replay-work-space/ReplayWorkSpace"
import { SimulationProgressBar } from "@/components/replay/replay-playback-controller/ReplayPlaybackController"
import { SimulationProvider } from '@/lib/providers/replay-provider/ReplayProvider';

const SimulationPage = () => {
  return (
    <SimulationProvider>
      <div className="relative h-screen">
        {/* Main workspace */}
        <div className="h-full pb-24">
          <SimulationWorkspaceLayout />
        </div>
        
        {/* Progress bar */}
        <SimulationProgressBar />
      </div>
    </SimulationProvider>
  );
};

export default SimulationPage;