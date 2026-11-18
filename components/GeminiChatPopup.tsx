

import React, { useState, useRef, useEffect } from 'react';
import { Meal, ChatMessage } from '../types';
import { generateChatResponse } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';

interface GeminiChatPopupProps {
  meal: Meal;
  isOpen: boolean;
  onClose: () => void;
}

const GeminiChatPopup: React.FC<GeminiChatPopupProps> = ({ meal, isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setMessages([
        { id: 'system-1', sender: 'system', text: `Ask me anything about ${meal.name}! (e.g., "Is this spicy?", "What pairs well with this?")`, timestamp: new Date() }
      ]);
      setUserInput('');
      setError(null);
    }
  }, [isOpen, meal]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;

    const newUserMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: userInput,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newUserMessage]);
    setUserInput('');
    setIsLoading(true);
    setError(null);

    try {
      const aiResponseText = await generateChatResponse(meal, userInput);
      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: aiResponseText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (err: any) {
      console.error("Gemini API error:", err);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        sender: 'system',
        text: `Sorry, I couldn't get a response. ${err.message || 'Please try again later.'}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      setError(err.message || 'Failed to get response.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 w-full max-w-md bg-light-surface dark:bg-dark-surface rounded-lg shadow-xl border border-neutral-300 dark:border-gray-700 z-[100]">
      <div className="flex justify-between items-center p-3 border-b border-neutral-300 dark:border-gray-700 bg-light-background dark:bg-dark-background rounded-t-lg">
        <h3 className="text-md font-semibold text-light-text dark:text-dark-text">AI Assistant for {meal.name}</h3>
        <button onClick={onClose} className="text-light-text dark:text-dark-text hover:text-primary">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="h-64 overflow-y-auto p-4 space-y-3">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-2.5 rounded-xl text-sm ${
              msg.sender === 'user' ? 'bg-secondary text-white' : 
              msg.sender === 'ai' ? 'bg-neutral-200 dark:bg-dark-background text-light-text dark:text-dark-text' : 'bg-neutral-200/50 dark:bg-dark-background/50 text-light-text dark:text-dark-text text-center w-full'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
             <div className="max-w-[70%] p-2 rounded-lg bg-neutral-200 dark:bg-dark-background text-light-text dark:text-dark-text">
                <LoadingSpinner size="sm" color="text-secondary" text="Thinking..."/>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      {error && <p className="text-red-500 text-xs px-4 pb-2">{error}</p>}
      <div className="p-3 border-t border-neutral-300 dark:border-gray-700 flex">
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
          placeholder="Type your question..."
          className="flex-grow border border-neutral-300 rounded-l-md p-2 text-sm focus:ring-2 focus:ring-accent-yellow focus:border-secondary outline-none dark:bg-dark-background dark:border-gray-600 dark:text-dark-text"
          disabled={isLoading}
          inputMode="search"
        />
        <button
          onClick={handleSendMessage}
          disabled={isLoading || !userInput.trim()}
          className="bg-secondary hover:bg-secondary-dark text-white p-2 rounded-r-md disabled:bg-gray-400 text-sm group"
        >
          {isLoading ? 
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            : 
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 transition-transform duration-300 group-hover:scale-125 group-hover:-rotate-12">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          }
        </button>
      </div>
    </div>
  );
};

export default GeminiChatPopup;