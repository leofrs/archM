import type { LLMConfig, LLMProviderId, LLMProviderInfo } from "../types/llm";

export const LLM_PROVIDERS: Record<LLMProviderId, LLMProviderInfo> = {
  google: {
    id: "google",
    name: "Google Gemini",
    icon: "fa-brands fa-google",
    color: "emerald",
    getKeyUrl: "https://aistudio.google.com/app/apikey",
    defaultModel: "gemini-2.5-flash",
    models: [
      {
        id: "gemini-2.5-flash",
        name: "Gemini 2.5 Flash",
        description: "Rápido, de alta precisão e multimodal (Recomendado)",
      },
      {
        id: "gemini-1.5-pro",
        name: "Gemini 1.5 Pro",
        description: "Raciocínio avançado para arquiteturas complexas",
      },
    ],
  },
  anthropic: {
    id: "anthropic",
    name: "Anthropic Claude",
    icon: "fa-solid fa-brain",
    color: "amber",
    getKeyUrl: "https://console.anthropic.com/settings/keys",
    defaultModel: "claude-3-5-sonnet-20241022",
    models: [
      {
        id: "claude-3-5-sonnet-20241022",
        name: "Claude 3.5 Sonnet",
        description: "Excelente em design estruturado de arquitetura",
      },
      {
        id: "claude-3-5-haiku-20241022",
        name: "Claude 3.5 Haiku",
        description: "Resposta ultrarrápida para diagramas diretos",
      },
    ],
  },
  openai: {
    id: "openai",
    name: "OpenAI ChatGPT",
    icon: "fa-solid fa-robot",
    color: "indigo",
    getKeyUrl: "https://platform.openai.com/api-keys",
    defaultModel: "gpt-4o",
    models: [
      {
        id: "gpt-4o",
        name: "GPT-4o",
        description: "Modelo flagship versátil, multimodal e rápido",
      },
      {
        id: "gpt-4o-mini",
        name: "GPT-4o Mini",
        description: "Econômico e extremamente leve",
      },
      {
        id: "o3-mini",
        name: "o3-mini",
        description: "Raciocínio computacional focado para código e arquitetura",
      },
    ],
  },
};

const STORAGE_KEY = "archm_llm_config";
const LEGACY_GEMINI_KEY = "archm_gemini_key";

export const DEFAULT_LLM_CONFIG: LLMConfig = {
  activeProvider: "google",
  apiKeys: {
    google: "",
    anthropic: "",
    openai: "",
  },
  selectedModels: {
    google: "gemini-2.5-flash",
    anthropic: "claude-3-5-sonnet-20241022",
    openai: "gpt-4o",
  },
};

export function getStoredLLMConfig(): LLMConfig {
  try {
    const storedStr = localStorage.getItem(STORAGE_KEY);
    const legacyGeminiKey = localStorage.getItem(LEGACY_GEMINI_KEY) || "";

    if (storedStr) {
      const parsed = JSON.parse(storedStr) as Partial<LLMConfig>;
      return {
        activeProvider: parsed.activeProvider || "google",
        apiKeys: {
          google: parsed.apiKeys?.google || legacyGeminiKey || "",
          anthropic: parsed.apiKeys?.anthropic || "",
          openai: parsed.apiKeys?.openai || "",
        },
        selectedModels: {
          google: parsed.selectedModels?.google || "gemini-2.5-flash",
          anthropic: parsed.selectedModels?.anthropic || "claude-3-5-sonnet-20241022",
          openai: parsed.selectedModels?.openai || "gpt-4o",
        },
      };
    }

    if (legacyGeminiKey) {
      return {
        ...DEFAULT_LLM_CONFIG,
        apiKeys: {
          ...DEFAULT_LLM_CONFIG.apiKeys,
          google: legacyGeminiKey,
        },
      };
    }
  } catch (error) {
    console.error("Erro ao carregar configurações de LLM:", error);
  }

  return DEFAULT_LLM_CONFIG;
}

export function saveLLMConfig(config: LLMConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    if (config.apiKeys.google) {
      localStorage.setItem(LEGACY_GEMINI_KEY, config.apiKeys.google);
    }
  } catch (error) {
    console.error("Erro ao salvar configurações de LLM:", error);
  }
}

export function getActiveLLMKey(config: LLMConfig): string {
  return config.apiKeys[config.activeProvider] || "";
}

export function getActiveLLMModel(config: LLMConfig): string {
  return config.selectedModels[config.activeProvider] || LLM_PROVIDERS[config.activeProvider].defaultModel;
}
