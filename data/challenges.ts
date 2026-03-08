// ─── Challenge target scores (% to beat) per quiz ────────────────────────────
// Represents the "CPU opponent score" in Challenge Arena mode
export const CHALLENGE_SCORES: Record<string, number> = {
  'bedrock-fundamentals':          70,
  'bedrock-advanced':              65,
  'rag-knowledge-bases':           70,
  'agents-multi-agent':            70,
  'guardrails-safety':             70,
  'prompt-engineering':            75,
  'multi-llm-routing':             65,
  'security-compliance':           70,
  'monitoring-observability':      70,
  'orchestration-step-functions':  65,
  'evaluation-testing':            70,
  'mlops-sagemaker':               70,
  'genai-mega-quiz':               60,
  'ai-agents':                     70,
  'cost-optimization':             72,
  'serverless':                    70,
  'networking':                    68,
  'databases':                     70,
};

// ─── CPU display names ────────────────────────────────────────────────────────
export const CPU_NAMES: Record<string, string> = {
  'bedrock-fundamentals':          'CloudBot v3',
  'bedrock-advanced':              'AdvancedAI Pro',
  'rag-knowledge-bases':           'VectorBot',
  'agents-multi-agent':            'AgentMaster',
  'guardrails-safety':             'SafetyBot',
  'prompt-engineering':            'PromptGenius',
  'multi-llm-routing':             'RouterBot',
  'security-compliance':           'SecureAI',
  'monitoring-observability':      'ObserveBot',
  'orchestration-step-functions':  'OrchestrAI',
  'evaluation-testing':            'EvalMaster',
  'mlops-sagemaker':               'MLOpsBot',
  'genai-mega-quiz':               'MegaMind',
  'ai-agents':                     'AgentCore',
  'cost-optimization':             'CostBot Pro',
  'serverless':                    'LambdaMind',
  'networking':                    'NetBot',
  'databases':                     'DataBot',
};
