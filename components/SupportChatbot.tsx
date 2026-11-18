import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../types';
import { generateSupportChatResponse } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';

const SupportChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const initialMessage: ChatMessage = {
    id: 'system-init',
    sender: 'system',
    text: "Hello! I'm the MoM's Vyanjan support assistant. How can I help you today? (e.g., 'How do I place an order?', 'What are your delivery hours?')",
    timestamp: new Date(),
  };

  useEffect(() => {
    if (isOpen) {
      setMessages([initialMessage]);
      setUserInput('');
      setError(null);
      setTimeout(() => inputRef.current?.focus(), 100); // Focus input when chat opens
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleChat = () => {
    setIsOpen(prev => !prev);
  };

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;

    const newUserMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: userInput,
      timestamp: new Date(),
    };
    
    const currentMessages = [...messages, newUserMessage];
    setMessages(currentMessages);
    setUserInput('');
    setIsLoading(true);
    setError(null);

    try {
      // Pass a limited history to the AI for context (e.g., last 5 messages)
      const historyForAI = currentMessages.slice(-6); // Includes the new user message
      const aiResponseText = await generateSupportChatResponse(userInput, historyForAI);
      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: aiResponseText,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (err: any) {
      console.error("Support Chatbot API error:", err);
      const errorMessageText = err.message === "API_KEY_NOT_CONFIGURED" 
        ? "The AI assistant is currently unavailable due to a configuration issue."
        : "Sorry, I couldn't get a response. Please try again later.";
      
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        sender: 'system',
        text: errorMessageText,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      setError(errorMessageText);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };
  
  return (
    <>
      {/* FAB to open chat */}
      {!isOpen && (
        <button
          onClick={toggleChat}
          className="fixed bottom-6 right-6 bg-secondary hover:bg-secondary-dark text-white p-4 rounded-full shadow-lg z-[90] transition-transform duration-300 hover:scale-110 hover:-rotate-12 focus:outline-none focus:ring-2 focus:ring-secondary-dark focus:ring-offset-2"
          aria-label="Ask MoM's Vyanjan"
          title="Ask MoM's Vyanjan"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
            <path fillRule="evenodd" d="M18.403 5.633A8.919 8.919 0 0012.053 3.012c-4.943 0-8.977 4.023-8.977 8.954 0 1.53.385 2.98.995 4.286L3 21l5.02-1.31a8.9 8.9 0 004.032.999h.007c4.942 0 8.977-4.024 8.977-8.954a8.935 8.935 0 00-2.628-6.347zM12.053 19.56c-1.413 0-2.774-.383-3.92-1.054l-.28-.165-2.933.766.78-2.86-.184-.296a7.561 7.561 0 01-1.19-3.957c0-4.14 3.36-7.49 7.502-7.49a7.503 7.503 0 017.503 7.49c0 4.14-3.36 7.49-7.504 7.49z" clipRule="evenodd"></path>
            <path d="M15.75 13.282c-.234-.118-1.383-.683-1.6-.76s-.368-.118-.523.118c-.156.235-.603.754-.74 1.002s-.273.155-.523.04c-.25-.118-1.097-.404-2.093-1.287-.78-.686-1.304-1.536-1.45-1.8s-.015-.273.103-.385c.117-.118.25-.282.375-.42.124-.132.164-.207.234-.33.07-.123.039-.234 0-.354s-.523-1.26-.71-1.732c-.19-.47-.376-.403-.515-.403h-.45c-.156 0-.406.06-.618.293-.21.234-.816.8-.816 1.932 0 1.134.832 2.23 1.05 2.385.12.156 1.64 2.508 4.067 3.51.554.244.988.385 1.32.486.554.168 1.058.148 1.46.094.437-.066 1.383-.566 1.58-1.104.195-.546.195-1.002.14-1.104s-.2-.155-.436-.273z"></path>
          </svg>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-0 right-0 sm:bottom-4 sm:right-4 w-full sm:w-96 h-[70vh] sm:h-auto sm:max-h-[80vh] bg-light-surface rounded-t-lg sm:rounded-lg shadow-xl border border-gray-300 flex flex-col z-[100]" role="dialog" aria-modal="true" aria-labelledby="support-chat-title">
          <header className="flex justify-between items-center p-3 sm:p-4 border-b border-gray-200 bg-secondary text-white rounded-t-lg">
            <h3 id="support-chat-title" className="text-lg font-semibold">Ask MoM's Vyanjan</h3>
            <button onClick={toggleChat} className="text-white hover:bg-secondary-dark p-1 rounded-full" aria-label="Close support chat">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </header>

          <main className="flex-grow overflow-y-auto p-3 sm:p-4 space-y-3 bg-light-background dark:bg-dark-background min-h-[200px]">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-2.5 rounded-xl text-sm shadow-sm ${
                  msg.sender === 'user' ? 'bg-primary text-white rounded-br-none' : 
                  msg.sender === 'ai' ? 'bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text rounded-bl-none' : 
                  'bg-accent/30 text-light-text text-center w-full py-2 border border-accent rounded-md'
                }`}>
                  {msg.text.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                  <p className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-gray-200' : 'text-light-muted dark:text-dark-muted'} ${msg.sender === 'system' ? 'hidden' : ''}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                 <div className="max-w-[70%] p-2 rounded-lg bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text">
                    <LoadingSpinner size="sm" color="text-secondary" text="Assistant is typing..."/>
                 </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </main>
          
          {error && !isLoading && <p className="text-red-600 text-xs px-4 py-1 bg-red-50 border-t border-red-200">{error}</p>}

          <footer className="p-3 sm:p-4 border-t border-gray-200 bg-light-surface dark:bg-dark-surface">
            <div className="flex items-center space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
                placeholder="Type your message..."
                className="flex-grow border border-neutral-300 dark:border-gray-600 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-accent-yellow focus:border-transparent outline-none transition-shadow bg-light-surface dark:bg-dark-background dark:text-dark-text"
                disabled={isLoading}
                aria-label="Chat input"
                inputMode="search"
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !userInput.trim()}
                className="bg-secondary hover:bg-secondary-dark text-white p-2.5 rounded-lg disabled:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary-dark focus:ring-offset-1 group"
                aria-label="Send message"
              >
                {isLoading ? 
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  : 
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 transition-transform duration-300 group-hover:scale-125 group-hover:rotate-[-15deg]">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                }
              </button>
            </div>
          </footer>
        </div>
      )}
    </>
  );
};

export default SupportChatbot;