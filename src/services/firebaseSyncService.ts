// Enhanced Firebase Sync Service
// Provides cross-device synchronization for workflows, settings, chat history, and automation rules

import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  serverTimestamp,
  writeBatch,
  getDocs
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ChatMessage, AIProvider } from '@/types/ai-providers';
import { EmailAutomationRule } from './emailAutomationService';

export interface SyncedChatSession {
  id: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  deviceId: string;
  activeProviders: string[];
  metadata?: {
    totalTokens: number;
    totalCost: number;
    messageCount: number;
  };
}

export interface SyncedUserSettings {
  userId: string;
  aiSettings: {
    defaultProvider: string;
    defaultModel: string;
    temperature: number;
    maxTokens: number;
    systemPrompt?: string;
    activeProviders: string[];
  };
  mcpSettings: {
    connectedServices: string[];
    serviceConfigs: Record<string, any>;
  };
  automationSettings: {
    emailRules: EmailAutomationRule[];
    workflowTemplates: any[];
    notificationPreferences: {
      email: boolean;
      push: boolean;
      desktop: boolean;
    };
  };
  uiPreferences: {
    theme: 'light' | 'dark' | 'system';
    sidebarCollapsed: boolean;
    defaultChatLayout: 'single' | 'multi';
    fileUploadPreferences: {
      autoAttachFromDrive: boolean;
      defaultCloudProvider: 'google-drive' | 'onedrive' | 'dropbox';
    };
  };
  updatedAt: Date;
  deviceId: string;
}

export interface SyncedWorkflow {
  id: string;
  userId: string;
  name: string;
  description: string;
  nodes: any[];
  connections: any[];
  triggers: any[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deviceId: string;
  executionHistory: {
    timestamp: Date;
    status: 'success' | 'error';
    duration: number;
    logs: string[];
  }[];
}

export interface DeviceInfo {
  id: string;
  userId: string;
  name: string;
  type: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  os: string;
  lastActive: Date;
  syncEnabled: boolean;
}

class FirebaseSyncService {
  private userId: string | null = null;
  private deviceId: string;
  private syncListeners: (() => void)[] = [];

  constructor() {
    this.deviceId = this.generateDeviceId();
  }

  private generateDeviceId(): string {
    // Generate a unique device ID
    const stored = localStorage.getItem('calendar-ai-device-id');
    if (stored) return stored;
    
    const deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('calendar-ai-device-id', deviceId);
    return deviceId;
  }

  async initialize(userId: string): Promise<void> {
    this.userId = userId;
    await this.registerDevice();
    await this.setupSyncListeners();
  }

  private async registerDevice(): Promise<void> {
    if (!this.userId) return;

    const deviceInfo: DeviceInfo = {
      id: this.deviceId,
      userId: this.userId,
      name: this.getDeviceName(),
      type: this.getDeviceType(),
      browser: this.getBrowserInfo(),
      os: this.getOSInfo(),
      lastActive: new Date(),
      syncEnabled: true
    };

    await setDoc(doc(db, 'devices', this.deviceId), {
      ...deviceInfo,
      lastActive: serverTimestamp()
    });
  }

  private getDeviceName(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Mobile')) return 'Mobile Device';
    if (userAgent.includes('Tablet')) return 'Tablet';
    return 'Desktop';
  }

  private getDeviceType(): 'desktop' | 'mobile' | 'tablet' {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Mobile')) return 'mobile';
    if (userAgent.includes('Tablet')) return 'tablet';
    return 'desktop';
  }

  private getBrowserInfo(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private getOSInfo(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  private async setupSyncListeners(): Promise<void> {
    if (!this.userId) return;

    // Listen for settings changes
    const settingsUnsubscribe = onSnapshot(
      doc(db, 'userSettings', this.userId),
      (doc) => {
        if (doc.exists()) {
          const settings = doc.data() as SyncedUserSettings;
          if (settings.deviceId !== this.deviceId) {
            this.handleSettingsSync(settings);
          }
        }
      }
    );

    // Listen for workflow changes
    const workflowsUnsubscribe = onSnapshot(
      query(
        collection(db, 'workflows'),
        where('userId', '==', this.userId),
        orderBy('updatedAt', 'desc')
      ),
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          const workflow = change.doc.data() as SyncedWorkflow;
          if (workflow.deviceId !== this.deviceId) {
            this.handleWorkflowSync(change.type, workflow);
          }
        });
      }
    );

