import { useState, useCallback, useEffect, useRef } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  type Node as RFNode,
  type Edge as RFEdge,
  type Connection,
  type NodeChange,
  type EdgeChange,
  useReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import {
  mermaidToReactFlow,
  reactFlowToMermaid,
  getNodeStyleByClass,
} from "../utils/mermaidReactFlowConverter";
import { QuickNodesPalette, type QuickPreset } from "./QuickNodesPalette";

interface ReactFlowViewProps {
  mermaidCode: string;
  onSaveMermaid: (newMermaidCode: string) => void;
}

const CATEGORY_OPTIONS = [
  {
    value: "default",
    label: "Padrão / Processamento (Cinza)",
    icon: "fa-cube",
  },
  { value: "database", label: "Banco de Dados (Laranja)", icon: "fa-database" },
  { value: "cache", label: "Cache / Redis (Amarelo)", icon: "fa-bolt" },
  { value: "queue", label: "Fila / Mensageria (Rosa)", icon: "fa-list-check" },
  {
    value: "gateway",
    label: "Gateway / Rota (Roxo)",
    icon: "fa-network-wired",
  },
  {
    value: "success",
    label: "Sucesso / Resposta (Verde)",
    icon: "fa-circle-check",
  },
  {
    value: "error",
    label: "Erro / Exceção (Vermelho)",
    icon: "fa-circle-xmark",
  },
];

