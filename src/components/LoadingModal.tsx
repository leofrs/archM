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
      setCurrentStepIndex((prevIndex) => (prevIndex + 1) % DEFAULT_LOADING_STEPS.length);
    }, 2800);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex justify-center items-center z-50 p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden p-8 flex flex-col items-center text-center relative">
        
        {/* Ambient background glow */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-violet-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* AI Icon Header */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-6 border border-indigo-400/30">
          <i className="fa-solid fa-wand-magic-sparkles text-2xl text-white animate-pulse"></i>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-white mb-2 tracking-tight">
          Gerando Arquitetura com IA
        </h3>

        {/* Status Messages */}
        <p className="text-xs text-indigo-300 font-medium h-6 flex items-center justify-center transition-all duration-300">
          {statusMsg || DEFAULT_LOADING_STEPS[currentStepIndex]}
        </p>

        {/* Sub-step indicator string */}
        <p className="text-[11px] text-slate-400 mt-1 mb-6">
          {DEFAULT_LOADING_STEPS[currentStepIndex]}
        </p>

        {/* 3 Animated Dots Loading */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s] shadow-sm shadow-indigo-500/50"></span>
          <span className="w-3 h-3 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s] shadow-sm shadow-indigo-400/50"></span>
          <span className="w-3 h-3 bg-violet-400 rounded-full animate-bounce shadow-sm shadow-violet-400/50"></span>
        </div>

        <span className="text-[10px] text-slate-500 font-mono tracking-wider uppercase mt-4">
          Aguarde a resposta do LLM...
        </span>
      </div>
    </div>
  );
}
