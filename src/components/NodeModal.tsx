import { useState, useEffect } from "react";

export interface InspectorNode {
  id: string;
  label: string;
  category: string;
  icon: string;
  colorClass: string;
  headers: string[];
  dtoSample: string;
  codeSnippet: string;
  expectedInput?: string;
  expectedOutput?: string;
  cssClass?: string;
}

export const CATEGORY_OPTIONS = [
  {
    value: "default",
    label: "Padrão / Processamento (Cinza)",
    categoryName: "Bloco de Processamento",
    icon: "fa-cube",
    colorClass: "bg-slate-100 text-slate-800 border-slate-200",
  },
  {
    value: "database",
    label: "Banco de Dados (Laranja)",
    categoryName: "Banco de Dados",
    icon: "fa-database",
    colorClass: "bg-orange-100 text-orange-800 border-orange-200",
  },
  {
    value: "cache",
    label: "Cache / Redis (Amarelo)",
    categoryName: "Cache em Memória",
    icon: "fa-bolt",
    colorClass: "bg-amber-100 text-amber-800 border-amber-200",
  },
  {
    value: "queue",
    label: "Fila / Mensageria (Rosa)",
    categoryName: "Mensageria & Filas",
    icon: "fa-list-check",
    colorClass: "bg-pink-100 text-pink-800 border-pink-200",
  },
  {
    value: "gateway",
    label: "Gateway / Rota (Roxo)",
    categoryName: "API Gateway",
    icon: "fa-network-wired",
    colorClass: "bg-purple-100 text-purple-800 border-purple-200",
  },
  {
    value: "success",
    label: "Sucesso / Resposta (Verde)",
    categoryName: "Saída de Sucesso",
    icon: "fa-circle-check",
    colorClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  {
    value: "error",
    label: "Erro / Exceção (Vermelho)",
    categoryName: "Tratamento de Erro",
    icon: "fa-circle-xmark",
    colorClass: "bg-red-100 text-red-800 border-red-200",
  },
];

interface NodeModalProps {
  node: InspectorNode | null;
  isOpen: boolean;
  onClose: () => void;
  isEditable?: boolean;
  onSave?: (updatedNode: InspectorNode) => void;
  onDelete?: () => void;
}

export function NodeModal({
  node,
  isOpen,
  onClose,
  isEditable = false,
  onSave,
  onDelete,
}: NodeModalProps) {
  const [activeTab, setActiveTab] = useState<"general" | "contract" | "code">("general");
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Form states when editable
  const [editLabel, setEditLabel] = useState("");
  const [editCssClass, setEditCssClass] = useState("default");
  const [editExpectedInput, setEditExpectedInput] = useState("");
  const [editExpectedOutput, setEditExpectedOutput] = useState("");
  const [editDtoSample, setEditDtoSample] = useState("");
  const [editHeaders, setEditHeaders] = useState("");
  const [editCodeSnippet, setEditCodeSnippet] = useState("");

  useEffect(() => {
    if (node) {
      setEditLabel(node.label || "");
      setEditCssClass(node.cssClass || "default");
      setEditExpectedInput(node.expectedInput || "");
      setEditExpectedOutput(node.expectedOutput || "");
      setEditDtoSample(node.dtoSample || "");
      setEditHeaders(
        Array.isArray(node.headers) ? node.headers.join(", ") : node.headers || ""
      );
      setEditCodeSnippet(node.codeSnippet || "");
      setActiveTab("general");
    }
  }, [node]);

  if (!isOpen || !node) return null;

  const handleCopy = (text: string, type: "json" | "code") => {
    navigator.clipboard.writeText(text);
    setCopiedText(type);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleSave = () => {
    if (!onSave) return;
    const selectedCat = CATEGORY_OPTIONS.find((c) => c.value === editCssClass);

    const parsedHeaders = editHeaders
      ? editHeaders.split(",").map((h) => h.trim()).filter(Boolean)
      : [];

    onSave({
      ...node,
      label: editLabel,
      cssClass: editCssClass,
      category: selectedCat ? selectedCat.categoryName : node.category,
      icon: selectedCat ? selectedCat.icon : node.icon,
      colorClass: selectedCat ? selectedCat.colorClass : node.colorClass,
      expectedInput: editExpectedInput,
      expectedOutput: editExpectedOutput,
      dtoSample: editDtoSample,
      headers: parsedHeaders,
      codeSnippet: editCodeSnippet,
    });
    onClose();
  };

  const selectedCategoryOpt = CATEGORY_OPTIONS.find(
    (c) => c.value === (isEditable ? editCssClass : node.cssClass || "default")
  );
  const currentIcon = isEditable
    ? selectedCategoryOpt?.icon || "fa-cube"
    : node.icon || "fa-gears";
  const currentColorClass = isEditable
    ? selectedCategoryOpt?.colorClass || "bg-slate-100 text-slate-800 border-slate-200"
    : node.colorClass || "bg-indigo-100 text-indigo-800 border-indigo-200";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Cabeçalho do Modal */}
        <div className="p-3 sm:p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 overflow-hidden">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-600/30 border border-indigo-500/30 text-indigo-400 grid place-items-center text-sm sm:text-base shrink-0">
              <i className={`fa-solid ${currentIcon}`}></i>
            </div>
            <div className="truncate">
              <div className="text-xs sm:text-sm font-bold truncate text-slate-100">
                {isEditable ? editLabel || node.id : node.label}
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-400 uppercase font-semibold tracking-wider flex items-center gap-2">
                <span>{isEditable ? selectedCategoryOpt?.categoryName || node.category : node.category}</span>
                <span className="font-mono text-slate-500">({node.id})</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xl px-2 cursor-pointer transition-colors"
            title="Fechar Modal"
          >
            &times;
          </button>
        </div>

        {/* Tag e ID Banner */}
        <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <span className={`text-[11px] sm:text-xs font-semibold px-2 sm:px-2.5 py-0.5 rounded-full border ${currentColorClass}`}>
            <i className={`fa-solid ${currentIcon} mr-1`}></i>
            {isEditable ? selectedCategoryOpt?.categoryName || node.category : node.category}
          </span>
          <span className="text-[11px] sm:text-xs text-slate-500 font-mono">
            Nó ID: <strong className="text-slate-700">{node.id}</strong>
          </span>
        </div>

        {/* Navegação por Abas */}
        <div className="flex border-b border-slate-200 bg-white text-[11px] sm:text-xs font-semibold text-slate-600 shrink-0">
          <button
            type="button"
            className={`flex-1 py-2 sm:py-2.5 text-center cursor-pointer border-b-2 transition-colors flex items-center justify-center gap-1 sm:gap-1.5 ${
              activeTab === "general"
                ? "border-indigo-600 text-indigo-600 font-bold bg-indigo-50/40"
                : "border-transparent hover:text-slate-900"
            }`}
            onClick={() => setActiveTab("general")}
          >
            <i className="fa-solid fa-circle-info"></i>
            <span className="hidden sm:inline">Identificação & Fluxo</span>
            <span className="sm:hidden">Geral</span>
          </button>
          <button
            type="button"
            className={`flex-1 py-2 sm:py-2.5 text-center cursor-pointer border-b-2 transition-colors flex items-center justify-center gap-1 sm:gap-1.5 ${
              activeTab === "contract"
                ? "border-indigo-600 text-indigo-600 font-bold bg-indigo-50/40"
                : "border-transparent hover:text-slate-900"
            }`}
            onClick={() => setActiveTab("contract")}
          >
            <i className="fa-solid fa-file-code"></i>
            <span className="hidden sm:inline">Contrato DTO & Headers</span>
            <span className="sm:hidden">Contrato</span>
          </button>
          <button
            type="button"
            className={`flex-1 py-2 sm:py-2.5 text-center cursor-pointer border-b-2 transition-colors flex items-center justify-center gap-1 sm:gap-1.5 ${
              activeTab === "code"
                ? "border-indigo-600 text-indigo-600 font-bold bg-indigo-50/40"
                : "border-transparent hover:text-slate-900"
            }`}
            onClick={() => setActiveTab("code")}
          >
            <i className="fa-solid fa-code"></i>
            <span className="hidden sm:inline">Código / Implementação</span>
            <span className="sm:hidden">Código</span>
          </button>
        </div>

        {/* Conteúdo do Modal (Scrollable) */}
        <div className="p-5 flex-1 overflow-y-auto bg-slate-50/50 flex flex-col gap-4">
          {/* Aba 1: Identificação & Fluxo */}
          {activeTab === "general" && (
            <div className="flex flex-col gap-4">
              {isEditable ? (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Rótulo / Nome do Bloco:
                    </label>
                    <input
                      type="text"
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 bg-white"
                      placeholder="Ex: OrderController: handleCheckout"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Categoria / Estilo Visual:
                    </label>
                    <select
                      value={editCssClass}
                      onChange={(e) => setEditCssClass(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 bg-white cursor-pointer"
                    >
                      {CATEGORY_OPTIONS.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                        <span>📥 Entrada Esperada:</span>
                      </label>
                      <input
                        type="text"
                        value={editExpectedInput}
                        onChange={(e) => setEditExpectedInput(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:border-indigo-600 bg-white"
                        placeholder="Ex: Request Body / DTO de Pagamento"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                        <span>📤 Saída / Resposta Esperada:</span>
                      </label>
                      <input
                        type="text"
                        value={editExpectedOutput}
                        onChange={(e) => setEditExpectedOutput(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:border-indigo-600 bg-white"
                        placeholder="Ex: HTTP 200 OK com OrderResponseDTO"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-4 bg-white border border-slate-200 rounded-xl flex flex-col gap-2 shadow-2xs">
                    <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                      Informações Gerais do Nó
                    </div>
                    <div className="text-base font-bold text-slate-900">{node.label}</div>
                    <div className="text-xs text-slate-600 font-medium">
                      Categoria: <span className="font-semibold text-indigo-600">{node.category}</span>
                    </div>
                  </div>

                  {(node.expectedInput || node.expectedOutput) ? (
                    <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl flex flex-col gap-3 text-xs shadow-2xs">
                      {node.expectedInput && (
                        <div>
                          <span className="font-bold text-indigo-950 text-[11px] uppercase tracking-wider block mb-1">
                            📥 Entrada Esperada:
                          </span>
                          <span className="text-slate-800 font-medium leading-relaxed">
                            {node.expectedInput}
                          </span>
                        </div>
                      )}
                      {node.expectedOutput && (
                        <div>
                          <span className="font-bold text-indigo-950 text-[11px] uppercase tracking-wider block mb-1">
                            📤 Resposta / Saída Esperada:
                          </span>
                          <span className="text-slate-800 font-medium leading-relaxed">
                            {node.expectedOutput}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (node.dtoSample && node.dtoSample !== "{}" && node.dtoSample !== "") || (node.headers && node.headers.length > 0) ? (
                    <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl flex flex-col gap-3 text-xs shadow-2xs">
                      <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                        <span className="font-bold text-indigo-950 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                          <i className="fa-solid fa-file-contract text-indigo-600"></i>
                          Resumo do Contrato de Dados
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveTab("contract")}
                          className="text-xs text-indigo-600 font-semibold hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <span>Ver Contrato DTO</span>
                          <i className="fa-solid fa-arrow-right text-[10px]"></i>
                        </button>
                      </div>

                      {node.headers && node.headers.length > 0 && (
                        <div>
                          <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider block mb-1">
                            🌐 Headers HTTP:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {node.headers.map((h, i) => (
                              <span key={i} className="px-2 py-0.5 bg-white border border-indigo-200 rounded text-[11px] font-mono text-slate-800">
                                {h}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {node.dtoSample && node.dtoSample !== "{}" && node.dtoSample !== "" && (
                        <div>
                          <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider block mb-1">
                            📄 Exemplo de Payload DTO:
                          </span>
                          <pre className="p-2.5 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-lg max-h-28 overflow-y-auto">
                            {node.dtoSample}
                          </pre>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-100/70 border border-slate-200 rounded-xl text-xs text-slate-500 italic text-center flex flex-col items-center gap-1">
                      <i className="fa-solid fa-circle-info text-slate-400 text-base"></i>
                      <span>Nenhuma especificação de Entrada/Saída definida para este nó.</span>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Aba 2: Contrato DTO & Headers */}
          {activeTab === "contract" && (
            <div className="flex flex-col gap-4">
              {/* Headers HTTP */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-700">
                  Cabeçalhos HTTP Esperados (Headers):
                </label>
                {isEditable ? (
                  <input
                    type="text"
                    value={editHeaders}
                    onChange={(e) => setEditHeaders(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:border-indigo-600 bg-white"
                    placeholder="Content-Type: application/json, Authorization: Bearer token"
                  />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {!node.headers || node.headers.length === 0 ? (
                      <div className="text-xs text-slate-400 font-medium py-1">
                        Nenhum cabeçalho específico configurado.
                      </div>
                    ) : (
                      node.headers.map((header, idx) => (
                        <div
                          key={idx}
                          className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 flex items-center gap-2 shadow-2xs"
                        >
                          <i className="fa-solid fa-globe text-indigo-500 text-[11px]"></i>
                          <span>{header}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* DTO / JSON Sample */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">
                    Contrato DTO / Payload Exemplo (JSON):
                  </label>
                  {!isEditable && node.dtoSample && (
                    <button
                      type="button"
                      onClick={() => handleCopy(node.dtoSample, "json")}
                      className="text-xs text-indigo-600 hover:underline font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <i
                        className={`fa-solid ${
                          copiedText === "json" ? "fa-check text-emerald-500" : "fa-copy"
                        }`}
                      ></i>
                      {copiedText === "json" ? "Copiado!" : "Copiar JSON"}
                    </button>
                  )}
                </div>

                {isEditable ? (
                  <textarea
                    rows={6}
                    value={editDtoSample}
                    onChange={(e) => setEditDtoSample(e.target.value)}
                    className="w-full p-3.5 border border-slate-300 rounded-xl text-xs font-mono bg-slate-900 text-slate-100 outline-none focus:border-indigo-600 leading-relaxed resize-none shadow-inner"
                    placeholder={`{\n  "clienteId": "cli_100",\n  "total": 150.00\n}`}
                  />
                ) : (
                  <pre className="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800 shadow-inner max-h-[260px]">
                    {node.dtoSample || "{}"}
                  </pre>
                )}
              </div>
            </div>
          )}

          {/* Aba 3: Código / Implementação */}
          {activeTab === "code" && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  Implementação Recomendada / Snippet de Código:
                </label>
                {(isEditable ? editCodeSnippet : node.codeSnippet) && (
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(isEditable ? editCodeSnippet : node.codeSnippet, "code")
                    }
                    className="text-xs text-indigo-600 hover:underline font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <i
                      className={`fa-solid ${
                        copiedText === "code" ? "fa-check text-emerald-500" : "fa-copy"
                      }`}
                    ></i>
                    {copiedText === "code" ? "Copiado!" : "Copiar Código"}
                  </button>
                )}
              </div>

              {isEditable ? (
                <textarea
                  rows={8}
                  value={editCodeSnippet}
                  onChange={(e) => setEditCodeSnippet(e.target.value)}
                  className="w-full p-3.5 border border-slate-300 rounded-xl text-xs font-mono bg-slate-900 text-slate-100 outline-none focus:border-indigo-600 leading-relaxed resize-none shadow-inner"
                  placeholder="// Cole ou edite o código de implementação aqui..."
                />
              ) : (
                <pre className="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800 shadow-inner max-h-[300px]">
                  {node.codeSnippet || "// Nenhum código fornecido"}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* Rodapé do Modal */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          {isEditable ? (
            <>
              {onDelete ? (
                <button
                  type="button"
                  onClick={() => {
                    onDelete();
                    onClose();
                  }}
                  className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <i className="fa-solid fa-trash-can"></i>
                  <span>Excluir Bloco</span>
                </button>
              ) : (
                <div></div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-sm transition-all"
                >
                  Salvar Alterações
                </button>
              </div>
            </>
          ) : (
            <div className="w-full flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Inspeção de metadados do nó no diagrama
              </span>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              >
                Fechar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
