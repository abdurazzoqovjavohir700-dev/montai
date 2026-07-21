'use client';

import { useEffect } from 'react';
import { getPlatform, isCapacitor } from '@/lib/native-bridge';

export default function PlatformProvider() {
  useEffect(() => {
    const platform = getPlatform();
    document.body.setAttribute('data-platform', platform);

    if (isCapacitor()) {
      // Listen for Capacitor keyboard events to adjust layout
      const handleKeyboardShow = () => document.body.classList.add('keyboard-visible');
      const handleKeyboardHide = () => document.body.classList.remove('keyboard-visible');

      window.addEventListener('capacitorKeyboardWillShow', handleKeyboardShow);
      window.addEventListener('capacitorKeyboardWillHide', handleKeyboardHide);
      return () => {
        window.removeEventListener('capacitorKeyboardWillShow', handleKeyboardShow);
        window.removeEventListener('capacitorKeyboardWillHide', handleKeyboardHide);
      };
    }
  }, []);

  return null;
}
