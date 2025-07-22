# Auto Agent Feature - AWS Serverless Implementation

**Version:** 1.0  
**Date:** January 2025  
**Status:** Planning Complete - Ready for Implementation

---

## 1. Feature Overview

The Auto Agent allows users to set up fully automated agents that continuously monitor for optimization opportunities based on the user's plan. Once an opportunity is identified, the agent automatically runs the optimization process.

### User Modes:
- **Review Mode**: Send email with confirmation/review link before deployment
- **Auto-Deploy Mode**: Deploy optimized changes directly and automatically

### Key Benefits:
- Streamlines optimization workflow
- Reduces manual intervention  
- Ensures improvements are implemented efficiently
- Keeps main backend fast and responsive

---

## 2. Architecture Decision

**Chosen Approach: AWS Serverless Architecture**

### Why Serverless:
- ✅ Zero impact on main backend performance (critical for tracker responses)
- ✅ Auto-scaling based on workload
- ✅ Pay-per-use cost model
- ✅ Built-in fault tolerance and retries
- ✅ Easy monitoring and logging

### AWS Services Used:
```typescript
const AWS_SERVICES = {
  EventBridge: 'Schedule cron jobs based on user plans',
  Lambda: 'Process optimizations, AI analysis, notifications',
  SQS: 'Queue jobs with priorities and retry logic',
  RDS: 'Shared PostgreSQL database',
  SES: 'Send review/confirmation emails',
  CloudWatch: 'Logs and metrics'
};
```

---

## 3. System Architecture

```
┌─────────────────────┐    ┌──────────────────────┐    ┌─────────────────────┐
│   Main Backend      │    │   AWS EventBridge    │    │   Lambda Functions  │
│   (Tracker + API)   │    │   (Cron Scheduler)   │    │   (Auto Agent)      │
│                     │    │                      │    │                     │
│ ✅ Fast tracker     │    │ ⏰ Plan-based crons  │    │ 🤖 AI Processing    │
│ ✅ Dashboard API    │────│ ⏰ Trigger events    │────│ 🤖 Optimizations    │
│ ✅ Enable/Disable   │    │ ⏰ Cleanup jobs     │    │ 🤖 Notifications    │
│    Auto Agent      │    │                      │    │                     │
└─────────────────────┘    └──────────────────────┘    └─────────────────────┘
           │                          │                          │
           └──────────────────────────┼──────────────────────────┘
                                     │
                          ┌─────────────────────┐
                          │   Shared Database   │
                          │   (PostgreSQL)      │
                          │   + SQS Queues      │
                          └─────────────────────┘
```

---

## 4. Plan-Based Configuration

### User Plans and Auto Agent Limits:
```typescript
const PLAN_CONFIGS: Record<string, PlanLimits> = {
  basic: {
    optimizationsPerMonth: 10,
    checkFrequency: 'cron(0 0 ? * MON *)', // Weekly on Monday
    maxPages: 50,
    aiModel: 'gpt-3.5-turbo',
    features: ['title-optimization', 'meta-description'],
    triggers: ['manual-only']
  },
  
  pro: {
    optimizationsPerMonth: 100,
    checkFrequency: 'cron(0 0 * * ? *)', // Daily
    maxPages: 500,
    aiModel: 'gpt-4',
    features: ['title-optimization', 'meta-description', 'faq-generation', 'keyword-optimization'],
    triggers: ['new-page', 'score-drop']
  },
  
  enterprise: {
    optimizationsPerMonth: -1, // Unlimited
    checkFrequency: 'cron(0 */6 * * ? *)', // Every 6 hours
    maxPages: -1, // Unlimited
    aiModel: 'claude-3',
    features: ['all'],
    triggers: ['new-page', 'score-drop', 'competitor-change', 'traffic-spike']
  }
};
```

