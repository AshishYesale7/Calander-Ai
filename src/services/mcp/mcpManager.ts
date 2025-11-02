// MCP (Model Context Protocol) Manager - Handles connections to various services

import { MCPServer, MCPTool, MCPConnection, MCPAuthConfig } from '@/types/ai-providers';

export interface MCPAuthResult {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  error?: string;
  authUrl?: string; // For OAuth flows
}

export interface MCPServiceConfig {
  id: string;
  name: string;
  displayName: string;
  description: string;
  icon: string;
  authType: 'oauth2' | 'api_key' | 'service_account';
  authConfig: MCPAuthConfig;
  capabilities: string[];
  tools: MCPTool[];
}

class MCPManager {
  private connections: Map<string, MCPConnection> = new Map();
  private serviceConfigs: MCPServiceConfig[] = [];

  constructor() {
    this.initializeServices();
  }

  private initializeServices() {
    this.serviceConfigs = [
      {
        id: 'google-calendar',
        name: 'Google Calendar',
        displayName: 'Google Calendar',
        description: 'Access and manage your Google Calendar events',
        icon: '/icons/google-calendar.svg',
        authType: 'oauth2',
        authConfig: {
          clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
          scopes: [
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/calendar.events'
          ],
          redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback/google`,
          authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
          tokenUrl: 'https://oauth2.googleapis.com/token'
        },
        capabilities: [
          'read_events',
          'create_events',
          'update_events',
          'delete_events',
          'list_calendars'
        ],
        tools: [
          {
            id: 'create_event',
            name: 'Create Calendar Event',
            description: 'Create a new event in Google Calendar',
            parameters: [
              { name: 'title', type: 'string', required: true, description: 'Event title' },
              { name: 'start_time', type: 'string', required: true, description: 'Start time (ISO format)' },
              { name: 'end_time', type: 'string', required: true, description: 'End time (ISO format)' },
              { name: 'description', type: 'string', required: false, description: 'Event description' },
              { name: 'location', type: 'string', required: false, description: 'Event location' },
              { name: 'attendees', type: 'array', required: false, description: 'List of attendee emails' }
            ],
            examples: [
              'Create a meeting titled "Team Standup" tomorrow at 9 AM for 1 hour',
              'Schedule a doctor appointment on Friday at 2 PM'
            ]
          },
          {
            id: 'list_events',
            name: 'List Calendar Events',
            description: 'Get upcoming events from Google Calendar',
            parameters: [
              { name: 'start_date', type: 'string', required: false, description: 'Start date filter (ISO format)' },
              { name: 'end_date', type: 'string', required: false, description: 'End date filter (ISO format)' },
              { name: 'max_results', type: 'number', required: false, description: 'Maximum number of events to return' }
            ],
            examples: [
              'Show me my events for today',
              'What meetings do I have this week?'
            ]
          }
        ]
      },
      {
        id: 'gmail',
        name: 'Gmail',
        displayName: 'Gmail',
        description: 'Read, compose, and manage your Gmail messages',
        icon: '/icons/gmail.svg',
        authType: 'oauth2',
        authConfig: {
          clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
          scopes: [
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/gmail.compose',
            'https://www.googleapis.com/auth/gmail.modify'
          ],
          redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback/google`,
          authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
          tokenUrl: 'https://oauth2.googleapis.com/token'
        },
        capabilities: [
          'read_emails',
          'compose_emails',
          'send_emails',
          'search_emails',
          'manage_labels'
        ],
        tools: [
          {
            id: 'compose_email',
            name: 'Compose Email',
            description: 'Draft a new email message',
            parameters: [
              { name: 'to', type: 'string', required: true, description: 'Recipient email address' },
              { name: 'subject', type: 'string', required: true, description: 'Email subject' },
              { name: 'body', type: 'string', required: true, description: 'Email body content' },
              { name: 'cc', type: 'string', required: false, description: 'CC recipients' },
              { name: 'bcc', type: 'string', required: false, description: 'BCC recipients' }
            ],
            examples: [
              'Compose an email to john@example.com about the project update',
              'Draft a follow-up email to the client'
            ]
          },
          {
            id: 'search_emails',
            name: 'Search Emails',
            description: 'Search for emails in Gmail',
            parameters: [
              { name: 'query', type: 'string', required: true, description: 'Search query' },
              { name: 'max_results', type: 'number', required: false, description: 'Maximum number of results' }
            ],
            examples: [
              'Find emails from last week about the project',
              'Search for unread emails from my manager'
            ]
          }
        ]
      },
      {
        id: 'notion',
        name: 'Notion',
        displayName: 'Notion',
        description: 'Access and manage your Notion workspace',
        icon: '/icons/notion.svg',
        authType: 'oauth2',
        authConfig: {
          clientId: process.env.NEXT_PUBLIC_NOTION_CLIENT_ID || '',
          scopes: ['read_content', 'update_content', 'insert_content'],
          redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback/notion`,
          authUrl: 'https://api.notion.com/v1/oauth/authorize',
          tokenUrl: 'https://api.notion.com/v1/oauth/token'
        },
        capabilities: [
          'read_pages',
          'create_pages',
          'update_pages',
          'search_content',
          'manage_databases'
        ],
        tools: [
          {
            id: 'create_page',
            name: 'Create Notion Page',
            description: 'Create a new page in Notion',
            parameters: [
              { name: 'title', type: 'string', required: true, description: 'Page title' },
              { name: 'content', type: 'string', required: true, description: 'Page content' },
              { name: 'parent_id', type: 'string', required: false, description: 'Parent page or database ID' }
            ],
            examples: [
              'Create a meeting notes page for today\'s standup',
              'Add a new task to my project database'
            ]
          }
        ]
      },
      {
        id: 'linear',
        name: 'Linear',
        displayName: 'Linear',
        description: 'Manage Linear issues and projects',
        icon: '/icons/linear.svg',
        authType: 'api_key',
        authConfig: {
          apiKeyHeader: 'Authorization',
          apiKeyPrefix: 'Bearer',
          baseUrl: 'https://api.linear.app/graphql'
        },
        capabilities: [
          'create_issues',
          'read_issues',
          'update_issues',
          'manage_projects'
        ],
        tools: [
          {
            id: 'create_linear_issue',
            name: 'Create Linear Issue',
            description: 'Create a new issue in Linear',
            parameters: [
              { name: 'title', type: 'string', required: true, description: 'Issue title' },
              { name: 'description', type: 'string', required: false, description: 'Issue description' },
              { name: 'team_id', type: 'string', required: true, description: 'Team ID' },
              { name: 'priority', type: 'number', required: false, description: 'Issue priority (1-4)' }
            ],
            examples: [
              'Create a high priority bug report',
              'Add a new feature request to the backlog'
            ]
          }
        ]
      }
    ];
  }

  getAvailableServices(): MCPServiceConfig[] {
    return this.serviceConfigs;
  }

  getServiceConfig(serviceId: string): MCPServiceConfig | null {
    return this.serviceConfigs.find(config => config.id === serviceId) || null;
  }

  async authenticateService(serviceId: string, userId: string, apiKey?: string): Promise<MCPAuthResult> {
    const config = this.getServiceConfig(serviceId);
    if (!config) {
      return { success: false, error: 'Service not found' };
    }

    try {
      switch (config.authType) {
        case 'oauth2':
          return await this.handleOAuth2Authentication(config, userId);
        case 'api_key':
          if (!apiKey) {
            return { success: false, error: 'API key required' };
          }
          return await this.handleApiKeyAuthentication(config, userId, apiKey);
        case 'service_account':
          return await this.handleServiceAccountAuthentication(config, userId);
        default:
          return { success: false, error: 'Unsupported authentication type' };
      }
    } catch (error) {
      console.error(`Authentication failed for ${serviceId}:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Authentication failed' 
      };
    }
  }

  private async handleOAuth2Authentication(config: MCPServiceConfig, userId: string): Promise<MCPAuthResult> {
    // Generate OAuth2 authorization URL
    const state = this.generateSecureState(userId, config.id);
    const params = new URLSearchParams({
      client_id: config.authConfig.clientId!,
      redirect_uri: config.authConfig.redirectUri!,
      scope: config.authConfig.scopes!.join(' '),
      response_type: 'code',
      state,
      access_type: 'offline',
      prompt: 'consent'
    });

    const authUrl = `${config.authConfig.authUrl}?${params.toString()}`;
    
    // Store state for verification
    await this.storeAuthState(state, userId, config.id);
    
    return {
      success: true,
      authUrl
    };
  }

  private async handleApiKeyAuthentication(config: MCPServiceConfig, userId: string, apiKey: string): Promise<MCPAuthResult> {
    // Test the API key by making a simple request
    try {
      const testResult = await this.testApiKey(config, apiKey);
      if (!testResult.success) {
        return { success: false, error: testResult.error };
      }

      // Store the API key connection
      const connection: MCPConnection = {
        id: `${config.id}-${userId}`,
        serviceId: config.id,
        userId,
        accessToken: apiKey, // For API keys, we store it as access token
        refreshToken: undefined,
        expiresAt: undefined, // API keys typically don't expire
        isConnected: true,
        lastUsed: Date.now(),
        createdAt: Date.now()
      };

      await this.storeConnection(connection);
      this.connections.set(connection.id, connection);

      return {
        success: true,
        accessToken: apiKey
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'API key validation failed'
      };
    }
  }

  private async testApiKey(config: MCPServiceConfig, apiKey: string): Promise<{ success: boolean; error?: string }> {
    try {
      switch (config.id) {
        case 'linear':
          // Test Linear API key with a simple query
          const response = await fetch(config.authConfig.baseUrl!, {
            method: 'POST',
            headers: {
              'Authorization': `${config.authConfig.apiKeyPrefix} ${apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              query: 'query { viewer { id name } }'
            })
          });

          if (!response.ok) {
            return { success: false, error: 'Invalid API key' };
          }

          const data = await response.json();
          if (data.errors) {
            return { success: false, error: data.errors[0]?.message || 'API key validation failed' };
          }

          return { success: true };

        default:
          // For other services, assume the key is valid
          // In production, implement proper validation for each service
          return { success: true };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'API key test failed' 
      };
    }
  }

  private async handleServiceAccountAuthentication(config: MCPServiceConfig, userId: string): Promise<MCPAuthResult> {
    // For service account authentication, we use our own credentials
    return {
      success: true,
      accessToken: 'service_account_token',
      expiresAt: Date.now() + (60 * 60 * 1000) // 1 hour
    };
  }

  async handleOAuthCallback(code: string, state: string): Promise<MCPAuthResult> {
    try {
      const stateData = await this.verifyAuthState(state);
      if (!stateData) {
        return { success: false, error: 'Invalid state parameter' };
      }

      const config = this.getServiceConfig(stateData.serviceId);
      if (!config) {
        return { success: false, error: 'Service configuration not found' };
      }

      // Exchange authorization code for access token
      const tokenResponse = await fetch(config.authConfig.tokenUrl!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: new URLSearchParams({
          client_id: config.authConfig.clientId!,
          client_secret: this.getClientSecret(config.id),
          code,
          grant_type: 'authorization_code',
          redirect_uri: config.authConfig.redirectUri!
        })
      });

      if (!tokenResponse.ok) {
        const error = await tokenResponse.text();
        return { success: false, error: `Token exchange failed: ${error}` };
      }

      const tokenData = await tokenResponse.json();
      
      // Store the connection
      const connection: MCPConnection = {
        id: `${stateData.serviceId}-${stateData.userId}`,
        serviceId: stateData.serviceId,
        userId: stateData.userId,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: Date.now() + (tokenData.expires_in * 1000),
        isConnected: true,
        lastUsed: Date.now(),
        createdAt: Date.now()
      };

      await this.storeConnection(connection);
      this.connections.set(connection.id, connection);

      return {
        success: true,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: connection.expiresAt
      };
    } catch (error) {
      console.error('OAuth callback error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'OAuth callback failed' 
      };
    }
  }

  private getClientSecret(serviceId: string): string {
    // In production, store these securely in environment variables
    const secrets: Record<string, string> = {
      'google-calendar': process.env.GOOGLE_CLIENT_SECRET || '',
      'gmail': process.env.GOOGLE_CLIENT_SECRET || '',
      'notion': process.env.NOTION_CLIENT_SECRET || '',
      'slack': process.env.SLACK_CLIENT_SECRET || '',
      'github': process.env.GITHUB_CLIENT_SECRET || ''
    };
    return secrets[serviceId] || '';
  }

  async executeToolCall(serviceId: string, toolId: string, parameters: Record<string, any>, userId: string): Promise<any> {
    const connection = await this.getConnection(serviceId, userId);
    if (!connection || !connection.isConnected) {
      throw new Error(`Not connected to ${serviceId}. Please authenticate first.`);
    }

    // Refresh token if needed (for OAuth connections)
    if (connection.expiresAt && connection.expiresAt < Date.now() && connection.refreshToken) {
      await this.refreshAccessToken(connection);
    }

    const config = this.getServiceConfig(serviceId);
    if (!config) {
      throw new Error('Service configuration not found');
    }

    const tool = config.tools.find(t => t.id === toolId);
    if (!tool) {
      throw new Error(`Tool ${toolId} not found for service ${serviceId}`);
    }

    // Validate parameters
    this.validateToolParameters(tool, parameters);

    // Execute the tool based on service type
    switch (serviceId) {
      case 'google-calendar':
        return await this.executeGoogleCalendarTool(toolId, parameters, connection.accessToken);
      case 'gmail':
        return await this.executeGmailTool(toolId, parameters, connection.accessToken);
      case 'notion':
        return await this.executeNotionTool(toolId, parameters, connection.accessToken);
      case 'linear':
        return await this.executeLinearTool(toolId, parameters, connection.accessToken);
      default:
        throw new Error(`Tool execution not implemented for ${serviceId}`);
    }
  }

  private validateToolParameters(tool: MCPTool, parameters: Record<string, any>): void {
    for (const param of tool.parameters) {
      if (param.required && !(param.name in parameters)) {
        throw new Error(`Required parameter '${param.name}' is missing`);
      }
      
      if (param.name in parameters) {
        const value = parameters[param.name];
        const expectedType = param.type;
        
        if (expectedType === 'string' && typeof value !== 'string') {
          throw new Error(`Parameter '${param.name}' must be a string`);
        }
        if (expectedType === 'number' && typeof value !== 'number') {
          throw new Error(`Parameter '${param.name}' must be a number`);
        }
        if (expectedType === 'boolean' && typeof value !== 'boolean') {
          throw new Error(`Parameter '${param.name}' must be a boolean`);
        }
        if (expectedType === 'array' && !Array.isArray(value)) {
          throw new Error(`Parameter '${param.name}' must be an array`);
        }
      }
    }
  }

  private async executeGoogleCalendarTool(toolId: string, parameters: Record<string, any>, accessToken: string): Promise<any> {
    const baseUrl = 'https://www.googleapis.com/calendar/v3';
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };

    switch (toolId) {
      case 'create_event':
        const eventData = {
          summary: parameters.title,
          start: { dateTime: parameters.start_time },
          end: { dateTime: parameters.end_time },
          description: parameters.description,
          location: parameters.location,
          attendees: parameters.attendees?.map((email: string) => ({ email }))
        };

        const response = await fetch(`${baseUrl}/calendars/primary/events`, {
          method: 'POST',
          headers,
          body: JSON.stringify(eventData)
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(`Failed to create event: ${error.error?.message || response.statusText}`);
        }

        return await response.json();

      case 'list_events':
        const params = new URLSearchParams({
          timeMin: parameters.start_date || new Date().toISOString(),
          timeMax: parameters.end_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          maxResults: (parameters.max_results || 10).toString(),
          singleEvents: 'true',
          orderBy: 'startTime'
        });

        const listResponse = await fetch(`${baseUrl}/calendars/primary/events?${params}`, {
          headers
        });

        if (!listResponse.ok) {
          const error = await listResponse.json();
          throw new Error(`Failed to list events: ${error.error?.message || listResponse.statusText}`);
        }

        return await listResponse.json();

      default:
        throw new Error(`Unknown Google Calendar tool: ${toolId}`);
    }
  }

  private async executeGmailTool(toolId: string, parameters: Record<string, any>, accessToken: string): Promise<any> {
    const baseUrl = 'https://gmail.googleapis.com/gmail/v1';
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };

    switch (toolId) {
      case 'compose_email':
        const emailContent = [
          `To: ${parameters.to}`,
          `Subject: ${parameters.subject}`,
          parameters.cc ? `Cc: ${parameters.cc}` : '',
          parameters.bcc ? `Bcc: ${parameters.bcc}` : '',
          '',
          parameters.body
        ].filter(Boolean).join('\n');

        const encodedMessage = Buffer.from(emailContent).toString('base64')
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');

        const response = await fetch(`${baseUrl}/users/me/drafts`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            message: {
              raw: encodedMessage
            }
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(`Failed to compose email: ${error.error?.message || response.statusText}`);
        }

        return await response.json();

      case 'search_emails':
        const searchParams = new URLSearchParams({
          q: parameters.query,
          maxResults: (parameters.max_results || 10).toString()
        });

        const searchResponse = await fetch(`${baseUrl}/users/me/messages?${searchParams}`, {
          headers
        });

        if (!searchResponse.ok) {
          const error = await searchResponse.json();
          throw new Error(`Failed to search emails: ${error.error?.message || searchResponse.statusText}`);
        }

        return await searchResponse.json();

      default:
        throw new Error(`Unknown Gmail tool: ${toolId}`);
    }
  }

  private async executeNotionTool(toolId: string, parameters: Record<string, any>, accessToken: string): Promise<any> {
    const baseUrl = 'https://api.notion.com/v1';
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28'
    };

    switch (toolId) {
      case 'create_page':
        const pageData = {
          parent: parameters.parent_id ? { page_id: parameters.parent_id } : { type: 'workspace', workspace: true },
          properties: {
            title: {
              title: [
                {
                  text: {
                    content: parameters.title
                  }
                }
              ]
            }
          },
          children: [
            {
              object: 'block',
              type: 'paragraph',
              paragraph: {
                rich_text: [
                  {
                    type: 'text',
                    text: {
                      content: parameters.content
                    }
                  }
                ]
              }
            }
          ]
        };

        const response = await fetch(`${baseUrl}/pages`, {
          method: 'POST',
          headers,
          body: JSON.stringify(pageData)
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(`Failed to create Notion page: ${error.message || response.statusText}`);
        }

        return await response.json();

      default:
        throw new Error(`Unknown Notion tool: ${toolId}`);
    }
  }

  private async executeLinearTool(toolId: string, parameters: Record<string, any>, accessToken: string): Promise<any> {
    const baseUrl = 'https://api.linear.app/graphql';
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };

    switch (toolId) {
      case 'create_linear_issue':
        const mutation = `
          mutation IssueCreate($input: IssueCreateInput!) {
            issueCreate(input: $input) {
              success
              issue {
                id
                title
                url
              }
            }
          }
        `;

        const variables = {
          input: {
            title: parameters.title,
            description: parameters.description,
            teamId: parameters.team_id,
            priority: parameters.priority
          }
        };

        const response = await fetch(baseUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({ query: mutation, variables })
        });

        if (!response.ok) {
          throw new Error(`Failed to create Linear issue: ${response.statusText}`);
        }

        const result = await response.json();
        if (result.errors) {
          throw new Error(`Linear API error: ${result.errors[0]?.message}`);
        }

        return result.data;

      default:
        throw new Error(`Unknown Linear tool: ${toolId}`);
    }
  }

  private generateSecureState(userId: string, serviceId: string): string {
    const data = { userId, serviceId, timestamp: Date.now(), nonce: Math.random().toString(36) };
    return Buffer.from(JSON.stringify(data)).toString('base64');
  }

  private async storeAuthState(state: string, userId: string, serviceId: string): Promise<void> {
    // In production, store in Redis with expiration
    // For now, we'll use Firebase with TTL
    try {
      const { doc, setDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      await setDoc(doc(db, 'authStates', state), {
        userId,
        serviceId,
        timestamp: Date.now(),
        expiresAt: Date.now() + (10 * 60 * 1000) // 10 minutes
      });
    } catch (error) {
      console.error('Failed to store auth state:', error);
    }
  }

  private async verifyAuthState(state: string): Promise<{ userId: string; serviceId: string } | null> {
    try {
      const { doc, getDoc, deleteDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      const stateDoc = await getDoc(doc(db, 'authStates', state));
      
      if (!stateDoc.exists()) {
        return null;
      }
      
      const data = stateDoc.data();
      
      // Check if expired
      if (Date.now() > data.expiresAt) {
        await deleteDoc(doc(db, 'authStates', state));
        return null;
      }
      
      // Clean up used state
      await deleteDoc(doc(db, 'authStates', state));
      
      return { userId: data.userId, serviceId: data.serviceId };
    } catch (error) {
      console.error('Failed to verify auth state:', error);
      return null;
    }
  }

  private async storeConnection(connection: MCPConnection): Promise<void> {
    try {
      const { doc, setDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      // Encrypt sensitive data before storing
      const secureConnection = {
        ...connection,
        accessToken: await this.encryptToken(connection.accessToken),
        refreshToken: connection.refreshToken ? await this.encryptToken(connection.refreshToken) : undefined
      };
      
      await setDoc(doc(db, 'mcpConnections', connection.id), secureConnection);
    } catch (error) {
      console.error('Failed to store MCP connection:', error);
    }
  }

  private async getConnection(serviceId: string, userId: string): Promise<MCPConnection | null> {
    const connectionId = `${serviceId}-${userId}`;
    
    // Check in-memory cache first
    if (this.connections.has(connectionId)) {
      return this.connections.get(connectionId)!;
    }

    try {
      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      const connectionDoc = await getDoc(doc(db, 'mcpConnections', connectionId));
      
      if (connectionDoc.exists()) {
        const data = connectionDoc.data() as MCPConnection;
        // Decrypt sensitive data
        data.accessToken = await this.decryptToken(data.accessToken);
        if (data.refreshToken) {
          data.refreshToken = await this.decryptToken(data.refreshToken);
        }
        
        this.connections.set(connectionId, data);
        return data;
      }
    } catch (error) {
      console.error('Failed to get MCP connection:', error);
    }

    return null;
  }

  private async refreshAccessToken(connection: MCPConnection): Promise<void> {
    if (!connection.refreshToken) {
      throw new Error('No refresh token available');
    }

    const config = this.getServiceConfig(connection.serviceId);
    if (!config) {
      throw new Error('Service configuration not found');
    }

    try {
      const response = await fetch(config.authConfig.tokenUrl!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: config.authConfig.clientId!,
          client_secret: this.getClientSecret(connection.serviceId),
          refresh_token: connection.refreshToken,
          grant_type: 'refresh_token'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to refresh access token');
      }

      const tokenData = await response.json();
      
      // Update connection
      connection.accessToken = tokenData.access_token;
      connection.expiresAt = Date.now() + (tokenData.expires_in * 1000);
      
      // Store updated connection
      await this.storeConnection(connection);
      this.connections.set(connection.id, connection);
    } catch (error) {
      console.error('Failed to refresh access token:', error);
      // Mark connection as disconnected
      connection.isConnected = false;
      await this.storeConnection(connection);
    }
  }

  private async encryptToken(token: string): Promise<string> {
    try {
      const { encryptionService } = await import('@/utils/encryption');
      return encryptionService.encryptForStorage(token);
    } catch (error) {
      console.error('Encryption service not available, using fallback:', error);
      // Fallback to base64 (NOT SECURE - for development only)
      return Buffer.from(token).toString('base64');
    }
  }

  private async decryptToken(encryptedToken: string): Promise<string> {
    try {
      const { encryptionService } = await import('@/utils/encryption');
      return encryptionService.decryptFromStorage(encryptedToken);
    } catch (error) {
      console.error('Decryption service not available, using fallback:', error);
      // Fallback to base64 decode (NOT SECURE - for development only)
      return Buffer.from(encryptedToken, 'base64').toString();
    }
  }

  async disconnectService(serviceId: string, userId: string): Promise<void> {
    const connectionId = `${serviceId}-${userId}`;
    
    try {
      // Remove from cache
      this.connections.delete(connectionId);
      
      // Remove from database
      const { doc, deleteDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      await deleteDoc(doc(db, 'mcpConnections', connectionId));
    } catch (error) {
      console.error('Failed to disconnect MCP service:', error);
    }
  }

  getUserConnections(userId: string): MCPConnection[] {
    return Array.from(this.connections.values()).filter(conn => conn.userId === userId);
  }

  async isServiceConnected(serviceId: string, userId: string): Promise<boolean> {
    const connection = await this.getConnection(serviceId, userId);
    return connection?.isConnected || false;
  }
}

export const mcpManager = new MCPManager();
export default mcpManager;