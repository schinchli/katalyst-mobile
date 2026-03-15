// ─── Challenge target scores (% to beat) per quiz ────────────────────────────
// Represents the "CPU opponent score" in Challenge Arena mode
export const CHALLENGE_SCORES: Record<string, number> = {
  'bedrock-fundamentals':          70,
  'bedrock-advanced':              65,
  'rag-knowledge-bases':           70,
  'prompt-engineering':            75,
  'security-compliance':           70,
  'mlops-sagemaker':               70,
  'ai-agents':                     70,
  'cost-optimization':             72,
  'serverless':                    70,
  'networking':                    68,
  'databases':                     70,
  'clf-c02-cloud-concepts':        67,
  'clf-c02-security':              72,
  'clf-c02-technology':            74,
  'clf-c02-billing':               66,
};

// ─── CPU display names ────────────────────────────────────────────────────────
export const CPU_NAMES: Record<string, string> = {
  'bedrock-fundamentals':          'CloudBot v3',
  'bedrock-advanced':              'AdvancedAI Pro',
  'rag-knowledge-bases':           'VectorBot',
  'prompt-engineering':            'PromptGenius',
  'security-compliance':           'SecureAI',
  'mlops-sagemaker':               'MLOpsBot',
  'ai-agents':                     'AgentCore',
  'cost-optimization':             'CostBot Pro',
  'serverless':                    'LambdaMind',
  'networking':                    'NetBot',
  'databases':                     'DataBot',
  'clf-c02-cloud-concepts':        'ConceptPilot',
  'clf-c02-security':              'ShieldOps',
  'clf-c02-technology':            'TechStacker',
  'clf-c02-billing':               'BudgetBot',
};
