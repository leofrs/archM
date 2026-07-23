import { MarkerType } from "@xyflow/react";

function getNodeStyleByClass(cssClass) {
  const base = {
    padding: "12px 16px",
    borderRadius: "10px",
    fontSize: "12px",
    fontWeight: "600",
    minWidth: "160px",
    textAlign: "center",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
  };

  switch (cssClass) {
    case "error":
      return {
        ...base,
        background: "#fee2e2",
        border: "2px solid #ef4444",
        color: "#7f1d1d",
      };
    case "success":
      return {
        ...base,
        background: "#dcfce3",
        border: "2px solid #10b981",
        color: "#14532d",
      };
    case "database":
      return {
        ...base,
        background: "#ffedd5",
        border: "2px solid #f97316",
        color: "#7c2d12",
      };
    case "cache":
      return {
        ...base,
        background: "#fef9c3",
        border: "2px solid #ca8a04",
        color: "#854d0e",
      };
    case "queue":
      return {
        ...base,
        background: "#fce7f3",
        border: "2px solid #db2777",
        color: "#9d174d",
      };
    case "gateway":
      return {
        ...base,
        background: "#f3e8ff",
        border: "2px solid #9333ea",
        color: "#6b21a8",
      };
    default:
      return {
        ...base,
        background: "#ffffff",
        border: "2px solid #cbd5e1",
        color: "#0f172a",
      };
  }
}

export function mermaidToReactFlow(mermaidCode) {
  if (!mermaidCode) return { nodes: [], edges: [] };

  const nodesMap = new Map();
  const edgesList = [];
  const lines = mermaidCode.split("\n");

  const nodeRegex = /^\s*([A-Za-z0-9_]+)\["([^"]+)"\](?::\:\:([A-Za-z0-9_]+))?/;
  const edgeRegex =
    /^\s*([A-Za-z0-9_]+)\s*(-.->|-->|==>)(?:\|([^|]+)\|)?\s*([A-Za-z0-9_]+)/;

  lines.forEach((line) => {
    const nodeMatch = line.match(nodeRegex);
    if (nodeMatch) {
      const [, id, label, cssClass] = nodeMatch;
      nodesMap.set(id, { id, label, cssClass: cssClass || "default" });
    }

    const edgeMatch = line.match(edgeRegex);
    if (edgeMatch) {
      const [, source, arrow, label, target] = edgeMatch;
      edgesList.push({
        id: `e-${source}-${target}-${edgesList.length}`,
        source,
        target,
        arrow,
        label: label || "",
      });
      if (!nodesMap.has(source))
        nodesMap.set(source, {
          id: source,
          label: source,
          cssClass: "default",
        });
      if (!nodesMap.has(target))
        nodesMap.set(target, {
          id: target,
          label: target,
          cssClass: "default",
        });
    }
  });

  const inDegree = new Map();
  nodesMap.forEach((_, id) => inDegree.set(id, 0));
  edgesList.forEach((e) =>
    inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1),
  );

  const levels = new Map();
  let currentLevel = 0;
  let currentQueue = Array.from(nodesMap.keys()).filter(
    (id) => inDegree.get(id) === 0,
  );
  if (currentQueue.length === 0 && nodesMap.size > 0) {
    currentQueue = [Array.from(nodesMap.keys())[0]];
  }

  const visited = new Set();
  while (currentQueue.length > 0) {
    levels.set(currentLevel, currentQueue);
    const nextQueue = [];

    currentQueue.forEach((id) => {
      visited.add(id);
      edgesList
        .filter((e) => e.source === id)
        .forEach((e) => {
          if (!visited.has(e.target) && !nextQueue.includes(e.target)) {
            nextQueue.push(e.target);
          }
        });
    });

    currentLevel++;
    currentQueue = nextQueue;
  }

  nodesMap.forEach((_, id) => {
    if (!visited.has(id)) {
      if (!levels.has(currentLevel)) levels.set(currentLevel, []);
      levels.get(currentLevel).push(id);
    }
  });

  const rfNodes = [];
  levels.forEach((nodeIds, levelIdx) => {
    nodeIds.forEach((id, indexInLevel) => {
      const nodeData = nodesMap.get(id);
      const totalWidth = nodeIds.length * 240;
      const startX = -(totalWidth / 2) + 120;
      const x = startX + indexInLevel * 240;
      const y = levelIdx * 140 + 40;

      rfNodes.push({
        id,
        data: {
          label: nodeData.label,
          rawLabel: nodeData.label,
          cssClass: nodeData.cssClass,
        },
        position: { x, y },
        style: getNodeStyleByClass(nodeData.cssClass),
      });
    });
  });

  const rfEdges = edgesList.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label,
    animated: e.arrow === "-.->",
    style: { strokeWidth: 2, stroke: "#64748b" },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#64748b" },
  }));

  return { nodes: rfNodes, edges: rfEdges };
}

export function reactFlowToMermaid(nodes, edges) {
  let mermaid = `graph TD\n`;
  mermaid += `    classDef default fill:#f8fafc,stroke:#cbd5e1,stroke-width:2px,color:#0f172a,rx:8px,ry:8px;\n`;
  mermaid += `    classDef error fill:#fee2e2,stroke:#ef4444,stroke-width:2px,color:#7f1d1d;\n`;
  mermaid += `    classDef success fill:#dcfce3,stroke:#10b981,stroke-width:2px,color:#14532d;\n`;
  mermaid += `    classDef database fill:#ffedd5,stroke:#f97316,stroke-width:2px,color:#7c2d12;\n`;
  mermaid += `    classDef cache fill:#fef9c3,stroke:#ca8a04,stroke-width:2px,color:#854d0e;\n`;
  mermaid += `    classDef queue fill:#fce7f3,stroke:#db2777,stroke-width:2px,color:#9d174d;\n\n`;

  nodes.forEach((node) => {
    const label = node.data?.rawLabel || node.data?.label || node.id;
    const cssClass = node.data?.cssClass || "default";
    mermaid += `    ${node.id}["${label}"]:::${cssClass}\n`;
  });

  mermaid += `\n`;

  edges.forEach((edge) => {
    const arrow = edge.animated ? "-.->" : "-->";
    const labelPart = edge.label ? `|${edge.label}|` : "";
    mermaid += `    ${edge.source} ${arrow}${labelPart} ${edge.target}\n`;
  });

  return mermaid;
}
