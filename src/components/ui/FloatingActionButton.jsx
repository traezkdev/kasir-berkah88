import React from 'react';
import { useTheme } from '../ThemeProvider';
import Button from './Button';
import Icon from '../AppIcon';

const FloatingActionButton = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="fixed bottom-4 right-4 z-50 hidden md:block">
      <Button
        variant="outline"
        size="icon"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      >
        <Icon name="Sun" className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Icon name="Moon" className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:-rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    </div>
  );
};

export default FloatingActionButton;
