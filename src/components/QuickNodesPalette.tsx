import React, { useState } from "react";

export const QUICK_PRESETS = [
  {
    id: "middleware",
    name: "Middleware",
    icon: "fa-filter",
    cssClass: "default",
    defaultLabel: "AuthMiddleware: Validar JWT",
    category: "Middleware de Segurança",
    color: "border-indigo-200 text-indigo-700 hover:bg-indigo-50",
  },
  {
    id: "controller",
    name: "Controller",
    icon: "fa-sliders",
    cssClass: "default",
    defaultLabel: "OrderController: handleCheckout",
    category: "Controller / Rota",
    color: "border-blue-200 text-blue-700 hover:bg-blue-50",
  },
  {
    id: "service",
    name: "Service",
    icon: "fa-gears",
    cssClass: "default",
    defaultLabel: "OrderService: Executar Regra",
    category: "Lógica de Negócio",
    color: "border-slate-200 text-slate-700 hover:bg-slate-100",
  },
  {
    id: "database",
    name: "Database",
    icon: "fa-database",
    cssClass: "database",
    defaultLabel: "PostgreSQL: Tabela Pedidos",
    category: "Banco de Dados",
    color: "border-amber-200 text-amber-800 hover:bg-amber-50",
  },
  {
    id: "cache",
    name: "Cache (Redis)",
    icon: "fa-bolt",
    cssClass: "cache",
    defaultLabel: "RedisCache: Sessão Usuário",
    category: "Cache em Memória",
    color: "border-yellow-200 text-yellow-800 hover:bg-yellow-50",
  },
  {
    id: "queue",
    name: "Fila (Kafka)",
    icon: "fa-list-check",
    cssClass: "queue",
    defaultLabel: "KafkaTopic: OrderPlaced",
    category: "Mensageria / Fila",
    color: "border-pink-200 text-pink-700 hover:bg-pink-50",
  },
  {
    id: "external",
    name: "API Externa",
    icon: "fa-cloud-arrow-up",
    cssClass: "external",
    defaultLabel: "StripeAPI: Cobrança Cartão",
    category: "Serviço Externo",
    color: "border-slate-300 text-slate-800 hover:bg-slate-100",
  },
  {
    id: "success",
    name: "Sucesso (2xx)",
    icon: "fa-circle-check",
    cssClass: "success",
    defaultLabel: "HTTP 201: Created",
    category: "Resposta HTTP",
    color: "border-emerald-200 text-emerald-800 hover:bg-emerald-50",
  },
  {
    id: "error",
    name: "Erro (4xx/5xx)",
    icon: "fa-circle-xmark",
    cssClass: "error",
    defaultLabel: "HTTP 400: Bad Request",
    category: "Erro HTTP",
    color: "border-red-200 text-red-800 hover:bg-red-50",
  },
];

export function QuickNodesPalette({ onAddNode }) {
  const [isOpen, setIsOpen] = useState(true);

  const handleDragStart = (e, preset) => {
    e.dataTransfer.setData("application/json", JSON.stringify(preset));
  };

  return (
    <div className="absolute bottom-5 left-5 z-20 flex flex-col items-start transition-all">
      {/* Botão Toggle da Paleta */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white border border-slate-200 text-slate-700 hover:text-indigo-600 px-3 py-2 rounded-xl shadow-sm text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all mb-2"
      >
        <i className="fa-solid fa-shapes text-indigo-500"></i>
        <span>
          {isOpen ? "Ocultar Paleta de Blocos" : "🧩 Adicionar Blocos (+)"}
        </span>
      </button>

      {/* Grid de Blocos Rápido */}
      {isOpen && (
        <div className="bg-white/95 backdrop-blur-sm p-3 rounded-2xl border border-slate-200 shadow-xl w-[310px] animate-in slide-in-from-bottom-2">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Clique ou Arraste para o Canvas</span>
            <i className="fa-solid fa-hand-pointer text-slate-400"></i>
          </div>

          <div className="grid grid-cols-2 gap-1.5 max-h-[180px] overflow-y-auto pr-1">
            {QUICK_PRESETS.map((preset) => (
              <div
                key={preset.id}
                draggable
                onDragStart={(e) => handleDragStart(e, preset)}
                onClick={() => onAddNode(preset)}
                className={`p-2 rounded-lg border bg-white cursor-grab active:cursor-grabbing flex items-center gap-2 text-xs font-semibold transition-all shadow-2xs hover:shadow-sm hover:scale-[1.02] ${preset.color}`}
                title={`Arraste ou clique para adicionar um nó de ${preset.name}`}
              >
                <i className={`fa-solid ${preset.icon} text-sm`}></i>
                <span className="truncate">{preset.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
