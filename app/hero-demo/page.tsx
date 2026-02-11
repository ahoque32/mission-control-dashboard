'use client';

import { useState } from 'react';
import HeroSection from '@/components/ui/glassmorphism-trust-hero';
import MissionControlHero from '@/components/ui/mission-control-hero';

export default function HeroDemo() {
  const [showMissionControl, setShowMissionControl] = useState(false);

  return (
    <div className="w-full min-h-screen overflow-y-auto bg-zinc-950">
      {/* Toggle Button */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setShowMissionControl(!showMissionControl)}
          className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white backdrop-blur-md transition-colors hover:bg-white/20"
        >
          {showMissionControl ? 'Show Original' : 'Show Mission Control'}
        </button>
      </div>
      
      {/* Hero Sections */}
      {showMissionControl ? <MissionControlHero /> : <HeroSection />}
    </div>
  );
}