import React, { useState, useEffect, useRef } from 'react';

const LiveOrderCounter: React.FC = () => {
    const [orderCount, setOrderCount] = useState(42);
    const [isUpdating, setIsUpdating] = useState(false);
    const counterRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: 20, y: window.innerHeight - 80 });
    const [isDragging, setIsDragging] = useState(false);
    const [offset, setOffset] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const interval = setInterval(() => {
            setIsUpdating(true);
            setOrderCount(prevCount => prevCount + 1);
            setTimeout(() => setIsUpdating(false), 400); 
        }, Math.random() * 8000 + 4000); 

        return () => clearInterval(interval);
    }, []);

    const handleInteractionStart = (clientX: number, clientY: number) => {
        if (!counterRef.current) return;
        setIsDragging(true);
        const rect = counterRef.current.getBoundingClientRect();
        setOffset({
            x: clientX - rect.left,
            y: clientY - rect.top,
        });
    };
    
    const handleInteractionMove = (clientX: number, clientY: number) => {
        if (!isDragging || !counterRef.current) return;
        const newX = clientX - offset.x;
        const newY = clientY - offset.y;
        
        const maxX = window.innerWidth - counterRef.current.offsetWidth;
        const maxY = window.innerHeight - counterRef.current.offsetHeight;

        setPosition({
            x: Math.max(0, Math.min(newX, maxX)),
            y: Math.max(0, Math.min(newY, maxY)),
        });
    };

    const handleInteractionEnd = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => handleInteractionMove(e.clientX, e.clientY);
        const handleTouchMove = (e: TouchEvent) => {
            e.preventDefault();
            handleInteractionMove(e.touches[0].clientX, e.touches[0].clientY);
        };
        const handleMouseUp = () => handleInteractionEnd();
        const handleTouchEnd = () => handleInteractionEnd();

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            window.addEventListener('touchmove', handleTouchMove, { passive: false });
            window.addEventListener('touchend', handleTouchEnd);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
        };
    }, [isDragging, offset]);

    return (
        <div 
            ref={counterRef}
            style={{ position: 'fixed', left: `${position.x}px`, top: `${position.y}px`, touchAction: 'none' }}
            onMouseDown={(e) => handleInteractionStart(e.clientX, e.clientY)}
            onTouchStart={(e) => handleInteractionStart(e.touches[0].clientX, e.touches[0].clientY)}
            className={`live-orders z-50 cursor-move bg-light-surface/90 dark:bg-dark-surface/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg flex items-center text-sm text-light-text dark:text-dark-text transition-transform duration-300 ${isUpdating ? 'animate-[orderPop_400ms_cubic-bezier(0.68,-0.55,0.265,1.55)]' : ''}`}
        >
            <span className="relative flex h-3 w-3 mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <strong>{orderCount}</strong>
            <span className="ml-1 hidden sm:inline"> tiffins ordered in the last hour!</span>
            <span className="ml-1 sm:hidden"> ordered recently!</span>
        </div>
    );
};

export default LiveOrderCounter;