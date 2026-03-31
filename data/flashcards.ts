export type FlashcardCategory = 'aws-practitioner' | 'genai-practitioner' | 'aip-c01';

export interface Flashcard {
  id: string;
  category: FlashcardCategory;
  front: string;
  back: string;
  tag?: string;
}

export const flashcards: Flashcard[] = [
  // AWS Cloud Practitioner core services
  { id: 'aws-s3', category: 'aws-practitioner', tag: 'Storage', front: 'Amazon S3', back: 'Object storage for any amount of data with versioning, lifecycle rules, and global access via buckets.' },
  { id: 'aws-ec2', category: 'aws-practitioner', tag: 'Compute', front: 'Amazon EC2', back: 'Resizable virtual servers with instance families (general, compute, memory) and pricing models like On-Demand and Spot.' },
  { id: 'aws-lambda', category: 'aws-practitioner', tag: 'Serverless', front: 'AWS Lambda', back: 'Run code without managing servers. Billed per millisecond with automatic scaling and event triggers.' },
  { id: 'aws-rds', category: 'aws-practitioner', tag: 'Database', front: 'Amazon RDS', back: 'Managed relational databases (Aurora, MySQL, Postgres, etc.) with automated backups and Multi-AZ.' },
  { id: 'aws-dynamodb', category: 'aws-practitioner', tag: 'NoSQL', front: 'Amazon DynamoDB', back: 'Fully managed key-value/NoSQL database with single-digit ms latency and autoscaling.' },
  { id: 'aws-vpc', category: 'aws-practitioner', tag: 'Networking', front: 'Amazon VPC', back: 'Isolated virtual network with subnets, route tables, NAT gateways, and security groups.' },
  { id: 'aws-cloudfront', category: 'aws-practitioner', tag: 'CDN', front: 'Amazon CloudFront', back: 'Content delivery network caching static/dynamic content at edge locations with Shield/ACL integration.' },
  { id: 'aws-sqs', category: 'aws-practitioner', tag: 'Messaging', front: 'Amazon SQS', back: 'Fully managed message queue supporting standard and FIFO queues for decoupling services.' },
  { id: 'aws-sns', category: 'aws-practitioner', tag: 'Pub/Sub', front: 'Amazon SNS', back: 'Pub/Sub messaging with topics, fan-out to email, SMS, HTTP, SQS, and Lambda.' },
  { id: 'aws-iam', category: 'aws-practitioner', tag: 'Security', front: 'AWS IAM', back: 'Identity and access management via users, roles, policies, and MFA enforcing least privilege.' },

  // GenAI Practitioner essentials
  { id: 'genai-bedrock', category: 'genai-practitioner', tag: 'Platform', front: 'Amazon Bedrock', back: 'Fully managed service to access foundation models (Anthropic, Amazon) with tooling for agents and guardrails.' },
  { id: 'genai-kb', category: 'genai-practitioner', tag: 'RAG', front: 'Knowledge Bases', back: 'Native Bedrock RAG feature that ingests documents, builds vectors, and returns context-grounded answers.' },
  { id: 'genai-guardrails', category: 'genai-practitioner', tag: 'Safety', front: 'Bedrock Guardrails', back: 'Configurable safety filters for PII redaction, topic denial, and hallucination control across model providers.' },
  { id: 'genai-titan-embed', category: 'genai-practitioner', tag: 'Embeddings', front: 'Titan Embeddings', back: 'Amazon Titan embedding models optimized for retrieval use cases and multi-lingual support.' },
  { id: 'genai-agents', category: 'genai-practitioner', tag: 'Agents', front: 'Bedrock Agents', back: 'Orchestrate tools and APIs with planning and execution steps, returning grounded actions to users.' },
  { id: 'genai-kendra', category: 'genai-practitioner', tag: 'Search', front: 'Amazon Kendra', back: 'Enterprise search with connectors and semantic ranking; often used as a retrieval source for RAG.' },
  { id: 'genai-sm-jumpstart', category: 'genai-practitioner', tag: 'MLOps', front: 'SageMaker JumpStart', back: 'Catalog of foundation models and solutions with managed deployment endpoints for custom GenAI.' },
  { id: 'genai-prompt-guard', category: 'genai-practitioner', tag: 'Safety', front: 'Prompt Guard', back: 'Bedrock safety filter that blocks prompt injections and sensitive content before model invocation.' },

  // AIP-C01 Professional — key concepts
  { id: 'aip-hierarchical-chunking', category: 'aip-c01', tag: 'RAG', front: 'Hierarchical Chunking', back: 'Splits documents into parent (section) and child (snippet) chunks. Retrieval matches child chunks but returns the parent for full context — preserves structure in technical docs.' },
  { id: 'aip-semantic-chunking', category: 'aip-c01', tag: 'RAG', front: 'Semantic Chunking', back: 'Groups sentences by embedding similarity rather than fixed token count. Keeps semantically related sentences together, reducing mid-sentence breaks.' },
  { id: 'aip-ragas', category: 'aip-c01', tag: 'Evaluation', front: 'RAGAS Framework', back: 'RAG evaluation suite. Key metrics: Faithfulness (answers supported by context), Context Recall (context covers ground truth), Answer Relevancy (answer addresses the question).' },
  { id: 'aip-grounding-check', category: 'aip-c01', tag: 'Guardrails', front: 'Guardrails Grounding Check', back: 'Validates each response claim against retrieved KB context. Blocks responses below a configurable grounding score threshold — primary defence against hallucinations.' },
  { id: 'aip-prompt-caching', category: 'aip-c01', tag: 'Cost', front: 'Prompt Caching', back: 'Caches the KV-state of a prompt prefix. Subsequent calls with the same prefix skip re-computation — reduces input token cost by ~90% and latency by ~85% for cached tokens.' },
  { id: 'aip-provisioned-throughput', category: 'aip-c01', tag: 'Deployment', front: 'Provisioned Throughput', back: 'Purchases dedicated Model Units (MUs) for a Bedrock model. Eliminates throttling and provides consistent latency. Required for serving fine-tuned models.' },
  { id: 'aip-cri', category: 'aip-c01', tag: 'Deployment', front: 'Cross-Region Inference (CRI)', back: 'Bedrock routes inference across regions for capacity and lower latency. ARN prefixes: us.*, eu.*, ap.*. SCPs can restrict to eu.* only for GDPR data-residency compliance.' },
  { id: 'aip-agentcore-memory', category: 'aip-c01', tag: 'Agents', front: 'AgentCore Memory', back: 'Managed memory service for Bedrock Agents. Stores user preferences and conversation history across sessions. Agent auto-injects relevant memory into context for multi-turn continuity.' },
  { id: 'aip-agentcore-browser', category: 'aip-c01', tag: 'Agents', front: 'AgentCore Browser Tool', back: 'Built-in agent capability to fetch and parse live web pages — no custom Lambda required. Part of AgentCore managed tools alongside Code Interpreter.' },
  { id: 'aip-intelligent-routing', category: 'aip-c01', tag: 'Cost', front: 'Intelligent Prompt Routing', back: 'Bedrock dynamically routes each request to the most cost-effective capable model. Configurable per complexity — simple queries → cheaper model; complex → more capable.' },
  { id: 'aip-multi-agent', category: 'aip-c01', tag: 'Agents', front: 'Multi-Agent Collaboration', back: 'Supervisor Bedrock Agent delegates sub-tasks to specialised sub-agents as action groups. Enables task decomposition across domain experts (DB queries, doc search, calculations).' },
  { id: 'aip-converse-api', category: 'aip-c01', tag: 'API', front: 'Converse API', back: 'Model-agnostic message schema for Bedrock. Same code works across Claude, Nova, Titan. Supports multi-modal content blocks (text + image) and tool use (function calling) for structured output.' },
  { id: 'aip-tool-use', category: 'aip-c01', tag: 'API', front: 'Tool Use (Function Calling)', back: 'Define a JSON schema as a "tool" in the Converse API. The model returns structured tool_use blocks guaranteed to match the schema — more reliable than prompt-based JSON instructions.' },
  { id: 'aip-bedrock-flows', category: 'aip-c01', tag: 'Orchestration', front: 'Bedrock Flows', back: 'Visual low-code builder for fixed, deterministic AI pipelines. Connects Prompt, KB, Guardrail, Condition, and Lambda nodes. Use for predefined sequences; use Agents for dynamic reasoning.' },
  { id: 'aip-sagemaker-neo', category: 'aip-c01', tag: 'Edge', front: 'SageMaker Neo', back: 'Compiles and optimises ML models for target hardware (iOS, Android, ARM). Enables sub-50ms on-device inference without internet — required for offline mobile AI features.' },
  { id: 'aip-a2i', category: 'aip-c01', tag: 'Governance', front: 'Amazon Augmented AI (A2I)', back: 'Human-in-the-loop review for AI outputs. Routes low-confidence outputs to reviewers before release. Supports Mechanical Turk or private workforce. Standard pattern for AI quality gates.' },
  { id: 'aip-model-invocation-logging', category: 'aip-c01', tag: 'Governance', front: 'Model Invocation Logging', back: 'Bedrock feature that logs full prompt/response content, guardrails outcomes, token counts, and IAM identity to S3 or CloudWatch. Enables compliance chain-of-custody audit trails.' },
  { id: 'aip-appconfig-routing', category: 'aip-c01', tag: 'MLOps', front: 'AppConfig for Model Routing', back: 'Externalise the active Bedrock model ID in an AppConfig profile. Update the config to switch models (e.g. Claude → Nova Pro) without redeployment. Supports progressive rollout and rollback.' },
  { id: 'aip-batch-inference', category: 'aip-c01', tag: 'Cost', front: 'Batch Inference', back: 'Asynchronous job (CreateModelInvocationJob) processing large S3 datasets. Lower per-token cost than on-demand. Best for overnight bulk workloads — not for real-time user-facing requests.' },
  { id: 'aip-scp-model-governance', category: 'aip-c01', tag: 'Security', front: 'SCP for Model Governance', back: 'AWS Organizations SCP with a bedrock:InvokeModel condition restricting to approved model ARN allowlist. Enforces org-wide model governance — no account can call non-approved models.' },
];
