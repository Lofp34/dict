
import React from 'react';

interface IconButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  className?: string;
  disabled?: boolean;
  active?: boolean; 
}

const IconButton: React.FC<IconButtonProps> = ({ onClick, icon, label, className = '', disabled = false, active = false }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      disabled={disabled}
      className={`p-3 rounded-full transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center
        ${active ? 'ring-2 ring-indigo-500 ring-offset-1' : ''}
        ${className}`}
    >
      {icon}
    </button>
  );
};

export default IconButton;
