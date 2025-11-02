// AI Provider Types for Multi-LLM Support

export interface AIModel {
  id: string;
  name: string;
  displayName: string;
  speed: 'fast' | 'medium' | 'slow';
  intelligence: 'basic' | 'advanced' | 'expert';
  contextWindow: number;
  costPerToken: number;
  maxTokens: number;
  supportsStreaming: boolean;
  supportsImages: boolean;
  supportsFiles: boolean;
}

export interface AIProvider {
  id: string;
  name: string;
  displayName: string;
  logo: string;
  models: AIModel[];
  apiKey?: string;
  isActive: boolean;
  isConnected: boolean;
  capabilities: AICapability[];
  baseUrl?: string;
  headers?: Record<string, string>;
}

export interface AICapability {
  id: string;
  name: string;
  description: string;
  supported: boolean;
}

export interface AIResponse {
  id: string;
  providerId: string;
  modelId: string;
  content: string;
  tokens: {
    input: number;
    output: number;
    total: number;
  };
  cost: number;
  latency: number;
  timestamp: number;
  error?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  attachments?: FileAttachment[];
  responses?: AIResponse[];
  selectedResponse?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  isStarred: boolean;
  activeProviders: string[];
  settings: ChatSettings;
}

export interface ChatSettings {
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  systemPrompt?: string;
}

export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  source: 'local' | 'google-drive' | 'onedrive' | 'dropbox';
  sourceId?: string;
  preview?: string;
  summary?: string;
}

export interface CloudFile {
  id: string;
  name: string;
  type: 'file' | 'folder';
  mimeType: string;
  size: number;
  modifiedTime: string;
  parents: string[];
  source: 'google-drive' | 'onedrive' | 'dropbox';
  path: string;
  isShared: boolean;
  permissions: string[];
  webViewLink?: string;
  downloadUrl?: string;
  thumbnailLink?: string;
}

export interface MCPServer {
  id: string;
  name: string;
  displayName: string;
  description: string;
  icon: string;
  version: string;
  capabilities: string[];
  isConnected: boolean;
  isEnabled: boolean;
  config: Record<string, any>;
  tools: MCPTool[];
}

export interface MCPTool {
  id: string;
  name: string;
  description: string;
  parameters: MCPParameter[];
  examples: string[];
}

export interface MCPParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required: boolean;
  default?: any;
}

export interface MCPConnection {
  id: string;
  serviceId: string;
  userId: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  isConnected: boolean;
  lastUsed: number;
  createdAt: number;
}

export interface MCPAuthConfig {
  // OAuth2 config
  clientId?: string;
  scopes?: string[];
  redirectUri?: string;
  authUrl?: string;
  tokenUrl?: string;
  
  // API Key config
  apiKeyHeader?: string;
  apiKeyPrefix?: string;
  baseUrl?: string;
  
  // Service Account config
  serviceAccountKey?: string;
  serviceAccountEmail?: string;
}

export interface WorkflowNode {
  id: string;
  type: 'trigger' | 'ai-model' | 'mcp-tool' | 'condition' | 'action';
  position: { x: number; y: number };
  data: {
    label: string;
    config: Record<string, any>;
    inputs: WorkflowPort[];
    outputs: WorkflowPort[];
  };
}

export interface WorkflowPort {
  id: string;
  name: string;
  type: string;
  connected: boolean;
}

export interface WorkflowConnection {
  id: string;
  source: string;
  sourcePort: string;
  target: string;
  targetPort: string;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  triggers: WorkflowTrigger[];
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface WorkflowTrigger {
  id: string;
  type: 'schedule' | 'email' | 'calendar' | 'webhook' | 'manual';
  config: Record<string, any>;
  isActive: boolean;
}

export interface UserAISettings {
  userId: string;
  globalProvider: string;
  globalModel: string;
  providers: Record<string, {
    apiKey: string;
    selectedModel: string;
    isActive: boolean;
    customConfig?: Record<string, any>;
  }>;
  mcpServers: Record<string, {
    isEnabled: boolean;
    config: Record<string, any>;
  }>;
  workflows: WorkflowDefinition[];
  chatSessions: string[];
  preferences: {
    showMultipleResponses: boolean;
    autoSaveChats: boolean;
    enableFileAnalysis: boolean;
    enableEmailAutomation: boolean;
    defaultTemperature: number;
    defaultMaxTokens: number;
  };
}

export interface CloudFile {
  id: string;
  name: string;
  type: 'file' | 'folder';
  mimeType: string;
  size: number;
  modifiedTime: string;
  webViewLink?: string;
  downloadUrl?: string;
  thumbnailLink?: string;
  parents: string[];
  source: 'google-drive' | 'onedrive' | 'dropbox';
  path: string;
  isShared: boolean;
  permissions: string[];
}

export interface EmailContext {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  body: string;
  attachments: FileAttachment[];
  timestamp: number;
  isImportant: boolean;
  labels: string[];
  snippet: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: {
    type: 'email' | 'calendar' | 'time' | 'file' | 'webhook';
    conditions: Record<string, any>;
  };
  actions: {
    type: 'send-email' | 'create-event' | 'notify' | 'run-workflow';
    config: Record<string, any>;
  }[];
  isActive: boolean;
  lastRun?: number;
  runCount: number;
}