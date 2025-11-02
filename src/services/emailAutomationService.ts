// Intelligent Email Automation Service
// Integrates with Gmail MCP for automated email handling, deadline notifications, and smart composition

import { globalAIService } from './globalAIService';
import { mcpManager } from './mcp/mcpManager';
import { FileAttachment } from '@/types/ai-providers';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  tone: 'formal' | 'casual' | 'friendly' | 'urgent';
  category: 'meeting' | 'follow-up' | 'request' | 'update' | 'deadline';
}

export interface EmailAutomationRule {
  id: string;
  name: string;
  trigger: {
    type: 'keyword' | 'sender' | 'deadline' | 'calendar_event' | 'file_received';
    value: string;
    conditions?: string[];
  };
  action: {
    type: 'auto_reply' | 'forward' | 'categorize' | 'create_task' | 'schedule_reminder';
    template?: string;
    recipient?: string;
    delay?: number; // minutes
  };
  enabled: boolean;
}

export interface SmartEmailComposition {
  recipient: string;
  subject: string;
  body: string;
  attachments?: FileAttachment[];
  priority: 'low' | 'normal' | 'high';
  scheduledSend?: Date;
  followUpReminder?: Date;
}

class EmailAutomationService {
  private templates: EmailTemplate[] = [
    {
      id: 'meeting_request',
      name: 'Meeting Request',
      subject: 'Meeting Request: {topic}',
      body: `Hi {recipient},

I hope this email finds you well. I would like to schedule a meeting to discuss {topic}.

Proposed times:
- {time_option_1}
- {time_option_2}
- {time_option_3}

Please let me know which time works best for you, or suggest alternative times if none of these work.

Best regards,
{sender_name}`,
      tone: 'formal',
      category: 'meeting'
    },
    {
      id: 'follow_up',
      name: 'Follow Up',
      subject: 'Following up on {topic}',
      body: `Hi {recipient},

I wanted to follow up on our previous conversation about {topic}. 

{follow_up_details}

Please let me know if you need any additional information or if there's anything I can help with.

Best regards,
{sender_name}`,
      tone: 'friendly',
      category: 'follow-up'
    },
    {
      id: 'deadline_reminder',
      name: 'Deadline Reminder',
      subject: 'Reminder: {task} due {deadline}',
      body: `Hi {recipient},

This is a friendly reminder that {task} is due on {deadline}.

{additional_details}

Please let me know if you need any assistance or if there are any blockers.

Best regards,
{sender_name}`,
      tone: 'friendly',
      category: 'deadline'
    },
    {
      id: 'file_sharing',
      name: 'File Sharing',
      subject: 'Sharing: {file_description}',
      body: `Hi {recipient},

I'm sharing {file_description} with you as requested.

{file_context}

Please let me know if you have any questions or need additional information.

Best regards,
{sender_name}`,
      tone: 'casual',
      category: 'update'
    }
  ];

  private automationRules: EmailAutomationRule[] = [];

  async initialize(userId: string): Promise<void> {
    // Load user's automation rules
    await this.loadAutomationRules(userId);
  }

  private async loadAutomationRules(userId: string): Promise<void> {
    // In a real implementation, this would load from Firebase
    // For now, we'll use default rules
    this.automationRules = [
      {
        id: 'urgent_auto_reply',
        name: 'Urgent Email Auto-Reply',
        trigger: {
          type: 'keyword',
          value: 'urgent',
          conditions: ['subject_contains', 'body_contains']
        },
        action: {
          type: 'auto_reply',
          template: 'urgent_acknowledgment',
          delay: 5
        },
        enabled: true
      },
      {
        id: 'deadline_reminder',
        name: 'Deadline Reminder',
        trigger: {
          type: 'deadline',
          value: '24_hours_before'
        },
        action: {
          type: 'schedule_reminder',
          delay: 1440 // 24 hours in minutes
        },
        enabled: true
      }
    ];
  }

