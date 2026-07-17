import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';

interface Message {
  role: 'user' | 'model';
  content: string;
}

export default function AiChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      content: 'Namaste Kisan Bhai! 🙏 Main hoon aapka agricultural AI advisor, **Krishi Mitra**. Fasal (crop) chunnne, mitti (soil) ke upchar, ya kheti ki machinery se juda koi bhi sawal poochein. Main aapki madad ke liye taiyar hoon!'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = { role: 'user', content: text };
    const updatedMessages = [...messages, userMsg];
    
    setMessages(updatedMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      // Call backend AI API
      const res = await api.chatWithAi(updatedMessages);
      setMessages((prev) => [...prev, { role: 'model', content: res.reply }]);
    } catch (e: any) {
      console.error(e);
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          content: 'Maafi chahta hoon Kisan Bhai, system me kuch connectivity issues hain. Kripya thodi der baad dobara koshish karein.'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestionChips = [
    'Cotton crop ke liye kaun sa tool best hai?',
    'Tillage machines under ₹1,000/day?',
    'Mera tractor 50 HP ka hai, rotavator batayein.',
    'Black soil me sowing ke liye kya chahiye?'
  ];

  return (
    <div className="fixed bottom-24 right-6 z-[90] flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className="w-[360px] sm:w-[400px] h-[520px] max-h-[calc(100vh-240px)] bg-white rounded-3xl border border-outline-variant/30 shadow-2xl flex flex-col overflow-hidden mb-4 animate-scale-in origin-bottom-right">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-primary-container p-4 flex items-center justify-between text-white shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
                <span className="material-symbols-outlined text-white text-2xl font-bold">smart_toy</span>
              </div>
              <div className="text-left">
                <h4 className="font-extrabold text-sm tracking-tight text-white">Krishi Mitra AI</h4>
                <p className="text-[10px] font-bold text-white/80 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  Online Expert Agronomist
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center text-white cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-slate-50 scrollbar-thin scrollbar-thumb-outline-variant/20 scrollbar-track-transparent">
            {messages.map((msg, index) => {
              const isModel = msg.role === 'model';
              return (
                <div
                  key={index}
                  className={`flex ${isModel ? 'justify-start' : 'justify-end'} items-end gap-2`}
                >
                  {isModel && (
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-[14px] font-bold">smart_toy</span>
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-xs font-semibold leading-relaxed shadow-sm text-left ${
                      isModel
                        ? 'bg-white text-on-surface border border-outline-variant/20 rounded-bl-none'
                        : 'bg-primary text-white rounded-br-none'
                    }`}
                  >
                    {/* Render basic formatting for bold text */}
                    {msg.content.split('\n').map((line, i) => (
                      <p key={i} className={i > 0 ? 'mt-1.5' : ''}>
                        {line.split('**').map((part, pi) => 
                          pi % 2 === 1 ? <strong key={pi} className="font-extrabold text-primary-dark">{part}</strong> : part
                        )}
                      </p>
                    ))}
                  </div>
                </div>
              );
            })}
            
            {isLoading && (
              <div className="flex justify-start items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[14px] font-bold">smart_toy</span>
                </div>
                <div className="bg-white rounded-2xl rounded-bl-none px-4 py-3 border border-outline-variant/20 flex gap-1 shadow-sm">
                  <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce delay-75" />
                  <span className="w-1.5 h-1.5 bg-primary/70 rounded-full animate-bounce delay-150" />
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce delay-300" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions Chips */}
          <div className="p-3 bg-white border-t border-outline-variant/10">
            <p className="text-[10px] font-bold text-on-surface-variant/80 uppercase tracking-wider text-left mb-2 px-1">
              Ask suggestions:
            </p>
            <div className="flex overflow-x-auto gap-2 pb-1.5 scrollbar-thin scrollbar-thumb-outline-variant/10 -mx-1 px-1">
              {suggestionChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(chip)}
                  disabled={isLoading}
                  className="bg-slate-50 hover:bg-primary-container hover:text-on-primary-container text-on-surface-variant font-bold text-[10px] px-3 py-1.5 rounded-full border border-outline-variant/20 flex-shrink-0 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputValue);
            }}
            className="p-3 bg-white border-t border-outline-variant/20 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask Krishi Mitra... (Hindi/English)"
              disabled={isLoading}
              className="flex-grow bg-slate-100 font-semibold text-xs px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 border border-transparent focus:border-primary/30 transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="w-9 h-9 rounded-xl bg-primary hover:bg-primary/95 text-white flex items-center justify-center transition-all disabled:opacity-40 disabled:scale-100 active:scale-90 cursor-pointer flex-shrink-0"
            >
              <span className="material-symbols-outlined text-lg">send</span>
            </button>
          </form>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-gradient-to-tr from-primary to-emerald-600 hover:from-primary/95 hover:to-emerald-500 text-white flex items-center justify-center shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer relative group"
      >
        <span className="material-symbols-outlined text-2xl font-bold animate-pulse">chat_spark</span>
        
        {/* Hover label */}
        {!isOpen && (
          <span className="absolute right-16 bg-on-surface text-surface text-[10px] font-bold px-3 py-1.5 rounded-xl shadow-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 whitespace-nowrap">
            Chat with Krishi Mitra AI
          </span>
        )}
      </button>
    </div>
  );
}
