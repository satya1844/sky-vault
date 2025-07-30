'use client';


import React, { useState, useRef, useEffect } from 'react';
import { Send, Plus, Settings, Search } from 'lucide-react';

const ChatInterface = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'Mike',
      text: "Hi Bryan, our priorities have just changed 😊",
      timestamp: '14 days ago',
      isOwn: false,
      avatar: 'M'
    },
    {
      id: 2,
      sender: 'Bryan',
      text: "No problem, I'm listening for the changes 👍",
      timestamp: '5 days ago',
      isOwn: true,
      avatar: 'B'
    },
    {
      id: 3,
      sender: 'Mike',
      text: "Can you prioritize the task from yesterday ⚠️",
      timestamp: '3 days ago',
      isOwn: false,
      avatar: 'M'
    }
  ]);
  
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  
  // AI Response Configuration - Easy to modify
  const aiResponses = [
    "Thanks for the update! I'll get right on that.",
    "Understood. Let me review the current tasks and reprioritize accordingly.",
    "I've noted the changes. Should I send out an update to the team?",
    "Perfect timing. I was just about to ask about this.",
    "Got it! I'll make sure this gets the attention it needs.",
    "Thanks for the heads up. I'll adjust my schedule.",
    "Absolutely, I'll take care of this right away.",
    "I appreciate the clarification. This helps a lot.",
  ];
  
  const getAIResponse = (userMessage) => {
    // You can add logic here to return specific responses based on user input
    // For now, it randomly selects from the responses array
    const randomIndex = Math.floor(Math.random() * aiResponses.length);
    return aiResponses[randomIndex];
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const userMessage = {
        id: messages.length + 1,
        sender: 'You',
        text: newMessage,
        timestamp: 'now',
        isOwn: true,
        avatar: 'Y'
      };
      
      setMessages(prev => [...prev, userMessage]);
      const currentMessage = newMessage;
      setNewMessage('');
      
      // Show typing indicator briefly
      setIsTyping(true);
      
      // Get AI response and add it after a short delay
      setTimeout(() => {
        setIsTyping(false);
        const aiResponse = {
          id: messages.length + 2,
          sender: 'Mike',
          text: getAIResponse(currentMessage), // Use the AI response function
          timestamp: 'now',
          isOwn: false,
          avatar: 'M'
        };
        setMessages(prev => [...prev, aiResponse]);
      }, 800); // Shorter delay for quicker responses
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-[#1d1d1d] border-b border-white/10">
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-semibold">C</span>
          </div>
          <div>
            <h1 className="text-gray-100 font-medium">Chat</h1>
          </div>
        </div>
       
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex items-end space-x-3 max-w-sm lg:max-w-md ${message.isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white flex-shrink-0 ${
                message.isOwn 
                  ? 'bg-blue-500' 
                  : 'bg-gray-200'
              }`}>
                {message.avatar}
              </div>
              
              {/* Message Content */}
              <div className={`flex flex-col ${message.isOwn ? 'items-end' : 'items-start'}`}>
                <div className={`px-4 py-3 rounded-2xl ${
                  message.isOwn 
                    ? 'bg-blue-500 text-white rounded-br-md' 
                    : 'bg-[#1d1d1d] text-gray-100 rounded-bl-md border border-white/10'
                }`}>
                  <p className="text-sm leading-relaxed">{message.text}</p>
                </div>
                <div className="flex items-center mt-1 px-1">
                  <span className="text-xs text-gray-500">{message.sender}</span>
                  <span className="mx-1 text-gray-600">•</span>
                  <span className="text-xs text-gray-500">{message.timestamp}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex items-end space-x-3 max-w-sm lg:max-w-md">
              <div className="w-8 h-8 bg-[#1d1d1d] rounded-full flex items-center justify-center text-sm font-medium text-white flex-shrink-0">
                M
              </div>
              <div className="flex flex-col items-start">
                <div className="bg-[#1d1d1d] px-4 py-3 rounded-2xl rounded-bl-md border border-gray-700">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
                <div className="flex items-center mt-1 px-1">
                  <span className="text-xs text-gray-500">Mike is typing...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="px-6 py-4 bg-[#1d1d1d] border-t border-white/10">
        <div className="flex items-end space-x-3">
          <button className="p-2 text-gray-400 hover:text-gray-100 hover:bg-gray-700 rounded-lg transition-all duration-200 mb-1">
            <Plus size={20} />
          </button>
          
          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              rows="1"
              className="w-full bg-[#f1f1f1] border border-gray-600 text-gray-100 placeholder-gray-400 rounded-xl px-4 py-3 pr-12 outline-none focus:border-blue-500 focus:bg-gray-600 transition-all duration-200 resize-none"
              style={{
                minHeight: '48px',
                maxHeight: '120px',
              }}
            />
            
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className={`absolute right-2 bottom-2 p-2 rounded-lg transition-all duration-200 ${
                newMessage.trim()
                  ? 'bg-blue-500 text-white hover:bg-blue-600 transform hover:scale-105'
                  : 'text-gray-500 cursor-not-allowed'
              }`}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
        
        {/* Status bar */}
        <div className="flex items-center justify-between mt-3 px-1">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-xs text-gray-500">Online</span>
          </div>
          <span className="text-xs text-gray-500">End-to-end encrypted</span>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;