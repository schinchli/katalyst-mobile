/**
 * Exam Guide definitions — single edit point when AWS updates an exam guide.
 *
 * DESIGN PRINCIPLES
 * ─────────────────
 * 1. DOMAIN WEIGHTS drive recommendation priority.
 *    Updating a weight here automatically reprioritises the feed — no other files change.
 *
 * 2. SHARED TOPICS power cross-exam overlap detection.
 *    If you scored ≥70% in a domain whose sharedTopics overlap another exam's domain,
 *    that overlapping domain gets lower urgency — you study it once, not twice.
 *
 * 3. TASK KEYWORDS are used for wrong-answer signal matching.
 *    Precise task-level keywords surface better content after a failed quiz.
 *
 * HOW TO UPDATE
 * ─────────────
 * - New guide version: bump `version` + `lastSyncedDate`, adjust domain weights/tasks.
 * - New quiz for an exam: set `primaryQuizId` or add to `warmupQuizIds`.
 * - New exam: add an entry to EXAM_GUIDES — recommendations adapt automatically.
 *
 * NOTE ON EXAM CODES
 * ──────────────────
 * Internal key = our app's ID (stable, used in quiz categories and stores).
 * examCode     = the official AWS cert code shown on certificates.
 * `aip-c01` internal key → `AIF-C01` AWS code (AI Practitioner Foundational).
 * `aip-pro-c01` internal key → `AIP-C01` AWS code (GenAI Developer Professional).
 *
 * Sources: https://docs.aws.amazon.com/aws-certification/latest/examguides/
 */

// ─── Shared topic taxonomy ────────────────────────────────────────────────────
// Topics that appear across multiple exams. If you mastered a topic in exam A,
// you only need to cover the delta in exam B, not the full domain again.

export const SHARED_TOPICS = {
  // Foundation
  'aws-core':              'Core AWS services, cloud value prop, well-architected',
  'cost-billing':          'Pricing models, cost management, billing tools',
  // Security
  'security-iam':          'IAM, identity, roles, policies, least privilege',
  'security-encryption':   'Encryption, KMS, certificates, data protection',
  'security-compliance':   'Compliance, governance, auditing, CloudTrail, Config',
  'security-network':      'WAF, Shield, GuardDuty, network security',
  // Compute & Networking
  'compute-ec2':           'EC2, instance types, auto scaling, AMI',
  'compute-serverless':    'Lambda, Fargate, containers, ECS/EKS',
  'networking-vpc':        'VPC, subnets, IGW, NAT, security groups, VPN',
  'networking-cdn':        'CloudFront, Route 53, ELB, global infrastructure',
  // Storage & Data
  'storage-s3':            'S3, object storage, lifecycle, Glacier',
  'storage-block-file':    'EBS, EFS, block and file storage',
  'database-relational':   'RDS, Aurora, relational databases, DMS',
  'database-nosql':        'DynamoDB, ElastiCache, NoSQL patterns',
  // Operations
  'monitoring':            'CloudWatch, CloudTrail, X-Ray, logging, alerting',
  'devops-cicd':           'CI/CD, CodePipeline, CodeBuild, CodeDeploy',
  'devops-iac':            'CloudFormation, CDK, infrastructure as code',
  // AI / ML
  'ai-ml-fundamentals':    'ML lifecycle, SageMaker, model training and evaluation',
  'ai-genai':              'Generative AI, LLMs, foundation models, prompting',
  'ai-bedrock':            'Amazon Bedrock, model APIs, customization, throughput',
  'ai-rag':                'RAG, knowledge bases, vector stores, embeddings',
} as const;

export type SharedTopicId = keyof typeof SHARED_TOPICS;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TaskStatement {
  id: string;
  description: string;
  keywords: string[];
}

export interface DomainSpec {
  id: string;
  name: string;
  weight: number;
  tasks: TaskStatement[];
  sharedTopics: SharedTopicId[];
  primaryQuizId: string;   // '' if quiz not yet built
  warmupQuizIds: string[];
}

export interface ExamGuide {
  examCode: string;
  examName: string;
  level: 'Foundational' | 'Associate' | 'Professional' | 'Specialty';
  version: string;
  lastSyncedDate: string;
  prerequisiteExamCodes: string[];  // exams whose content substantially overlaps
  domains: DomainSpec[];
}

