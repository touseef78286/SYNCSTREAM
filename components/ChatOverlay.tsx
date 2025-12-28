
import React, { useState, useEffect, useRef } from 'react';
import { Send, CheckCheck, Smile, Sparkles } from 'lucide-react';
import { User, ChatMessage } from '../types';
import { GoogleGenAI } from "@google/genai";

interface Props {
  currentUser: User;
  currentMovie: string;
}

const ChatOverlay: React.FC<Props> = ({ currentUser, currentMovie }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const askGemini = async (query: string) => {
    setIsTyping(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `The user is watching ${currentMovie}. Answer their question: ${query}`,
        config: {
          systemInstruction: "You are the SyncStream Movie Oracle. Be witty, concise, and provide interesting facts about the movie the user is watching. Always try to find real-world context if relevant.",
          tools: [{ googleSearch: {} }]
        }
      });

      // Fix: Compliance with Search Grounding requirements - always extract and display grounding source URLs
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      const sources = groundingChunks?.map((chunk: any) => chunk.web?.uri).filter(Boolean) || [];
      const uniqueSources = [...new Set(sources)];
      const sourceSuffix = uniqueSources.length > 0 
        ? `\n\nSources:\n${uniqueSources.map(url => `• ${url}`).join('\n')}` 
        : "";

      const aiMessage: ChatMessage = {
        id: Date.now().toString(),
        senderId: 'gemini-ai',
        senderName: 'Movie Oracle',
        text: (response.text || "I'm having trouble retrieving details for this movie right now.") + sourceSuffix,
        timestamp: Date.now(),
        isRead: true,
        isAI: true
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (e) {
      console.error(e);
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        senderId: 'gemini-ai',
        senderName: 'Movie Oracle',
        text: "Sorry, I encountered an error while searching for information. Please try again later.",
        timestamp: Date.now(),
        isRead: true,
        isAI: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const text = inputText;
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      senderName: currentUser.name,
      text: text,
      timestamp: Date.now(),
      isRead: false
    };

    setMessages([...messages, newMessage]);
    setInputText('');

    // Check for AI command
    if (text.toLowerCase().includes('/ask')) {
      askGemini(text.replace('/ask', ''));
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40">
        <div>
          <h3 className="font-bold text-sm">Room Chat</h3>
          <p className="text-[10px] text-gray-500">Watching: {currentMovie}</p>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 bg-red-600/10 rounded-full border border-red-600/20">
          <Sparkles size={10} className="text-red-500" />
          <span className="text-[9px] font-bold text-red-500">AI Active</span>
        </div>
      </div>

      <div ref={scrollRef} className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.length === 0 && (
          <div className="text-center py-10 px-6">
            <p className="text-xs text-gray-500 italic">No messages yet. Try typing "/ask who directed this?" to use the AI companion.</p>
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUser.id;
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <span className="text-[9px] text-gray-500 mb-1 px-1">{msg.senderName}</span>
              <div className={`max-w-[85%] p-3 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed ${
                msg.isAI ? 'bg-indigo-900/40 border border-indigo-500/30' : 
                isMe ? 'bg-red-600 rounded-tr-none' : 'bg-white/10 rounded-tl-none'
              }`}>
                {msg.text}
              </div>
              <div className="flex items-center gap-1 mt-1 px-1">
                <span className="text-[8px] text-gray-600">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {isMe && <CheckCheck size={10} className={msg.isRead ? 'text-blue-500' : 'text-gray-500'} />}
              </div>
            </div>
          );
        })}
        {isTyping && (
          <div className="flex items-center gap-2 text-gray-600">
            <div className="flex gap-1">
              <span className="w-1 h-1 bg-gray-500 rounded-full animate-bounce"></span>
              <span className="w-1 h-1 bg-gray-500 rounded-full animate-bounce delay-100"></span>
              <span className="w-1 h-1 bg-gray-500 rounded-full animate-bounce delay-200"></span>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={sendMessage} className="p-4 bg-black/40 border-t border-white/5">
        <div className="relative flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type /ask to use AI..."
            className="flex-grow bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500/40"
          />
          <button 
            disabled={!inputText.trim()}
            className="p-2.5 bg-red-600 rounded-xl disabled:opacity-50 transition-all active:scale-95"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatOverlay;