    // Listen for chat session changes
    const chatsUnsubscribe = onSnapshot(
      query(
        collection(db, 'chatSessions'),
        where('userId', '==', this.userId),
        orderBy('updatedAt', 'desc'),
        limit(50)
      ),
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          const chatSession = change.doc.data() as SyncedChatSession;
          if (chatSession.deviceId !== this.deviceId) {
            this.handleChatSync(change.type, chatSession);
          }
        });
      }
    );

    this.syncListeners = [settingsUnsubscribe, workflowsUnsubscribe, chatsUnsubscribe];
  }

  private handleSettingsSync(settings: SyncedUserSettings): void {
    // Emit event for settings sync
    window.dispatchEvent(new CustomEvent('settings-synced', { detail: settings }));
  }

  private handleWorkflowSync(changeType: 'added' | 'modified' | 'removed', workflow: SyncedWorkflow): void {
    // Emit event for workflow sync
    window.dispatchEvent(new CustomEvent('workflow-synced', { 
      detail: { type: changeType, workflow } 
    }));
  }

  private handleChatSync(changeType: 'added' | 'modified' | 'removed', chatSession: SyncedChatSession): void {
    // Emit event for chat sync
    window.dispatchEvent(new CustomEvent('chat-synced', { 
      detail: { type: changeType, chatSession } 
    }));
  }

  // Chat Session Sync Methods
  async saveChatSession(chatSession: Omit<SyncedChatSession, 'deviceId' | 'updatedAt'>): Promise<void> {
    if (!this.userId) return;

    const syncedSession: SyncedChatSession = {
      ...chatSession,
      deviceId: this.deviceId,
      updatedAt: new Date()
    };

    await setDoc(doc(db, 'chatSessions', chatSession.id), {
      ...syncedSession,
      updatedAt: serverTimestamp()
    });
  }

  async getChatSessions(limit: number = 50): Promise<SyncedChatSession[]> {
    if (!this.userId) return [];

    const q = query(
      collection(db, 'chatSessions'),
      where('userId', '==', this.userId),
      orderBy('updatedAt', 'desc'),
      limit(limit)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    })) as SyncedChatSession[];
  }

  async deleteChatSession(sessionId: string): Promise<void> {
    await deleteDoc(doc(db, 'chatSessions', sessionId));
  }

  // User Settings Sync Methods
  async saveUserSettings(settings: Omit<SyncedUserSettings, 'userId' | 'deviceId' | 'updatedAt'>): Promise<void> {
    if (!this.userId) return;

    const syncedSettings: SyncedUserSettings = {
      ...settings,
      userId: this.userId,
      deviceId: this.deviceId,
      updatedAt: new Date()
    };

    await setDoc(doc(db, 'userSettings', this.userId), {
      ...syncedSettings,
      updatedAt: serverTimestamp()
    });
  }

  async getUserSettings(): Promise<SyncedUserSettings | null> {
    if (!this.userId) return null;

    const docSnap = await getDoc(doc(db, 'userSettings', this.userId));
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        ...data,
        updatedAt: data.updatedAt?.toDate()
      } as SyncedUserSettings;
    }
    return null;
  }

  // Workflow Sync Methods
  async saveWorkflow(workflow: Omit<SyncedWorkflow, 'deviceId' | 'updatedAt'>): Promise<void> {
    if (!this.userId) return;

    const syncedWorkflow: SyncedWorkflow = {
      ...workflow,
      deviceId: this.deviceId,
      updatedAt: new Date()
    };

    await setDoc(doc(db, 'workflows', workflow.id), {
      ...syncedWorkflow,
      updatedAt: serverTimestamp()
    });
  }

  async getWorkflows(): Promise<SyncedWorkflow[]> {
    if (!this.userId) return [];

    const q = query(
      collection(db, 'workflows'),
      where('userId', '==', this.userId),
      orderBy('updatedAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    })) as SyncedWorkflow[];
  }

  async deleteWorkflow(workflowId: string): Promise<void> {
    await deleteDoc(doc(db, 'workflows', workflowId));
  }

  // Batch Operations for Efficient Syncing
  async batchSyncChatMessages(sessionId: string, messages: ChatMessage[]): Promise<void> {
    if (!this.userId) return;

    const batch = writeBatch(db);
    
    // Update the chat session with new messages
    const sessionRef = doc(db, 'chatSessions', sessionId);
    batch.update(sessionRef, {
      messages,
      updatedAt: serverTimestamp(),
      deviceId: this.deviceId,
      metadata: {
        messageCount: messages.length,
        totalTokens: messages.reduce((sum, msg) => sum + (msg.metadata?.tokenCount || 0), 0),
        totalCost: messages.reduce((sum, msg) => sum + (msg.metadata?.cost || 0), 0)
      }
    });

    await batch.commit();
  }

  async syncAutomationRules(rules: EmailAutomationRule[]): Promise<void> {
    if (!this.userId) return;

    const settings = await this.getUserSettings();
    if (settings) {
      settings.automationSettings.emailRules = rules;
      await this.saveUserSettings(settings);
    }
  }

  // Device Management
  async getConnectedDevices(): Promise<DeviceInfo[]> {
    if (!this.userId) return [];

    const q = query(
      collection(db, 'devices'),
      where('userId', '==', this.userId),
      orderBy('lastActive', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      lastActive: doc.data().lastActive?.toDate()
    })) as DeviceInfo[];
  }

  async updateDeviceActivity(): Promise<void> {
    if (!this.userId) return;

    await updateDoc(doc(db, 'devices', this.deviceId), {
      lastActive: serverTimestamp()
    });
  }

  async disableDeviceSync(deviceId: string): Promise<void> {
    await updateDoc(doc(db, 'devices', deviceId), {
      syncEnabled: false
    });
  }

  async enableDeviceSync(deviceId: string): Promise<void> {
    await updateDoc(doc(db, 'devices', deviceId), {
      syncEnabled: true
    });
  }

  // Conflict Resolution
  async resolveSettingsConflict(localSettings: any, remoteSettings: SyncedUserSettings): Promise<SyncedUserSettings> {
    // Simple last-write-wins strategy
    // In a more sophisticated implementation, you might merge specific fields
    const localTimestamp = new Date(localSettings.updatedAt || 0);
    const remoteTimestamp = remoteSettings.updatedAt;

    if (remoteTimestamp > localTimestamp) {
      return remoteSettings;
    } else {
      return {
        ...localSettings,
        userId: this.userId!,
        deviceId: this.deviceId,
        updatedAt: new Date()
      };
    }
  }

  // Cleanup and Maintenance
  async cleanupOldChatSessions(daysOld: number = 30): Promise<void> {
    if (!this.userId) return;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const q = query(
      collection(db, 'chatSessions'),
      where('userId', '==', this.userId),
      where('updatedAt', '<', cutoffDate)
    );

    const snapshot = await getDocs(q);
    const batch = writeBatch(db);

    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  }

  async exportUserData(): Promise<{
    settings: SyncedUserSettings | null;
    chatSessions: SyncedChatSession[];
    workflows: SyncedWorkflow[];
    devices: DeviceInfo[];
  }> {
    const [settings, chatSessions, workflows, devices] = await Promise.all([
      this.getUserSettings(),
      this.getChatSessions(1000), // Export all chat sessions
      this.getWorkflows(),
      this.getConnectedDevices()
    ]);

    return {
      settings,
      chatSessions,
      workflows,
      devices
    };
  }

  // Event Listeners for Real-time Sync
  onSettingsSync(callback: (settings: SyncedUserSettings) => void): () => void {
    const handler = (event: CustomEvent) => callback(event.detail);
    window.addEventListener('settings-synced', handler as EventListener);
    return () => window.removeEventListener('settings-synced', handler as EventListener);
  }

  onWorkflowSync(callback: (type: string, workflow: SyncedWorkflow) => void): () => void {
    const handler = (event: CustomEvent) => callback(event.detail.type, event.detail.workflow);
    window.addEventListener('workflow-synced', handler as EventListener);
    return () => window.removeEventListener('workflow-synced', handler as EventListener);
  }

  onChatSync(callback: (type: string, chatSession: SyncedChatSession) => void): () => void {
    const handler = (event: CustomEvent) => callback(event.detail.type, event.detail.chatSession);
    window.addEventListener('chat-synced', handler as EventListener);
    return () => window.removeEventListener('chat-synced', handler as EventListener);
  }

  // Cleanup
  destroy(): void {
    this.syncListeners.forEach(unsubscribe => unsubscribe());
    this.syncListeners = [];
  }
}

// Export singleton instance
export const firebaseSyncService = new FirebaseSyncService();
export default firebaseSyncService;