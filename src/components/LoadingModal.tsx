import { useState, useEffect } from "react";

interface LoadingModalProps {
  isOpen: boolean;
  statusMsg?: string;
}

const DEFAULT_LOADING_STEPS = [
  "Estabelecendo conexão com o modelo de IA...",
  "Analisando contexto e regras de arquitetura...",
  "Mapeando componentes, fluxos e metadados dos nós...",
  "Sintetizando estrutura Mermaid e definições visuais...",
  "Processando validação final e preparando exibição...",
];

export function LoadingModal({ isOpen, statusMsg }: LoadingModalProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStepIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentStepIndex(
        (prevIndex) => (prevIndex + 1) % DEFAULT_LOADING_STEPS.length,
      );
    }, 2800);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const currentMessage = statusMsg || DEFAULT_LOADING_STEPS[currentStepIndex];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex justify-center items-center z-50 p-4 animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden p-8 flex flex-col items-center text-center relative bg-gradient-to-b from-indigo-50/50 via-white to-white">
        {/* Animated Dual Ring AI Orb Icon */}
        <div className="relative mb-6 flex items-center justify-center">
          {/* Outer ring */}
          <div className="w-20 h-20 rounded-full border-2 border-indigo-600/20 border-t-indigo-600 animate-spin" />
          {/* Inner counter-rotating ring */}
          <div className="w-14 h-14 rounded-full border-2 border-violet-500/30 border-b-violet-600 animate-[spin_2s_linear_infinite_reverse] absolute" />
          {/* Icon Badge Center */}
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-xl shadow-lg shadow-indigo-500/25 absolute border border-indigo-400/30">
            <i className="fa-solid fa-wand-magic-sparkles"></i>
          </div>
        </div>

        {/* Header Title */}
        <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
          Gerando Arquitetura com IA
        </h3>

        {/* Active Status Message Pill Badge */}
        <div className="mt-3 mb-4 px-3.5 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full flex items-center gap-2 max-w-full">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
          </span>
          <span className="text-xs font-semibold text-indigo-700 truncate">
            {currentMessage}
          </span>
        </div>

        {/* Sub-description */}
        <p className="text-xs text-slate-500 max-w-xs mb-6 leading-relaxed">
          O modelo de IA está processando as diretrizes técnicas e sintetizando
          o diagrama de fluxo.
        </p>
      </div>
    </div>
  );
}
