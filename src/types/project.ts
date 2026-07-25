export interface SubProject {
  id: string;
  name: string;
  description?: string;
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
}

export interface Workspace {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  icon?: string;
  isExample?: boolean;
  activeSubProjectId?: string;
  subProjects: SubProject[];
}

// Alias para manter compatibilidade retroativa com código existente
export type Project = Workspace;

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  mode: "low-level" | "high-level";
  icon: string;
  tags: string[];
  mermaidCode: string;
  mermaidSequenceCode?: string;
  nodesMetadata?: Record<string, any>;
  prompt: string;
  defaultSubProjects?: Array<{
    name: string;
    description?: string;
    mode: "low-level" | "high-level";
    mermaidCode: string;
    mermaidSequenceCode?: string;
    nodesMetadata?: Record<string, any>;
    prompt: string;
  }>;
}

