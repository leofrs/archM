import { useState, useMemo } from "react";
import { AVAILABLE_ARCHITECTURES } from "../constants/mvcArchitecture";
import type {
  BlockDefinition,
  ArchitectureDefinition,
} from "../types/architecture";

export interface QuickPreset {
  id: string;
  name: string;
  icon: string;
  cssClass: string;
  defaultLabel: string;
  category: string;
  color: string;
  descricao?: string;
  responsabilidades?: string[];
  fase?: string;
  expectedInput?: string;
  expectedOutput?: string;
  dtoSample?: string;
  headers?: string[];
  payloadSample?: string;
  codeSnippet?: string;
}

interface QuickNodesPaletteProps {
  onAddNode: (block: BlockDefinition | QuickPreset) => void;
}

export function QuickNodesPalette({ onAddNode }: QuickNodesPaletteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedArchId, setSelectedArchId] = useState<string>("mvc-api");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [inspectingBlock, setInspectingBlock] = useState<BlockDefinition | null>(
    null,
  );
  const [activeInspectTab, setActiveInspectTab] = useState<
    "resp" | "contract" | "code"
  >("resp");

  const selectedArchitecture: ArchitectureDefinition = useMemo(() => {
    return (
      AVAILABLE_ARCHITECTURES.find((arch) => arch.id === selectedArchId) ||
      AVAILABLE_ARCHITECTURES[0]
    );
  }, [selectedArchId]);

  // Lista direta e simples de todos os blocos da arquitetura
  const allBlocks = useMemo(() => {
    const blocks: { block: BlockDefinition; badgeColor: string }[] = [];
    selectedArchitecture.etapas.forEach((etapa) => {
      etapa.blocos.forEach((b) => {
        blocks.push({
          block: b,
          badgeColor: etapa.badgeColor,
        });
      });
    });
    return blocks;
  }, [selectedArchitecture]);

  const filteredBlocks = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return allBlocks;

    return allBlocks.filter(({ block }) => {
      const matchesTitle = block.titulo.toLowerCase().includes(q);
      const matchesDesc = block.descricao.toLowerCase().includes(q);
      const matchesFase = block.fase.toLowerCase().includes(q);
      const matchesResp = block.responsabilidades.some((r) =>
        r.toLowerCase().includes(q),
      );
      const matchesInput = block.expectedInput?.toLowerCase().includes(q);
      const matchesOutput = block.expectedOutput?.toLowerCase().includes(q);

      return (
        matchesTitle ||
        matchesDesc ||
        matchesFase ||
        matchesResp ||
        matchesInput ||
        matchesOutput
      );
    });
  }, [allBlocks, searchQuery]);

  const handleDragStart = (e: React.DragEvent, block: BlockDefinition) => {
    const presetData: QuickPreset = {
      id: block.id,
      name: block.titulo,
      icon: block.icon,
      cssClass: block.cssClass,
      defaultLabel: block.titulo,
      category: block.fase,
      color: block.color,
      descricao: block.descricao,
      responsabilidades: block.responsabilidades,
      fase: block.fase,
      expectedInput: block.expectedInput,
      expectedOutput: block.expectedOutput,
      dtoSample: block.dtoSample,
      headers: block.headers,
      payloadSample: block.payloadSample,
      codeSnippet: block.codeSnippet,
    };
    e.dataTransfer.setData("application/json", JSON.stringify(presetData));
  };

  return (
    <div className="absolute bottom-12 left-14 z-20 flex flex-col items-start transition-all">
      {/* Botão Toggle da Paleta */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white/95 backdrop-blur-md border border-slate-200 text-slate-800 hover:text-indigo-600 px-3.5 py-2 rounded-xl shadow-md text-xs font-bold flex items-center gap-2 cursor-pointer transition-all hover:shadow-lg hover:border-indigo-300 mb-2 group"
      >
        <i className="fa-solid fa-shapes text-indigo-600 text-sm group-hover:scale-110 transition-transform"></i>
        <span>
          {isOpen ? "Ocultar Paleta de Blocos" : "🧩 Adicionar Blocos (+)"}
        </span>
        <span className="bg-indigo-50 text-indigo-700 text-[10px] px-1.5 py-0.5 rounded-md font-semibold border border-indigo-100">
          Arquitetura MVC
        </span>
      </button>

      {/* Painel Direto e Simples */}
      {isOpen && (
        <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200 shadow-2xl w-[360px] animate-in slide-in-from-bottom-3 duration-200 flex flex-col gap-3">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-sitemap text-indigo-600 text-sm"></i>
              <span className="text-xs font-bold text-slate-800">
                Blocos de Arquitetura
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 text-base cursor-pointer"
              title="Fechar paleta"
            >
              &times;
            </button>
          </div>

          {/* Seletor de Arquitetura */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Arquitetura Selecionada
            </label>
            <select
              value={selectedArchId}
              onChange={(e) => setSelectedArchId(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 cursor-pointer"
            >
              {AVAILABLE_ARCHITECTURES.map((arch) => (
                <option key={arch.id} value={arch.id}>
                  🏛️ {arch.name}
                </option>
              ))}
            </select>
          </div>

          {/* Campo de Busca Rápida */}
          <div className="relative">
            <i className="fa-solid fa-magnifying-glass absolute left-2.5 top-2 text-slate-400 text-xs"></i>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar bloco ou contrato (DTO, Controller, Service)..."
              className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500 focus:bg-white transition-colors font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1.5 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
              >
                &times;
              </button>
            )}
          </div>

          {/* Lista Direta de Blocos */}
          <div className="max-h-[240px] overflow-y-auto pr-1 flex flex-col gap-1.5">
            {filteredBlocks.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">
                Nenhum bloco encontrado.
              </div>
            ) : (
              filteredBlocks.map(({ block, badgeColor }) => (
                <div
                  key={block.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, block)}
                  onClick={() => onAddNode(block)}
                  className={`p-2 rounded-xl border bg-white cursor-grab active:cursor-grabbing flex items-center justify-between text-xs font-semibold transition-all shadow-2xs hover:shadow-md hover:scale-[1.01] group ${block.color}`}
                  title="Clique ou arraste para adicionar ao diagrama"
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <div className="w-6 h-6 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 group-hover:bg-indigo-50 group-hover:border-indigo-200 transition-colors">
                      <i
                        className={`fa-solid ${block.icon} text-slate-700 group-hover:text-indigo-600 text-xs`}
                      ></i>
                    </div>
                    <div className="truncate flex flex-col">
                      <span className="truncate text-slate-800 font-bold group-hover:text-indigo-900">
                        {block.titulo}
                      </span>
                      <span
                        className={`text-[9px] font-semibold px-1 rounded border self-start ${badgeColor}`}
                      >
                        {block.fase}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setInspectingBlock(block);
                        setActiveInspectTab("resp");
                      }}
                      className="w-5 h-5 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 flex items-center justify-center transition-colors cursor-pointer"
                      title="Ver detalhes de contrato, DTO e responsabilidades"
                    >
                      <i className="fa-solid fa-circle-info text-[11px]"></i>
                    </button>
                    <i className="fa-solid fa-plus text-slate-300 group-hover:text-indigo-600 text-[10px]"></i>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="text-[10px] text-slate-400 text-center border-t border-slate-100 pt-2 flex items-center justify-center gap-1">
            <i className="fa-solid fa-hand-pointer text-slate-300"></i>
            <span>Clique ou arraste o bloco para o Editor</span>
          </div>
        </div>
      )}

      {/* Modal de Detalhes Técnicos e Contratos do Bloco */}
      {inspectingBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-[500px] w-full p-5 flex flex-col gap-3">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 text-base">
                  <i className={`fa-solid ${inspectingBlock.icon}`}></i>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {inspectingBlock.titulo}
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {inspectingBlock.fase}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectingBlock(null)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Descrição */}
            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-medium">
              {inspectingBlock.descricao}
            </p>

            {/* Navegação de Abas do Bloco */}
            <div className="flex border-b border-slate-200 bg-slate-50 rounded-lg p-0.5 text-xs font-semibold text-slate-600">
              <button
                type="button"
                onClick={() => setActiveInspectTab("resp")}
                className={`flex-1 py-1.5 rounded-md text-center cursor-pointer transition-all ${
                  activeInspectTab === "resp"
                    ? "bg-white text-indigo-600 font-bold shadow-xs"
                    : "hover:text-slate-900"
                }`}
              >
                🎯 Responsabilidades
              </button>
              <button
                type="button"
                onClick={() => setActiveInspectTab("contract")}
                className={`flex-1 py-1.5 rounded-md text-center cursor-pointer transition-all ${
                  activeInspectTab === "contract"
                    ? "bg-white text-indigo-600 font-bold shadow-xs"
                    : "hover:text-slate-900"
                }`}
              >
                📄 DTO / Headers / Payload
              </button>
              <button
                type="button"
                onClick={() => setActiveInspectTab("code")}
                className={`flex-1 py-1.5 rounded-md text-center cursor-pointer transition-all ${
                  activeInspectTab === "code"
                    ? "bg-white text-indigo-600 font-bold shadow-xs"
                    : "hover:text-slate-900"
                }`}
              >
                💻 Código
              </button>
            </div>

            {/* Conteúdo da Aba */}
            <div className="max-h-[200px] overflow-y-auto pr-1">
              {activeInspectTab === "resp" && (
                <ul className="flex flex-col gap-1.5">
                  {inspectingBlock.responsabilidades.map((resp, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-slate-700 bg-slate-50 border border-slate-100 px-2.5 py-1.5 rounded-lg flex items-start gap-2"
                    >
                      <i className="fa-solid fa-check text-emerald-500 text-[11px] mt-0.5 shrink-0"></i>
                      <span>{resp}</span>
                    </li>
                  ))}
                </ul>
              )}

              {activeInspectTab === "contract" && (
                <div className="flex flex-col gap-2.5 text-xs text-slate-700">
                  {inspectingBlock.expectedInput && (
                    <div>
                      <span className="font-bold text-slate-800 block text-[11px]">
                        📥 Entrada Esperada:
                      </span>
                      <span className="text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-100 block font-mono text-[11px]">
                        {inspectingBlock.expectedInput}
                      </span>
                    </div>
                  )}

                  {inspectingBlock.expectedOutput && (
                    <div>
                      <span className="font-bold text-slate-800 block text-[11px]">
                        📤 Resposta / Saída Esperada:
                      </span>
                      <span className="text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-100 block font-mono text-[11px]">
                        {inspectingBlock.expectedOutput}
                      </span>
                    </div>
                  )}

                  {inspectingBlock.headers && inspectingBlock.headers.length > 0 && (
                    <div>
                      <span className="font-bold text-slate-800 block text-[11px] mb-1">
                        🌐 Headers HTTP:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {inspectingBlock.headers.map((h, i) => (
                          <span
                            key={i}
                            className="bg-indigo-50 border border-indigo-100 text-indigo-800 text-[10px] font-mono px-2 py-0.5 rounded"
                          >
                            {h}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {inspectingBlock.dtoSample && (
                    <div>
                      <span className="font-bold text-slate-800 block text-[11px] mb-1">
                        📋 DTO / Schema Exemplo:
                      </span>
                      <pre className="bg-slate-900 text-slate-200 p-2.5 rounded-lg text-[11px] font-mono leading-relaxed overflow-x-auto">
                        {inspectingBlock.dtoSample}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {activeInspectTab === "code" && (
                <div>
                  <span className="font-bold text-slate-800 block text-[11px] mb-1">
                    💻 Exemplo de Implementação:
                  </span>
                  <pre className="bg-slate-900 text-slate-200 p-3 rounded-lg text-[11px] font-mono leading-relaxed overflow-x-auto border border-slate-800">
                    {inspectingBlock.codeSnippet || "// Sem exemplo de código"}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 mt-1">
              <button
                type="button"
                onClick={() => setInspectingBlock(null)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => {
                  onAddNode(inspectingBlock);
                  setInspectingBlock(null);
                }}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <i className="fa-solid fa-plus"></i>
                <span>Adicionar Bloco</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
