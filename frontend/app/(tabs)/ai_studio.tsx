// ============================================================
// AI STUDIO TAB - ZENITH GRADE SUPER APP (Phase 2)
// Routes to AI Studio Home with Atlas Cloud Integration
// ============================================================

import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function AIStudioScreen() {
  const router = useRouter();

  useEffect(() => {
    // Automatically navigate to AI Studio Home
    router.replace('/(tabs)/ai-studio-home');
  }, []);

  return null;
}
