import React from 'react';
import DarkModeToggle from './DarkModeToggle';

const StickyDarkModeToggle = () => {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <DarkModeToggle />
    </div>
  );
};

export default StickyDarkModeToggle;
