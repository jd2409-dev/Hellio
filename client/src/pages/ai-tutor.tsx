import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Link } from "wouter";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AITutor() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I'm your AI tutor. I can help you with any subject. What would you like to learn today?",
      timestamp: new Date(),
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", "/api/ai-chat", {
        message,
        history: messages,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      }]);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = () => {
    const message = inputMessage.trim();
    if (!message) return;

    // Add user message immediately
    setMessages(prev => [...prev, {
      role: 'user',
      content: message,
      timestamp: new Date(),
    }]);

    setInputMessage('');
    chatMutation.mutate(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-nexus-black text-white flex flex-col">
      {/* Header */}
      <div className="glass-effect p-4 border-b border-gray-700">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <i className="fas fa-arrow-left mr-2"></i>
                Back to Dashboard
              </Button>
            </Link>
            <h2 className="font-orbitron text-2xl font-bold text-nexus-green">AI Tutor</h2>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-nexus-green rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-400">AI Online</span>
          </div>
        </div>
      </div>
      
      {/* Chat Container */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="container mx-auto max-w-4xl space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex items-start space-x-3 ${message.role === 'user' ? 'justify-end' : ''}`}
            >
              {message.role === 'assistant' && (
                <div className="w-10 h-10 bg-gradient-to-r from-nexus-green to-blue-500 rounded-full flex items-center justify-center">
                  <i className="fas fa-robot text-white"></i>
                </div>
              )}
              <Card className={`max-w-md ${message.role === 'user' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white' : 'glass-effect'}`}>
                <CardContent className="p-4">
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <div className="text-xs opacity-60 mt-2">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </CardContent>
              </Card>
              {message.role === 'user' && (
                <div className="w-10 h-10 bg-gradient-to-r from-nexus-gold to-orange-500 rounded-full flex items-center justify-center">
                  <i className="fas fa-user text-white"></i>
                </div>
              )}
            </div>
          ))}
          
          {chatMutation.isPending && (
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-nexus-green to-blue-500 rounded-full flex items-center justify-center">
                <i className="fas fa-robot text-white"></i>
              </div>
              <Card className="glass-effect">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin w-4 h-4 border-2 border-nexus-green border-t-transparent rounded-full"></div>
                    <span>AI is thinking...</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Input Area */}
      <div className="glass-effect p-4 border-t border-gray-700">
        <div className="container mx-auto max-w-4xl flex space-x-4">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your studies..."
            className="flex-1 bg-nexus-gray border-gray-600 focus:border-nexus-green"
            disabled={chatMutation.isPending}
          />
          <Button
            onClick={handleSendMessage}
            disabled={chatMutation.isPending || !inputMessage.trim()}
            className="bg-nexus-green text-black hover:bg-nexus-gold"
          >
            <i className="fas fa-paper-plane"></i>
          </Button>
        </div>
      </div>
    </div>
  );
}
