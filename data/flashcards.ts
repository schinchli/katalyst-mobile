export type FlashcardCategory = 'aws-practitioner' | 'genai-practitioner';

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
];
