
import React, { useState, useEffect } from 'react';

interface TypingEffectProps {
  texts: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
  classNames?: string[];
}

const TypingEffect: React.FC<TypingEffectProps> = ({
  texts,
  typingSpeed = 150,
  deletingSpeed = 75,
  pauseDuration = 2000,
  classNames,
}) => {
  const [textIndex, setTextIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    // If paused, do nothing until the pause is over.
    if (isPaused) return;

    const handleTyping = () => {
      const currentText = texts[textIndex];

      if (isDeleting) {
        // Handle deleting
        if (displayedText.length > 0) {
          setDisplayedText(currentText.substring(0, displayedText.length - 1));
        } else {
          // Finished deleting, switch to next text and start typing
          setIsDeleting(false);
          setTextIndex((prevIndex) => (prevIndex + 1) % texts.length);
        }
      } else {
        // Handle typing
        if (displayedText.length < currentText.length) {
          setDisplayedText(currentText.substring(0, displayedText.length + 1));
        } else {
          // Finished typing, start the pause
          setIsPaused(true);
          setTimeout(() => {
            setIsDeleting(true);
            setIsPaused(false);
          }, pauseDuration);
        }
      }
    };

    // Set timeout for the next character change
    const timeout = isDeleting ? deletingSpeed : typingSpeed;
    const timerId = setTimeout(handleTyping, timeout);

    // Cleanup function to clear the timeout
    return () => clearTimeout(timerId);
  }, [displayedText, isDeleting, isPaused, texts, textIndex, typingSpeed, deletingSpeed, pauseDuration]);

  const currentClassName = classNames?.[textIndex] || '';

  return (
    <span className={currentClassName}>
      {displayedText}
      {/* Show cursor only when not paused */}
      {!isPaused && <span className="blinking-cursor" />}
    </span>
  );
};

export default TypingEffect;