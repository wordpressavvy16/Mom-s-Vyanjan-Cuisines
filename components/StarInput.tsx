

import React, { useState } from 'react';

interface StarInputProps {
  count?: number;
  value: number;
  onChange: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  activeColor?: string;
  inactiveColor?: string;
  disabled?: boolean;
}

const StarInput: React.FC<StarInputProps> = ({
  count = 5,
  value,
  onChange,
  size = 'md',
  activeColor = 'text-accent-yellow',
  inactiveColor = 'text-gray-300 dark:text-gray-600',
  disabled = false,
}) => {
  const [hoverValue, setHoverValue] = useState<number | undefined>(undefined);

  const stars = Array(count).fill(0);

  const handleClick = (newValue: number) => {
    if (!disabled) {
      onChange(newValue);
    }
  };

  const handleMouseOver = (newHoverValue: number) => {
    if (!disabled) {
      setHoverValue(newHoverValue);
    }
  };

  const handleMouseLeave = () => {
    if (!disabled) {
      setHoverValue(undefined);
    }
  };

  const sizeClasses = {
    sm: 'w-5 h-5', // Adjusted for better clickability
    md: 'w-7 h-7',
    lg: 'w-9 h-9',
  };

  return (
    <div className="flex items-center space-x-1">
      {stars.map((_, index) => {
        const starValue = index + 1;
        return (
          <svg
            key={index}
            className={`${sizeClasses[size]} ${
              (hoverValue || value) >= starValue ? activeColor : inactiveColor
            } ${!disabled ? 'cursor-pointer transition-colors duration-150' : 'cursor-not-allowed'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
            onClick={() => handleClick(starValue)}
            onMouseOver={() => handleMouseOver(starValue)}
            onMouseLeave={handleMouseLeave}
            aria-label={`Rate ${starValue} out of ${count} stars`}
            role="radio"
            aria-checked={value === starValue}
            tabIndex={disabled ? -1 : 0}
            onKeyDown={(e) => {
                if(!disabled && (e.key === 'Enter' || e.key === ' ')) {
                    handleClick(starValue);
                }
            }}
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        );
      })}
    </div>
  );
};

export default StarInput;