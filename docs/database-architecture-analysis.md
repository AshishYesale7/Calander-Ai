# Database Architecture Analysis for Calendar.ai

## Current State: Firebase Firestore (NoSQL)

### ✅ Current Advantages
- **Rapid Development**: Quick setup and deployment
- **Real-time Updates**: Built-in real-time synchronization
- **Scalability**: Auto-scaling with Google's infrastructure
- **Security**: Built-in authentication and security rules
- **Offline Support**: Client-side caching and offline capabilities
- **Cost-Effective**: Pay-per-use pricing model

### ❌ Current Limitations
- **Complex Queries**: Limited query capabilities, no JOINs
- **Relationships**: Difficult to maintain referential integrity
- **Analytics**: Poor support for complex analytics queries
- **Data Consistency**: Eventual consistency model
- **Vendor Lock-in**: Tied to Google Cloud ecosystem
- **Cost at Scale**: Can become expensive with high usage

## 🎯 Recommended Hybrid Architecture

For Calendar.ai's scaling needs, I recommend a **hybrid approach**:

### Primary Database: PostgreSQL (Relational)
**Use for**: Core business logic, user management, subscriptions, relationships

```sql
-- Users and Authentication
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    subscription_plan_id UUID REFERENCES subscription_plans(id),
    settings JSONB DEFAULT '{}',
    
    -- Indexes for performance
    INDEX idx_users_email ON users(email),
    INDEX idx_users_subscription ON users(subscription_plan_id)
);

-- AI Provider Configurations
CREATE TABLE ai_provider_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider_id VARCHAR(50) NOT NULL,
    access_type VARCHAR(20) NOT NULL, -- 'user_api_key', 'pro_managed', 'free_tier'
    encrypted_api_key TEXT, -- Encrypted with our encryption service
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, provider_id),
    INDEX idx_provider_configs_user ON ai_provider_configs(user_id)
);

-- Subscription Management
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    price_monthly DECIMAL(10,2) NOT NULL,
    price_yearly DECIMAL(10,2) NOT NULL,
    features JSONB NOT NULL,
    ai_providers JSONB NOT NULL,
    limits JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    status VARCHAR(20) NOT NULL,
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    stripe_subscription_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_user_subscriptions_user ON user_subscriptions(user_id),
    INDEX idx_user_subscriptions_status ON user_subscriptions(status)
);

-- Usage Tracking and Analytics
CREATE TABLE token_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider_id VARCHAR(50) NOT NULL,
    model_id VARCHAR(100) NOT NULL,
    input_tokens INTEGER NOT NULL,
    output_tokens INTEGER NOT NULL,
    total_tokens INTEGER NOT NULL,
    cost DECIMAL(10,6) NOT NULL,
    session_id UUID,
    message_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Partitioning by date for performance
    PARTITION BY RANGE (created_at),
    
    -- Indexes for analytics
    INDEX idx_token_usage_user_date ON token_usage(user_id, created_at),
    INDEX idx_token_usage_provider_date ON token_usage(provider_id, created_at)
);

-- MCP Connections
CREATE TABLE mcp_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service_id VARCHAR(50) NOT NULL,
    encrypted_access_token TEXT NOT NULL,
    encrypted_refresh_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_connected BOOLEAN DEFAULT true,
    last_used TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, service_id),
    INDEX idx_mcp_connections_user ON mcp_connections(user_id)
);
```

### Secondary Database: Redis (Caching & Sessions)
**Use for**: Session management, caching, real-time features

```redis
# Session Management
SET session:user:123 '{"userId":"123","expires":1234567890}' EX 3600

# API Rate Limiting
INCR rate_limit:user:123:openai:minute
EXPIRE rate_limit:user:123:openai:minute 60

# Real-time Chat State
HSET chat:session:456 "participants" "user1,user2" "last_activity" "1234567890"

# Caching AI Responses (for similar queries)
SET cache:ai:hash:abc123 '{"response":"...","timestamp":1234567890}' EX 1800
```

### Document Store: Keep Firestore for Specific Use Cases
**Use for**: Chat messages, file metadata, real-time collaboration

```javascript
// Chat Sessions (Keep in Firestore for real-time updates)
{
  id: "chat-session-123",
  userId: "user-456",
  title: "Project Discussion",
  messages: [
    {
      id: "msg-1",
      role: "user",
      content: "Hello",
      timestamp: 1234567890,
      attachments: []
    }
  ],
  createdAt: 1234567890,
  updatedAt: 1234567890
}

// File Metadata (Keep in Firestore for real-time sync)
{
  id: "file-789",
  userId: "user-456",
  name: "document.pdf",
  size: 1024000,
  type: "application/pdf",
  source: "google-drive",
  sourceId: "drive-file-123",
  uploadedAt: 1234567890
}
```

### Search Engine: Elasticsearch/OpenSearch
**Use for**: Full-text search, analytics, log aggregation

```json
{
  "mappings": {
    "properties": {
      "userId": { "type": "keyword" },
      "content": { "type": "text", "analyzer": "standard" },
      "timestamp": { "type": "date" },
      "provider": { "type": "keyword" },
      "model": { "type": "keyword" },
      "tokens": { "type": "integer" },
      "cost": { "type": "float" }
    }
  }
}
```

## 🏗️ Migration Strategy

### Phase 1: Hybrid Setup (Immediate)
1. **Keep Firestore** for chat messages and real-time features
2. **Add PostgreSQL** for user management and subscriptions
3. **Add Redis** for caching and sessions
4. **Implement data synchronization** between systems