### Job Types and Priorities:
```typescript
enum AutoAgentJobTypes {
  // Scheduled jobs (by user plan)
  BASIC_OPTIMIZATION = 'auto-agent:basic-optimization',
  PRO_OPTIMIZATION = 'auto-agent:pro-optimization', 
  ENTERPRISE_OPTIMIZATION = 'auto-agent:enterprise-optimization',
  
  // Trigger-based jobs
  NEW_PAGE_DETECTED = 'auto-agent:new-page',
  SCORE_DROP_DETECTED = 'auto-agent:score-drop',
  COMPETITOR_CHANGE = 'auto-agent:competitor-change',
  
  // Follow-up jobs
  REVIEW_REMINDER = 'auto-agent:review-reminder',
  DEPLOYMENT_CONFIRMATION = 'auto-agent:deployment-confirm'
}

const JOB_PRIORITIES = {
  ENTERPRISE: 100,
  PRO: 50,
  BASIC: 10,
  TRIGGER_BASED: 75 // High priority for immediate triggers
};
```

---

## 5. Database Schema

### Auto Agent Configuration:
```sql
-- Auto Agent Configuration per Site
CREATE TABLE auto_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  user_plan VARCHAR(20) NOT NULL, -- 'basic', 'pro', 'enterprise'
  mode VARCHAR(20) NOT NULL CHECK (mode IN ('review', 'auto-deploy')),
  is_enabled BOOLEAN DEFAULT true,
  
  -- Schedule configuration
  check_frequency VARCHAR(50), -- cron expression
  next_scheduled_check TIMESTAMP,
  
  -- Limits and usage
  optimizations_this_month INTEGER DEFAULT 0,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  
  -- Trigger configuration
  enabled_triggers TEXT[] DEFAULT '{}',
  trigger_conditions JSONB DEFAULT '{}',
  
  -- Optimization criteria
  optimization_criteria JSONB DEFAULT '{
    "min_score_threshold": 70,
    "content_types": ["title", "meta-description"],
    "page_filters": {
      "min_traffic": 100,
      "max_age_days": 30
    }
  }',
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Job Queue Table (for persistence and monitoring)
CREATE TABLE auto_agent_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id),
  job_type VARCHAR(50) NOT NULL,
  priority INTEGER DEFAULT 10,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  
  -- Job payload
  job_data JSONB NOT NULL,
  
  -- Scheduling
  scheduled_for TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  
  -- Results
  result JSONB,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Usage tracking for plan limits
CREATE TABLE auto_agent_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id),
  month_year VARCHAR(7), -- '2024-07'
  optimizations_used INTEGER DEFAULT 0,
  plan_limit INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(site_id, month_year)
);
```

---

## 6. Main Backend Implementation

### Minimal Backend Changes (Enable/Disable Auto Agent):
```typescript
// backend/src/routes/autoAgent.ts
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';

const eventBridge = new EventBridgeClient({ region: 'us-east-1' });

// Enable Auto Agent
app.post('/api/sites/:siteId/auto-agent/enable', auth, async (req, res) => {
  const { siteId } = req.params;
  const { mode, plan, criteria, schedule } = req.body;
  
  // 1. Save config to database
  await db.insert(autoAgents).values({
    siteId,
    userPlan: plan,
    mode,
    isEnabled: true,
    optimizationCriteria: criteria,
    checkFrequency: PLAN_SCHEDULES[plan]
  });
  
  // 2. Create EventBridge rule for this site
  await eventBridge.send(new PutEventsCommand({
    Entries: [{
      Source: 'clever-search.auto-agent',
      DetailType: 'Auto Agent Enabled',
      Detail: JSON.stringify({
        siteId,
        action: 'enable',
        plan,
        schedule: PLAN_SCHEDULES[plan]
      })
    }]
  }));
  
  res.json({ success: true, message: 'Auto Agent enabled' });
});

// Disable Auto Agent
app.post('/api/sites/:siteId/auto-agent/disable', auth, async (req, res) => {
  const { siteId } = req.params;
  
  // 1. Update database
  await db.update(autoAgents)
    .set({ isEnabled: false })
    .where(eq(autoAgents.siteId, siteId));
  
  // 2. Disable EventBridge rule
  await eventBridge.send(new PutEventsCommand({
    Entries: [{
      Source: 'clever-search.auto-agent',
      DetailType: 'Auto Agent Disabled',
      Detail: JSON.stringify({
        siteId,
        action: 'disable'
      })
    }]
  }));
  
  res.json({ success: true, message: 'Auto Agent disabled' });
});

const PLAN_SCHEDULES = {
  basic: 'cron(0 0 ? * MON *)',     // Weekly Monday
  pro: 'cron(0 0 * * ? *)',        // Daily
  enterprise: 'cron(0 */6 * * ? *)'  // Every 6 hours
};
```

