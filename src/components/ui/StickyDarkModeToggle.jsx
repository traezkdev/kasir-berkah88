import React from 'react';
import DarkModeToggle from './DarkModeToggle';

const StickyDarkModeToggle = () => {
  return (
    <div className="hidden fixed bottom-4 right-4 z-50 bg-background rounded-full shadow-lg">
      <DarkModeToggle className="rounded-full border-none bg-transparent" />
    </div>
  );
};

export default StickyDarkModeToggle;
