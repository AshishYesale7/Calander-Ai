// Pre-built Workflow Templates
// Common automation workflows that users can quickly deploy

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'email' | 'calendar' | 'productivity' | 'ai' | 'integration';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedSetupTime: number; // minutes
  requiredServices: string[];
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  variables: WorkflowVariable[];
  tags: string[];
  icon: string;
  previewImage?: string;
}

export interface WorkflowNode {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'ai' | 'delay';
  service?: string;
  operation: string;
  position: { x: number; y: number };
  config: Record<string, any>;
  title: string;
  description: string;
}

export interface WorkflowConnection {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface WorkflowVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'email' | 'url';
  description: string;
  defaultValue?: any;
  required: boolean;
}

export const workflowTemplates: WorkflowTemplate[] = [
  {
    id: 'email-auto-responder',
    name: 'Smart Email Auto-Responder',
    description: 'Automatically respond to emails with AI-generated replies based on content and context',
    category: 'email',
    difficulty: 'beginner',
    estimatedSetupTime: 5,
    requiredServices: ['gmail', 'openai'],
    tags: ['email', 'automation', 'ai', 'customer-service'],
    icon: '📧',
    variables: [
      {
        name: 'response_tone',
        type: 'string',
        description: 'Tone of the auto-response (professional, friendly, casual)',
        defaultValue: 'professional',
        required: true
      },
      {
        name: 'max_response_length',
        type: 'number',
        description: 'Maximum length of auto-response in words',
        defaultValue: 150,
        required: true
      }
    ],
    nodes: [
      {
        id: 'trigger-1',
        type: 'trigger',
        service: 'gmail',
        operation: 'new_email',
        position: { x: 100, y: 100 },
        config: {
          filters: {
            unread: true,
            excludeSpam: true
          }
        },
        title: 'New Email Received',
        description: 'Triggers when a new email is received'
      },
      {
        id: 'condition-1',
        type: 'condition',
        operation: 'check_keywords',
        position: { x: 300, y: 100 },
        config: {
          keywords: ['urgent', 'asap', 'immediate'],
          operator: 'contains_any'
        },
        title: 'Check if Urgent',
        description: 'Check if email contains urgent keywords'
      },
      {
        id: 'ai-1',
        type: 'ai',
        service: 'openai',
        operation: 'generate_response',
        position: { x: 500, y: 100 },
        config: {
          model: 'gpt-4',
          prompt: 'Generate a professional auto-response to this email: {{email.content}}. Tone: {{response_tone}}. Max length: {{max_response_length}} words.',
          temperature: 0.7
        },
        title: 'Generate AI Response',
        description: 'Create intelligent response using AI'
      },
      {
        id: 'action-1',
        type: 'action',
        service: 'gmail',
        operation: 'send_reply',
        position: { x: 700, y: 100 },
        config: {
          subject: 'Re: {{email.subject}}',
          body: '{{ai_response}}',
          addSignature: true
        },
        title: 'Send Reply',
        description: 'Send the AI-generated reply'
      }
    ],
    connections: [
      { id: 'conn-1', source: 'trigger-1', target: 'condition-1' },
      { id: 'conn-2', source: 'condition-1', target: 'ai-1' },
      { id: 'conn-3', source: 'ai-1', target: 'action-1' }
    ]
  },

  {
    id: 'meeting-scheduler',
    name: 'AI Meeting Scheduler',
    description: 'Automatically schedule meetings by analyzing email requests and finding available time slots',
    category: 'calendar',
    difficulty: 'intermediate',
    estimatedSetupTime: 10,
    requiredServices: ['gmail', 'google-calendar', 'openai'],
    tags: ['calendar', 'scheduling', 'ai', 'productivity'],
    icon: '📅',
    variables: [
      {
        name: 'default_meeting_duration',
        type: 'number',
        description: 'Default meeting duration in minutes',
        defaultValue: 30,
        required: true
      },
      {
        name: 'business_hours_start',
        type: 'string',
        description: 'Business hours start time (HH:MM)',
        defaultValue: '09:00',
        required: true
      },
      {
        name: 'business_hours_end',
        type: 'string',
        description: 'Business hours end time (HH:MM)',
        defaultValue: '17:00',
        required: true
      }
    ],
    nodes: [
      {
        id: 'trigger-1',
        type: 'trigger',
        service: 'gmail',
        operation: 'new_email',
        position: { x: 100, y: 100 },
        config: {
          filters: {
            keywords: ['meeting', 'schedule', 'call', 'appointment']
          }
        },
        title: 'Meeting Request Email',
        description: 'Detects emails requesting meetings'
      },
      {
        id: 'ai-1',
        type: 'ai',
        service: 'openai',
        operation: 'extract_meeting_details',
        position: { x: 300, y: 100 },
        config: {
          prompt: 'Extract meeting details from this email: {{email.content}}. Return JSON with: title, duration, participants, preferred_times, topic'
        },
        title: 'Extract Meeting Details',
        description: 'AI extracts meeting information from email'
      },
      {
        id: 'action-1',
        type: 'action',
        service: 'google-calendar',
        operation: 'find_available_slots',
        position: { x: 500, y: 100 },
        config: {
          duration: '{{meeting_details.duration || default_meeting_duration}}',
          participants: '{{meeting_details.participants}}',
          businessHours: {
            start: '{{business_hours_start}}',
            end: '{{business_hours_end}}'
          }
        },
        title: 'Find Available Times',
        description: 'Find available calendar slots'
      },
      {
        id: 'action-2',
        type: 'action',
        service: 'google-calendar',
        operation: 'create_event',
        position: { x: 700, y: 100 },
        config: {
          title: '{{meeting_details.title}}',
          start: '{{available_slots[0].start}}',
          end: '{{available_slots[0].end}}',
          attendees: '{{meeting_details.participants}}',
          description: '{{meeting_details.topic}}'
        },
        title: 'Create Calendar Event',
        description: 'Create the meeting in calendar'
      },
      {
        id: 'action-3',
        type: 'action',
        service: 'gmail',
        operation: 'send_reply',
        position: { x: 900, y: 100 },
        config: {
          subject: 'Meeting Scheduled: {{meeting_details.title}}',
          body: 'Hi,\n\nI\'ve scheduled our meeting for {{calendar_event.start}}. Calendar invite has been sent.\n\nLooking forward to our discussion!\n\nBest regards'
        },
        title: 'Send Confirmation',
        description: 'Send meeting confirmation email'
      }
    ],
    connections: [
      { id: 'conn-1', source: 'trigger-1', target: 'ai-1' },
      { id: 'conn-2', source: 'ai-1', target: 'action-1' },
      { id: 'conn-3', source: 'action-1', target: 'action-2' },
      { id: 'conn-4', source: 'action-2', target: 'action-3' }
    ]
  },

  {
    id: 'document-analyzer',
    name: 'Smart Document Analyzer',
    description: 'Automatically analyze uploaded documents and create summaries, extract key information, and organize files',
    category: 'productivity',
    difficulty: 'intermediate',
    estimatedSetupTime: 8,
    requiredServices: ['google-drive', 'openai', 'notion'],
    tags: ['documents', 'ai', 'analysis', 'organization'],
    icon: '📄',
    variables: [
      {
        name: 'analysis_depth',
        type: 'string',
        description: 'Depth of analysis (summary, detailed, comprehensive)',
        defaultValue: 'detailed',
        required: true
      },
      {
        name: 'auto_categorize',
        type: 'boolean',
        description: 'Automatically categorize documents',
        defaultValue: true,
        required: false
      }
    ],
    nodes: [
      {
        id: 'trigger-1',
        type: 'trigger',
        service: 'google-drive',
        operation: 'file_uploaded',
        position: { x: 100, y: 100 },
        config: {
          folder: '/Documents/Inbox',
          fileTypes: ['pdf', 'docx', 'txt', 'md']
        },
        title: 'New Document Uploaded',
        description: 'Triggers when document is uploaded to Drive'
      },
      {
        id: 'ai-1',
        type: 'ai',
        service: 'openai',
        operation: 'analyze_document',
        position: { x: 300, y: 100 },
        config: {
          prompt: 'Analyze this document and provide: 1) Summary, 2) Key points, 3) Category, 4) Action items, 5) Important dates. Analysis depth: {{analysis_depth}}'
        },
        title: 'AI Document Analysis',
        description: 'Analyze document content with AI'
      },
      {
        id: 'condition-1',
        type: 'condition',
        operation: 'check_variable',
        position: { x: 500, y: 100 },
        config: {
          variable: 'auto_categorize',
          operator: 'equals',
          value: true
        },
        title: 'Auto-categorize?',
        description: 'Check if auto-categorization is enabled'
      },
      {
        id: 'action-1',
        type: 'action',
        service: 'google-drive',
        operation: 'move_file',
        position: { x: 700, y: 50 },
        config: {
          destination: '/Documents/{{analysis.category}}',
          createFolder: true
        },
        title: 'Categorize File',
        description: 'Move file to appropriate category folder'
      },
      {
        id: 'action-2',
        type: 'action',
        service: 'notion',
        operation: 'create_page',
        position: { x: 700, y: 150 },
        config: {
          database: 'Document Analysis',
          properties: {
            'Title': '{{file.name}}',
            'Summary': '{{analysis.summary}}',
            'Category': '{{analysis.category}}',
            'Key Points': '{{analysis.key_points}}',
            'Action Items': '{{analysis.action_items}}',
            'File Link': '{{file.url}}'
          }
        },
        title: 'Create Notion Page',
        description: 'Create analysis record in Notion'
      }
    ],
    connections: [
      { id: 'conn-1', source: 'trigger-1', target: 'ai-1' },
      { id: 'conn-2', source: 'ai-1', target: 'condition-1' },
      { id: 'conn-3', source: 'condition-1', target: 'action-1', sourceHandle: 'true' },
      { id: 'conn-4', source: 'condition-1', target: 'action-2', sourceHandle: 'false' },
      { id: 'conn-5', source: 'action-1', target: 'action-2' }
    ]
  },

  {
    id: 'task-manager',
    name: 'AI Task Manager',
    description: 'Convert emails and messages into tasks, prioritize them with AI, and track progress across platforms',
    category: 'productivity',
    difficulty: 'advanced',
    estimatedSetupTime: 15,
    requiredServices: ['gmail', 'slack', 'linear', 'openai'],
    tags: ['tasks', 'project-management', 'ai', 'productivity'],
    icon: '✅',
    variables: [
      {
        name: 'default_priority',
        type: 'string',
        description: 'Default task priority (low, medium, high, urgent)',
        defaultValue: 'medium',
        required: true
      },
      {
        name: 'auto_assign',
        type: 'boolean',
        description: 'Automatically assign tasks based on content',
        defaultValue: false,
        required: false
      }
    ],
    nodes: [
      {
        id: 'trigger-1',
        type: 'trigger',
        service: 'gmail',
        operation: 'new_email',
        position: { x: 100, y: 100 },
        config: {
          filters: {
            keywords: ['todo', 'task', 'action item', 'please', 'can you']
          }
        },
        title: 'Task Email Received',
        description: 'Detects emails containing tasks'
      },
      {
        id: 'trigger-2',
        type: 'trigger',
        service: 'slack',
        operation: 'message_mention',
        position: { x: 100, y: 200 },
        config: {
          channels: ['#general', '#tasks', '#projects']
        },
        title: 'Slack Task Mention',
        description: 'Detects task mentions in Slack'
      },
      {
        id: 'ai-1',
        type: 'ai',
        service: 'openai',
        operation: 'extract_task_details',
        position: { x: 300, y: 150 },
        config: {
          prompt: 'Extract task details from this message: {{message.content}}. Return JSON with: title, description, priority, due_date, assignee, category, estimated_effort'
        },
        title: 'Extract Task Details',
        description: 'AI extracts structured task information'
      },
      {
        id: 'ai-2',
        type: 'ai',
        service: 'openai',
        operation: 'prioritize_task',
        position: { x: 500, y: 150 },
        config: {
          prompt: 'Analyze this task and determine priority (low/medium/high/urgent) based on: urgency keywords, deadlines, business impact. Task: {{task_details}}'
        },
        title: 'AI Prioritization',
        description: 'AI determines task priority'
      },
      {
        id: 'action-1',
        type: 'action',
        service: 'linear',
        operation: 'create_issue',
        position: { x: 700, y: 150 },
        config: {
          title: '{{task_details.title}}',
          description: '{{task_details.description}}\n\nSource: {{message.source}}\nOriginal message: {{message.content}}',
          priority: '{{ai_priority || default_priority}}',
          dueDate: '{{task_details.due_date}}',
          assignee: '{{task_details.assignee}}',
          labels: ['ai-generated', '{{task_details.category}}']
        },
        title: 'Create Linear Issue',
        description: 'Create task in Linear'
      },
      {
        id: 'condition-1',
        type: 'condition',
        operation: 'check_source',
        position: { x: 900, y: 100 },
        config: {
          variable: 'message.source',
          operator: 'equals',
          value: 'email'
        },
        title: 'From Email?',
        description: 'Check if task came from email'
      },
      {
        id: 'action-2',
        type: 'action',
        service: 'gmail',
        operation: 'send_reply',
        position: { x: 1100, y: 50 },
        config: {
          subject: 'Task Created: {{task_details.title}}',
          body: 'Hi,\n\nI\'ve created a task from your email: "{{task_details.title}}"\n\nTask ID: {{linear_issue.id}}\nPriority: {{ai_priority}}\n\nYou can track progress at: {{linear_issue.url}}\n\nBest regards'
        },
        title: 'Email Confirmation',
        description: 'Send task creation confirmation'
      },
      {
        id: 'action-3',
        type: 'action',
        service: 'slack',
        operation: 'send_message',
        position: { x: 1100, y: 150 },
        config: {
          channel: '{{message.channel}}',
          message: '✅ Task created: {{task_details.title}}\nPriority: {{ai_priority}}\nLinear: {{linear_issue.url}}'
        },
        title: 'Slack Confirmation',
        description: 'Send task creation confirmation to Slack'
      }
    ],
    connections: [
      { id: 'conn-1', source: 'trigger-1', target: 'ai-1' },
      { id: 'conn-2', source: 'trigger-2', target: 'ai-1' },
      { id: 'conn-3', source: 'ai-1', target: 'ai-2' },
      { id: 'conn-4', source: 'ai-2', target: 'action-1' },
      { id: 'conn-5', source: 'action-1', target: 'condition-1' },
      { id: 'conn-6', source: 'condition-1', target: 'action-2', sourceHandle: 'true' },
      { id: 'conn-7', source: 'condition-1', target: 'action-3', sourceHandle: 'false' }
    ]
  },

  {
    id: 'social-media-monitor',
    name: 'AI Social Media Monitor',
    description: 'Monitor social media mentions, analyze sentiment, and automatically respond or escalate issues',
    category: 'integration',
    difficulty: 'advanced',
    estimatedSetupTime: 20,
    requiredServices: ['slack', 'openai', 'gmail'],
    tags: ['social-media', 'monitoring', 'sentiment', 'ai'],
    icon: '📱',
    variables: [
      {
        name: 'brand_keywords',
        type: 'string',
        description: 'Keywords to monitor (comma-separated)',
        defaultValue: 'YourBrand, @yourbrand',
        required: true
      },
      {
        name: 'sentiment_threshold',
        type: 'number',
        description: 'Negative sentiment threshold for escalation (0-1)',
        defaultValue: 0.3,
        required: true
      }
    ],
    nodes: [
      {
        id: 'trigger-1',
        type: 'trigger',
        operation: 'social_mention',
        position: { x: 100, y: 100 },
        config: {
          keywords: '{{brand_keywords}}',
          platforms: ['twitter', 'linkedin', 'facebook'],
          interval: 300 // 5 minutes
        },
        title: 'Social Media Mention',
        description: 'Detects brand mentions on social media'
      },
      {
        id: 'ai-1',
        type: 'ai',
        service: 'openai',
        operation: 'analyze_sentiment',
        position: { x: 300, y: 100 },
        config: {
          prompt: 'Analyze the sentiment of this social media post: {{mention.content}}. Return JSON with: sentiment_score (0-1), sentiment_label (positive/neutral/negative), key_topics, urgency_level, suggested_response'
        },
        title: 'Sentiment Analysis',
        description: 'AI analyzes post sentiment and context'
      },
      {
        id: 'condition-1',
        type: 'condition',
        operation: 'check_sentiment',
        position: { x: 500, y: 100 },
        config: {
          variable: 'sentiment.sentiment_score',
          operator: 'less_than',
          value: '{{sentiment_threshold}}'
        },
        title: 'Negative Sentiment?',
        description: 'Check if sentiment is below threshold'
      },
      {
        id: 'action-1',
        type: 'action',
        service: 'slack',
        operation: 'send_alert',
        position: { x: 700, y: 50 },
        config: {
          channel: '#social-alerts',
          message: '🚨 Negative mention detected!\n\nPlatform: {{mention.platform}}\nAuthor: {{mention.author}}\nContent: {{mention.content}}\nSentiment: {{sentiment.sentiment_label}} ({{sentiment.sentiment_score}})\n\nSuggested response: {{sentiment.suggested_response}}\n\nLink: {{mention.url}}'
        },
        title: 'Alert Team',
        description: 'Send negative sentiment alert to team'
      },
      {
        id: 'action-2',
        type: 'action',
        service: 'slack',
        operation: 'send_message',
        position: { x: 700, y: 150 },
        config: {
          channel: '#social-monitoring',
          message: '📊 New mention: {{mention.platform}}\nSentiment: {{sentiment.sentiment_label}}\nTopics: {{sentiment.key_topics}}\nLink: {{mention.url}}'
        },
        title: 'Log Mention',
        description: 'Log all mentions for tracking'
      },
      {
        id: 'delay-1',
        type: 'delay',
        operation: 'wait',
        position: { x: 900, y: 50 },
        config: {
          duration: 3600, // 1 hour
          unit: 'seconds'
        },
        title: 'Wait for Response',
        description: 'Wait 1 hour for team response'
      },
      {
        id: 'condition-2',
        type: 'condition',
        operation: 'check_response',
        position: { x: 1100, y: 50 },
        config: {
          variable: 'team_responded',
          operator: 'equals',
          value: false
        },
        title: 'Team Responded?',
        description: 'Check if team has responded'
      },
      {
        id: 'action-3',
        type: 'action',
        service: 'gmail',
        operation: 'send_email',
        position: { x: 1300, y: 50 },
        config: {
          to: 'manager@company.com',
          subject: 'Urgent: Unresponded Negative Social Media Mention',
          body: 'A negative social media mention has not been addressed after 1 hour:\n\nPlatform: {{mention.platform}}\nContent: {{mention.content}}\nSentiment Score: {{sentiment.sentiment_score}}\nLink: {{mention.url}}\n\nPlease review and respond immediately.'
        },
        title: 'Escalate to Manager',
        description: 'Escalate unresponded negative mentions'
      }
    ],
    connections: [
      { id: 'conn-1', source: 'trigger-1', target: 'ai-1' },
      { id: 'conn-2', source: 'ai-1', target: 'condition-1' },
      { id: 'conn-3', source: 'condition-1', target: 'action-1', sourceHandle: 'true' },
      { id: 'conn-4', source: 'condition-1', target: 'action-2', sourceHandle: 'false' },
      { id: 'conn-5', source: 'action-1', target: 'delay-1' },
      { id: 'conn-6', source: 'delay-1', target: 'condition-2' },
      { id: 'conn-7', source: 'condition-2', target: 'action-3', sourceHandle: 'true' }
    ]
  },

  {
    id: 'expense-tracker',
    name: 'Smart Expense Tracker',
    description: 'Automatically extract expense information from emails and receipts, categorize them, and create expense reports',
    category: 'productivity',
    difficulty: 'intermediate',
    estimatedSetupTime: 12,
    requiredServices: ['gmail', 'google-drive', 'openai', 'notion'],
    tags: ['expenses', 'receipts', 'finance', 'automation'],
    icon: '💰',
    variables: [
      {
        name: 'expense_categories',
        type: 'string',
        description: 'Expense categories (comma-separated)',
        defaultValue: 'Travel, Meals, Office Supplies, Software, Marketing',
        required: true
      },
      {
        name: 'auto_approve_limit',
        type: 'number',
        description: 'Auto-approve expenses under this amount',
        defaultValue: 50,
        required: true
      }
    ],
    nodes: [
      {
        id: 'trigger-1',
        type: 'trigger',
        service: 'gmail',
        operation: 'new_email',
        position: { x: 100, y: 100 },
        config: {
          filters: {
            keywords: ['receipt', 'invoice', 'purchase', 'expense', 'payment'],
            hasAttachments: true
          }
        },
        title: 'Receipt Email',
        description: 'Detects emails with receipts/invoices'
      },
      {
        id: 'ai-1',
        type: 'ai',
        service: 'openai',
        operation: 'extract_expense_data',
        position: { x: 300, y: 100 },
        config: {
          prompt: 'Extract expense information from this email and attachments: {{email.content}} {{attachments}}. Return JSON with: vendor, amount, date, category, description, tax_amount, payment_method'
        },
        title: 'Extract Expense Data',
        description: 'AI extracts expense details from receipt'
      },
      {
        id: 'ai-2',
        type: 'ai',
        service: 'openai',
        operation: 'categorize_expense',
        position: { x: 500, y: 100 },
        config: {
          prompt: 'Categorize this expense into one of these categories: {{expense_categories}}. Expense: {{expense_data}}. Return the most appropriate category.'
        },
        title: 'Categorize Expense',
        description: 'AI categorizes the expense'
      },
      {
        id: 'condition-1',
        type: 'condition',
        operation: 'check_amount',
        position: { x: 700, y: 100 },
        config: {
          variable: 'expense_data.amount',
          operator: 'less_than',
          value: '{{auto_approve_limit}}'
        },
        title: 'Under Auto-Approve Limit?',
        description: 'Check if expense is under auto-approve limit'
      },
      {
        id: 'action-1',
        type: 'action',
        service: 'notion',
        operation: 'create_expense_record',
        position: { x: 900, y: 50 },
        config: {
          database: 'Expenses',
          properties: {
            'Vendor': '{{expense_data.vendor}}',
            'Amount': '{{expense_data.amount}}',
            'Date': '{{expense_data.date}}',
            'Category': '{{expense_category}}',
            'Description': '{{expense_data.description}}',
            'Status': 'Auto-Approved',
            'Receipt': '{{email.attachments[0].url}}'
          }
        },
        title: 'Auto-Approve Expense',
        description: 'Create approved expense record'
      },
      {
        id: 'action-2',
        type: 'action',
        service: 'notion',
        operation: 'create_expense_record',
        position: { x: 900, y: 150 },
        config: {
          database: 'Expenses',
          properties: {
            'Vendor': '{{expense_data.vendor}}',
            'Amount': '{{expense_data.amount}}',
            'Date': '{{expense_data.date}}',
            'Category': '{{expense_category}}',
            'Description': '{{expense_data.description}}',
            'Status': 'Pending Approval',
            'Receipt': '{{email.attachments[0].url}}'
          }
        },
        title: 'Create Pending Expense',
        description: 'Create expense record for approval'
      },
      {
        id: 'action-3',
        type: 'action',
        service: 'gmail',
        operation: 'send_email',
        position: { x: 1100, y: 150 },
        config: {
          to: 'finance@company.com',
          subject: 'Expense Approval Required: {{expense_data.vendor}} - ${{expense_data.amount}}',
          body: 'An expense requires approval:\n\nVendor: {{expense_data.vendor}}\nAmount: ${{expense_data.amount}}\nCategory: {{expense_category}}\nDate: {{expense_data.date}}\nDescription: {{expense_data.description}}\n\nReceipt attached.\n\nPlease review and approve in Notion.'
        },
        title: 'Request Approval',
        description: 'Send approval request to finance team'
      }
    ],
    connections: [
      { id: 'conn-1', source: 'trigger-1', target: 'ai-1' },
      { id: 'conn-2', source: 'ai-1', target: 'ai-2' },
      { id: 'conn-3', source: 'ai-2', target: 'condition-1' },
      { id: 'conn-4', source: 'condition-1', target: 'action-1', sourceHandle: 'true' },
      { id: 'conn-5', source: 'condition-1', target: 'action-2', sourceHandle: 'false' },
      { id: 'conn-6', source: 'action-2', target: 'action-3' }
    ]
  }
];

export const getTemplatesByCategory = (category: string): WorkflowTemplate[] => {
  return workflowTemplates.filter(template => template.category === category);
};

export const getTemplatesByDifficulty = (difficulty: string): WorkflowTemplate[] => {
  return workflowTemplates.filter(template => template.difficulty === difficulty);
};

export const getTemplatesByService = (service: string): WorkflowTemplate[] => {
  return workflowTemplates.filter(template => 
    template.requiredServices.includes(service)
  );
};

export const searchTemplates = (query: string): WorkflowTemplate[] => {
  const lowerQuery = query.toLowerCase();
  return workflowTemplates.filter(template =>
    template.name.toLowerCase().includes(lowerQuery) ||
    template.description.toLowerCase().includes(lowerQuery) ||
    template.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
};

export default workflowTemplates;