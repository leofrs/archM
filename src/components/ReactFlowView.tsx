import React, { useState, useCallback, useEffect } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import {
  mermaidToReactFlow,
  reactFlowToMermaid,
} from "../utils/mermaidReactFlowConverter";

export function ReactFlowView({ mermaidCode, onSaveMermaid }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (mermaidCode) {
      const { nodes: parsedNodes, edges: parsedEdges } =
        mermaidToReactFlow(mermaidCode);
      setNodes(parsedNodes);
      setEdges(parsedEdges);
      setIsDirty(false);
    }
  }, [mermaidCode]);

  const onConnect = useCallback(
    (params) => {
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

  const handleNodesChange = (changes) => {
    onNodesChange(changes);
    setIsDirty(true);
  };

  const handleEdgesChange = (changes) => {
    onEdgesChange(changes);
    setIsDirty(true);
  };

  const handleAddNode = () => {
    const label = window.prompt("Nome do novo bloco:", "Novo Bloco");
    if (!label) return;

    const id = `Node_${Math.random().toString(36).substring(2, 7)}`;
    const newNode = {
      id,
      data: {
        label: `<i class='fa-solid fa-cube'></i> ${label}`,
        rawLabel: `<i class='fa-solid fa-cube'></i> ${label}`,
        cssClass: "default",
      },
      position: { x: 0, y: 100 },
      style: {
        padding: "12px 16px",
        borderRadius: "10px",
        fontSize: "12px",
        fontWeight: "600",
        minWidth: "160px",
        textAlign: "center",
        background: "#ffffff",
        border: "2px solid #cbd5e1",
        color: "#0f172a",
      },
    };

    setNodes((nds) => [...nds, newNode]);
    setIsDirty(true);
  };

  const handleSave = () => {
    const newMermaidCode = reactFlowToMermaid(nodes, edges);
    onSaveMermaid(newMermaidCode);
    setIsDirty(false);
  };

  const customNodes = nodes.map((node) => ({
    ...node,
    data: {
      ...node.data,
      label: (
        <div
          dangerouslySetInnerHTML={{
            __html: node.data.rawLabel || node.data.label,
          }}
        />
      ),
    },
  }));

  return (
    <div className="relative w-full h-full bg-slate-100">
      {/* BARRA DE AÇÕES DO REACT FLOW (NÍVEL 2 - FICA LOGO ABAIXO DO NÍVEL 1) */}
      <div className="absolute top-[68px] left-5 z-20 flex items-center gap-2 bg-white/90 backdrop-blur-sm p-1.5 rounded-xl border border-slate-200 shadow-md">
        <button
          type="button"
          onClick={handleAddNode}
          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
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
              : "bg-slate-800 hover:bg-slate-900 text-white"
          }`}
        >
          <i className="fa-solid fa-floppy-disk"></i>
          <span>{isDirty ? "💾 Salvar e Atualizar" : "Salvo"}</span>
        </button>
      </div>

      <div className="absolute bottom-5 right-5 z-20 bg-white/80 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-slate-200 text-[11px] text-slate-500 shadow-xs pointer-events-none">
        💡 Selecione um nó ou linha e pressione{" "}
        <kbd className="font-mono bg-slate-200 px-1 rounded">Delete</kbd> para
        remover.
      </div>

      <ReactFlow
        nodes={customNodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Controls />
        <MiniMap zoomable pannable />
        <Background color="#cbd5e1" gap={20} size={1} />
      </ReactFlow>
    </div>
  );
}
