import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Bot } from 'lucide-react';
import api from '../lib/api';

interface Message {
  role: 'user' | 'bot';
  content: string;
}

const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      loadHistory();
    }
  }, [isOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadHistory = async () => {
    try {
      const { data } = await api.get('/chat/history');
      if (data.data?.length) {
        setMessages(data.data.map((m: any) => ({ role: m.role, content: m.content })));
      } else {
        setMessages([{ role: 'bot', content: 'Namaste! I am CDGI Sahayak. How can I help you today?' }]);
      }
    } catch {
      setMessages([{ role: 'bot', content: 'Namaste! I am CDGI Sahayak. How can I help you today?' }]);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const { data } = await api.post('/chat', { message: userMsg });
      setMessages((prev) => [...prev, { role: 'bot', content: data.data.response }]);
    } catch {
      try {
        const res = await fetch('/api/chatbot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: userMsg }),
        });
        const data = await res.json();
        if (data?.success && data?.data?.response) {
          setMessages((prev) => [...prev, { role: 'bot', content: data.data.response }]);
        } else {
          setMessages((prev) => [...prev, { role: 'bot', content: 'Sorry, something went wrong. Please try again.' }]);
        }
      } catch {
        setMessages((prev) => [...prev, { role: 'bot', content: 'Sorry, something went wrong. Please try again.' }]);
      }
    }
    setLoading(false);
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-[70] w-14 h-14 rounded-full gradient-primary shadow-lg shadow-blue-500/25 flex items-center justify-center text-white hover:scale-110 transition-transform"
        title="Open CDGI Sahayak chatbot"
        aria-label="Open CDGI Sahayak chatbot"
      >
        {isOpen ? <X size={22} /> : <MessageSquare size={22} />}
      </button>

      {!isOpen && (
        <div className="fixed bottom-10 right-24 z-[70] bg-[var(--color-card)] border border-[var(--color-border)] rounded-full px-3 py-1.5 text-xs font-semibold shadow-md">
          CDGI Sahayak
        </div>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-[70] w-80 sm:w-96 h-[28rem] glass-card flex flex-col shadow-2xl animate-scale-in">
          {/* Header */}
          <div className="gradient-primary rounded-t-2xl px-4 py-3 flex items-center gap-3">
            <Bot size={24} className="text-white" />
            <div>
              <h3 className="text-white font-semibold text-sm">CDGI Sahayak</h3>
              <p className="text-blue-100 text-xs">Your No-Dues Assistant</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm whitespace-pre-line ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-sm'
                      : 'bg-gray-100 dark:bg-gray-800 text-[var(--color-text)] rounded-tl-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-2xl rounded-tl-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce typing-dot-1" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce typing-dot-2" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce typing-dot-3" />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-[var(--color-border)]">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="input-field !py-2 text-sm flex-1"
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="p-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                title="Send message"
                aria-label="Send message"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWidget;