  async composeSmartEmail(
    context: string,
    options: {
      recipient?: string;
      subject?: string;
      tone?: 'formal' | 'casual' | 'friendly' | 'urgent';
      purpose?: 'meeting' | 'follow-up' | 'request' | 'update' | 'deadline';
      attachments?: FileAttachment[];
      userProfile?: any;
      calendarContext?: any[];
      emailHistory?: any[];
    }
  ): Promise<SmartEmailComposition> {
    
    // Use AI to analyze context and generate email
    const emailPrompt = `
    Compose a professional email based on the following context:
    
    Context: ${context}
    Recipient: ${options.recipient || 'Not specified'}
    Purpose: ${options.purpose || 'general'}
    Tone: ${options.tone || 'professional'}
    
    ${options.calendarContext ? `Calendar context: ${JSON.stringify(options.calendarContext)}` : ''}
    ${options.emailHistory ? `Recent email history: ${JSON.stringify(options.emailHistory)}` : ''}
    
    Please generate:
    1. An appropriate subject line
    2. A well-structured email body
    3. Suggested priority level (low/normal/high)
    
    Format the response as JSON with fields: subject, body, priority, suggestedFollowUp
    `;

    const aiResponse = await globalAIService.executeOperation('rewrite', emailPrompt, {
      temperature: 0.7,
      maxTokens: 1000
    });

    if (!aiResponse.success) {
      throw new Error('Failed to compose email: ' + aiResponse.error);
    }

    try {
      const emailData = JSON.parse(aiResponse.result!);
      
      return {
        recipient: options.recipient || '',
        subject: emailData.subject || options.subject || 'Email from Calendar.ai',
        body: emailData.body || context,
        attachments: options.attachments || [],
        priority: emailData.priority || 'normal',
        followUpReminder: emailData.suggestedFollowUp ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : undefined
      };
    } catch (error) {
      // Fallback if JSON parsing fails
      return {
        recipient: options.recipient || '',
        subject: options.subject || 'Email from Calendar.ai',
        body: aiResponse.result!,
        attachments: options.attachments || [],
        priority: 'normal'
      };
    }
  }

