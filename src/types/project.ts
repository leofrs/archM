export interface Project {
  id: string;
  name: string;
  description: string;
  mode: "low-level" | "high-level";
  createdAt: string;
  updatedAt: string;
  nodeCount?: number;
  mermaidCode: string;
  mermaidSequenceCode?: string;
  nodesMetadata?: Record<string, any>;
  agentPrompt?: string;
  lowLevelPrompt?: string;
  highLevelPrompt?: string;
  includeEdgeCases?: boolean;
  tags?: string[];
  icon?: string;
  isExample?: boolean; // True para os projetos de demonstração predefinidos
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  mode: "low-level" | "high-level";
  icon: string;
  mermaidCode: string;
  mermaidSequenceCode?: string;
  nodesMetadata?: Record<string, any>;
  prompt: string;
  tags: string[];
}
