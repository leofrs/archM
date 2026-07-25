export type LLMProviderId = "google" | "anthropic" | "openai";

export interface LLMModelOption {
  id: string;
  name: string;
  description: string;
}

export interface LLMProviderInfo {
  id: LLMProviderId;
  name: string;
  icon: string;
  color: string;
  getKeyUrl: string;
  defaultModel: string;
  models: LLMModelOption[];
}

export interface LLMConfig {
  activeProvider: LLMProviderId;
  apiKeys: Record<LLMProviderId, string>;
  selectedModels: Record<LLMProviderId, string>;
}

export interface LLMDiagramResult {
  mermaidCode: string;
  mermaidSequenceCode?: string;
  nodes?: Record<string, any>;
  agentPrompt?: string;
}
