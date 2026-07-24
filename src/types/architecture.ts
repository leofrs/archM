export type FaseType =
  | "Entrada"
  | "Processamento"
  | "Armazenamento"
  | "Saida_de_Sucesso"
  | "Saida_de_Erro";

export interface BlockDefinition {
  id: string;
  titulo: string;
  descricao: string;
  responsabilidades: string[];
  fase: FaseType;
  icon: string;
  cssClass: "gateway" | "default" | "database" | "cache" | "success" | "error";
  color: string;

  // Contratos de dados técnicos (DTO/Schema, Headers, Payload, Entrada/Saída)
  expectedInput?: string;
  expectedOutput?: string;
  dtoSample?: string;
  headers?: string[];
  payloadSample?: string;
  codeSnippet?: string;
}

export interface EtapaDefinition {
  faseId: FaseType;
  faseNome: string;
  icon: string;
  color: string;
  badgeColor: string;
  blocos: BlockDefinition[];
}

export interface ArchitectureDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  etapas: EtapaDefinition[];
}
