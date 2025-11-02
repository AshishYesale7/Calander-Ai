'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Play, 
  Pause, 
  Square, 
  Save, 
  Download, 
  Upload,
  Plus,
  Settings,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Zap,
  Mail,
  Calendar,
  FileText,
  MessageSquare,
  Bot,
  GitBranch,
  Clock,
  Database,
  Globe,
  Smartphone
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkflowNode {
  id: string;
  type: 'trigger' | 'ai-model' | 'mcp-tool' | 'condition' | 'action' | 'data';
  position: { x: number; y: number };
  data: {
    label: string;
    description?: string;
    config: Record<string, any>;
    status?: 'idle' | 'running' | 'success' | 'error';
  };
  inputs: Array<{ id: string; label: string; type: string }>;
  outputs: Array<{ id: string; label: string; type: string }>;
}

interface WorkflowConnection {
  id: string;
  sourceNodeId: string;
  sourceOutputId: string;
  targetNodeId: string;
  targetInputId: string;
}

interface WorkflowCanvasProps {
  workflowId?: string;
  onSave?: (workflow: any) => void;
  onExecute?: (workflow: any) => void;
}

export function WorkflowCanvas({ workflowId, onSave, onExecute }: WorkflowCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [connections, setConnections] = useState<WorkflowConnection[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [draggedNode, setDraggedNode] = useState<WorkflowNode | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showChat, setShowChat] = useState(false);
  const [executionLogs, setExecutionLogs] = useState<Array<{ timestamp: string; message: string; type: 'info' | 'error' | 'success' }>>([]);

  // Predefined node templates
  const nodeTemplates: Record<string, Omit<WorkflowNode, 'id' | 'position'>> = {
    'email-trigger': {
      type: 'trigger',
      data: {
        label: 'When chat message received',
        description: 'Triggers when a new chat message is received',
        config: { interval: '1m' },
        status: 'idle'
      },
      inputs: [],
      outputs: [{ id: 'message', label: 'Message', type: 'string' }]
    },
    'slack-post': {
      type: 'mcp-tool',
      data: {
        label: 'Slack',
        description: 'post message',
        config: { channel: '#general' },
        status: 'idle'
      },
      inputs: [{ id: 'message', label: 'Message', type: 'string' }],
      outputs: [{ id: 'result', label: 'Result', type: 'object' }]
    },
    'ai-agent': {
      type: 'ai-model',
      data: {
        label: 'AI Agent',
        description: 'Tools Agent',
        config: { model: 'gpt-4', temperature: 0.7 },
        status: 'idle'
      },
      inputs: [
        { id: 'chat_model', label: 'Chat Model', type: 'string' },
        { id: 'memory', label: 'Memory', type: 'object' }
      ],
      outputs: [{ id: 'response', label: 'Response', type: 'string' }]
    },
    'postgres-chat': {
      type: 'data',
      data: {
        label: 'Postgres Chat Memory',
        description: 'Deactivated',
        config: { table: 'chat_memory' },
        status: 'idle'
      },
      inputs: [{ id: 'query', label: 'Query', type: 'string' }],
      outputs: [{ id: 'data', label: 'Data', type: 'object' }]
    },
    'vector-store': {
      type: 'data',
      data: {
        label: 'Vector Store Tool',
        description: 'Vector Store',
        config: { collection: 'documents' },
        status: 'idle'
      },
      inputs: [{ id: 'query', label: 'Query', type: 'string' }],
      outputs: [{ id: 'results', label: 'Results', type: 'array' }]
    },
    'qdrant-vector': {
      type: 'data',
      data: {
        label: 'Qdrant Vector Store!',
        description: 'Embeddings',
        config: { collection: 'embeddings' },
        status: 'idle'
      },
      inputs: [{ id: 'embeddings', label: 'Embeddings', type: 'array' }],
      outputs: [{ id: 'stored', label: 'Stored', type: 'boolean' }]
    },
    'openai-embeddings': {
      type: 'ai-model',
      data: {
        label: 'Embeddings OpenAI3',
        description: 'OpenAI',
        config: { model: 'text-embedding-3-small' },
        status: 'idle'
      },
      inputs: [{ id: 'text', label: 'Text', type: 'string' }],
      outputs: [{ id: 'embeddings', label: 'Embeddings', type: 'array' }]
    },
    'openai-chat': {
      type: 'ai-model',
      data: {
        label: 'OpenAI Chat Model1',
        description: 'OpenAI',
        config: { model: 'gpt-4o', temperature: 0.7 },
        status: 'idle'
      },
      inputs: [{ id: 'messages', label: 'Messages', type: 'array' }],
      outputs: [{ id: 'response', label: 'Response', type: 'string' }]
    }
  };

  useEffect(() => {
    // Initialize with sample workflow from Image 1
    const sampleNodes: WorkflowNode[] = [
      {
        id: 'trigger-1',
        ...nodeTemplates['email-trigger'],
        position: { x: 100, y: 200 }
      },
      {
        id: 'slack-1',
        ...nodeTemplates['slack-post'],
        position: { x: 300, y: 100 }
      },
      {
        id: 'ai-agent-1',
        ...nodeTemplates['ai-agent'],
        position: { x: 500, y: 150 }
      },
      {
        id: 'postgres-1',
        ...nodeTemplates['postgres-chat'],
        position: { x: 500, y: 280 }
      },
      {
        id: 'vector-1',
        ...nodeTemplates['vector-store'],
        position: { x: 800, y: 180 }
      },
      {
        id: 'qdrant-1',
        ...nodeTemplates['qdrant-vector'],
        position: { x: 800, y: 320 }
      },
      {
        id: 'embeddings-1',
        ...nodeTemplates['openai-embeddings'],
        position: { x: 650, y: 400 }
      },
      {
        id: 'chat-1',
        ...nodeTemplates['openai-chat'],
        position: { x: 1000, y: 250 }
      }
    ];

    const sampleConnections: WorkflowConnection[] = [
      {
        id: 'conn-1',
        sourceNodeId: 'trigger-1',
        sourceOutputId: 'message',
        targetNodeId: 'slack-1',
        targetInputId: 'message'
      },
      {
        id: 'conn-2',
        sourceNodeId: 'slack-1',
        sourceOutputId: 'result',
        targetNodeId: 'ai-agent-1',
        targetInputId: 'chat_model'
      },
      {
        id: 'conn-3',
        sourceNodeId: 'postgres-1',
        sourceOutputId: 'data',
        targetNodeId: 'ai-agent-1',
        targetInputId: 'memory'
      },
      {
        id: 'conn-4',
        sourceNodeId: 'ai-agent-1',
        sourceOutputId: 'response',
        targetNodeId: 'vector-1',
        targetInputId: 'query'
      },
      {
        id: 'conn-5',
        sourceNodeId: 'embeddings-1',
        sourceOutputId: 'embeddings',
        targetNodeId: 'qdrant-1',
        targetInputId: 'embeddings'
      },
      {
        id: 'conn-6',
        sourceNodeId: 'vector-1',
        sourceOutputId: 'results',
        targetNodeId: 'chat-1',
        targetInputId: 'messages'
      }
    ];

    setNodes(sampleNodes);
    setConnections(sampleConnections);
  }, []);

  const getNodeIcon = (type: string, label: string) => {
    if (label.toLowerCase().includes('slack')) return <MessageSquare className="h-4 w-4" />;
    if (label.toLowerCase().includes('email') || label.toLowerCase().includes('gmail')) return <Mail className="h-4 w-4" />;
    if (label.toLowerCase().includes('calendar')) return <Calendar className="h-4 w-4" />;
    if (label.toLowerCase().includes('ai') || label.toLowerCase().includes('openai') || label.toLowerCase().includes('gpt')) return <Bot className="h-4 w-4" />;
    if (label.toLowerCase().includes('vector') || label.toLowerCase().includes('embeddings')) return <Database className="h-4 w-4" />;
    if (label.toLowerCase().includes('postgres') || label.toLowerCase().includes('database')) return <Database className="h-4 w-4" />;
    if (type === 'trigger') return <Zap className="h-4 w-4" />;
    if (type === 'condition') return <GitBranch className="h-4 w-4" />;
    return <Settings className="h-4 w-4" />;
  };

  const getNodeColor = (type: string, status?: string) => {
    if (status === 'running') return 'border-blue-500 bg-blue-50 dark:bg-blue-950/20';
    if (status === 'success') return 'border-green-500 bg-green-50 dark:bg-green-950/20';
    if (status === 'error') return 'border-red-500 bg-red-50 dark:bg-red-950/20';
    
    switch (type) {
      case 'trigger': return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20';
      case 'ai-model': return 'border-purple-500 bg-purple-50 dark:bg-purple-950/20';
      case 'mcp-tool': return 'border-blue-500 bg-blue-50 dark:bg-blue-950/20';
      case 'condition': return 'border-orange-500 bg-orange-50 dark:bg-orange-950/20';
      case 'action': return 'border-green-500 bg-green-50 dark:bg-green-950/20';
      case 'data': return 'border-gray-500 bg-gray-50 dark:bg-gray-950/20';
      default: return 'border-gray-300 bg-white dark:bg-gray-900';
    }
  };

  const handleNodeDragStart = (node: WorkflowNode, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    });
    setDraggedNode(node);
  };

  const handleNodeDrag = useCallback((event: React.MouseEvent) => {
    if (!draggedNode || !canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const newPosition = {
      x: event.clientX - canvasRect.left - dragOffset.x,
      y: event.clientY - canvasRect.top - dragOffset.y
    };

    setNodes(prev => prev.map(node => 
      node.id === draggedNode.id 
        ? { ...node, position: newPosition }
        : node
    ));
  }, [draggedNode, dragOffset]);

  const handleNodeDragEnd = () => {
    setDraggedNode(null);
  };

  const handleExecuteWorkflow = async () => {
    setIsExecuting(true);
    setExecutionLogs([]);
    
    try {
      // Simulate workflow execution
      const executionSteps = [
        { nodeId: 'trigger-1', message: 'Workflow started', type: 'info' as const },
        { nodeId: 'slack-1', message: 'Slack message posted', type: 'success' as const },
        { nodeId: 'ai-agent-1', message: 'AI processing message', type: 'info' as const },
        { nodeId: 'vector-1', message: 'Vector search completed', type: 'success' as const },
        { nodeId: 'chat-1', message: 'Response generated', type: 'success' as const }
      ];

      for (const step of executionSteps) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Update node status
        setNodes(prev => prev.map(node => 
          node.id === step.nodeId 
            ? { ...node, data: { ...node.data, status: 'running' } }
            : node
        ));

        // Add log
        setExecutionLogs(prev => [...prev, {
          timestamp: new Date().toLocaleTimeString(),
          message: step.message,
          type: step.type
        }]);

        // Update to success after a moment
        setTimeout(() => {
          setNodes(prev => prev.map(node => 
            node.id === step.nodeId 
              ? { ...node, data: { ...node.data, status: 'success' } }
              : node
          ));
        }, 500);
      }

      onExecute?.({ nodes, connections });
    } catch (error) {
      console.error('Workflow execution failed:', error);
      setExecutionLogs(prev => [...prev, {
        timestamp: new Date().toLocaleTimeString(),
        message: 'Workflow execution failed',
        type: 'error'
      }]);
    } finally {
      setIsExecuting(false);
    }
  };

  const renderConnection = (connection: WorkflowConnection) => {
    const sourceNode = nodes.find(n => n.id === connection.sourceNodeId);
    const targetNode = nodes.find(n => n.id === connection.targetNodeId);
    
    if (!sourceNode || !targetNode) return null;

    const sourceX = sourceNode.position.x + 200; // Node width
    const sourceY = sourceNode.position.y + 40; // Node height / 2
    const targetX = targetNode.position.x;
    const targetY = targetNode.position.y + 40;

    const midX = (sourceX + targetX) / 2;

    return (
      <g key={connection.id}>
        <path
          d={`M ${sourceX} ${sourceY} C ${midX} ${sourceY} ${midX} ${targetY} ${targetX} ${targetY}`}
          stroke="#10b981"
          strokeWidth="2"
          fill="none"
          className="drop-shadow-sm"
        />
        <circle
          cx={targetX}
          cy={targetY}
          r="4"
          fill="#10b981"
        />
      </g>
    );
  };

  return (
    <div className="h-full flex flex-col bg-gray-950">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-white">Battlecard bot</h3>
          <Badge variant="secondary" className="bg-green-600 text-white">marketing</Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-green-400 border-green-400">Active</Badge>
          <Button variant="outline" size="sm" className="text-white border-gray-600">Share</Button>
          <Button variant="outline" size="sm" className="text-white border-gray-600">Saved</Button>
        </div>
      </div>

      {/* Secondary Toolbar */}
      <div className="flex items-center justify-between p-2 border-b border-gray-800 bg-gray-900">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              onClick={handleExecuteWorkflow}
              disabled={isExecuting}
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isExecuting ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              Test workflow
            </Button>
            <Button
              onClick={() => setShowChat(!showChat)}
              variant="outline"
              size="sm"
              className="text-white border-gray-600"
            >
              {showChat ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              Hide chat
            </Button>
            <Button variant="ghost" size="sm" className="text-red-400">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>Session: b6ff428be3e64e8a891eceb814bb9a78</span>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden">
          <div
            ref={canvasRef}
            className="w-full h-full relative bg-gray-950"
            onMouseMove={handleNodeDrag}
            onMouseUp={handleNodeDragEnd}
            style={{ 
              backgroundImage: 'radial-gradient(circle, #374151 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}
          >
            {/* SVG for connections */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {connections.map(renderConnection)}
            </svg>

            {/* Nodes */}
            {nodes.map((node) => (
              <div
                key={node.id}
                className={cn(
                  "absolute w-48 p-3 rounded-lg border-2 cursor-move transition-all duration-200",
                  getNodeColor(node.type, node.data.status),
                  selectedNode === node.id && "ring-2 ring-blue-500"
                )}
                style={{
                  left: node.position.x,
                  top: node.position.y,
                  transform: draggedNode?.id === node.id ? 'scale(1.05)' : 'scale(1)'
                }}
                onMouseDown={(e) => handleNodeDragStart(node, e)}
                onClick={() => setSelectedNode(node.id)}
              >
                <div className="flex items-center gap-2 mb-2">
                  {getNodeIcon(node.type, node.data.label)}
                  <span className="font-medium text-sm text-gray-900 dark:text-white truncate">
                    {node.data.label}
                  </span>
                  {node.data.status === 'running' && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  )}
                </div>
                
                {node.data.description && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    {node.data.description}
                  </p>
                )}

                {/* Connection points */}
                {node.inputs.length > 0 && (
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full border border-white" />
                  </div>
                )}
                
                {node.outputs.length > 0 && (
                  <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full border border-white" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Zoom controls */}
          <div className="absolute bottom-4 left-4 flex gap-2">
            <Button variant="outline" size="sm" className="bg-gray-800 border-gray-600 text-white">
              <Plus className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="bg-gray-800 border-gray-600 text-white">
              100%
            </Button>
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-80 border-l border-gray-800 bg-gray-900 flex flex-col">
          {/* Tabs */}
          <div className="flex border-b border-gray-800">
            <button className="flex-1 p-3 text-sm font-medium text-white bg-gray-800">
              Editor
            </button>
            <button className="flex-1 p-3 text-sm font-medium text-gray-400 hover:text-white">
              Executions
            </button>
            <button className="flex-1 p-3 text-sm font-medium text-gray-400 hover:text-white">
              Tests
            </button>
          </div>

          {/* Latest Logs */}
          <div className="p-4 border-b border-gray-800">
            <h4 className="text-sm font-medium text-white mb-2">Latest Logs from AI Agent node</h4>
            <ScrollArea className="h-32">
              <div className="space-y-2">
                {executionLogs.map((log, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs">
                    <span className="text-gray-400">{log.timestamp}</span>
                    <span className={cn(
                      log.type === 'error' ? 'text-red-400' :
                      log.type === 'success' ? 'text-green-400' :
                      'text-gray-300'
                    )}>
                      {log.message}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Execution Details */}
          <div className="flex-1 p-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-blue-400" />
                <span className="text-sm text-white">AI Agent</span>
                <span className="text-xs text-gray-400">1089ms | Started at 8:49:40 PM</span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Input</span>
                </div>
                <div className="bg-gray-800 p-2 rounded text-xs text-gray-300 font-mono">
                  {`{
  "query": "n8n",
  "k": 25
}`}
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 text-gray-400">
                  <Database className="h-3 w-3" />
                  <span>Vector Store Tool</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Database className="h-3 w-3" />
                  <span>Qdrant Vector Store!</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Bot className="h-3 w-3" />
                  <span>Embeddings OpenAI3</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Bot className="h-3 w-3" />
                  <span>OpenAI Chat Model1</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Bot className="h-3 w-3" />
                  <span>OpenAI Chat Model</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Chat Panel */}
      {showChat && (
        <div className="h-64 border-t border-gray-800 bg-gray-900 p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-white">Chat</h4>
            <Button
              onClick={() => setShowChat(false)}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
            >
              <EyeOff className="h-4 w-4" />
            </Button>
          </div>
          
          <ScrollArea className="h-32 mb-4">
            <div className="space-y-2 text-sm">
              <div className="text-gray-300">
                <strong>Integration Capabilities:</strong> n8n comes with over 400 ready-to-use integrations, supporting a vast range of automation possibilities without the need for premium connectors.
              </div>
              <div className="text-gray-400 text-xs mt-2">
                <strong>Important Aspects About n8n:</strong>
              </div>
              <ul className="text-gray-300 text-xs space-y-1 ml-4">
                <li>• n8n offers a predominantly free use model, with 95% of its features available at no cost. This makes it accessible and cost-effective for many users.</li>
                <li>• The platform's vibrant community plays a pivotal role in its development and support, enhancing the user experience and providing extensive resources.</li>
                <li>• The drag-and-drop interface simplifies workflow creation, making it ideal for both technical users and those with minimal coding expertise, enabling quick modifications and integrations.</li>
              </ul>
            </div>
          </ScrollArea>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Type a message, or press 'up' arrow for previous one"
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
            />
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              Send
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}