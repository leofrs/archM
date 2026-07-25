import { useState } from "react";

interface AgentPromptViewerProps {
  prompt: string;
}

export function AgentPromptViewer({ prompt }: AgentPromptViewerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!prompt) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const wordCount = prompt.trim().split(/\s+/).length;
  const charCount = prompt.length;

  return (
    <div className="w-full bg-slate-900 text-slate-100 rounded-xl border border-slate-800 shadow-md overflow-hidden transition-all duration-300">
      {/* Header do Card */}
      <div className="p-3 bg-slate-950/90 backdrop-blur-sm flex flex-col gap-2.5">
        {/* Título e ícone */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 grid place-items-center text-white text-xs shadow-xs shrink-0">
              <i className="fa-solid fa-robot"></i>
            </div>
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider truncate">
              Prompt Gerado
            </h3>
          </div>

          {/* Badge estatística */}
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800 shrink-0">
            <span>{wordCount} palavras</span>
            <span className="text-slate-600">•</span>
            <span>{charCount} chars</span>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="grid grid-cols-2 gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              copied
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs"
            }`}
            title="Copiar prompt para a área de transferência"
          >
            <i className={`fa-solid ${copied ? "fa-check" : "fa-copy"}`}></i>
            <span>{copied ? "Copiado!" : "Copiar Prompt"}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-700/60"
            title={
              isExpanded ? "Recolher visualização" : "Expandir visualização"
            }
          >
            <span>{isExpanded ? "Recolher" : "Ver Prompt"}</span>
            <i
              className={`fa-solid fa-chevron-down text-[10px] transition-transform duration-200 ${
                isExpanded ? "rotate-180" : ""
              }`}
            ></i>
          </button>
        </div>
      </div>

      {/* Conteúdo Expandível */}
      {isExpanded && (
        <div className="p-3 bg-slate-950/60 border-t border-slate-800/80 transition-all duration-300">
          <div className="relative">
            <pre className="w-full max-h-[300px] overflow-y-auto p-3 bg-slate-900 text-slate-200 font-mono text-[11px] leading-relaxed rounded-lg border border-slate-800 whitespace-pre-wrap break-words select-text scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
              {prompt}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
