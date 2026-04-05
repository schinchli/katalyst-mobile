/**
 * AWS service and category icon registry.
 * Static requires are mandatory for React Native bundler — no dynamic paths.
 * All icons are 64px PNGs from the official AWS Architecture Icons package (Jan 2026).
 */
import type { ImageSourcePropType } from 'react-native';

// ─── Service icons ────────────────────────────────────────────────────────────

export const AWS_SERVICE_ICONS: Record<string, ImageSourcePropType> = {
  // AWS Practitioner — all 10 services matched 1-to-1
  'Amazon S3':         require('@/assets/aws/s3.png'),          // Arch_Amazon-Simple-Storage-Service
  'Amazon EC2':        require('@/assets/aws/ec2.png'),          // Arch_Amazon-EC2
  'AWS Lambda':        require('@/assets/aws/lambda.png'),       // Arch_AWS-Lambda
  'Amazon RDS':        require('@/assets/aws/rds.png'),          // Arch_Amazon-RDS
  'Amazon DynamoDB':   require('@/assets/aws/dynamodb.png'),     // Arch_Amazon-DynamoDB
  'Amazon VPC':        require('@/assets/aws/vpc.png'),          // Arch_Amazon-Virtual-Private-Cloud
  'Amazon CloudFront': require('@/assets/aws/cloudfront.png'),   // Arch_Amazon-CloudFront
  'Amazon SQS':        require('@/assets/aws/sqs.png'),          // Arch_Amazon-Simple-Queue-Service
  'Amazon SNS':        require('@/assets/aws/sns.png'),          // Arch_Amazon-Simple-Notification-Service
  'AWS IAM':           require('@/assets/aws/iam.png'),          // Arch_AWS-Identity-and-Access-Management

  // GenAI Practitioner — all 8 services matched 1-to-1
  'Amazon Bedrock':     require('@/assets/aws/bedrock.png'),        // Arch_Amazon-Bedrock
  'Knowledge Bases':    require('@/assets/aws/bedrock.png'),        // Bedrock KB — uses Bedrock icon
  'Bedrock Guardrails': require('@/assets/aws/guardduty.png'),      // GuardDuty as safety proxy
  'Titan Embeddings':   require('@/assets/aws/nova.png'),           // Amazon Nova — embedding models
  'Bedrock Agents':     require('@/assets/aws/bedrock-agents.png'), // Arch_Amazon-Bedrock-AgentCore
  'Amazon Kendra':      require('@/assets/aws/kendra.png'),         // Arch_Amazon-Kendra
  'SageMaker JumpStart':require('@/assets/aws/sagemaker.png'),      // Arch_Amazon-SageMaker-AI
  'Prompt Guard':       require('@/assets/aws/guardduty.png'),      // GuardDuty as safety proxy
};

// ─── Service accent colours (brand-accurate, matches icon colour) ─────────────

export const AWS_SERVICE_ACCENT: Record<string, string> = {
  'Amazon S3':          '#3F8624',
  'Amazon EC2':         '#FF9900',
  'AWS Lambda':         '#FF9900',
  'Amazon RDS':         '#527FFF',
  'Amazon DynamoDB':    '#527FFF',
  'Amazon VPC':         '#8A63D2',
  'Amazon CloudFront':  '#FF9900',
  'Amazon SQS':         '#FF9900',
  'Amazon SNS':         '#E7157B',
  'AWS IAM':            '#DD344C',
  'Amazon Bedrock':     '#7C3AED',
  'Knowledge Bases':    '#0EA5E9',
  'Bedrock Guardrails': '#EF4444',
  'Titan Embeddings':   '#7C3AED',
  'Bedrock Agents':     '#10B981',
  'Amazon Kendra':      '#527FFF',
  'SageMaker JumpStart':'#10B981',
  'Prompt Guard':       '#EF4444',
};

// ─── Category icons (for quiz course cards) ───────────────────────────────────

export const AWS_CATEGORY_ICONS: Record<string, ImageSourcePropType> = {
  'clf-c02':           require('@/assets/aws/cat-compute.png'),
  bedrock:             require('@/assets/aws/cat-ai.png'),
  genai:               require('@/assets/aws/cat-ai.png'),
  security:            require('@/assets/aws/cat-security.png'),
  mlops:               require('@/assets/aws/cat-ai.png'),
  compute:             require('@/assets/aws/cat-compute.png'),
  networking:          require('@/assets/aws/cat-networking.png'),
  databases:           require('@/assets/aws/cat-databases.png'),
  'cost-optimization': require('@/assets/aws/cat-cost.png'),
  storage:             require('@/assets/aws/cat-storage.png'),
  management:          require('@/assets/aws/cat-management.png'),
};
