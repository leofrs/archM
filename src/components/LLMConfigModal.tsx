import { useState, useEffect } from "react";
import type { LLMConfig, LLMProviderId } from "../types/llm";
import { LLM_PROVIDERS } from "../utils/llmStorage";

interface LLMConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: LLMConfig;
  onSaveConfig: (newConfig: LLMConfig) => void;
}

export function LLMConfigModal({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}: LLMConfigModalProps) {
  const [tempConfig, setTempConfig] = useState<LLMConfig>(config);
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    setTempConfig(config);
  }, [config, isOpen]);

  if (!isOpen) return null;

  const activeProviderInfo = LLM_PROVIDERS[tempConfig.activeProvider];
  const activeKey = tempConfig.apiKeys[tempConfig.activeProvider] || "";
  const activeModel =
    tempConfig.selectedModels[tempConfig.activeProvider] ||
    activeProviderInfo.defaultModel;

  const handleSelectProvider = (providerId: LLMProviderId) => {
    setTempConfig((prev) => ({
      ...prev,
      activeProvider: providerId,
    }));
  };

  const handleKeyChange = (value: string) => {
    setTempConfig((prev) => ({
      ...prev,
      apiKeys: {
        ...prev.apiKeys,
        [prev.activeProvider]: value,
      },
    }));
  };

  const handleModelChange = (modelId: string) => {
    setTempConfig((prev) => ({
      ...prev,
      selectedModels: {
        ...prev.selectedModels,
        [prev.activeProvider]: modelId,
      },
    }));
  };

  const handleSave = () => {
    onSaveConfig(tempConfig);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 border border-indigo-600/20 flex items-center justify-center text-indigo-600 font-bold">
              <i className="fa-solid fa-sliders text-lg"></i>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Configuração de Provedor de IA (LLM)
              </h2>
              <p className="text-xs text-slate-500">
                Escolha o provedor, insira sua chave e selecione o modelo
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer text-sm font-semibold"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Seletor de Provedor */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
              1. Selecione o Provedor Ativo:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(Object.keys(LLM_PROVIDERS) as LLMProviderId[]).map((id) => {
                const provider = LLM_PROVIDERS[id];
                const isSelected = tempConfig.activeProvider === id;
                const hasKey = !!tempConfig.apiKeys[id]?.trim();

                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleSelectProvider(id)}
                    className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer relative ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20 shadow-xs"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <i className={`${provider.icon} text-lg text-slate-700`}></i>
                      {hasKey ? (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-emerald-100" title="Chave configurada"></span>
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-amber-400 ring-4 ring-amber-100" title="Sem chave"></span>
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900">
                        {provider.name}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium">
                        {hasKey ? "Chave salva" : "Chave pendente"}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Configuração da Chave API do Provedor Selecionado */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <i className={`${activeProviderInfo.icon} text-indigo-600`}></i>
                Chave da API ({activeProviderInfo.name}):
              </label>
              <a
                href={activeProviderInfo.getKeyUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-1"
              >
                Obter chave ↗
              </a>
            </div>

            <div className="relative">
              <input
                type={showApiKey ? "text" : "password"}
                value={activeKey}
                onChange={(e) => handleKeyChange(e.target.value)}
                placeholder={`Cole sua API Key da ${activeProviderInfo.name}...`}
                className="w-full pl-3 pr-10 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-900 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs px-1"
                title={showApiKey ? "Ocultar chave" : "Mostrar chave"}
              >
                <i className={`fa-solid ${showApiKey ? "fa-eye-slash" : "fa-eye"}`}></i>
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Sua chave é mantida apenas localmente no navegador (`localStorage`).
            </p>
          </div>

          {/* Seleção do Modelo do Provedor */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              2. Modelo de IA Selecionado:
            </label>
            <div className="space-y-2">
              {activeProviderInfo.models.map((model) => {
                const isSelected = activeModel === model.id;

                return (
                  <label
                    key={model.id}
                    onClick={() => handleModelChange(model.id)}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-50/30"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="llm-model"
                      checked={isSelected}
                      onChange={() => handleModelChange(model.id)}
                      className="mt-0.5 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">
                          {model.name}
                        </span>
                        <code className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md font-mono">
                          {model.id}
                        </code>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {model.description}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            <i className="fa-solid fa-check"></i>
            Salvar Configurações
          </button>
        </div>
      </div>
    </div>
  );
}