  async sendEmail(composition: SmartEmailComposition): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!await mcpManager.isServiceConnected('gmail')) {
        throw new Error('Gmail service not connected');
      }

      // Prepare email data for Gmail MCP
      const emailData = {
        to: composition.recipient,
        subject: composition.subject,
        body: composition.body,
        attachments: composition.attachments?.map(att => ({
          filename: att.name,
          content: att.file,
          contentType: att.type
        })),
        priority: composition.priority,
        scheduledSend: composition.scheduledSend
      };

      // Send via Gmail MCP
      const result = await mcpManager.executeTool('gmail', 'send_email', emailData);
      
      if (result.success) {
        // Schedule follow-up reminder if specified
        if (composition.followUpReminder) {
          await this.scheduleFollowUpReminder(composition, result.messageId);
        }
        
        return { success: true, messageId: result.messageId };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async checkIncomingEmails(): Promise<{
    newEmails: any[];
    urgentEmails: any[];
    deadlineEmails: any[];
    automationTriggered: string[];
  }> {
    try {
      if (!await mcpManager.isServiceConnected('gmail')) {
        return { newEmails: [], urgentEmails: [], deadlineEmails: [], automationTriggered: [] };
      }

      // Get recent emails
      const emails = await mcpManager.executeTool('gmail', 'list_emails', {
        query: 'is:unread',
        maxResults: 50
      });

      if (!emails.success) {
        throw new Error('Failed to fetch emails');
      }

      const newEmails = emails.data || [];
      const urgentEmails = newEmails.filter((email: any) => 
        email.subject?.toLowerCase().includes('urgent') || 
        email.body?.toLowerCase().includes('urgent') ||
        email.priority === 'high'
      );

      const deadlineEmails = newEmails.filter((email: any) => 
        this.containsDeadlineKeywords(email.subject + ' ' + email.body)
      );

      // Process automation rules
      const automationTriggered: string[] = [];
      for (const email of newEmails) {
        const triggeredRules = await this.processEmailAutomation(email);
        automationTriggered.push(...triggeredRules);
      }

      return {
        newEmails,
        urgentEmails,
        deadlineEmails,
        automationTriggered
      };
    } catch (error) {
      console.error('Failed to check incoming emails:', error);
      return { newEmails: [], urgentEmails: [], deadlineEmails: [], automationTriggered: [] };
    }
  }

  private containsDeadlineKeywords(text: string): boolean {
    const deadlineKeywords = [
      'deadline', 'due date', 'expires', 'urgent', 'asap', 'immediately',
      'by end of day', 'eod', 'by tomorrow', 'this week', 'next week'
    ];
    
    const lowerText = text.toLowerCase();
    return deadlineKeywords.some(keyword => lowerText.includes(keyword));
  }

  private async processEmailAutomation(email: any): Promise<string[]> {
    const triggeredRules: string[] = [];

    for (const rule of this.automationRules) {
      if (!rule.enabled) continue;

      let shouldTrigger = false;

      switch (rule.trigger.type) {
        case 'keyword':
          shouldTrigger = this.checkKeywordTrigger(email, rule.trigger);
          break;
        case 'sender':
          shouldTrigger = email.from?.includes(rule.trigger.value);
          break;
        case 'deadline':
          shouldTrigger = this.containsDeadlineKeywords(email.subject + ' ' + email.body);
          break;
      }

      if (shouldTrigger) {
        await this.executeAutomationAction(email, rule);
        triggeredRules.push(rule.name);
      }
    }

    return triggeredRules;
  }

  private checkKeywordTrigger(email: any, trigger: any): boolean {
    const keyword = trigger.value.toLowerCase();
    const emailText = (email.subject + ' ' + email.body).toLowerCase();
    
    if (trigger.conditions?.includes('subject_contains')) {
      return email.subject?.toLowerCase().includes(keyword);
    }
    
    if (trigger.conditions?.includes('body_contains')) {
      return email.body?.toLowerCase().includes(keyword);
    }
    
    return emailText.includes(keyword);
  }

  private async executeAutomationAction(email: any, rule: EmailAutomationRule): Promise<void> {
    switch (rule.action.type) {
      case 'auto_reply':
        await this.sendAutoReply(email, rule.action.template);
        break;
      case 'forward':
        await this.forwardEmail(email, rule.action.recipient);
        break;
      case 'categorize':
        await this.categorizeEmail(email, rule.action.template);
        break;
      case 'create_task':
        await this.createTaskFromEmail(email);
        break;
      case 'schedule_reminder':
        await this.scheduleEmailReminder(email, rule.action.delay);
        break;
    }
  }

  private async sendAutoReply(email: any, templateId?: string): Promise<void> {
    const replySubject = `Re: ${email.subject}`;
    const replyBody = `Thank you for your email. I have received your message and will respond as soon as possible.

This is an automated response from Calendar.ai.

Original message:
${email.body?.substring(0, 200)}...`;

    await this.sendEmail({
      recipient: email.from,
      subject: replySubject,
      body: replyBody,
      priority: 'normal'
    });
  }

  private async forwardEmail(email: any, recipient?: string): Promise<void> {
    if (!recipient) return;

    const forwardSubject = `Fwd: ${email.subject}`;
    const forwardBody = `---------- Forwarded message ---------
From: ${email.from}
Date: ${email.date}
Subject: ${email.subject}

${email.body}`;

    await this.sendEmail({
      recipient,
      subject: forwardSubject,
      body: forwardBody,
      priority: 'normal'
    });
  }

  private async categorizeEmail(email: any, category?: string): Promise<void> {
    // Add label/category to email via Gmail API
    if (await mcpManager.isServiceConnected('gmail')) {
      await mcpManager.executeTool('gmail', 'add_label', {
        messageId: email.id,
        label: category || 'Automated'
      });
    }
  }

  private async createTaskFromEmail(email: any): Promise<void> {
    // Extract task details from email using AI
    const taskPrompt = `Extract task details from this email:
    
    Subject: ${email.subject}
    Body: ${email.body}
    
    Return JSON with: title, description, dueDate, priority`;

    const aiResponse = await globalAIService.executeOperation('analyze', taskPrompt);
    
    if (aiResponse.success) {
      try {
        const taskData = JSON.parse(aiResponse.result!);
        // Here you would integrate with a task management system
        console.log('Task created from email:', taskData);
      } catch (error) {
        console.error('Failed to parse task data:', error);
      }
    }
  }

  private async scheduleEmailReminder(email: any, delayMinutes?: number): Promise<void> {
    const reminderTime = new Date(Date.now() + (delayMinutes || 60) * 60 * 1000);
    
    // Schedule reminder (in a real implementation, this would use a job queue)
    setTimeout(async () => {
      await this.sendEmail({
        recipient: email.to, // Send to original recipient
        subject: `Reminder: ${email.subject}`,
        body: `This is a reminder about the email: "${email.subject}"

Original message:
${email.body?.substring(0, 300)}...`,
        priority: 'normal'
      });
    }, (delayMinutes || 60) * 60 * 1000);
  }

  private async scheduleFollowUpReminder(composition: SmartEmailComposition, messageId?: string): Promise<void> {
    if (!composition.followUpReminder) return;

    const delay = composition.followUpReminder.getTime() - Date.now();
    
    setTimeout(async () => {
      // Send follow-up reminder to sender
      await this.sendEmail({
        recipient: composition.recipient,
        subject: `Follow-up: ${composition.subject}`,
        body: `Hi,

I wanted to follow up on my previous email about "${composition.subject}".

Please let me know if you need any additional information or if there's anything I can help with.

Best regards`,
        priority: 'normal'
      });
    }, delay);
  }

  async analyzeEmailWithFiles(email: any, attachments: FileAttachment[]): Promise<string> {
    let analysisPrompt = `Analyze this email and its attachments:

Email Subject: ${email.subject}
Email Body: ${email.body}
From: ${email.from}

Attachments:`;

    for (const attachment of attachments) {
      analysisPrompt += `\n- ${attachment.name} (${attachment.type})`;
      
      // If it's a text file, include content
      if (attachment.type.startsWith('text/') && attachment.file) {
        try {
          const content = await attachment.file.text();
          analysisPrompt += `\nContent preview: ${content.substring(0, 500)}...`;
        } catch (error) {
          console.error('Failed to read file content:', error);
        }
      }
    }

    analysisPrompt += `\n\nProvide insights about:
1. Email purpose and urgency
2. Key information from attachments
3. Suggested actions or responses
4. Any deadlines or important dates mentioned`;

    const analysis = await globalAIService.executeOperation('analyze', analysisPrompt);
    return analysis.success ? analysis.result! : 'Failed to analyze email and attachments';
  }

  getTemplates(): EmailTemplate[] {
    return this.templates;
  }

  getAutomationRules(): EmailAutomationRule[] {
    return this.automationRules;
  }

  async addAutomationRule(rule: Omit<EmailAutomationRule, 'id'>): Promise<string> {
    const newRule: EmailAutomationRule = {
      ...rule,
      id: `rule-${Date.now()}`
    };
    
    this.automationRules.push(newRule);
    // In a real implementation, save to Firebase
    
    return newRule.id;
  }

  async updateAutomationRule(ruleId: string, updates: Partial<EmailAutomationRule>): Promise<boolean> {
    const ruleIndex = this.automationRules.findIndex(r => r.id === ruleId);
    if (ruleIndex === -1) return false;
    
    this.automationRules[ruleIndex] = { ...this.automationRules[ruleIndex], ...updates };
    // In a real implementation, save to Firebase
    
    return true;
  }

  async deleteAutomationRule(ruleId: string): Promise<boolean> {
    const ruleIndex = this.automationRules.findIndex(r => r.id === ruleId);
    if (ruleIndex === -1) return false;
    
    this.automationRules.splice(ruleIndex, 1);
    // In a real implementation, save to Firebase
    
    return true;
  }
}

// Export singleton instance
export const emailAutomationService = new EmailAutomationService();
export default emailAutomationService;