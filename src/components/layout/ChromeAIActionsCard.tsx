'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Edit3, 
  Languages, 
  FileText, 
  Wand2, 
  MessageSquare, 
  BookOpen, 
  Lightbulb,
  CheckCircle,
  X
} from 'lucide-react';
import React from 'react';
import { Button } from '../ui/button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { cn } from '@/lib/utils';

interface ChromeAIAction {
  id: string;
  icon: React.ElementType;
  label: string;
  description: string;
  action: string;
  color: string;
}

const chromeAIActions: ChromeAIAction[] = [
  {
    id: 'summarize',
    icon: Sparkles,
    label: 'Summarize',
    description: 'Create a concise summary',
    action: 'summarize',
    color: 'bg-blue-500 hover:bg-blue-600'
  },
  {
    id: 'rewrite',
    icon: Edit3,
    label: 'Rewrite',
    description: 'Improve and rephrase text',
    action: 'rewrite',
    color: 'bg-green-500 hover:bg-green-600'
  },
  {
    id: 'translate',
    icon: Languages,
    label: 'Translate',
    description: 'Translate to another language',
    action: 'translate',
    color: 'bg-purple-500 hover:bg-purple-600'
  },
  {
    id: 'proofread',
    icon: FileText,
    label: 'Proofread',
    description: 'Check grammar and spelling',
    action: 'proofread',
    color: 'bg-orange-500 hover:bg-orange-600'
  },
  {
    id: 'explain',
    icon: BookOpen,
    label: 'Explain',
    description: 'Explain complex concepts',
    action: 'explain',
    color: 'bg-indigo-500 hover:bg-indigo-600'
  },
  {
    id: 'enhance',
    icon: Wand2,
    label: 'Enhance',
    description: 'Make text more engaging',
    action: 'enhance',
    color: 'bg-pink-500 hover:bg-pink-600'
  },
  {
    id: 'question',
    icon: MessageSquare,
    label: 'Ask Question',
    description: 'Ask AI about this text',
    action: 'question',
    color: 'bg-teal-500 hover:bg-teal-600'
  },
  {
    id: 'ideas',
    icon: Lightbulb,
    label: 'Generate Ideas',
    description: 'Brainstorm related ideas',
    action: 'ideas',
    color: 'bg-yellow-500 hover:bg-yellow-600'
  }
];

interface ChromeAIActionsCardProps {
  selectedText: string;
  position: { x: number; y: number };
  onAction: (action: string, text: string) => void;
  onClose: () => void;
  isProcessing?: boolean;
  processingAction?: string;
}

export default function ChromeAIActionsCard({
  selectedText,
  position,
  onAction,
  onClose,
  isProcessing = false,
  processingAction
}: ChromeAIActionsCardProps) {
  const handleActionClick = (action: string) => {
    onAction(action, selectedText);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: 20 }}
      className="fixed z-[400] bg-black/95 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl"
      style={{
        left: Math.max(10, Math.min(position.x - 200, window.innerWidth - 420)),
        top: Math.max(10, position.y - 280),
        width: '400px',
        maxHeight: '500px'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-400" />
          <h3 className="text-white font-medium">Chrome AI Actions</h3>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={onClose}
          className="h-8 w-8 p-0 text-gray-400 hover:text-white"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Selected Text Preview */}
      <div className="p-4 border-b border-white/10">
        <div className="text-xs text-gray-400 mb-2">Selected Text:</div>
        <div className="text-sm text-white/80 bg-white/5 rounded-lg p-3 max-h-20 overflow-y-auto">
          {selectedText.length > 150 
            ? `${selectedText.substring(0, 150)}...` 
            : selectedText
          }
        </div>
      </div>

      {/* Actions Grid */}
      <div className="p-4 max-h-80 overflow-y-auto">
        <div className="grid grid-cols-2 gap-3">
          {chromeAIActions.map((action) => (
            <motion.button
              key={action.id}
              onClick={() => handleActionClick(action.action)}
              disabled={isProcessing}
              className={cn(
                "relative p-3 rounded-xl text-left transition-all duration-200",
                "border border-white/10 hover:border-white/20",
                "bg-white/5 hover:bg-white/10",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                isProcessing && processingAction === action.action && "ring-2 ring-blue-400"
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "p-2 rounded-lg text-white flex-shrink-0",
                  action.color
                )}>
                  {isProcessing && processingAction === action.action ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <action.icon className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-white mb-1">
                    {action.label}
                  </div>
                  <div className="text-xs text-gray-400 leading-tight">
                    {action.description}
                  </div>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Chrome AI Powered
          </div>
          <div>
            {selectedText.length} characters selected
          </div>
        </div>
      </div>
    </motion.div>
  );
}