### Trigger Integration (Existing Endpoints):
```typescript
// backend/src/utils/autoAgentTriggers.ts
export async function triggerAutoAgent(triggerType: string, siteId: string, data: any) {
  await lambda.invoke({
    FunctionName: 'auto-agent-triggers',
    InvocationType: 'Event', // Async
    Payload: JSON.stringify({
      triggerType,
      siteId,
      data
    })
  });
}

// Integration in existing sitemap import
app.post('/sites/:siteId/sitemap/import', async (req, res) => {
  // ... existing sitemap import logic ...
  
  // NEW: Trigger auto agent for new pages detected
  const newPages = /* pages discovered in sitemap */;
  
  for (const page of newPages) {
    await triggerAutoAgent('new-page', siteId, { pageUrl: page.url });
  }
});
```

---

## 7. Lambda Functions

### A. Auto Agent Manager Lambda:
```typescript
// lambda/auto-agent-manager/index.ts
export async function autoAgentManagerHandler(event: EventBridgeEvent) {
  const { siteId, action, plan, schedule } = JSON.parse(event.detail);
  
  switch (action) {
    case 'enable':
      await createScheduleRule(siteId, plan, schedule);
      break;
      
    case 'disable':
      await deleteScheduleRule(siteId);
      break;
  }
}

async function createScheduleRule(siteId: string, plan: string, schedule: string) {
  const eventBridge = new EventBridgeClient({});
  
  // Create scheduled rule for this site
  await eventBridge.send(new PutRuleCommand({
    Name: `auto-agent-${siteId}`,
    ScheduleExpression: schedule,
    State: 'ENABLED',
    Description: `Auto Agent for site ${siteId} (${plan} plan)`
  }));
  
  // Add target (SQS queue)
  await eventBridge.send(new PutTargetsCommand({
    Rule: `auto-agent-${siteId}`,
    Targets: [{
      Id: '1',
      Arn: process.env.AUTO_AGENT_QUEUE_ARN,
      SqsParameters: {
        MessageGroupId: siteId
      }
    }]
  }));
}
```

### B. Auto Agent Processor Lambda:
```typescript
// lambda/auto-agent-processor/index.ts
export async function autoAgentProcessorHandler(event: SQSEvent) {
  for (const record of event.Records) {
    const { siteId } = JSON.parse(record.body);
    
    try {
      await processAutoAgent(siteId);
    } catch (error) {
      console.error(`Failed to process auto agent for site ${siteId}:`, error);
      throw error; // Let SQS handle retries
    }
  }
}

async function processAutoAgent(siteId: string) {
  // 1. Get auto agent config from database
  const config = await getAutoAgentConfig(siteId);
  if (!config?.isEnabled) return;
  
  // 2. Check usage limits
  const usage = await getMonthlyUsage(siteId, config.userPlan);
  if (usage.exceeded) {
    console.log(`Site ${siteId} exceeded monthly limit`);
    return;
  }
  
  // 3. Process based on plan
  let result;
  switch (config.userPlan) {
    case 'basic':
      result = await processBasicOptimization(siteId, config);
      break;
    case 'pro':
      result = await processProOptimization(siteId, config);
      break;
    case 'enterprise':
      result = await processEnterpriseOptimization(siteId, config);
      break;
  }
  
  // 4. Handle results (deploy or send for review)
  await handleOptimizationResults(siteId, result, config.mode);
  
  // 5. Update usage stats
  await updateUsageStats(siteId);
}
```