### Phase 2: Gradual Migration (3-6 months)
1. **Migrate user data** from Firestore to PostgreSQL
2. **Implement dual-write** pattern during transition
3. **Add analytics** with time-series database
4. **Optimize queries** and add proper indexing

### Phase 3: Full Architecture (6-12 months)
1. **Complete migration** of structured data
2. **Implement microservices** architecture
3. **Add event sourcing** for audit trails
4. **Scale horizontally** with read replicas

## 📊 Performance Comparison

| Feature | Firestore | PostgreSQL | Hybrid |
|---------|-----------|------------|--------|
| **Complex Queries** | ❌ Limited | ✅ Full SQL | ✅ Best of both |
| **Real-time Updates** | ✅ Native | ❌ Requires setup | ✅ Firestore for RT |
| **Relationships** | ❌ Manual | ✅ Foreign keys | ✅ PostgreSQL |
| **Analytics** | ❌ Poor | ✅ Excellent | ✅ PostgreSQL + ES |
| **Scalability** | ✅ Auto | ✅ Manual | ✅ Both |
| **Cost at Scale** | ❌ Expensive | ✅ Predictable | ✅ Optimized |

## 🔧 Implementation Code

### Database Connection Manager
```typescript
// src/lib/database.ts
import { Pool } from 'pg';
import { createClient } from 'redis';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

class DatabaseManager {
  private pgPool: Pool;
  private redisClient: any;
  private firestore: any;

  constructor() {
    // PostgreSQL connection
    this.pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Redis connection
    this.redisClient = createClient({
      url: process.env.REDIS_URL
    });

    // Firestore (keep for real-time features)
    const firebaseApp = initializeApp(firebaseConfig);
    this.firestore = getFirestore(firebaseApp);
  }

  // PostgreSQL queries
  async query(text: string, params?: any[]) {
    const client = await this.pgPool.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  }

  // Redis operations
  async cacheSet(key: string, value: any, ttl?: number) {
    const serialized = JSON.stringify(value);
    if (ttl) {
      await this.redisClient.setEx(key, ttl, serialized);
    } else {
      await this.redisClient.set(key, serialized);
    }
  }

  async cacheGet(key: string) {
    const cached = await this.redisClient.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  // Firestore operations (keep for real-time)
  getFirestore() {
    return this.firestore;
  }
}

export const db = new DatabaseManager();
```

### Updated MCP Manager with PostgreSQL
```typescript
// Update the MCP manager to use PostgreSQL
private async storeConnection(connection: MCPConnection): Promise<void> {
  try {
    // Encrypt sensitive data
    const encryptedAccessToken = encryptionService.encryptForStorage(connection.accessToken);
    const encryptedRefreshToken = connection.refreshToken 
      ? encryptionService.encryptForStorage(connection.refreshToken) 
      : null;

    // Store in PostgreSQL instead of Firestore
    await db.query(`
      INSERT INTO mcp_connections (
        id, user_id, service_id, encrypted_access_token, 
        encrypted_refresh_token, expires_at, is_connected, 
        last_used, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (user_id, service_id) 
      DO UPDATE SET
        encrypted_access_token = $4,
        encrypted_refresh_token = $5,
        expires_at = $6,
        is_connected = $7,
        last_used = $8
    `, [
      connection.id,
      connection.userId,
      connection.serviceId,
      encryptedAccessToken,
      encryptedRefreshToken,
      connection.expiresAt ? new Date(connection.expiresAt) : null,
      connection.isConnected,
      new Date(connection.lastUsed),
      new Date(connection.createdAt)
    ]);

    // Cache in Redis for fast access
    await db.cacheSet(`mcp:${connection.id}`, connection, 3600);
  } catch (error) {
    console.error('Failed to store MCP connection:', error);
    throw error;
  }
}
```

## 🚀 Scaling Recommendations

### Immediate (0-3 months)
1. **Implement the encryption service** I provided above
2. **Add PostgreSQL** for user management and subscriptions
3. **Add Redis** for caching and rate limiting
4. **Keep Firestore** for chat messages (real-time requirement)

### Medium-term (3-6 months)
1. **Migrate user data** to PostgreSQL
2. **Add read replicas** for PostgreSQL
3. **Implement connection pooling** (PgBouncer)
4. **Add monitoring** (DataDog, New Relic)

### Long-term (6+ months)
1. **Microservices architecture** with separate databases per service
2. **Event sourcing** for audit trails and data consistency
3. **CQRS pattern** for read/write separation
4. **Kubernetes deployment** for container orchestration

## 💰 Cost Analysis

### Current Firestore Costs (Estimated)
- **Reads**: $0.36 per million reads
- **Writes**: $1.08 per million writes
- **Storage**: $0.18 per GB/month
- **At 100K users**: ~$2,000-5,000/month

### Hybrid Architecture Costs
- **PostgreSQL (managed)**: $200-500/month
- **Redis (managed)**: $100-300/month
- **Firestore (reduced usage)**: $500-1,000/month
- **Total**: $800-1,800/month (40-60% savings)

## 🎯 Final Recommendation

**Implement the hybrid architecture** with:

1. **PostgreSQL** for structured data, relationships, and analytics
2. **Redis** for caching, sessions, and rate limiting  
3. **Firestore** for real-time chat and collaboration features
4. **Elasticsearch** for search and advanced analytics (later)

This approach gives you:
- ✅ **Best performance** for different use cases
- ✅ **Cost optimization** at scale
- ✅ **Flexibility** to evolve architecture
- ✅ **Reduced vendor lock-in**
- ✅ **Better analytics and reporting**

The migration can be done gradually without disrupting your current users, and you'll be well-positioned for future scaling needs.