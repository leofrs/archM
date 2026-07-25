import type { Workspace, SubProject, ProjectTemplate } from "../types/project";

const PERSONAL_STORAGE_KEY = "archm_personal_projects_v1";

export function countNodesInMermaid(mermaidCode: string): number {
  if (!mermaidCode) return 0;
  const matches = mermaidCode.match(/([a-zA-Z0-9_-]+)\s*(\[|\(|\{|\>)/g);
  return matches ? new Set(matches.map((m) => m.split(/\[|\(|\{|\>/)[0].trim())).size : 4;
}

// Catálogo constante de Workspaces de Exemplo e Demonstração
export const DEMO_EXAMPLES: Workspace[] = [
  {
    id: "example-1",
    name: "Gateway de Pagamentos & Pix",
    description: "Workspace REST de alto desempenho para autorização e liquidação de pagamentos Pix com Webhooks.",
    createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    isExample: true,
    tags: ["Payments", "Pix", "Redis", "Postgres"],
    icon: "fa-credit-card",
    activeSubProjectId: "sub-ex1-1",
    subProjects: [
      {
        id: "sub-ex1-1",
        name: "POST /v1/payments/pix",
        description: "Autorização de cobrança Pix e enfileiramento assíncrono",
        mode: "low-level",
        createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
        nodeCount: 8,
        mermaidCode: `graph TD
    Client["📱 App Mobile / Web"] -->|"POST /v1/payments/pix"| Gateway["🛡️ API Gateway (Rate Limit)"]
    Gateway -->|"Bearer Token"| Auth["🔐 Auth Middleware"]
    Auth -->|"PayLoad Validado"| Controller["💳 Payment Controller"]
    Controller -->|"Lock de Chave"| Redis[("⚡ Redis Cache & Lock")]
    Controller -->|"Fila Async"| Queue["📥 RabbitMQ Payment Queue"]
    Queue -->|"Processa Pix"| Worker["⚙️ Payment Worker"]
    Worker -->|"Persiste Transação"| DB[("🗄️ Postgres DB (ACID)")]
    Worker -->|"Notifica Webhook"| Webhook["🚀 Webhook Dispatcher"]`,
        mermaidSequenceCode: `sequenceDiagram
    autonumber
    actor User as Usuário Mobile
    participant GW as API Gateway
    participant Auth as Auth Middleware
    participant Controller as Payment Controller
    participant Redis as Redis Cache
    participant Queue as RabbitMQ
    participant DB as Postgres DB

    User->>GW: POST /v1/payments/pix (JSON Payload)
    GW->>Auth: Validar JWT & Header Signature
    Auth-->>GW: OK (200)
    GW->>Controller: Processar solicitação
    Controller->>Redis: Verificar Idempotency Key
    Redis-->>Controller: Chave Válida
    Controller->>Queue: Enviar mensagem de pagamento
    Controller->>DB: Criar transação PENDING
    Controller-->>User: HTTP 202 Accepted (TransactionID)`,
        nodesMetadata: {
          "Client": {
            title: "Client App (Frontend)",
            responsabilidades: ["Interface do usuário", "Assinatura digital do payload"],
            expectedInput: "Ação do usuário no app",
            expectedOutput: "HTTP POST /v1/payments/pix",
          },
          "Gateway": {
            title: "API Gateway (Rate Limit)",
            responsabilidades: ["Roteamento", "Rate Limiting", "Proteção contra DDoS"],
            headers: ["Authorization", "X-Idempotency-Key"],
          },
          "Controller": {
            title: "Payment Controller",
            responsabilidades: ["Validação técnica", "Orquestração de pagamento"],
          },
          "DB": {
            title: "Postgres DB (ACID)",
            responsabilidades: ["Persistência transacional", "Auditoria de saldo"],
          },
        },
        agentPrompt: "API de pagamento Pix com middleware de autenticação, idempotência no Redis e fila assíncrona no RabbitMQ.",
        lowLevelPrompt: "API de pagamento Pix com middleware de autenticação, idempotência no Redis e fila assíncrona no RabbitMQ.",
      },
      {
        id: "sub-ex1-2",
        name: "GET /v1/payments/:id/status",
        description: "Consulta rápida de estado de pagamentos com cache Redis",
        mode: "low-level",
        createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        nodeCount: 4,
        mermaidCode: `graph TD
    Client["📱 App Mobile / Web"] -->|"GET /v1/payments/:id"| Gateway["🛡️ API Gateway"]
    Gateway --> Cache["⚡ Redis Status Cache"]
    Cache -->|"Cache Miss"| DB[("🗄️ Postgres DB")]
    Cache -->|"200 OK (Cached)"| Client`,
        agentPrompt: "Endpoint de consulta de status de pagamento Pix com cache Redis.",
        lowLevelPrompt: "Endpoint de consulta de status de pagamento Pix com cache Redis.",
      },
      {
        id: "sub-ex1-3",
        name: "POST /v1/payments/refund",
        description: "Estorno de transação com validação de saldo e auditoria",
        mode: "low-level",
        createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
        nodeCount: 5,
        mermaidCode: `graph TD
    Client["💻 Portal Admin"] -->|"POST /v1/payments/refund"| RefundSvc["💸 Refund Controller"]
    RefundSvc --> Ledger["📚 Financial Ledger Svc"]
    Ledger --> DB[("🗄️ Postgres DB")]
    Ledger --> BACEN["🏦 Central Bank API"]`,
        agentPrompt: "Endpoint para processamento de reembolso e conciliação com o Banco Central.",
        lowLevelPrompt: "Endpoint para processamento de reembolso e conciliação com o Banco Central.",
      },
    ],
  },
  {
    id: "example-2",
    name: "Plataforma E-commerce Event-Driven",
    description: "Arquitetura reativa distribuída utilizando Apache Kafka para desacoplamento de pedidos e estoque.",
    createdAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    isExample: true,
    tags: ["Event-Driven", "Kafka", "Microservices"],
    icon: "fa-network-wired",
    activeSubProjectId: "sub-ex2-1",
    subProjects: [
      {
        id: "sub-ex2-1",
        name: "Fluxo Principal de Pedidos",
        description: "Processamento assíncrono via Apache Kafka",
        mode: "high-level",
        createdAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
        nodeCount: 10,
        mermaidCode: `graph TD
    Storefront["🛒 Storefront React"] --> Gateway["⚡ Cloud Gateway"]
    Gateway --> OrderSvc["📦 Order Service"]
    Gateway --> CatalogSvc["📚 Catalog Service"]
    OrderSvc -->|"Evento: OrderCreated"| Kafka["🔥 Apache Kafka Event Bus"]
    Kafka --> InventorySvc["🏬 Inventory Service"]
    Kafka --> BillingSvc["💸 Billing Service"]
    Kafka --> NotificationSvc["✉️ Notification Service"]
    InventorySvc --> StockDB[("🗄️ Stock Mongo DB")]
    BillingSvc --> PaymentGateway["💳 External Payment API"]
    NotificationSvc --> SES["📧 AWS SES"]`,
        agentPrompt: "Plataforma e-commerce orientada a eventos usando Kafka para sincronização de pedidos, estoque e faturamento.",
        highLevelPrompt: "Plataforma e-commerce orientada a eventos usando Kafka para sincronização de pedidos, estoque e faturamento.",
      },
    ],
  },
  {
    id: "example-3",
    name: "Serviço de Autenticação SSO & OAuth2",
    description: "Provedor de Identidade (IdP) centralizado com emissão de JWT, Refresh Tokens e validação MFA.",
    createdAt: new Date(Date.now() - 3600000 * 24 * 8).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    isExample: true,
    tags: ["OAuth2", "JWT", "Security"],
    icon: "fa-key",
    activeSubProjectId: "sub-ex3-1",
    subProjects: [
      {
        id: "sub-ex3-1",
        name: "Emissão de Access Token JWT",
        description: "Autenticação via OAuth2 com assinatura RS256",
        mode: "low-level",
        createdAt: new Date(Date.now() - 3600000 * 24 * 8).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
        nodeCount: 6,
        mermaidCode: `graph TD
    App["💻 Client Web App"] -->|"POST /oauth/token"| Gateway["🛡️ Auth Gateway"]
    Gateway -->|"Validate Credentials"| AuthSvc["🔐 Identity Service"]
    AuthSvc -->|"Check User Status"| UserDB[("🗄️ Users Database")]
    AuthSvc -->|"Store Session"| RedisSession[("⚡ Redis Session Store")]
    AuthSvc -->|"Generate Access JWT"| TokenGenerator["🔑 JWT Signer (RS256)"]
    TokenGenerator -->|"Return Tokens"| App`,
        agentPrompt: "Serviço de autenticação OAuth2 com emissão de JWT assinado com chave assimétrica RS256 e Redis.",
        lowLevelPrompt: "Serviço de autenticação OAuth2 com emissão de JWT assinado com chave assimétrica RS256 e Redis.",
      },
    ],
  },
];

export const STARTER_TEMPLATES: ProjectTemplate[] = [
  {
    id: "empty-low",
    name: "Workspace em Branco (Baixo Nível)",
    description: "Inicie um workspace do zero para detalhar endpoints, DTOs e payloads.",
    mode: "low-level",
    icon: "fa-square-plus",
    mermaidCode: `graph TD
    Client["📱 Client App (Frontend)"] -->|"POST /api/v1/resource"| Gateway["⚡ API Gateway"]
    Gateway -->|"Route with Headers"| Service["⚙️ Backend Service"]
    Service -->|"SQL Query"| DB[("🗄️ Database")]`,
    prompt: "Crie um endpoint RESTful com validação de payload e banco de dados.",
    tags: ["REST", "Backend"],
  },
  {
    id: "empty-high",
    name: "Workspace em Branco (Alto Nível)",
    description: "Inicie um workspace do zero para mapear microsserviços e integração entre sistemas.",
    mode: "high-level",
    icon: "fa-cubes-stacked",
    mermaidCode: `graph TD
    User["👤 Usuário"] --> App["💻 Web App"]
    App --> Services["📦 Cluster de Microsserviços"]
    Services --> Storage[("☁️ Nuvem & Armazenamento")]`,
    prompt: "Arquitetura geral de microsserviços com filas e persistência distribuída.",
    tags: ["Microsserviços", "Cloud"],
  },
  {
    id: "payment-api",
    name: "Gateway de Pagamentos Pix",
    description: "Template base para autorização de pagamentos com cache Redis e RabbitMQ.",
    mode: "low-level",
    icon: "fa-credit-card",
    mermaidCode: DEMO_EXAMPLES[0].subProjects[0].mermaidCode,
    mermaidSequenceCode: DEMO_EXAMPLES[0].subProjects[0].mermaidSequenceCode,
    prompt: DEMO_EXAMPLES[0].subProjects[0].agentPrompt || "",
    tags: ["Payments", "Pix"],
  },
  {
    id: "ecommerce-event-driven",
    name: "E-commerce Kafka Event Bus",
    description: "Template de arquitetura orientada a eventos.",
    mode: "high-level",
    icon: "fa-network-wired",
    mermaidCode: DEMO_EXAMPLES[1].subProjects[0].mermaidCode,
    prompt: DEMO_EXAMPLES[1].subProjects[0].agentPrompt || "",
    tags: ["Kafka", "Microservices"],
  },
];

// Utilitário de Migração Automática
function migrateToWorkspaceFormat(rawProjects: any[]): Workspace[] {
  if (!Array.isArray(rawProjects)) return [];

  return rawProjects.map((item) => {
    // Se o item já for um Workspace com subProjects válidos:
    if (item && Array.isArray(item.subProjects) && item.subProjects.length > 0) {
      return {
        ...item,
        activeSubProjectId: item.activeSubProjectId || item.subProjects[0].id,
      };
    }

    // Migração de um Projeto Legado de nível único -> Workspace com 1 SubProject
    const now = item.createdAt || new Date().toISOString();
    const defaultSub: SubProject = {
      id: "sub-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      name: item.name ? `Rota / ${item.name}` : "Fluxo Principal",
      description: item.description || "Rota/Sub-projeto principal",
      mode: item.mode || "low-level",
      createdAt: now,
      updatedAt: item.updatedAt || now,
      nodeCount: item.nodeCount || countNodesInMermaid(item.mermaidCode || ""),
      mermaidCode: item.mermaidCode || "",
      mermaidSequenceCode: item.mermaidSequenceCode || "",
      nodesMetadata: item.nodesMetadata || {},
      agentPrompt: item.agentPrompt || "",
      lowLevelPrompt: item.lowLevelPrompt || "",
      highLevelPrompt: item.highLevelPrompt || "",
      includeEdgeCases: item.includeEdgeCases || false,
    };

    return {
      id: item.id || "ws-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      name: item.name || "Novo Workspace de Arquitetura",
      description: item.description || "Sem descrição informada.",
      createdAt: now,
      updatedAt: item.updatedAt || now,
      tags: item.tags || ["Arquitetura"],
      icon: item.icon || (item.mode === "high-level" ? "fa-sitemap" : "fa-code"),
      isExample: !!item.isExample,
      activeSubProjectId: defaultSub.id,
      subProjects: [defaultSub],
    };
  });
}

// Obter Workspaces Pessoais salvos no localStorage (com migração)
export function getPersonalWorkspaces(): Workspace[] {
  try {
    const raw = localStorage.getItem(PERSONAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const migrated = migrateToWorkspaceFormat(parsed);
    return migrated;
  } catch (error) {
    console.error("Erro ao carregar workspaces pessoais do localStorage:", error);
    return [];
  }
}

// Obter Exemplos
export function getExampleWorkspaces(): Workspace[] {
  return DEMO_EXAMPLES;
}

// Obter Todos os Workspaces (Pessoais + Exemplos)
export function getStoredWorkspaces(): Workspace[] {
  const personal = getPersonalWorkspaces();
  return [...personal, ...DEMO_EXAMPLES];
}

// Aliases para compatibilidade retroativa
export const getPersonalProjects = getPersonalWorkspaces;
export const getExampleProjects = getExampleWorkspaces;
export const getStoredProjects = getStoredWorkspaces;

// Salvar Workspaces Pessoais no localStorage
export function savePersonalWorkspacesToStorage(workspaces: Workspace[]): void {
  try {
    const personalOnly = workspaces.filter((w) => !w.isExample);
    localStorage.setItem(PERSONAL_STORAGE_KEY, JSON.stringify(personalOnly));
  } catch (error) {
    console.error("Erro ao salvar workspaces no localStorage:", error);
  }
}

export const savePersonalProjectsToStorage = savePersonalWorkspacesToStorage;

// Criar um novo Workspace Pessoal
export function createNewWorkspace(
  name: string,
  description: string,
  mode: "low-level" | "high-level",
  templateId?: string,
  initialSubProjectName?: string
): Workspace {
  const template = templateId
    ? STARTER_TEMPLATES.find((t) => t.id === templateId)
    : undefined;

  const now = new Date().toISOString();
  const subId = "sub-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6);

  const hasInitialSub = !!template || (initialSubProjectName !== undefined && initialSubProjectName.trim().length > 0);

  const initialSubProject: SubProject | null = hasInitialSub
    ? {
        id: subId,
        name: initialSubProjectName?.trim() || (mode === "low-level" ? "POST /v1/resource" : "Fluxo Principal"),
        description: "Sub-projeto inicial do workspace",
        mode,
        createdAt: now,
        updatedAt: now,
        nodeCount: template ? countNodesInMermaid(template.mermaidCode) : 0,
        mermaidCode: template ? template.mermaidCode : "",
        mermaidSequenceCode: template ? template.mermaidSequenceCode || "" : "",
        agentPrompt: template ? template.prompt : "",
        lowLevelPrompt: template && mode === "low-level" ? template.prompt : "",
        highLevelPrompt: template && mode === "high-level" ? template.prompt : "",
        includeEdgeCases: false,
      }
    : null;

  const newWorkspace: Workspace = {
    id: "ws-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
    name: name.trim() || "Novo Workspace de Arquitetura",
    description: description.trim() || "Sem descrição informada.",
    createdAt: now,
    updatedAt: now,
    tags: template?.tags || ["Arquitetura"],
    icon: template?.icon || (mode === "low-level" ? "fa-code" : "fa-sitemap"),
    isExample: false,
    activeSubProjectId: initialSubProject ? initialSubProject.id : "",
    subProjects: initialSubProject ? [initialSubProject] : [],
  };

  const personal = getPersonalWorkspaces();
  const updatedPersonal = [newWorkspace, ...personal];
  savePersonalWorkspacesToStorage(updatedPersonal);
  return newWorkspace;
}

export const createNewProject = createNewWorkspace;

// Atualizar Workspace no Storage (Se for Exemplo e editado, converte em Pessoal)
export function updateWorkspaceInStorage(updatedWorkspace: Workspace): Workspace[] {
  const personal = getPersonalWorkspaces();

  const wsToSave: Workspace = {
    ...updatedWorkspace,
    isExample: false,
    updatedAt: new Date().toISOString(),
  };

  const idx = personal.findIndex((w) => w.id === wsToSave.id);

  let newList: Workspace[];
  if (idx !== -1) {
    newList = [...personal];
    newList[idx] = wsToSave;
  } else {
    newList = [wsToSave, ...personal];
  }

  savePersonalWorkspacesToStorage(newList);
  return [...newList, ...DEMO_EXAMPLES];
}

export const updateProjectInStorage = updateWorkspaceInStorage;

// Duplicar Workspace
export function duplicateWorkspaceInStorage(workspaceId: string): { updatedList: Workspace[]; newWorkspace?: Workspace } {
  const all = getStoredWorkspaces();
  const target = all.find((w) => w.id === workspaceId);
  if (!target) return { updatedList: all };

  const now = new Date().toISOString();
  const copyName = target.isExample ? `${target.name} (Meu Workspace)` : `${target.name} (Cópia)`;

  const copiedSubProjects: SubProject[] = target.subProjects.map((sub) => ({
    ...sub,
    id: "sub-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
    createdAt: now,
    updatedAt: now,
  }));

  const copy: Workspace = {
    ...target,
    id: "ws-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
    name: copyName,
    createdAt: now,
    updatedAt: now,
    isExample: false,
    subProjects: copiedSubProjects,
    activeSubProjectId: copiedSubProjects[0]?.id || "",
  };

  const personal = getPersonalWorkspaces();
  const updatedPersonal = [copy, ...personal];
  savePersonalWorkspacesToStorage(updatedPersonal);

  return { updatedList: [...updatedPersonal, ...DEMO_EXAMPLES], newWorkspace: copy };
}

export const duplicateProjectInStorage = duplicateWorkspaceInStorage;

// Excluir Workspace Pessoal
export function deleteWorkspaceFromStorage(workspaceId: string): Workspace[] {
  const personal = getPersonalWorkspaces();
  const updatedPersonal = personal.filter((w) => w.id !== workspaceId);
  savePersonalWorkspacesToStorage(updatedPersonal);
  return [...updatedPersonal, ...DEMO_EXAMPLES];
}

export const deleteProjectFromStorage = deleteWorkspaceFromStorage;

// Operações em Sub-projetos de um Workspace
export function addSubProjectToWorkspace(
  workspaceId: string,
  name: string,
  mode: "low-level" | "high-level" = "low-level",
  description?: string
): Workspace | null {
  const all = getStoredWorkspaces();
  const target = all.find((w) => w.id === workspaceId);
  if (!target) return null;

  const now = new Date().toISOString();
  const newSub: SubProject = {
    id: "sub-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
    name: name.trim() || `Sub-projeto ${target.subProjects.length + 1}`,
    description: description?.trim() || "Nova rota ou módulo de arquitetura",
    mode,
    createdAt: now,
    updatedAt: now,
    mermaidCode: "",
    mermaidSequenceCode: "",
    nodesMetadata: {},
    agentPrompt: "",
    lowLevelPrompt: "",
    highLevelPrompt: "",
    includeEdgeCases: false,
  };

  const updatedWorkspace: Workspace = {
    ...target,
    updatedAt: now,
    activeSubProjectId: newSub.id,
    subProjects: [...target.subProjects, newSub],
  };

  updateWorkspaceInStorage(updatedWorkspace);
  return updatedWorkspace;
}

export function duplicateSubProjectInWorkspace(
  workspaceId: string,
  subProjectId: string
): Workspace | null {
  const all = getStoredWorkspaces();
  const target = all.find((w) => w.id === workspaceId);
  if (!target) return null;

  const subTarget = target.subProjects.find((s) => s.id === subProjectId);
  if (!subTarget) return null;

  const now = new Date().toISOString();
  const newSub: SubProject = {
    ...subTarget,
    id: "sub-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
    name: `${subTarget.name} (Cópia)`,
    createdAt: now,
    updatedAt: now,
  };

  const updatedWorkspace: Workspace = {
    ...target,
    updatedAt: now,
    activeSubProjectId: newSub.id,
    subProjects: [...target.subProjects, newSub],
  };

  updateWorkspaceInStorage(updatedWorkspace);
  return updatedWorkspace;
}

export function deleteSubProjectFromWorkspace(
  workspaceId: string,
  subProjectId: string
): Workspace | null {
  const all = getStoredWorkspaces();
  const target = all.find((w) => w.id === workspaceId);
  if (!target) return null;

  const now = new Date().toISOString();
  const updatedSubProjects = target.subProjects.filter((s) => s.id !== subProjectId);
  const nextActiveId = target.activeSubProjectId === subProjectId
    ? (updatedSubProjects[0]?.id || "")
    : target.activeSubProjectId;

  const updatedWorkspace: Workspace = {
    ...target,
    updatedAt: now,
    activeSubProjectId: nextActiveId,
    subProjects: updatedSubProjects,
  };

  updateWorkspaceInStorage(updatedWorkspace);
  return updatedWorkspace;
}
