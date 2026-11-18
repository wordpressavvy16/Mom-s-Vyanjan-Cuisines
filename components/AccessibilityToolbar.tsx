import React from 'react';

const AccessibilityToolbar: React.FC = () => {
    // In a real app, these would be connected to state management (e.g., context)
    const handleIncreaseFontSize = () => alert('Mock: Increase font size');
    const handleDecreaseFontSize = () => alert('Mock: Decrease font size');
    const handleToggleHighContrast = () => alert('Mock: Toggle high contrast mode');

    return (
        <div className="a11y-toolbar fixed right-5 bottom-24 z-50 flex flex-col gap-2">
            {/* Each button would have state and logic */}
            <button 
                onClick={handleDecreaseFontSize}
                aria-label="Decrease font size"
                className="group relative w-11 h-11 rounded-full border-none bg-light-surface dark:bg-dark-surface shadow-lg cursor-pointer transition-all hover:bg-neutral-200 dark:hover:bg-gray-600"
            >
                A-
                <span className="tooltip absolute right-full top-1/2 -translate-y-1/2 mr-3 bg-gray-800 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap opacity-0 pointer-events-none transition-opacity group-hover:opacity-100
                                 after:content-[''] after:absolute after:left-full after:top-1/2 after:-translate-y-1/2 after:border-4 after:border-transparent after:border-l-gray-800">
                    Decrease Font
                </span>
            </button>
             <button 
                onClick={handleIncreaseFontSize}
                aria-label="Increase font size"
                className="group relative w-11 h-11 rounded-full border-none bg-light-surface dark:bg-dark-surface shadow-lg cursor-pointer transition-all hover:bg-neutral-200 dark:hover:bg-gray-600"
            >
                A+
                <span className="tooltip absolute right-full top-1/2 -translate-y-1/2 mr-3 bg-gray-800 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap opacity-0 pointer-events-none transition-opacity group-hover:opacity-100
                                 after:content-[''] after:absolute after:left-full after:top-1/2 after:-translate-y-1/2 after:border-4 after:border-transparent after:border-l-gray-800">
                    Increase Font
                </span>
            </button>
             <button 
                onClick={handleToggleHighContrast}
                aria-label="Toggle high contrast"
                className="group relative w-11 h-11 rounded-full border-none bg-light-surface dark:bg-dark-surface shadow-lg cursor-pointer transition-all hover:bg-neutral-200 dark:hover:bg-gray-600 flex items-center justify-center"
            >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6 7.924 6 10a4 4 0 004 4c2.076 0 3.73-1.487 3.73-3.5 0-.44-.06-.862-.172-1.254a6.003 6.003 0 011.912 2.706C13.488 12.27 12.27 14 10 14c-2.27 0-3.488-1.73-3.668-3.973z" clipRule="evenodd" />
                </svg>
                <span className="tooltip absolute right-full top-1/2 -translate-y-1/2 mr-3 bg-gray-800 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap opacity-0 pointer-events-none transition-opacity group-hover:opacity-100
                                 after:content-[''] after:absolute after:left-full after:top-1/2 after:-translate-y-1/2 after:border-4 after:border-transparent after:border-l-gray-800">
                    High Contrast
                </span>
            </button>
        </div>
    );
};

export default AccessibilityToolbar;