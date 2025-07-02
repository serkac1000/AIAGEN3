import React, { useState, useEffect } from "react";
import { Info, CheckCircle, AlertCircle, AlertTriangle, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface StatusMessage {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
  timestamp: Date;
}

// Helper function to generate unique IDs
let messageIdCounter = 0;
const generateUniqueId = () => {
  return `status-${Date.now()}-${++messageIdCounter}`;
};

interface StatusPanelProps {
  messages: StatusMessage[];
  onClear: () => void;
}

export function StatusPanel({ messages, onClear }: StatusPanelProps) {
  const [progress, setProgress] = useState(0);
  const [showProgress, setShowProgress] = useState(false);

  // Simulate progress when generation messages are present
  useEffect(() => {
    const generationMessages = messages.filter(m => 
      m.message.includes('generation') || 
      m.message.includes('Generating') ||
      m.message.includes('Processing') ||
      m.message.includes('Creating')
    );

    if (generationMessages.length > 0 && !messages.some(m => m.type === 'success' && m.message.includes('generated successfully'))) {
      setShowProgress(true);
      setProgress(0);

      const interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + Math.random() * 15;
          if (newProgress >= 95) {
            clearInterval(interval);
            return 95; // Don't complete until actually done
          }
          return newProgress;
        });
      }, 200);

      return () => clearInterval(interval);
    } else if (messages.some(m => m.type === 'success' && m.message.includes('generated successfully'))) {
      setProgress(100);
      setTimeout(() => setShowProgress(false), 3000);
    }
  }, [messages]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getMessageStyle = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  if (messages.length === 0) return null;

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Info className="text-primary w-4 h-4" />
            </div>
            <span>Status</span>
          </div>
          <Button variant="ghost" size="sm" onClick={onClear}>
            <X className="w-4 h-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="max-h-64 overflow-y-auto space-y-2">
          {messages.map((message, index) => (
            <div
              key={`${message.timestamp}-${index}`}
              className={`flex items-center space-x-3 p-3 rounded-lg border ${getMessageStyle(message.type)}`}
            >
              {getIcon(message.type)}
              <span className="text-sm flex-1">{message.message}</span>
              <span className="text-xs text-gray-500">
                {message.timestamp.toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>

        {showProgress && (
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Processing...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}