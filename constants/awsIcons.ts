/**
 * AWS service and category icon registry.
 * Static requires are mandatory for React Native bundler — no dynamic paths.
 * All icons are 64px PNGs from the official AWS Architecture Icons package (Jan 2026).
 */
import type { ImageSourcePropType } from 'react-native';

// ─── Service icons ────────────────────────────────────────────────────────────

export const AWS_SERVICE_ICONS: Record<string, ImageSourcePropType> = {
  // AWS Practitioner
  'Amazon EC2':        require('@/assets/aws/ec2.png'),
  'AWS Lambda':        require('@/assets/aws/lambda.png'),
  'Amazon RDS':        require('@/assets/aws/rds.png'),
  'Amazon DynamoDB':   require('@/assets/aws/dynamodb.png'),
  'Amazon CloudFront': require('@/assets/aws/cloudfront.png'),
  'Amazon SQS':        require('@/assets/aws/sqs.png'),
  'Amazon SNS':        require('@/assets/aws/sns.png'),
  'AWS IAM':           require('@/assets/aws/iam.png'),

  // GenAI Practitioner
  'Amazon Bedrock':    require('@/assets/aws/bedrock.png'),
  'Knowledge Bases':   require('@/assets/aws/bedrock.png'),
  'Bedrock Guardrails':require('@/assets/aws/guardduty.png'),
  'Titan Embeddings':  require('@/assets/aws/nova.png'),
  'Bedrock Agents':    require('@/assets/aws/bedrock-agents.png'),
  'Amazon Kendra':     require('@/assets/aws/kendra.png'),
  'SageMaker JumpStart':require('@/assets/aws/sagemaker.png'),
  'Prompt Guard':      require('@/assets/aws/guardduty.png'),
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
