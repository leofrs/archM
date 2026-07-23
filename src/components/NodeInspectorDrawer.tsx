import React, { useState } from "react";

export function NodeInspectorDrawer({ node, onClose }) {
  const [activeTab, setActiveTab] = useState("dto"); // 'dto' | 'headers' | 'code'
  const [copiedText, setCopiedText] = useState(false);

  if (!node) return null;

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <aside className="absolute top-0 right-0 bottom-0 w-[380px] bg-white border-l border-slate-200 shadow-2xl z-40 flex flex-col transition-all duration-300 animate-in slide-in-from-right">
      {/* Header da Gaveta */}
      <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/30 text-indigo-400 grid place-items-center text-sm shrink-0">
            <i className={`fa-solid ${node.icon}`}></i>
          </div>
          <div className="truncate">
            <div className="text-xs font-bold truncate text-slate-100">
              {node.label}
            </div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">
              {node.category}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-white text-lg px-2 cursor-pointer transition-colors"
          title="Fechar Inspeção"
        >
          &times;
        </button>
      </div>

      {/* Badge da Categoria/Camada */}
      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <span
          className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${node.colorClass}`}
        >
          <i className={`fa-solid ${node.icon} mr-1.5`}></i>
          {node.category}
        </span>
        <span className="text-[10px] text-slate-500 font-mono">
          ID: {node.id.slice(0, 12)}
        </span>
      </div>

      {/* Navegação por Abas */}
      <div className="flex border-b border-slate-200 bg-white text-xs font-semibold text-slate-600">
        <button
          type="button"
          className={`flex-1 py-2.5 text-center cursor-pointer border-b-2 transition-colors ${
            activeTab === "dto"
              ? "border-indigo-600 text-indigo-600 font-bold bg-indigo-50/40"
              : "border-transparent hover:text-slate-900"
          }`}
          onClick={() => setActiveTab("dto")}
        >
          📋 DTO / Payload
        </button>
        <button
          type="button"
          className={`flex-1 py-2.5 text-center cursor-pointer border-b-2 transition-colors ${
            activeTab === "headers"
              ? "border-indigo-600 text-indigo-600 font-bold bg-indigo-50/40"
              : "border-transparent hover:text-slate-900"
          }`}
          onClick={() => setActiveTab("headers")}
        >
          🌐 Headers
        </button>
        <button
          type="button"
          className={`flex-1 py-2.5 text-center cursor-pointer border-b-2 transition-colors ${
            activeTab === "code"
              ? "border-indigo-600 text-indigo-600 font-bold bg-indigo-50/40"
              : "border-transparent hover:text-slate-900"
          }`}
          onClick={() => setActiveTab("code")}
        >
          💻 Código
        </button>
      </div>

      {/* Conteúdo da Aba */}
      <div className="p-4 flex-1 overflow-y-auto bg-slate-50/50">
        {/* TAB 1: DTO / Payload */}
        {activeTab === "dto" && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">
                Payload / DTO Exemplo (JSON):
              </label>
              <button
                type="button"
                onClick={() => handleCopy(node.dtoSample)}
                className="text-[11px] text-indigo-600 hover:underline font-medium flex items-center gap-1 cursor-pointer"
              >
                <i
                  className={`fa-solid ${
                    copiedText ? "fa-check text-emerald-500" : "fa-copy"
                  }`}
                ></i>
                {copiedText ? "Copiado!" : "Copiar JSON"}
              </button>
            </div>
            <pre className="bg-slate-900 text-slate-200 p-3.5 rounded-lg font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800 shadow-inner">
              {node.dtoSample}
            </pre>
          </div>
        )}

        {/* TAB 2: Headers */}
        {activeTab === "headers" && (
          <div className="flex flex-col gap-3">
            <label className="text-xs font-semibold text-slate-700">
              Cabeçalhos HTTP Esperados:
            </label>
            <div className="flex flex-col gap-2">
              {node.headers.map((header, idx) => (
                <div
                  key={idx}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 flex items-center justify-between shadow-sm"
                >
                  <span>{header}</span>
                  <i className="fa-solid fa-lock text-slate-400 text-[10px]"></i>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: Trecho de Código */}
        {activeTab === "code" && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">
                Implementação Recomendada:
              </label>
              <button
                type="button"
                onClick={() => handleCopy(node.codeSnippet)}
                className="text-[11px] text-indigo-600 hover:underline font-medium flex items-center gap-1 cursor-pointer"
              >
                <i
                  className={`fa-solid ${
                    copiedText ? "fa-check text-emerald-500" : "fa-copy"
                  }`}
                ></i>
                {copiedText ? "Copiado!" : "Copiar Código"}
              </button>
            </div>
            <pre className="bg-slate-900 text-slate-200 p-3.5 rounded-lg font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800 shadow-inner">
              {node.codeSnippet}
            </pre>
          </div>
        )}
      </div>

      {/* Footer da Gaveta */}
      <div className="p-3 bg-white border-t border-slate-200 text-center text-[11px] text-slate-500">
        Inspeção ativa do nó no canvas
      </div>
    </aside>
  );
}