### C. Trigger-Based Lambda:
```typescript
// lambda/auto-agent-triggers/index.ts
export async function autoAgentTriggersHandler(event: any) {
  const { triggerType, siteId, data } = event;
  
  // Check if site has auto agent enabled with this trigger
  const config = await getAutoAgentConfig(siteId);
  if (!config?.isEnabled || !config.enabledTriggers.includes(triggerType)) {
    return;
  }
  
  // Check plan supports this trigger
  const plan = PLAN_CONFIGS[config.userPlan];
  if (!plan.triggers.includes(triggerType)) {
    return;
  }
  
  // Send to SQS for immediate processing
  await sqs.sendMessage({
    QueueUrl: process.env.AUTO_AGENT_QUEUE_URL,
    MessageBody: JSON.stringify({
      siteId,
      trigger: triggerType,
      data,
      priority: 'high' // Triggers get higher priority
    }),
    MessageGroupId: siteId
  });
}
```

---

## 8. AWS Infrastructure Configuration

### SQS Queue Setup:
```yaml
# CloudFormation/CDK for SQS
AutoAgentQueue:
  Type: AWS::SQS::Queue
  Properties:
    QueueName: auto-agent-queue.fifo
    FifoQueue: true
    ContentBasedDeduplication: true
    VisibilityTimeoutSeconds: 900  # 15 minutes for processing
    MessageRetentionPeriod: 1209600  # 14 days
    RedrivePolicy:
      deadLetterTargetArn: !GetAtt AutoAgentDLQ.Arn
      maxReceiveCount: 3

AutoAgentDLQ:
  Type: AWS::SQS::Queue
  Properties:
    QueueName: auto-agent-dlq.fifo
    FifoQueue: true
```

### Lambda Configuration:
```yaml
AutoAgentProcessor:
  Type: AWS::Lambda::Function
  Properties:
    FunctionName: auto-agent-processor
    Runtime: nodejs18.x
    Timeout: 900  # 15 minutes
    MemorySize: 1024
    Environment:
      Variables:
        DATABASE_URL: !Ref DatabaseUrl
        OPENAI_API_KEY: !Ref OpenAIApiKey
    Events:
      SQSEvent:
        Type: SQS
        Properties:
          Queue: !Ref AutoAgentQueue
          BatchSize: 1  # Process one at a time
```

---

## 9. Usage Tracking & Plan Limits

```typescript
// lambda/shared/usageTracker.ts
export class UsageTracker {
  static async checkUsageLimit(siteId: string, plan: string): Promise<{exceeded: boolean, remaining: number}> {
    const currentMonth = new Date().toISOString().slice(0, 7); // '2024-07'
    const planLimit = PLAN_LIMITS[plan].optimizationsPerMonth;
    
    if (planLimit === -1) { // Unlimited
      return { exceeded: false, remaining: -1 };
    }
    
    const usage = await db.select()
      .from(autoAgentUsage)
      .where(
        and(
          eq(autoAgentUsage.siteId, siteId),
          eq(autoAgentUsage.monthYear, currentMonth)
        )
      )
      .limit(1);
    
    const used = usage[0]?.optimizationsUsed || 0;
    return {
      exceeded: used >= planLimit,
      remaining: planLimit - used
    };
  }
  
  static async incrementUsage(siteId: string) {
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    await db.insert(autoAgentUsage)
      .values({
        siteId,
        monthYear: currentMonth,
        optimizationsUsed: 1
      })
      .onConflict(autoAgentUsage.siteId, autoAgentUsage.monthYear)
      .doUpdate({
        optimizationsUsed: sql`${autoAgentUsage.optimizationsUsed} + 1`
      });
  }
}
```

---

## 10. Frontend Dashboard Integration

### Auto Agent Settings UI:
```typescript
// frontend/src/components/AutoAgentSettings.tsx
export function AutoAgentSettings({ siteId }: { siteId: string }) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [mode, setMode] = useState<'review' | 'auto-deploy'>('review');
  const [plan, setPlan] = useState<'basic' | 'pro' | 'enterprise'>('basic');

  const handleEnable = async () => {
    await fetch(`/api/sites/${siteId}/auto-agent/enable`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode,
        plan,
        criteria: {
          min_score_threshold: 70,
          content_types: PLAN_CONFIGS[plan].features
        }
      })
    });
    setIsEnabled(true);
  };

  return (
    <div className="auto-agent-settings">
      <h3>Auto Agent</h3>
      
      <div className="mode-selection">
        <label>
          <input 
            type="radio" 
            value="review" 
            checked={mode === 'review'}
            onChange={(e) => setMode(e.target.value as 'review')}
          />
          Review Mode (email confirmation)
        </label>
        <label>
          <input 
            type="radio" 
            value="auto-deploy" 
            checked={mode === 'auto-deploy'}
            onChange={(e) => setMode(e.target.value as 'auto-deploy')}
          />
          Auto-Deploy Mode (automatic)
        </label>
      </div>

      <button onClick={handleEnable} disabled={isEnabled}>
        {isEnabled ? 'Auto Agent Enabled' : 'Enable Auto Agent'}
      </button>
    </div>
  );
}
```

