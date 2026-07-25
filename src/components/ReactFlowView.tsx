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
import type { BlockDefinition } from "../types/architecture";
import { NodeModal, type InspectorNode, CATEGORY_OPTIONS } from "./NodeModal";

interface ReactFlowViewProps {
  mermaidCode: string;
  nodesMetadata?: Record<string, any>;
  onSaveMermaid: (newMermaidCode: string) => void;
}

function ReactFlowContent({
  mermaidCode,
  nodesMetadata,
  onSaveMermaid,
}: ReactFlowViewProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<RFNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<RFEdge>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Estado do Nó Selecionado para Edição no Modal
  const [editingNode, setEditingNode] = useState<RFNode | null>(null);

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  useEffect(() => {
    if (mermaidCode) {
      const { nodes: parsedNodes, edges: parsedEdges } = mermaidToReactFlow(
        mermaidCode,
        nodesMetadata,
      );
      setNodes(parsedNodes);
      setEdges(parsedEdges);
      setIsDirty(false);
    }
  }, [mermaidCode, nodesMetadata, setNodes, setEdges]);

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
    (
      preset: QuickPreset | BlockDefinition,
      position?: { x: number; y: number },
    ) => {
      const id = `Node_${Math.random().toString(36).substring(2, 7)}`;
      const targetPos = position || {
        x: 100 + Math.random() * 50,
        y: 100 + Math.random() * 50,
      };
      const rawText =
        (preset as BlockDefinition).titulo ||
        (preset as QuickPreset).defaultLabel ||
        (preset as QuickPreset).name;
      const icon = preset.icon || "fa-cube";
      const cssClass = preset.cssClass || "default";
      const descricao =
        (preset as BlockDefinition).descricao ||
        (preset as QuickPreset).descricao;
      const responsabilidades =
        (preset as BlockDefinition).responsabilidades ||
        (preset as QuickPreset).responsabilidades;
      const fase =
        (preset as BlockDefinition).fase ||
        (preset as QuickPreset).fase ||
        (preset as QuickPreset).category;

      const htmlLabel = `<i class='fa-solid ${icon} mr-1.5'></i> ${rawText}`;

      const newNode: RFNode = {
        id,
        data: {
          label: htmlLabel,
          rawLabel: rawText,
          cssClass: cssClass,
          icon: icon,
          descricao: descricao,
          responsabilidades: responsabilidades,
          fase: fase,
        },
        position: targetPos,
        style: getNodeStyleByClass(cssClass),
      };

      setNodes((nds) => [...nds, newNode]);
      setIsDirty(true);
    },
    [setNodes],
  );

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

  // Ação ao Clicar em um Nó -> Selecionar Nó para Abrir Modal
  const onNodeClick = useCallback((_: React.MouseEvent, node: RFNode) => {
    setEditingNode(node);
  }, []);

  // Construção do objeto InspectorNode para passar ao NodeModal
  const selectedInspectorNode: InspectorNode | null = editingNode
    ? (() => {
        const data = editingNode.data as any;
        const cssClass = data?.cssClass || "default";
        const catOpt = CATEGORY_OPTIONS.find((c) => c.value === cssClass);

        return {
          id: editingNode.id,
          label:
            data?.rawLabel ||
            (typeof data?.label === "string" ? data.label : editingNode.id),
          cssClass: cssClass,
          category:
            data?.category || catOpt?.categoryName || "Bloco de Processamento",
          icon: data?.icon || catOpt?.icon || "fa-cube",
          colorClass:
            catOpt?.colorClass ||
            "bg-slate-100 text-slate-800 border-slate-200",
          headers: Array.isArray(data?.headers)
            ? data.headers
            : typeof data?.headers === "string" && data.headers.trim()
              ? data.headers.split(",").map((h: string) => h.trim())
              : ["Content-Type: application/json"],
          dtoSample:
            typeof data?.dtoSample === "object"
              ? JSON.stringify(data.dtoSample, null, 2)
              : data?.dtoSample || "{}",
          codeSnippet:
            data?.codeSnippet || `// Implementação: ${editingNode.id}`,
          expectedInput: data?.expectedInput,
          expectedOutput: data?.expectedOutput,
        };
      })()
    : null;

  const handleSaveNodeModal = (updatedNode: InspectorNode) => {
    if (!editingNode) return;

    const htmlLabel = `<i class='fa-solid ${updatedNode.icon} mr-1.5'></i> ${updatedNode.label}`;

    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === editingNode.id) {
          return {
            ...n,
            data: {
              ...n.data,
              rawLabel: updatedNode.label,
              label: htmlLabel,
              cssClass: updatedNode.cssClass || "default",
              category: updatedNode.category,
              icon: updatedNode.icon,
              expectedInput: updatedNode.expectedInput,
              expectedOutput: updatedNode.expectedOutput,
              dtoSample: updatedNode.dtoSample,
              headers: updatedNode.headers,
              codeSnippet: updatedNode.codeSnippet,
            },
            style: getNodeStyleByClass(updatedNode.cssClass),
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
      <div className="absolute top-2 left-5 z-20 flex items-center gap-2 bg-white/90 backdrop-blur-sm p-1.5 rounded-xl border border-slate-200 shadow-md">
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

      {/* MODAL DE EDIÇÃO DE BLOCO E METADADOS */}
      <NodeModal
        node={selectedInspectorNode}
        isOpen={!!editingNode}
        onClose={() => setEditingNode(null)}
        isEditable={true}
        onSave={handleSaveNodeModal}
        onDelete={handleDeleteNode}
      />
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