function ReactFlowContent({ mermaidCode, onSaveMermaid }: ReactFlowViewProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<RFNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<RFEdge>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Estado do Modal de Edição de Nó
  const [editingNode, setEditingNode] = useState<RFNode | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editClass, setEditClass] = useState("default");

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  useEffect(() => {
    if (mermaidCode) {
      const { nodes: parsedNodes, edges: parsedEdges } =
        mermaidToReactFlow(mermaidCode);
      setNodes(parsedNodes);
      setEdges(parsedEdges);
      setIsDirty(false);
    }
  }, [mermaidCode, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            animated: false,
            style: { strokeWidth: 2, stroke: "#64748b" },
            markerEnd: { type: MarkerType.ArrowClosed, color: "#64748b" },
          },
          eds,
        ),
      );
      setIsDirty(true);
    },
    [setEdges],
  );

  const handleNodesChange = (changes: NodeChange<RFNode>[]) => {
    onNodesChange(changes);
    // Só consideramos alterado se houver remoção, movimento ou alteração
    const hasMeaningfulChanges = changes.some(
      (c) =>
        c.type === "remove" || c.type === "position" || c.type === "dimensions",
    );
    if (hasMeaningfulChanges) {
      setIsDirty(true);
    }
  };

  const handleEdgesChange = (changes: EdgeChange<RFEdge>[]) => {
    onEdgesChange(changes);
    if (changes.some((c) => c.type === "remove" || c.type === "add")) {
      setIsDirty(true);
    }
  };

  // Adicionar Nó via Paleta Rápida (Clique ou Drag & Drop)
  const handleAddPresetNode = useCallback(
    (preset: QuickPreset, position?: { x: number; y: number }) => {
      const id = `Node_${Math.random().toString(36).substring(2, 7)}`;
      const targetPos = position || {
        x: 100 + Math.random() * 50,
        y: 100 + Math.random() * 50,
      };
      const rawText = preset.defaultLabel;
      const htmlLabel = `<i class='fa-solid ${preset.icon} mr-1.5'></i> ${rawText}`;

      const newNode: RFNode = {
        id,
        data: {
          label: htmlLabel,
          rawLabel: rawText,
          cssClass: preset.cssClass,
        },
        position: targetPos,
        style: getNodeStyleByClass(preset.cssClass),
      };

      setNodes((nds) => [...nds, newNode]);
      setIsDirty(true);
    },
    [setNodes],
  );

  const handleAddCustomNode = () => {
    const label = window.prompt("Nome do novo bloco:", "Novo Bloco");
    if (!label) return;

    const id = `Node_${Math.random().toString(36).substring(2, 7)}`;
    const newNode: RFNode = {
      id,
      data: {
        label: `<i class='fa-solid fa-cube mr-1.5'></i> ${label}`,
        rawLabel: label,
        cssClass: "default",
      },
      position: { x: 150 + Math.random() * 40, y: 150 + Math.random() * 40 },
      style: getNodeStyleByClass("default"),
    };

    setNodes((nds) => [...nds, newNode]);
    setIsDirty(true);
  };

  // Drag & Drop Handlers
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const rawData = event.dataTransfer.getData("application/json");
      if (!rawData) return;

      try {
        const preset: QuickPreset = JSON.parse(rawData);
        const position = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

        handleAddPresetNode(preset, position);
      } catch (err) {
        console.error("Erro ao soltar o preset de nó:", err);
      }
    },
    [screenToFlowPosition, handleAddPresetNode],
  );

  // Ação ao Clicar em um Nó -> Abrir Modal de Edição
  const onNodeClick = useCallback((_: React.MouseEvent, node: RFNode) => {
    const data = node.data as {
      rawLabel?: string;
      label?: string;
      cssClass?: string;
    };
    setEditingNode(node);
    setEditLabel(
      data.rawLabel || (typeof data.label === "string" ? data.label : node.id),
    );
    setEditClass(data.cssClass || "default");
  }, []);

  const handleSaveNodeEdit = () => {
    if (!editingNode) return;

    const selectedOption = CATEGORY_OPTIONS.find((c) => c.value === editClass);
    const icon = selectedOption ? selectedOption.icon : "fa-cube";
    const htmlLabel = `<i class='fa-solid ${icon} mr-1.5'></i> ${editLabel}`;

    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === editingNode.id) {
          return {
            ...n,
            data: {
              ...n.data,
              rawLabel: editLabel,
              label: htmlLabel,
              cssClass: editClass,
            },
            style: getNodeStyleByClass(editClass),
          };
        }
        return n;
      }),
    );

    setIsDirty(true);
    setEditingNode(null);
  };

  const handleDeleteNode = () => {
    if (!editingNode) return;

    setNodes((nds) => nds.filter((n) => n.id !== editingNode.id));
    setEdges((eds) =>
      eds.filter(
        (e) => e.source !== editingNode.id && e.target !== editingNode.id,
      ),
    );

    setIsDirty(true);
    setEditingNode(null);
  };

  const handleSave = () => {
    const newMermaidCode = reactFlowToMermaid(nodes, edges);
    onSaveMermaid(newMermaidCode);
    setIsDirty(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const customNodes = nodes.map((node) => {
    const data = node.data as { rawLabel?: string; label?: any };
    return {
      ...node,
      data: {
        ...node.data,
        label: (
          <div
            className="flex items-center justify-center gap-1.5 cursor-pointer"
            dangerouslySetInnerHTML={{
              __html:
                typeof data?.label === "string"
                  ? data.label
                  : data?.rawLabel || node.id,
            }}
          />
        ),
      },
    };
  });

  return (
    <div ref={reactFlowWrapper} className="relative w-full h-full bg-slate-100">
      {/* BARRA DE AÇÕES DO REACT FLOW */}
      <div className="absolute top-[68px] left-5 z-20 flex items-center gap-2 bg-white/90 backdrop-blur-sm p-1.5 rounded-xl border border-slate-200 shadow-md">
        <button
          type="button"
          onClick={handleAddCustomNode}
          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          title="Adicionar um nó genérico ao diagrama"
        >
          <i className="fa-solid fa-plus"></i>
          <span>Adicionar Bloco</span>
        </button>

        <button
          type="button"
          onClick={handleSave}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
            isDirty
              ? "bg-emerald-600 hover:bg-emerald-700 text-white animate-pulse"
              : savedSuccess
                ? "bg-emerald-700 text-white"
                : "bg-slate-800 hover:bg-slate-900 text-white"
          }`}
          title="Salvar alterações e atualizar o diagrama Mermaid"
        >
          <i
            className={`fa-solid ${savedSuccess ? "fa-check" : "fa-floppy-disk"}`}
          ></i>
          <span>
            {savedSuccess
              ? "Atualizado no Mermaid!"
              : isDirty
                ? "💾 Salvar e Atualizar Mermaid"
                : "Salvo"}
          </span>
        </button>
      </div>

      {/* DICA DE NAVEGAÇÃO E EXCLUSÃO */}
      <div className="absolute bottom-3 left-14 z-20 bg-white/90 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-slate-200 text-[11px] text-slate-600 shadow-md pointer-events-none flex items-center gap-2">
        <i className="fa-solid fa-circle-info text-indigo-500 text-sm"></i>
        <span>
          Clique no nó para <b>Editar/Excluir</b> ou selecione e pressione{" "}
          <kbd className="font-mono bg-slate-200 px-1 rounded text-slate-800 font-bold">
            Delete
          </kbd>
        </span>
      </div>

      {/* PALETA RÁPIDA DE PRESETS */}
      <QuickNodesPalette onAddNode={(preset) => handleAddPresetNode(preset)} />

      {/* CANVAS REACT FLOW */}
      <ReactFlow
        nodes={customNodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onDragOver={onDragOver}
        onDrop={onDrop}
        fitView
      >
        <Controls />
        <MiniMap zoomable pannable />
        <Background color="#cbd5e1" gap={20} size={1} />
      </ReactFlow>

      {/* MODAL DE EDIÇÃO DE BLOCO */}
      {editingNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-[420px] p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                <i className="fa-solid fa-pen-to-square text-indigo-600"></i>
                <span>Editar Bloco de Arquitetura</span>
              </div>
              <button
                type="button"
                onClick={() => setEditingNode(null)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Rótulo / Nome do Bloco:
              </label>
              <input
                type="text"
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                placeholder="Ex: AuthMiddleware: Validar JWT"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Categoria / Estilo Visual:
              </label>
              <select
                value={editClass}
                onChange={(e) => setEditClass(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 bg-white"
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-2">
              <button
                type="button"
                onClick={handleDeleteNode}
                className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <i className="fa-solid fa-trash-can"></i>
                <span>Excluir Bloco</span>
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingNode(null)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleSaveNodeEdit}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold cursor-pointer shadow-sm transition-all"
                >
                  Salvar Alterações
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function ReactFlowView(props: ReactFlowViewProps) {
  return (
    <ReactFlowProvider>
      <ReactFlowContent {...props} />
    </ReactFlowProvider>
  );
}