### Optimization History View:
```typescript
// frontend/src/components/OptimizationHistory.tsx
export function OptimizationHistory({ siteId }: { siteId: string }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetch(`/api/sites/${siteId}/auto-agent/history`)
      .then(res => res.json())
      .then(setHistory);
  }, [siteId]);

  return (
    <div className="optimization-history">
      <h3>Auto Agent History</h3>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Pages Optimized</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {history.map(item => (
            <tr key={item.id}>
              <td>{new Date(item.createdAt).toLocaleDateString()}</td>
              <td>{item.jobType}</td>
              <td>{item.pagesOptimized}</td>
              <td>{item.status}</td>
              <td>
                {item.status === 'pending' && (
                  <button onClick={() => reviewOptimization(item.id)}>
                    Review
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## 11. Cost Estimates

### Monthly AWS Costs (Estimated):

| Plan | Users | Lambda Invocations | SQS Messages | EventBridge Rules | Total/Month |
|------|-------|-------------------|--------------|-------------------|-------------|
| **Basic** | 100 | 400 | 400 | 100 | ~$2 |
| **Pro** | 50 | 1,500 | 1,500 | 50 | ~$5 |
| **Enterprise** | 10 | 4,800 | 4,800 | 10 | ~$12 |

### Per-User Costs:
- **Basic Plan Users**: ~$0.02/month per user
- **Pro Plan Users**: ~$0.10/month per user  
- **Enterprise Users**: ~$1.20/month per user

---

## 12. Implementation Timeline

### Phase 1: Core Infrastructure (Week 1)
- [ ] Database schema migration
- [ ] Basic Lambda functions setup
- [ ] SQS queue configuration
- [ ] EventBridge rules management

### Phase 2: Main Backend Integration (Week 2)
- [ ] Enable/disable Auto Agent endpoints
- [ ] Trigger integration in existing endpoints
- [ ] Usage tracking implementation
- [ ] Plan configuration setup

### Phase 3: Lambda Processing Logic (Week 2-3)
- [ ] Auto Agent processor implementation
- [ ] Plan-based optimization logic
- [ ] Trigger-based processing
- [ ] Notification system (email)

### Phase 4: Frontend Dashboard (Week 3)
- [ ] Auto Agent settings UI
- [ ] Optimization history view
- [ ] Usage tracking display
- [ ] Review/approval interface

### Phase 5: Testing & Deployment (Week 4)
- [ ] End-to-end testing
- [ ] Performance testing
- [ ] Security audit
- [ ] Production deployment

---

## 13. Monitoring & Observability

### Key Metrics to Track:
- Lambda execution duration and errors
- SQS queue depth and processing times
- Database connection pools and query performance
- Auto Agent success/failure rates by plan
- User engagement with Auto Agent features
- Cost optimization opportunities

### CloudWatch Dashboards:
- Auto Agent processing pipeline health
- Per-plan usage and performance metrics
- Error rates and failure analysis
- Cost tracking and optimization

---

## 14. Security Considerations

### AWS IAM Policies:
- Least privilege access for Lambda functions
- Secure database connection management
- API key encryption for external services
- VPC configuration for database access

### Data Protection:
- Encryption in transit and at rest
- Secure handling of user optimization data
- Audit logging for all Auto Agent actions
- Privacy compliance for automated processing

---

This comprehensive implementation guide provides the complete technical specification for the Auto Agent feature using AWS serverless architecture, ensuring optimal performance and cost efficiency while maintaining the speed of the main backend. 