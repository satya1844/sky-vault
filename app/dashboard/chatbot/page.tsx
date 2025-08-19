'use client';


import React, { useState, useRef, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Send, Plus, FileText, Loader2 } from 'lucide-react';
import axios from 'axios';
import { Button } from '@heroui/button';
import { addToast } from '@heroui/toast';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  meta?: { snippets?: string[] };
}

interface FileOption {
  id: string;
  name: string;
  type: string;
  fileUrl: string;
}

const ChatInterface = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [files, setFiles] = useState<FileOption[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string>('');
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [isOcrActive, setIsOcrActive] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { user } = useUser();
  // Load user's root text files (MVP scope: only text/* types)
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    const loadFiles = async () => {
      try {
        setLoadingFiles(true);
        const res = await axios.get('/api/files?userId=' + encodeURIComponent(user.id));
        if (cancelled) return;
        const eligible = (res.data || []).filter((f: any) => !f.isFolder && (
          f.type?.startsWith('text/') ||
          f.type === 'application/pdf' ||
          f.type === 'application/msword' ||
          f.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ));
        setFiles(eligible);
        if (eligible.length) {
          setSelectedFileId(prev => prev || eligible[0].id);
        }
        
        // Check OCR key status (as a subtle env var debug for admins)
        try {
          const envCheck = await fetch('/api/check-env?key=OCR_SPACE_API_KEY');
          const envData = await envCheck.json();
          console.log('OCR key status:', envData.status);
        } catch (e) {
          console.log('Could not check OCR key status');
        }
      } catch (e) {
        if (!cancelled) console.error('Load files failed', e);
      } finally {
        if (!cancelled) setLoadingFiles(false);
      }
    };
    loadFiles();
    return () => { cancelled = true; };
  }, [user?.id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedFileId || isThinking) return;
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: newMessage.trim(),
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);
    const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));
    setNewMessage('');
    setIsThinking(true);
    setIsOcrActive(false);
    
    // Detect if this might need OCR
    const selectedFile = files.find(f => f.id === selectedFileId);
    if (selectedFile?.type === 'application/pdf') {
      // Add a small delay to show the initial thinking state before setting OCR active
      setTimeout(() => {
        setIsOcrActive(true);
      }, 1500);
    }
    
    try {
      const res = await axios.post('/api/chat/file', { 
        fileId: selectedFileId, 
        messages: history,
        debug: true // Enable debug to get OCR info
      });
      const data = res.data;
      
      // If response mentions OCR, update OCR state
      if (data.answer?.toLowerCase().includes('ocr')) {
        setIsOcrActive(false);
      }
      
      const assistant: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.answer,
        timestamp: Date.now(),
        meta: { snippets: data.snippets }
      };
      setMessages(prev => [...prev, assistant]);
    } catch (e: any) {
      console.error('Chat error', e);
      addToast({
        title: 'Chat Error',
        description: e?.response?.data?.error || 'Failed to get answer',
        color: 'danger'
      });
    } finally {
      setIsThinking(false);
      setIsOcrActive(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="flex items-center justify-between px-6 py-4 bg-[#1d1d1d] border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-gray-100 font-medium">Chat With File</h1>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="bg-[#2a2a2a] border border-white/10 rounded-lg text-sm px-3 py-2 text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[180px]"
            value={selectedFileId}
            onChange={(e) => setSelectedFileId(e.target.value)}
            disabled={loadingFiles || isThinking || !files.length}
          >
            {loadingFiles && <option>Loading...</option>}
            {!loadingFiles && files.length === 0 && <option>No text files</option>}
            {!loadingFiles && files.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
          {!loadingFiles && files.length === 0 && (
            <span className="text-xs text-gray-400">Upload a .txt/.md file first</span>
          )}
          <Button size="sm" variant="flat" disabled={!selectedFileId || isThinking || loadingFiles}
            onClick={() => {
              if (selectedFileId) {
                setMessages([]);
              }
            }}>Reset</Button>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        {messages.map(m => {
          const isUser = m.role === 'user';
          return (
            <div key={m.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex items-end space-x-3 max-w-2xl ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${isUser ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>{isUser ? 'You' : 'AI'}</div>
                <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                  <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${isUser ? 'bg-blue-500 text-white rounded-br-md' : 'bg-[#1d1d1d] text-gray-100 rounded-bl-md border border-white/10'}`}>{m.content}</div>
                  {m.meta?.snippets && m.meta.snippets.length > 0 && (
                    <div className="mt-2 text-xs text-gray-400 space-y-1 bg-[#111] border border-white/10 rounded-md p-2 w-full">
                      <div className="font-medium text-gray-300">Source snippets:</div>
                      {m.meta.snippets.map((s, i) => (
                        <div key={i} className="text-[11px] leading-snug opacity-80">{s}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {isThinking && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> 
              {isOcrActive ? 'Running OCR (this may take a moment)...' : 'Thinking...'}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="px-6 py-4 bg-[#1d1d1d] border-t border-white/10">
        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={selectedFileId ? 'Ask about the selected file...' : 'Select a file first'}
              rows={1}
              disabled={!selectedFileId || isThinking}
              className="w-full bg-[#2a2a2a] border border-white/10 text-gray-100 placeholder-gray-500 rounded-xl px-4 py-3 pr-12 outline-none focus:border-blue-500 focus:bg-[#303030] transition-all duration-200 resize-none disabled:opacity-50"
              style={{ minHeight: '56px', maxHeight: '200px' }}
            />
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || !selectedFileId || isThinking}
              className={`absolute right-2 bottom-2 p-2 rounded-lg transition-all duration-200 ${(!newMessage.trim() || !selectedFileId || isThinking) ? 'text-gray-500 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
            >
              {isThinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between mt-3 px-1 text-xs text-gray-500">
          <span>
            {selectedFileId 
              ? 'Heuristic local Q&A (with OCR for scanned PDFs)' 
              : 'Select a file to start chatting'}
          </span>
          <div className="flex items-center gap-2">
            <span>MVP mode</span>
            <label className="inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={false}
                onChange={() => {
                  addToast({
                    title: 'Debug Mode',
                    description: 'To enable debug mode, manually edit chat request body.',
                    color: 'primary'
                  });
                }}
              />
              <div className="relative w-9 h-5 bg-[#333] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              <span className="ml-1 text-xs text-gray-500">Debug</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;