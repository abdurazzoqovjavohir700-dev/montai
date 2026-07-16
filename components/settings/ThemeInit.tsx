'use client';

import { useEffect } from 'react';
import { loadThemePrefs, applyThemePrefs } from './ThemeSystem';

export default function ThemeInit() {
  useEffect(() => {
    applyThemePrefs(loadThemePrefs());
  }, []);
  return null;
}