// ─────────────────────────────────────────────────────────────────────────────
// CLF-C02 — AWS Certified Cloud Practitioner (Foundational)
// ─────────────────────────────────────────────────────────────────────────────
const CLF_C02: ExamGuide = {
  examCode: 'CLF-C02',
  examName: 'AWS Certified Cloud Practitioner',
  level: 'Foundational',
  version: '1.0',
  lastSyncedDate: '2026-04-17',
  prerequisiteExamCodes: [],
  domains: [
    {
      id: 'clf-d1',
      name: 'Cloud Concepts',
      weight: 24,
      sharedTopics: ['aws-core', 'cost-billing'],
      tasks: [
        { id: '1.1', description: 'Benefits of the AWS Cloud', keywords: ['cloud benefit', 'elasticity', 'scalability', 'high availability', 'global reach', 'economies of scale', 'on-demand', 'pay-as-you-go', 'agility'] },
        { id: '1.2', description: 'Design principles of the AWS Cloud', keywords: ['well-architected', 'design principle', 'operational excellence', 'reliability', 'performance efficiency', 'sustainability', 'five pillars'] },
        { id: '1.3', description: 'Migration strategies', keywords: ['migration', 'lift-and-shift', '6r', 'rehost', 'replatform', 'refactor', 'repurchase', 'retain', 'retire', 'cloud adoption framework', 'caf'] },
        { id: '1.4', description: 'Cloud economics', keywords: ['tco', 'total cost of ownership', 'capex', 'opex', 'capital expense', 'operational expense', 'fixed cost', 'variable cost', 'aws pricing calculator'] },
      ],
      primaryQuizId: 'clf-c02-cloud-concepts',
      warmupQuizIds: [],
    },
    {
      id: 'clf-d2',
      name: 'Security and Compliance',
      weight: 30,
      sharedTopics: ['security-iam', 'security-encryption', 'security-compliance', 'security-network'],
      tasks: [
        { id: '2.1', description: 'Shared responsibility model', keywords: ['shared responsibility', 'customer responsibility', 'aws responsibility', 'security of the cloud', 'security in the cloud'] },
        { id: '2.2', description: 'Security, governance, and compliance', keywords: ['compliance', 'gdpr', 'hipaa', 'pci dss', 'sox', 'cloudtrail', 'aws config', 'audit', 'governance', 'artifact'] },
        { id: '2.3', description: 'Access management', keywords: ['iam', 'identity', 'user', 'group', 'role', 'policy', 'permission', 'mfa', 'root account', 'access key', 'least privilege', 'federation', 'sso', 'scp'] },
        { id: '2.4', description: 'Security resources and services', keywords: ['guardduty', 'inspector', 'shield', 'waf', 'macie', 'security hub', 'detective', 'kms', 'encryption', 'secrets manager', 'ddos'] },
      ],
      primaryQuizId: 'clf-c02-security',
      warmupQuizIds: ['security-compliance'],
    },
    {
      id: 'clf-d3',
      name: 'Cloud Technology and Services',
      weight: 34,
      sharedTopics: ['aws-core', 'compute-ec2', 'compute-serverless', 'networking-vpc', 'networking-cdn', 'storage-s3', 'storage-block-file', 'database-relational', 'database-nosql', 'monitoring'],
      tasks: [
        { id: '3.1', description: 'Deployment and operations', keywords: ['cloudformation', 'elastic beanstalk', 'cdk', 'cli', 'sdk', 'console', 'infrastructure as code', 'iac', 'codepipeline', 'codedeploy'] },
        { id: '3.2', description: 'Global infrastructure', keywords: ['region', 'availability zone', 'az', 'local zone', 'edge location', 'global infrastructure', 'data residency'] },
        { id: '3.3', description: 'Compute services', keywords: ['ec2', 'lambda', 'ecs', 'eks', 'fargate', 'lightsail', 'batch', 'auto scaling', 'serverless', 'container', 'instance type', 'ami'] },
        { id: '3.4', description: 'Database services', keywords: ['rds', 'dynamodb', 'aurora', 'elasticache', 'redshift', 'neptune', 'documentdb', 'database migration', 'dms', 'nosql', 'relational'] },
        { id: '3.5', description: 'Network services', keywords: ['vpc', 'subnet', 'internet gateway', 'nat gateway', 'route53', 'cloudfront', 'direct connect', 'vpn', 'transit gateway', 'security group', 'nacl', 'elb', 'alb', 'nlb'] },
        { id: '3.6', description: 'Storage services', keywords: ['s3', 'ebs', 'efs', 'glacier', 'storage gateway', 'fsx', 'snow family', 'snowball', 's3 intelligent-tiering', 's3 lifecycle', 'object storage', 'block storage'] },
        { id: '3.7', description: 'AI and ML services', keywords: ['rekognition', 'comprehend', 'textract', 'polly', 'transcribe', 'translate', 'lex', 'sagemaker', 'kinesis', 'glue', 'athena', 'quicksight', 'emr'] },
        { id: '3.8', description: 'Other in-scope services', keywords: ['sns', 'sqs', 'eventbridge', 'step functions', 'api gateway', 'ses', 'pinpoint', 'iot', 'amplify', 'connect', 'messaging', 'notification'] },
      ],
      primaryQuizId: 'clf-c02-technology',
      warmupQuizIds: ['serverless', 'networking', 'databases'],
    },
    {
      id: 'clf-d4',
      name: 'Billing, Pricing, and Support',
      weight: 12,
      sharedTopics: ['cost-billing'],
      tasks: [
        { id: '4.1', description: 'Pricing models', keywords: ['on-demand', 'reserved instance', 'spot instance', 'savings plan', 'dedicated host', 'pricing model', 'compute savings plan', 'convertible'] },
        { id: '4.2', description: 'Billing and cost management tools', keywords: ['cost explorer', 'budgets', 'billing dashboard', 'cost and usage report', 'cur', 'consolidated billing', 'cost allocation tag', 'aws organizations'] },
        { id: '4.3', description: 'Support options', keywords: ['support plan', 'basic support', 'developer support', 'business support', 'enterprise support', 'trusted advisor', 'personal health dashboard', 'knowledge center'] },
      ],
      primaryQuizId: 'clf-c02-billing',
      warmupQuizIds: ['cost-optimization'],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// AIF-C01 — AWS Certified AI Practitioner (Foundational)
// Internal key: aip-c01  |  AWS cert code: AIF-C01
// ─────────────────────────────────────────────────────────────────────────────
const AIF_C01: ExamGuide = {
  examCode: 'AIF-C01',
  examName: 'AWS Certified AI Practitioner',
  level: 'Foundational',
  version: '1.0',
  lastSyncedDate: '2026-04-17',
  prerequisiteExamCodes: [],
  domains: [
    {
      id: 'aif-d1',
      name: 'Fundamentals of AI and ML',
      weight: 20,
      sharedTopics: ['ai-ml-fundamentals'],
      tasks: [
        { id: '1.1', description: 'Basic AI concepts and terminologies', keywords: ['artificial intelligence', 'machine learning', 'deep learning', 'neural network', 'supervised learning', 'unsupervised learning', 'reinforcement learning', 'training data', 'inference'] },
        { id: '1.2', description: 'Practical use cases for AI', keywords: ['computer vision', 'natural language processing', 'nlp', 'object detection', 'recommendation system', 'anomaly detection', 'classification', 'regression', 'forecast'] },
        { id: '1.3', description: 'ML development lifecycle', keywords: ['data collection', 'feature engineering', 'model training', 'evaluation', 'model deployment', 'bias', 'variance', 'overfitting', 'underfitting', 'cross-validation', 'confusion matrix', 'precision', 'recall', 'f1'] },
      ],
      primaryQuizId: 'aip-c01-rag-foundations',
      warmupQuizIds: [],
    },
    {
      id: 'aif-d2',
      name: 'Fundamentals of Generative AI',
      weight: 24,
      sharedTopics: ['ai-genai', 'ai-bedrock'],
      tasks: [
        { id: '2.1', description: 'Basic concepts of generative AI', keywords: ['generative ai', 'large language model', 'llm', 'foundation model', 'diffusion model', 'multimodal', 'token', 'context window', 'hallucination', 'grounding'] },
        { id: '2.2', description: 'Capabilities and limitations of generative AI', keywords: ['prompt engineering', 'few-shot', 'zero-shot', 'chain-of-thought', 'temperature', 'top-p', 'inference parameter', 'summarization', 'extraction', 'code generation'] },
        { id: '2.3', description: 'AWS infrastructure for generative AI', keywords: ['bedrock', 'amazon bedrock', 'titan', 'claude', 'llama', 'nova', 'model id', 'converse api', 'invocation', 'model catalog', 'playground'] },
      ],
      primaryQuizId: 'aip-c01-rag-foundations',
      warmupQuizIds: [],
    },
    {
      id: 'aif-d3',
      name: 'Applications of Foundation Models',
      weight: 28,
      sharedTopics: ['ai-bedrock', 'ai-rag', 'ai-genai'],
      tasks: [
        { id: '3.1', description: 'Design considerations for foundation model applications', keywords: ['rag', 'retrieval augmented generation', 'knowledge base', 'vector store', 'embedding', 'opensearch', 'chunking', 'grounding', 'semantic search', 'hybrid search', 'reranking'] },
        { id: '3.2', description: 'Effective prompt engineering techniques', keywords: ['system prompt', 'prompt template', 'prompt caching', 'in-context learning', 'role prompting', 'output format', 'xml tag', 'instruction tuning', 'structured output'] },
        { id: '3.3', description: 'Training and fine-tuning foundation models', keywords: ['fine-tuning', 'continued pre-training', 'rlhf', 'peft', 'lora', 'distillation', 'model customization', 'provisioned throughput', 'model unit', 'training job'] },
      ],
      primaryQuizId: 'aip-c01-agents-ops',
      warmupQuizIds: [],
    },
    {
      id: 'aif-d4',
      name: 'Guidelines for Responsible AI',
      weight: 14,
      sharedTopics: ['security-compliance', 'ai-ml-fundamentals'],
      tasks: [
        { id: '4.1', description: 'Responsible AI development', keywords: ['responsible ai', 'fairness', 'transparency', 'explainability', 'accountability', 'human oversight', 'bias detection', 'model card', 'a2i', 'human review', 'inclusivity'] },
        { id: '4.2', description: 'Transparent and explainable models', keywords: ['explainability', 'interpretability', 'sagemaker clarify', 'shap', 'feature importance', 'model transparency', 'model bias report'] },
      ],
      primaryQuizId: 'aip-c01-security-governance',
      warmupQuizIds: [],
    },
    {
      id: 'aif-d5',
      name: 'Security, Compliance, and Governance for AI Solutions',
      weight: 14,
      sharedTopics: ['security-iam', 'security-encryption', 'security-compliance'],
      tasks: [
        { id: '5.1', description: 'Secure AI systems', keywords: ['guardrail', 'bedrock guardrail', 'content filter', 'sensitive information', 'pii', 'topic denial', 'grounding check', 'model invocation logging', 'word filter'] },
        { id: '5.2', description: 'Governance and compliance for AI', keywords: ['compliance', 'governance', 'audit', 'cloudtrail', 'model card', 'soc', 'iso', 'regulation', 'data privacy', 'data residency', 'eu ai act'] },
        { id: '5.3', description: 'AWS services for securing AI systems', keywords: ['iam', 'vpc endpoint', 'kms', 'encryption', 'secrets manager', 'macie', 'security hub', 'detective', 'inspector', 'private link'] },
      ],
      primaryQuizId: 'aip-c01-security-governance',
      warmupQuizIds: [],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// SAA-C03 — AWS Certified Solutions Architect - Associate
// ─────────────────────────────────────────────────────────────────────────────
const SAA_C03: ExamGuide = {
  examCode: 'SAA-C03',
  examName: 'AWS Certified Solutions Architect - Associate',
  level: 'Associate',
  version: '1.0',
  lastSyncedDate: '2026-04-17',
  prerequisiteExamCodes: ['CLF-C02'],
  domains: [
    { id: 'saa-d1', name: 'Design Secure Architectures', weight: 30, sharedTopics: ['security-iam', 'security-encryption', 'networking-vpc', 'security-network'], tasks: [{ id: '1.1', description: 'Secure access to AWS resources', keywords: ['iam', 'role', 'policy', 'sts', 'federation', 'sso', 'permission boundary', 'resource-based policy'] }, { id: '1.2', description: 'Secure workloads and applications', keywords: ['waf', 'shield', 'security group', 'nacl', 'vpc endpoint', 'private link', 'secrets manager', 'parameter store'] }, { id: '1.3', description: 'Appropriate data security controls', keywords: ['kms', 'encryption at rest', 'encryption in transit', 's3 encryption', 'macie', 'acm', 'certificate'] }], primaryQuizId: '', warmupQuizIds: [] },
    { id: 'saa-d2', name: 'Design Resilient Architectures', weight: 26, sharedTopics: ['compute-ec2', 'compute-serverless', 'networking-vpc', 'database-relational', 'database-nosql', 'storage-s3'], tasks: [{ id: '2.1', description: 'Scalable and loosely coupled architectures', keywords: ['auto scaling', 'elb', 'sqs', 'sns', 'eventbridge', 'step functions', 'microservice', 'decoupling'] }, { id: '2.2', description: 'Highly available and fault-tolerant architectures', keywords: ['multi-az', 'multi-region', 'rto', 'rpo', 'disaster recovery', 'backup', 'pilot light', 'warm standby', 'active-active'] }], primaryQuizId: '', warmupQuizIds: [] },
    { id: 'saa-d3', name: 'Design High-Performing Architectures', weight: 24, sharedTopics: ['compute-ec2', 'compute-serverless', 'networking-cdn', 'database-relational', 'database-nosql', 'storage-s3', 'storage-block-file'], tasks: [{ id: '3.1', description: 'High-performing and elastic compute solutions', keywords: ['ec2 instance type', 'spot instance', 'auto scaling group', 'lambda', 'ecs', 'fargate', 'graviton', 'placement group'] }, { id: '3.2', description: 'High-performing and scalable storage solutions', keywords: ['s3 performance', 'ebs volume type', 'efs throughput', 'fsx', 'multipart upload', 'transfer acceleration'] }, { id: '3.3', description: 'High-performing database solutions', keywords: ['rds read replica', 'aurora', 'dynamodb global table', 'elasticache', 'dax', 'database caching'] }], primaryQuizId: '', warmupQuizIds: [] },
    { id: 'saa-d4', name: 'Design Cost-Optimized Architectures', weight: 20, sharedTopics: ['cost-billing', 'compute-ec2', 'storage-s3'], tasks: [{ id: '4.1', description: 'Cost-optimized storage solutions', keywords: ['s3 storage class', 's3 intelligent-tiering', 'glacier', 'lifecycle policy', 'ebs snapshot', 'cost-effective storage'] }, { id: '4.2', description: 'Cost-optimized compute solutions', keywords: ['reserved instance', 'savings plan', 'spot instance', 'right-sizing', 'graviton', 'compute optimizer'] }, { id: '4.3', description: 'Cost-optimized database solutions', keywords: ['rds reserved', 'dynamodb on-demand', 'aurora serverless', 'cost-effective database'] }], primaryQuizId: '', warmupQuizIds: [] },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// DVA-C02 — AWS Certified Developer - Associate
// ─────────────────────────────────────────────────────────────────────────────
const DVA_C02: ExamGuide = {
  examCode: 'DVA-C02',
  examName: 'AWS Certified Developer - Associate',
  level: 'Associate',
  version: '1.0',
  lastSyncedDate: '2026-04-17',
  prerequisiteExamCodes: ['CLF-C02'],
  domains: [
    { id: 'dva-d1', name: 'Development with AWS Services', weight: 32, sharedTopics: ['compute-serverless', 'compute-ec2', 'database-relational', 'database-nosql', 'storage-s3'], tasks: [{ id: '1.1', description: 'Develop code for applications hosted on AWS', keywords: ['sdk', 'api gateway', 'lambda', 'elastic beanstalk', 'ecs', 'ec2', 'app runner'] }, { id: '1.2', description: 'Develop code for AWS Lambda', keywords: ['lambda handler', 'lambda layer', 'lambda event', 'cold start', 'concurrency', 'lambda url', 'function url'] }, { id: '1.3', description: 'Use data stores in application development', keywords: ['dynamodb', 'rds', 's3', 'elasticache', 'sqs', 'sns', 'kinesis', 'data store'] }], primaryQuizId: '', warmupQuizIds: [] },
    { id: 'dva-d2', name: 'Security', weight: 26, sharedTopics: ['security-iam', 'security-encryption'], tasks: [{ id: '2.1', description: 'Implement authentication and authorization', keywords: ['cognito', 'iam', 'oauth', 'jwt', 'saml', 'api key', 'resource policy', 'authorizer'] }, { id: '2.2', description: 'Implement encryption', keywords: ['kms', 'acm', 'ssl', 'tls', 'client-side encryption', 'server-side encryption', 'envelope encryption'] }, { id: '2.3', description: 'Manage sensitive data in application code', keywords: ['secrets manager', 'parameter store', 'environment variable', 'credential', 'secret rotation'] }], primaryQuizId: '', warmupQuizIds: [] },
    { id: 'dva-d3', name: 'Deployment', weight: 24, sharedTopics: ['devops-cicd', 'devops-iac', 'compute-serverless'], tasks: [{ id: '3.1', description: 'Prepare application artifacts for deployment', keywords: ['container', 'docker', 'ecr', 'zip', 'artifact', 's3 artifact', 'package'] }, { id: '3.2', description: 'Test applications in development environments', keywords: ['sam local', 'localstack', 'unit test', 'integration test', 'mock', 'test event'] }, { id: '3.3', description: 'Automate deployment testing', keywords: ['codepipeline', 'codebuild', 'test stage', 'canary', 'blue-green', 'a/b testing'] }, { id: '3.4', description: 'Deploy code using AWS CI/CD services', keywords: ['codedeploy', 'codepipeline', 'codebuild', 'codecommit', 'elastic beanstalk deploy', 'lambda deploy', 'ecs deploy'] }], primaryQuizId: '', warmupQuizIds: [] },
    { id: 'dva-d4', name: 'Troubleshooting and Optimization', weight: 18, sharedTopics: ['monitoring'], tasks: [{ id: '4.1', description: 'Root cause analysis', keywords: ['cloudwatch logs', 'x-ray trace', 'cloudtrail', 'error log', 'debugging', 'structured logging'] }, { id: '4.2', description: 'Instrument code for observability', keywords: ['x-ray sdk', 'cloudwatch metric', 'custom metric', 'embedded metric format', 'lambda power tools', 'tracing'] }, { id: '4.3', description: 'Optimize applications', keywords: ['caching', 'elasticache', 'cloudfront cache', 'lambda optimization', 'provisioned concurrency', 'connection pooling', 'rds proxy'] }], primaryQuizId: '', warmupQuizIds: [] },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// SOA-C03 — AWS Certified CloudOps Engineer - Associate
// ─────────────────────────────────────────────────────────────────────────────
const SOA_C03: ExamGuide = {
  examCode: 'SOA-C03',
  examName: 'AWS Certified CloudOps Engineer - Associate',
  level: 'Associate',
  version: '1.0',
  lastSyncedDate: '2026-04-17',
  prerequisiteExamCodes: ['CLF-C02'],
  domains: [
    { id: 'soa-d1', name: 'Monitoring, Logging, and Remediation', weight: 20, sharedTopics: ['monitoring'], tasks: [{ id: '1.1', description: 'Implement metrics, alarms, and filters', keywords: ['cloudwatch alarm', 'cloudwatch metric', 'cloudwatch dashboard', 'log group', 'log filter', 'metric filter', 'sns notification'] }, { id: '1.2', description: 'Remediate issues based on monitoring and availability', keywords: ['auto remediation', 'ssm automation', 'lambda remediation', 'eventbridge rule', 'runbook', 'ops item'] }], primaryQuizId: '', warmupQuizIds: [] },
    { id: 'soa-d2', name: 'Reliability and Business Continuity', weight: 16, sharedTopics: ['compute-ec2', 'database-relational', 'networking-vpc'], tasks: [{ id: '2.1', description: 'Implement scalability and elasticity', keywords: ['auto scaling', 'scheduled scaling', 'predictive scaling', 'elastic load balancing', 'target tracking'] }, { id: '2.2', description: 'Implement high availability and resilient environments', keywords: ['multi-az', 'rds failover', 'route53 health check', 'backup', 'rto', 'rpo'] }], primaryQuizId: '', warmupQuizIds: [] },
    { id: 'soa-d3', name: 'Deployment, Provisioning, and Automation', weight: 18, sharedTopics: ['devops-cicd', 'devops-iac'], tasks: [{ id: '3.1', description: 'Provision and maintain cloud resources', keywords: ['cloudformation', 'service catalog', 'systems manager', 'ssm', 'patch manager', 'ami management'] }, { id: '3.2', description: 'Automate manual or repeatable processes', keywords: ['aws lambda', 'eventbridge', 'step functions', 'ssm automation', 'aws config rule', 'automatic remediation'] }], primaryQuizId: '', warmupQuizIds: [] },
    { id: 'soa-d4', name: 'Security and Compliance', weight: 16, sharedTopics: ['security-iam', 'security-compliance', 'security-network'], tasks: [{ id: '4.1', description: 'Implement and manage security and compliance policies', keywords: ['iam policy', 'scp', 'aws config', 'security hub', 'guardduty', 'inspector', 'compliance check'] }, { id: '4.2', description: 'Implement data and infrastructure protection', keywords: ['kms', 'macie', 'vpc endpoint', 'security group', 'nacl', 'shield', 'waf'] }], primaryQuizId: '', warmupQuizIds: [] },
    { id: 'soa-d5', name: 'Networking and Content Delivery', weight: 18, sharedTopics: ['networking-vpc', 'networking-cdn'], tasks: [{ id: '5.1', description: 'Implement networking features and connectivity', keywords: ['vpc', 'subnet', 'routing table', 'transit gateway', 'vpn', 'direct connect', 'vpc peering', 'private link'] }, { id: '5.2', description: 'Configure domains, DNS, and content delivery', keywords: ['route53', 'dns record', 'cloudfront distribution', 'origin', 'cache behavior', 'ssl certificate', 'waf'] }], primaryQuizId: '', warmupQuizIds: [] },
    { id: 'soa-d6', name: 'Cost and Performance Optimization', weight: 12, sharedTopics: ['cost-billing'], tasks: [{ id: '6.1', description: 'Implement cost optimization strategies', keywords: ['trusted advisor', 'compute optimizer', 'cost explorer', 'savings plan', 'reserved instance', 'rightsizing'] }, { id: '6.2', description: 'Implement performance optimization strategies', keywords: ['auto scaling', 'elasticache', 'cloudfront', 'placement group', 'enhanced networking', 'efa', 'instance type'] }], primaryQuizId: '', warmupQuizIds: [] },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// DEA-C01 — AWS Certified Data Engineer - Associate
// ─────────────────────────────────────────────────────────────────────────────
const DEA_C01: ExamGuide = {
  examCode: 'DEA-C01',
  examName: 'AWS Certified Data Engineer - Associate',
  level: 'Associate',
  version: '1.0',
  lastSyncedDate: '2026-04-17',
  prerequisiteExamCodes: ['CLF-C02'],
  domains: [
    { id: 'dea-d1', name: 'Data Ingestion and Transformation', weight: 34, sharedTopics: ['database-nosql', 'storage-s3'], tasks: [{ id: '1.1', description: 'Perform data ingestion', keywords: ['kinesis data streams', 'kinesis firehose', 'glue', 'dms', 'datasync', 'emr', 'kafka', 'msk', 'batch ingestion', 'streaming ingestion'] }, { id: '1.2', description: 'Transform and process data', keywords: ['glue etl', 'lambda', 'emr', 'spark', 'athena', 'redshift', 'data pipeline', 'transformation', 'data wrangler'] }], primaryQuizId: '', warmupQuizIds: [] },
    { id: 'dea-d2', name: 'Data Store Management', weight: 26, sharedTopics: ['database-relational', 'database-nosql', 'storage-s3', 'storage-block-file'], tasks: [{ id: '2.1', description: 'Choose appropriate data store', keywords: ['s3', 'redshift', 'dynamodb', 'rds', 'aurora', 'data lake', 'data warehouse', 'olap', 'oltp'] }, { id: '2.2', description: 'Understand data cataloging systems', keywords: ['glue data catalog', 'lake formation', 'data catalog', 'metadata', 'schema', 'table definition'] }], primaryQuizId: '', warmupQuizIds: [] },
    { id: 'dea-d3', name: 'Data Operations and Support', weight: 22, sharedTopics: ['monitoring', 'devops-cicd'], tasks: [{ id: '3.1', description: 'Automate data processing', keywords: ['step functions', 'eventbridge', 'glue workflow', 'airflow', 'managed workflows', 'mwaa', 'data pipeline automation'] }, { id: '3.2', description: 'Analyze data by using AWS services', keywords: ['athena', 'quicksight', 'emr', 'redshift', 'sagemaker', 'data analysis', 'visualization'] }], primaryQuizId: '', warmupQuizIds: [] },
    { id: 'dea-d4', name: 'Data Security and Governance', weight: 18, sharedTopics: ['security-iam', 'security-encryption', 'security-compliance'], tasks: [{ id: '4.1', description: 'Apply authentication mechanisms', keywords: ['iam', 'lake formation permissions', 'column-level security', 'row-level security', 'data access control'] }, { id: '4.2', description: 'Apply authorization mechanisms', keywords: ['resource policy', 'kms', 'glue encryption', 's3 encryption', 'data governance', 'data privacy'] }], primaryQuizId: '', warmupQuizIds: [] },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// MLA-C01 — AWS Certified Machine Learning Engineer - Associate
// ─────────────────────────────────────────────────────────────────────────────
const MLA_C01: ExamGuide = {
  examCode: 'MLA-C01',
  examName: 'AWS Certified Machine Learning Engineer - Associate',
  level: 'Associate',
  version: '1.0',
  lastSyncedDate: '2026-04-17',
  prerequisiteExamCodes: ['AIF-C01'],
  domains: [
    { id: 'mla-d1', name: 'Data Preparation for Machine Learning', weight: 28, sharedTopics: ['ai-ml-fundamentals', 'storage-s3', 'database-nosql'], tasks: [{ id: '1.1', description: 'Ingest and store data', keywords: ['s3', 'glue', 'kinesis', 'dms', 'data lake', 'feature store', 'sagemaker feature store'] }, { id: '1.2', description: 'Transform data and perform feature engineering', keywords: ['sagemaker data wrangler', 'sagemaker processing job', 'glue etl', 'feature engineering', 'normalization', 'encoding'] }], primaryQuizId: '', warmupQuizIds: [] },
    { id: 'mla-d2', name: 'ML Model Development', weight: 26, sharedTopics: ['ai-ml-fundamentals'], tasks: [{ id: '2.1', description: 'Choose appropriate ML approaches', keywords: ['supervised', 'unsupervised', 'reinforcement', 'algorithm selection', 'xgboost', 'linear learner', 'neural network'] }, { id: '2.2', description: 'Train and refine ML models', keywords: ['sagemaker training job', 'hyperparameter tuning', 'automatic model tuning', 'training metric', 'distributed training'] }], primaryQuizId: '', warmupQuizIds: [] },
    { id: 'mla-d3', name: 'Deployment and Orchestration of ML Workflows', weight: 22, sharedTopics: ['devops-cicd', 'compute-serverless', 'ai-ml-fundamentals'], tasks: [{ id: '3.1', description: 'Select deployment infrastructure', keywords: ['sagemaker endpoint', 'real-time inference', 'batch transform', 'serverless inference', 'async inference', 'multi-model endpoint'] }, { id: '3.2', description: 'Create and script infrastructure', keywords: ['sagemaker pipelines', 'mlflow', 'step functions ml', 'sagemaker model registry', 'cicd for ml', 'mlops'] }], primaryQuizId: '', warmupQuizIds: [] },
    { id: 'mla-d4', name: 'ML Solution Monitoring, Maintenance, and Security', weight: 24, sharedTopics: ['monitoring', 'security-compliance', 'ai-ml-fundamentals'], tasks: [{ id: '4.1', description: 'Monitor model inference', keywords: ['sagemaker model monitor', 'data drift', 'model drift', 'cloudwatch metrics', 'endpoint monitoring', 'bias monitoring'] }, { id: '4.2', description: 'Secure AWS resources', keywords: ['iam', 'vpc', 'kms', 'sagemaker role', 'network isolation', 'encryption', 'artifact security'] }], primaryQuizId: '', warmupQuizIds: [] },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// SAP-C02 — AWS Certified Solutions Architect - Professional
// ─────────────────────────────────────────────────────────────────────────────
const SAP_C02: ExamGuide = {
  examCode: 'SAP-C02',
  examName: 'AWS Certified Solutions Architect - Professional',
  level: 'Professional',
  version: '1.0',
  lastSyncedDate: '2026-04-17',
  prerequisiteExamCodes: ['SAA-C03'],
  domains: [
    { id: 'sap-d1', name: 'Design Solutions for Organizational Complexity', weight: 26, sharedTopics: ['security-iam', 'security-compliance', 'networking-vpc', 'cost-billing'], tasks: [{ id: '1.1', description: 'Architect network connectivity strategies', keywords: ['transit gateway', 'aws organizations', 'control tower', 'landing zone', 'account vending', 'multi-account'] }, { id: '1.2', description: 'Prescribe security controls', keywords: ['scp', 'permission boundary', 'iam identity center', 'aws config', 'security hub', 'detective'] }], primaryQuizId: '', warmupQuizIds: [] },
    { id: 'sap-d2', name: 'Design for New Solutions', weight: 29, sharedTopics: ['compute-ec2', 'compute-serverless', 'database-relational', 'database-nosql', 'storage-s3', 'networking-vpc', 'security-iam'], tasks: [{ id: '2.1', description: 'Design deployment strategies', keywords: ['blue-green', 'canary', 'rolling', 'immutable', 'codedeploy', 'elastic beanstalk', 'ecs blue-green'] }, { id: '2.2', description: 'Design for reliability', keywords: ['chaos engineering', 'game day', 'fault isolation', 'bulkhead pattern', 'circuit breaker', 'retry logic'] }], primaryQuizId: '', warmupQuizIds: [] },
    { id: 'sap-d3', name: 'Continuous Improvement for Existing Solutions', weight: 25, sharedTopics: ['monitoring', 'devops-cicd', 'cost-billing'], tasks: [{ id: '3.1', description: 'Determine strategy to improve overall operational excellence', keywords: ['well-architected review', 'trusted advisor', 'compute optimizer', 'performance insights', 'application performance'] }, { id: '3.2', description: 'Determine strategy to improve security', keywords: ['security hub', 'macie', 'guardduty', 'inspector', 'detective', 'security posture'] }], primaryQuizId: '', warmupQuizIds: [] },
    { id: 'sap-d4', name: 'Accelerate Workload Migration and Modernization', weight: 20, sharedTopics: ['aws-core', 'networking-vpc', 'database-relational', 'storage-s3'], tasks: [{ id: '4.1', description: 'Select migration tools and services', keywords: ['migration hub', 'application discovery service', 'server migration service', 'database migration service', 'datasync', 'snowball'] }, { id: '4.2', description: 'Determine migration strategy', keywords: ['7r', 'rehost', 'replatform', 'refactor', 'repurchase', 'retain', 'retire', 'relocate', 'migration strategy'] }], primaryQuizId: '', warmupQuizIds: [] },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// DOP-C02 — AWS Certified DevOps Engineer - Professional
// ─────────────────────────────────────────────────────────────────────────────
const DOP_C02: ExamGuide = {
  examCode: 'DOP-C02',
  examName: 'AWS Certified DevOps Engineer - Professional',
  level: 'Professional',
  version: '1.0',
  lastSyncedDate: '2026-04-17',
  prerequisiteExamCodes: ['DVA-C02', 'SOA-C03'],
  domains: [
    { id: 'dop-d1', name: 'SDLC Automation', weight: 22, sharedTopics: ['devops-cicd'], tasks: [{ id: '1.1', description: 'Implement CI/CD pipelines', keywords: ['codepipeline', 'codebuild', 'codecommit', 'github actions', 'jenkins', 'pipeline stage', 'artifact'] }, { id: '1.2', description: 'Integrate automated testing', keywords: ['unit test', 'integration test', 'selenium', 'postman', 'testng', 'sonarqube', 'static analysis'] }], primaryQuizId: '', warmupQuizIds: [] },
    { id: 'dop-d2', name: 'Configuration Management and IaC', weight: 17, sharedTopics: ['devops-iac'], tasks: [{ id: '2.1', description: 'Apply GitOps and immutable infrastructure', keywords: ['cloudformation', 'cdk', 'terraform', 'gitops', 'drift detection', 'change set', 'stack'] }, { id: '2.2', description: 'Apply deployment strategies', keywords: ['systems manager', 'opsworks', 'elastic beanstalk', 'asg lifecycle hook', 'rolling update', 'blue-green'] }], primaryQuizId: '', warmupQuizIds: [] },
    { id: 'dop-d3', name: 'Resilient Cloud Solutions', weight: 15, sharedTopics: ['compute-ec2', 'networking-vpc', 'database-relational'], tasks: [{ id: '3.1', description: 'Implement highly available solutions', keywords: ['multi-az', 'auto scaling', 'rds failover', 'route53 health check', 'global accelerator', 'resilience'] }, { id: '3.2', description: 'Implement disaster recovery solutions', keywords: ['backup', 'rpo', 'rto', 'pilot light', 'warm standby', 'active-active', 'cross-region'] }], primaryQuizId: '', warmupQuizIds: [] },
    { id: 'dop-d4', name: 'Monitoring and Logging', weight: 15, sharedTopics: ['monitoring'], tasks: [{ id: '4.1', description: 'Build centralized logging solutions', keywords: ['cloudwatch logs', 'log aggregation', 'opensearch', 'kinesis firehose', 'log insights', 'centralized logging'] }, { id: '4.2', description: 'Implement distributed tracing', keywords: ['x-ray', 'trace', 'segment', 'subsegment', 'service map', 'annotation', 'lambda powertools'] }], primaryQuizId: '', warmupQuizIds: [] },
    { id: 'dop-d5', name: 'Incident and Event Response', weight: 14, sharedTopics: ['monitoring', 'security-network'], tasks: [{ id: '5.1', description: 'Manage event lifecycle', keywords: ['eventbridge', 'cloudwatch alarm', 'sns', 'pagerduty', 'incident', 'runbook', 'ops center', 'ssm incident manager'] }], primaryQuizId: '', warmupQuizIds: [] },
    { id: 'dop-d6', name: 'Security and Compliance', weight: 17, sharedTopics: ['security-iam', 'security-compliance'], tasks: [{ id: '6.1', description: 'Implement security controls', keywords: ['iam', 'scp', 'permission boundary', 'security hub', 'config rule', 'guardduty', 'inspector'] }, { id: '6.2', description: 'Implement preventive security measures', keywords: ['aws config', 'conformance pack', 'service control policy', 'audit manager', 'compliance framework'] }], primaryQuizId: '', warmupQuizIds: [] },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// AIP-C01 — AWS Certified Generative AI Developer - Professional
// Note: different from AIF-C01 (AI Practitioner Foundational)
// ─────────────────────────────────────────────────────────────────────────────
const AIP_PRO_C01: ExamGuide = {
  examCode: 'AIP-C01',
  examName: 'AWS Certified Generative AI Developer - Professional',
  level: 'Professional',
  version: '1.0',
  lastSyncedDate: '2026-04-17',
  prerequisiteExamCodes: ['AIF-C01'],
  domains: [
    { id: 'aipp-d1', name: 'Foundation Model Integration, Data Management, and Compliance', weight: 31, sharedTopics: ['ai-bedrock', 'ai-rag', 'ai-genai', 'security-iam'], tasks: [{ id: '1.1', description: 'Integrate and orchestrate foundation model APIs', keywords: ['bedrock api', 'converse api', 'agent', 'action group', 'knowledge base', 'bedrock agent', 'orchestration'] }, { id: '1.2', description: 'Implement data management strategies', keywords: ['data ingestion', 'vector database', 'opensearch', 'aurora pgvector', 'pinecone', 'weaviate', 'embedding', 'chunking strategy'] }], primaryQuizId: '', warmupQuizIds: [] },
    { id: 'aipp-d2', name: 'Implementation and Integration', weight: 26, sharedTopics: ['ai-bedrock', 'ai-rag', 'compute-serverless'], tasks: [{ id: '2.1', description: 'Develop GenAI applications', keywords: ['langchain', 'llm chain', 'prompt template', 'output parser', 'memory', 'tool', 'agent framework'] }, { id: '2.2', description: 'Integrate GenAI solutions with AWS services', keywords: ['lambda integration', 'api gateway', 'step functions ai', 'bedrock flows', 'eventbridge', 'ecs fargate ai'] }], primaryQuizId: '', warmupQuizIds: [] },
    { id: 'aipp-d3', name: 'AI Safety, Security, and Governance', weight: 20, sharedTopics: ['security-compliance', 'security-iam', 'ai-genai'], tasks: [{ id: '3.1', description: 'Implement AI safety measures', keywords: ['guardrail', 'content filter', 'pii detection', 'hallucination mitigation', 'grounding check', 'topic block', 'harm prevention'] }, { id: '3.2', description: 'Apply security and governance frameworks', keywords: ['model invocation logging', 'cloudtrail ai', 'vpc endpoint bedrock', 'kms bedrock', 'iam bedrock policy', 'data residency'] }], primaryQuizId: '', warmupQuizIds: [] },
    { id: 'aipp-d4', name: 'Operational Efficiency and Optimization for GenAI Applications', weight: 12, sharedTopics: ['monitoring', 'cost-billing'], tasks: [{ id: '4.1', description: 'Optimize GenAI application performance', keywords: ['prompt caching', 'provisioned throughput', 'cross-region inference', 'model routing', 'batch inference', 'latency optimization'] }, { id: '4.2', description: 'Optimize costs of GenAI applications', keywords: ['bedrock pricing', 'token optimization', 'caching strategy', 'right model selection', 'cost per token', 'on-demand vs provisioned'] }], primaryQuizId: '', warmupQuizIds: [] },
    { id: 'aipp-d5', name: 'Testing, Validation, and Troubleshooting', weight: 11, sharedTopics: ['monitoring', 'ai-ml-fundamentals'], tasks: [{ id: '5.1', description: 'Test and validate GenAI applications', keywords: ['ragas', 'evaluation metric', 'faithfulness', 'answer relevance', 'context recall', 'llm judge', 'benchmarking'] }, { id: '5.2', description: 'Troubleshoot GenAI applications', keywords: ['bedrock logs', 'cloudwatch lambda', 'x-ray trace', 'error pattern', 'timeout', 'throttle', 'rate limit'] }], primaryQuizId: '', warmupQuizIds: [] },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// ANS-C01 — AWS Certified Advanced Networking - Specialty
// ─────────────────────────────────────────────────────────────────────────────
const ANS_C01: ExamGuide = {
  examCode: 'ANS-C01',
  examName: 'AWS Certified Advanced Networking - Specialty',
  level: 'Specialty',
  version: '1.0',
  lastSyncedDate: '2026-04-17',
  prerequisiteExamCodes: ['SAA-C03'],
  domains: [
    { id: 'ans-d1', name: 'Network Design', weight: 30, sharedTopics: ['networking-vpc', 'networking-cdn'], tasks: [{ id: '1.1', description: 'Design a solution that incorporates edge network services', keywords: ['cloudfront', 'route53', 'global accelerator', 'edge location', 'anycast', 'latency routing', 'geo routing'] }, { id: '1.2', description: 'Design and implement AWS networks', keywords: ['vpc design', 'cidr', 'subnet design', 'az', 'transit gateway', 'vpc peering', 'private link'] }], primaryQuizId: '', warmupQuizIds: [] },
    { id: 'ans-d2', name: 'Network Implementation', weight: 26, sharedTopics: ['networking-vpc', 'networking-cdn'], tasks: [{ id: '2.1', description: 'Implement hybrid network solutions', keywords: ['direct connect', 'site-to-site vpn', 'client vpn', 'transit gateway connect', 'bgp', 'lag', 'dx gateway'] }, { id: '2.2', description: 'Implement network connectivity solutions', keywords: ['vpc endpoint', 'interface endpoint', 'gateway endpoint', 'private link', 'endpoint policy'] }], primaryQuizId: '', warmupQuizIds: [] },
    { id: 'ans-d3', name: 'Network Management and Operation', weight: 20, sharedTopics: ['monitoring', 'networking-vpc'], tasks: [{ id: '3.1', description: 'Manage and optimize AWS networks', keywords: ['network manager', 'reachability analyzer', 'network access analyzer', 'vpc flow logs', 'traffic mirroring'] }], primaryQuizId: '', warmupQuizIds: [] },
    { id: 'ans-d4', name: 'Network Security, Compliance, and Governance', weight: 24, sharedTopics: ['security-network', 'security-iam', 'networking-vpc'], tasks: [{ id: '4.1', description: 'Implement and maintain network security', keywords: ['waf', 'shield advanced', 'network firewall', 'dns firewall', 'nacl', 'security group', 'macie'] }, { id: '4.2', description: 'Validate and audit security by using network monitoring and logging', keywords: ['vpc flow logs', 'cloudtrail', 'config', 'detective', 'network access analyzer', 'compliance'] }], primaryQuizId: '', warmupQuizIds: [] },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// MLS-C01 — AWS Certified Machine Learning - Specialty
// ─────────────────────────────────────────────────────────────────────────────
const MLS_C01: ExamGuide = {
  examCode: 'MLS-C01',
  examName: 'AWS Certified Machine Learning - Specialty',
  level: 'Specialty',
  version: '1.0',
  lastSyncedDate: '2026-04-17',
  prerequisiteExamCodes: ['AIF-C01', 'MLA-C01'],
  domains: [
    { id: 'mls-d1', name: 'Data Engineering', weight: 20, sharedTopics: ['ai-ml-fundamentals', 'storage-s3', 'database-nosql'], tasks: [{ id: '1.1', description: 'Create data repositories for machine learning', keywords: ['s3 data lake', 'redshift', 'athena', 'glue catalog', 'lake formation', 'feature store'] }, { id: '1.2', description: 'Identify and implement a data-ingestion solution', keywords: ['kinesis', 'dms', 'glue', 'batch ingestion', 'streaming ingestion', 'data pipeline'] }], primaryQuizId: '', warmupQuizIds: [] },
    { id: 'mls-d2', name: 'Exploratory Data Analysis', weight: 24, sharedTopics: ['ai-ml-fundamentals'], tasks: [{ id: '2.1', description: 'Sanitize and prepare data for modeling', keywords: ['missing value', 'outlier', 'imputation', 'normalization', 'standardization', 'class imbalance', 'smote'] }, { id: '2.2', description: 'Perform feature engineering', keywords: ['feature selection', 'pca', 'embedding', 'one-hot encoding', 'binning', 'feature importance', 'correlation'] }], primaryQuizId: '', warmupQuizIds: [] },
    { id: 'mls-d3', name: 'Modeling', weight: 36, sharedTopics: ['ai-ml-fundamentals'], tasks: [{ id: '3.1', description: 'Frame business problems as ML problems', keywords: ['classification', 'regression', 'clustering', 'recommendation', 'anomaly detection', 'nlp', 'computer vision'] }, { id: '3.2', description: 'Select the appropriate model', keywords: ['xgboost', 'linear learner', 'k-means', 'random forest', 'cnn', 'rnn', 'transformer', 'bert'] }, { id: '3.3', description: 'Train ML models', keywords: ['sagemaker training', 'distributed training', 'hyperparameter', 'early stopping', 'regularization', 'loss function'] }, { id: '3.4', description: 'Perform hyperparameter optimization', keywords: ['automatic model tuning', 'bayesian optimization', 'random search', 'grid search', 'hyperparameter range'] }, { id: '3.5', description: 'Evaluate ML models', keywords: ['confusion matrix', 'roc auc', 'precision recall', 'rmse', 'mae', 'cross validation', 'bias-variance tradeoff'] }], primaryQuizId: '', warmupQuizIds: [] },
    { id: 'mls-d4', name: 'Machine Learning Implementation and Operations', weight: 20, sharedTopics: ['monitoring', 'devops-cicd', 'ai-ml-fundamentals'], tasks: [{ id: '4.1', description: 'Build ML solutions for performance, availability, scalability', keywords: ['sagemaker endpoint', 'auto scaling endpoint', 'multi-model endpoint', 'inference pipeline', 'shadow testing'] }, { id: '4.2', description: 'Recommend and implement MLOps solutions', keywords: ['sagemaker pipelines', 'model registry', 'mlflow', 'model versioning', 'model monitor', 'a/b testing'] }], primaryQuizId: '', warmupQuizIds: [] },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// SCS-C03 — AWS Certified Security - Specialty
// ─────────────────────────────────────────────────────────────────────────────
const SCS_C03: ExamGuide = {
  examCode: 'SCS-C03',
  examName: 'AWS Certified Security - Specialty',
  level: 'Specialty',
  version: '1.0',
  lastSyncedDate: '2026-04-17',
  prerequisiteExamCodes: ['SAA-C03'],
  domains: [
    { id: 'scs-d1', name: 'Threat Detection and Incident Response', weight: 14, sharedTopics: ['monitoring', 'security-network'], tasks: [{ id: '1.1', description: 'Design and implement threat detection solutions', keywords: ['guardduty', 'detective', 'security hub', 'macie', 'inspector', 'threat intelligence', 'finding'] }, { id: '1.2', description: 'Design and implement incident response solutions', keywords: ['incident response', 'runbook', 'ssm incident manager', 'forensics', 'evasion', 'isolation', 'recovery'] }], primaryQuizId: '', warmupQuizIds: [] },
    { id: 'scs-d2', name: 'Security Logging and Monitoring', weight: 18, sharedTopics: ['monitoring', 'security-compliance'], tasks: [{ id: '2.1', description: 'Design and implement monitoring solutions', keywords: ['cloudtrail', 'cloudwatch', 'config', 'security hub findings', 'log aggregation', 'eventbridge security'] }, { id: '2.2', description: 'Troubleshoot security monitoring and alerting', keywords: ['cloudtrail log', 'vpc flow log', 'dns log', 'waf log', 'alb access log', 's3 access log'] }], primaryQuizId: '', warmupQuizIds: [] },
    { id: 'scs-d3', name: 'Infrastructure Security', weight: 20, sharedTopics: ['security-network', 'networking-vpc'], tasks: [{ id: '3.1', description: 'Design and implement security controls for edge services', keywords: ['cloudfront security', 'waf rule', 'shield advanced', 'route53 dnssec', 'certificate manager', 'https'] }, { id: '3.2', description: 'Design and implement network security controls', keywords: ['vpc security', 'nacl', 'security group', 'network firewall', 'vpn', 'direct connect security', 'vpc endpoint'] }], primaryQuizId: '', warmupQuizIds: [] },
    { id: 'scs-d4', name: 'Identity and Access Management', weight: 16, sharedTopics: ['security-iam'], tasks: [{ id: '4.1', description: 'Design, implement, and troubleshoot authentication for AWS resources', keywords: ['iam identity center', 'cognito', 'saml', 'oidc', 'mfa', 'federation', 'sts assume role'] }, { id: '4.2', description: 'Design, implement, and troubleshoot authorization for AWS resources', keywords: ['iam policy', 'resource policy', 'permission boundary', 'scp', 'abac', 'rbac', 'least privilege'] }], primaryQuizId: '', warmupQuizIds: [] },
    { id: 'scs-d5', name: 'Data Protection', weight: 18, sharedTopics: ['security-encryption', 'storage-s3'], tasks: [{ id: '5.1', description: 'Design and implement controls that provide confidentiality and integrity for data in transit', keywords: ['tls', 'ssl', 'acm', 'certificate', 'https', 'vpn encryption', 'direct connect encryption'] }, { id: '5.2', description: 'Design and implement controls that provide confidentiality and integrity for data at rest', keywords: ['kms', 'cmk', 'hsm', 'cloudhsm', 's3 encryption', 'ebs encryption', 'rds encryption', 'macie'] }], primaryQuizId: '', warmupQuizIds: [] },
    { id: 'scs-d6', name: 'Management and Security Governance', weight: 14, sharedTopics: ['security-compliance'], tasks: [{ id: '6.1', description: 'Develop a strategy to centrally deploy and manage AWS accounts', keywords: ['aws organizations', 'control tower', 'landing zone', 'scp', 'delegated admin', 'account factory'] }, { id: '6.2', description: 'Implement a secure and consistent deployment strategy', keywords: ['aws config', 'conformance pack', 'cloudformation stacksets', 'service catalog', 'audit manager', 'compliance'] }], primaryQuizId: '', warmupQuizIds: [] },
  ],
};

// ─── Registry ─────────────────────────────────────────────────────────────────

export const EXAM_GUIDES: Record<string, ExamGuide> = {
  'clf-c02':    CLF_C02,
  'aip-c01':    AIF_C01,   // internal key 'aip-c01' maps to AWS code AIF-C01
  'saa-c03':    SAA_C03,
  'dva-c02':    DVA_C02,
  'soa-c03':    SOA_C03,
  'dea-c01':    DEA_C01,
  'mla-c01':    MLA_C01,
  'sap-c02':    SAP_C02,
  'dop-c02':    DOP_C02,
  'aip-pro-c01': AIP_PRO_C01,
  'ans-c01':    ANS_C01,
  'mls-c01':    MLS_C01,
  'scs-c03':    SCS_C03,
};

// ─── Core helpers ─────────────────────────────────────────────────────────────

export function getExamGuide(internalKey: string): ExamGuide | undefined {
  return EXAM_GUIDES[internalKey.toLowerCase()];
}

/** Find which domain (and guide) a quiz belongs to. */
export function getDomainForQuiz(
  quizId: string,
): { domain: DomainSpec; guide: ExamGuide } | null {
  for (const guide of Object.values(EXAM_GUIDES)) {
    for (const domain of guide.domains) {
      if (
        domain.primaryQuizId === quizId ||
        domain.warmupQuizIds.includes(quizId)
      ) {
        return { domain, guide };
      }
    }
  }
  return null;
}

/**
 * 0–1 weight factor for a quiz, normalised to the highest-weight domain in
 * its exam. Use this to boost recommendation scores.
 * Returns 0.5 for quizzes not in any exam guide.
 */
export function getDomainWeightFactor(quizId: string): number {
  const result = getDomainForQuiz(quizId);
  if (!result) return 0.5;
  const maxWeight = Math.max(...result.guide.domains.map((d) => d.weight));
  return result.domain.weight / maxWeight;
}

/** All task-statement keywords for a quiz's domain — exam-guide-specific signals. */
export function getDomainSignals(quizId: string): string[] {
  const result = getDomainForQuiz(quizId);
  if (!result) return [];
  return result.domain.tasks.flatMap((t) => t.keywords);
}

/** e.g. "Domain 3 · 34% of exam" */
export function getDomainLabel(quizId: string): string | null {
  const result = getDomainForQuiz(quizId);
  if (!result) return null;
  const idx = result.guide.domains.findIndex((d) => d.id === result.domain.id);
  return `Domain ${idx + 1} · ${result.domain.weight}% of exam`;
}

/** Raw exam weight percentage (e.g. 34 for Domain 3 of CLF-C02). */
export function getRawDomainWeight(quizId: string): number | null {
  const result = getDomainForQuiz(quizId);
  return result ? result.domain.weight : null;
}

/** Domain name (e.g. "Cloud Technology and Services"). */
export function getDomainName(quizId: string): string | null {
  const result = getDomainForQuiz(quizId);
  return result ? result.domain.name : null;
}

// ─── Cross-exam overlap helpers ───────────────────────────────────────────────

/**
 * Returns all SharedTopicIds covered by a quiz's domain.
 * Used to detect which topics from one exam carry over to another.
 */
export function getSharedTopicsForQuiz(quizId: string): SharedTopicId[] {
  const result = getDomainForQuiz(quizId);
  return result ? result.domain.sharedTopics : [];
}

/**
 * Returns the set of SharedTopicIds where the user scored ≥ threshold
 * across any quiz in their history. These topics don't need re-study
 * when the same topic appears in a different exam's domain.
 *
 * @param quizResults  full quiz history from progressStore
 * @param quizLookup   function that maps quizId → SharedTopicId[]
 * @param threshold    pass score %, default 70
 */
export function getMasteredSharedTopics(
  quizResults: Array<{ quizId: string; score: number; totalQuestions: number }>,
  threshold = 70,
): Set<SharedTopicId> {
  const mastered = new Set<SharedTopicId>();
  for (const result of quizResults) {
    const pct = result.totalQuestions > 0
      ? (result.score / result.totalQuestions) * 100
      : 0;
    if (pct < threshold) continue;
    const topics = getSharedTopicsForQuiz(result.quizId);
    topics.forEach((t) => mastered.add(t));
  }
  return mastered;
}

/**
 * For a target exam, returns each domain's coverage status given what the
 * user already knows from other exams.
 *
 *  'covered'  — all sharedTopics in this domain are already mastered → skip or skim
 *  'partial'  — some sharedTopics mastered → focus on the delta
 *  'fresh'    — no overlap → full study needed
 *
 * Use this to surface "You already know X% of Domain 2 from CLF-C02 — focus on the delta."
 */
export function getCrossExamCoverage(
  targetExamKey: string,
  masteredTopics: Set<SharedTopicId>,
): Array<{
  domain: DomainSpec;
  status: 'covered' | 'partial' | 'fresh';
  masteredTopicCount: number;
  totalTopicCount: number;
  coveragePct: number;
}> {
  const guide = EXAM_GUIDES[targetExamKey];
  if (!guide) return [];

  return guide.domains.map((domain) => {
    const total = domain.sharedTopics.length;
    if (total === 0) return { domain, status: 'fresh', masteredTopicCount: 0, totalTopicCount: 0, coveragePct: 0 };
    const already = domain.sharedTopics.filter((t) => masteredTopics.has(t)).length;
    const pct = Math.round((already / total) * 100);
    const status: 'covered' | 'partial' | 'fresh' =
      pct >= 100 ? 'covered' : pct > 0 ? 'partial' : 'fresh';
    return { domain, status, masteredTopicCount: already, totalTopicCount: total, coveragePct: pct };
  });
}

/**
 * Suggests the most efficient exam study order for a set of target exams,
 * given what the user already knows. Exams whose prerequisite topics are
 * already covered come first; ones requiring the most new learning come last.
 */
export function getRecommendedExamOrder(
  targetExamKeys: string[],
  masteredTopics: Set<SharedTopicId>,
): Array<{ examKey: string; examCode: string; examName: string; newTopicCount: number; level: ExamGuide['level'] }> {
  return targetExamKeys
    .map((key) => {
      const guide = EXAM_GUIDES[key];
      if (!guide) return null;
      const allTopics = new Set(guide.domains.flatMap((d) => d.sharedTopics));
      const newTopics = [...allTopics].filter((t) => !masteredTopics.has(t));
      return {
        examKey: key,
        examCode: guide.examCode,
        examName: guide.examName,
        newTopicCount: newTopics.length,
        level: guide.level,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => a.newTopicCount - b.newTopicCount);
}
