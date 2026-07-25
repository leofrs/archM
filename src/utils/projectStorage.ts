import type { Project, ProjectTemplate } from "../types/project";

const PERSONAL_STORAGE_KEY = "archm_personal_projects_v1";

// Catálogo constante de Projetos de Exemplo e Demonstração (Mock)
export const DEMO_EXAMPLES: Project[] = [
  {
    id: "example-1",
    name: "Gateway de Pagamentos & Pix",
    description: "API REST de alto desempenho para autorização e liquidação de pagamentos Pix com Webhooks.",
    mode: "low-level",
    createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    nodeCount: 8,
    isExample: true,
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
        responsabilidades: ["Rroteamento", "Rate Limiting", "Proteção contra DDoS"],
        headers: ["Authorization", "X-Idempotency-Key"],
      },
      "Controller": {
        title: "Payment Controller",
        responsabilidades: ["Validação técnica", "Orquestração de pagamento"],
      },
      "DB": {
        title: "Postgres DB (ACID)",
        responsabilidades: ["Persistência transactional", "Auditoria de saldo"],
      },
    },
    agentPrompt: "API de pagamento Pix com middleware de autenticação, idempotência no Redis e fila assíncrona no RabbitMQ.",
    lowLevelPrompt: "API de pagamento Pix com middleware de autenticação, idempotência no Redis e fila assíncrona no RabbitMQ.",
    tags: ["Payments", "Pix", "Redis", "Postgres"],
    icon: "fa-credit-card",
  },
  {
    id: "example-2",
    name: "Plataforma E-commerce Event-Driven",
    description: "Arquitetura reativa distribuída utilizando Apache Kafka para desacoplamento de pedidos e estoque.",
    mode: "high-level",
    createdAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    nodeCount: 10,
    isExample: true,
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
    tags: ["Event-Driven", "Kafka", "Microservices"],
    icon: "fa-network-wired",
  },
  {
    id: "example-3",
    name: "Serviço de Autenticação SSO & OAuth2",
    description: "Provedor de Identidade (IdP) centralizado com emissão de JWT, Refresh Tokens e validação MFA.",
    mode: "low-level",
    createdAt: new Date(Date.now() - 3600000 * 24 * 8).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    nodeCount: 6,
    isExample: true,
    mermaidCode: `graph TD
    App["💻 Client Web App"] -->|"POST /oauth/token"| Gateway["🛡️ Auth Gateway"]
    Gateway -->|"Validate Credentials"| AuthSvc["🔐 Identity Service"]
    AuthSvc -->|"Check User Status"| UserDB[("🗄️ Users Database")]
    AuthSvc -->|"Store Session"| RedisSession[("⚡ Redis Session Store")]
    AuthSvc -->|"Generate Access JWT"| TokenGenerator["🔑 JWT Signer (RS256)"]
    TokenGenerator -->|"Return Tokens"| App`,
    agentPrompt: "Serviço de autenticação OAuth2 com emissão de JWT assinado com chave assimétrica RS256 e Redis.",
    lowLevelPrompt: "Serviço de autenticação OAuth2 com emissão de JWT assinado com chave assimétrica RS256 e Redis.",
    tags: ["OAuth2", "JWT", "Security"],
    icon: "fa-key",
  },
];

// Templates para o modal de criação rápida
export const STARTER_TEMPLATES: ProjectTemplate[] = [
  {
    id: "empty-low",
    name: "Projeto em Branco (Baixo Nível)",
    description: "Inicie um diagrama do zero para detalhar endpoints, DTOs e payloads.",
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
    name: "Projeto em Branco (Alto Nível)",
    description: "Inicie um diagrama do zero para mapear microsserviços e integração entre sistemas.",
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
    mermaidCode: DEMO_EXAMPLES[0].mermaidCode,
    mermaidSequenceCode: DEMO_EXAMPLES[0].mermaidSequenceCode,
    prompt: DEMO_EXAMPLES[0].agentPrompt || "",
    tags: ["Payments", "Pix"],
  },
  {
    id: "ecommerce-event-driven",
    name: "E-commerce Kafka Event Bus",
    description: "Template de arquitetura orientada a eventos.",
    mode: "high-level",
    icon: "fa-network-wired",
    mermaidCode: DEMO_EXAMPLES[1].mermaidCode,
    prompt: DEMO_EXAMPLES[1].agentPrompt || "",
    tags: ["Kafka", "Microservices"],
  },
];

// Obter Projetos Pessoais salvos no localStorage
export function getPersonalProjects(): Project[] {
  try {
    const raw = localStorage.getItem(PERSONAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Erro ao carregar projetos pessoais do localStorage:", error);
    return [];
  }
}

// Obter Projetos de Exemplo
export function getExampleProjects(): Project[] {
  return DEMO_EXAMPLES;
}

// Obter Todos os Projetos (Pessoais + Exemplos)
export function getStoredProjects(): Project[] {
  const personal = getPersonalProjects();
  return [...personal, ...DEMO_EXAMPLES];
}

// Salvar Projetos Pessoais no localStorage
export function savePersonalProjectsToStorage(projects: Project[]): void {
  try {
    // Garante que só salvamos projetos pessoais (isExample !== true)
    const personalOnly = projects.filter((p) => !p.isExample);
    localStorage.setItem(PERSONAL_STORAGE_KEY, JSON.stringify(personalOnly));
  } catch (error) {
    console.error("Erro ao salvar projetos pessoais no localStorage:", error);
  }
}

export function countNodesInMermaid(mermaidCode: string): number {
  if (!mermaidCode) return 0;
  const matches = mermaidCode.match(/([a-zA-Z0-9_-]+)\s*(\[|\(|\{|\>)/g);
  return matches ? new Set(matches.map((m) => m.split(/\[|\(|\{|\>/)[0].trim())).size : 4;
}

// Criar um novo Projeto Pessoal (isExample: false)
export function createNewProject(
  name: string,
  description: string,
  mode: "low-level" | "high-level",
  templateId?: string
): Project {
  const template = templateId
    ? STARTER_TEMPLATES.find((t) => t.id === templateId)
    : undefined;

  const now = new Date().toISOString();
  const newProj: Project = {
    id: "proj-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
    name: name.trim() || "Novo Projeto de Arquitetura",
    description: description.trim() || "Sem descrição informada.",
    mode,
    createdAt: now,
    updatedAt: now,
    nodeCount: template ? countNodesInMermaid(template.mermaidCode) : 0,
    mermaidCode: template ? template.mermaidCode : "",
    mermaidSequenceCode: template ? template.mermaidSequenceCode || "" : "",
    agentPrompt: template ? template.prompt : "",
    lowLevelPrompt: template && mode === "low-level" ? template.prompt : "",
    highLevelPrompt: template && mode === "high-level" ? template.prompt : "",
    tags: template?.tags || ["Arquitetura"],
    icon: template?.icon || (mode === "low-level" ? "fa-code" : "fa-sitemap"),
    isExample: false, // Sempre salva como projeto pessoal do usuário
  };

  const personal = getPersonalProjects();
  const updatedPersonal = [newProj, ...personal];
  savePersonalProjectsToStorage(updatedPersonal);
  return newProj;
}

// Atualizar um Projeto no Storage (Se for Exemplo e for editado, cria uma cópia pessoal)
export function updateProjectInStorage(updatedProject: Project): Project[] {
  const personal = getPersonalProjects();

  // Se o projeto editado for um Exemplo, converte-o para Projeto Pessoal na 1ª modificação
  const projToSave: Project = {
    ...updatedProject,
    isExample: false,
    updatedAt: new Date().toISOString(),
    nodeCount: countNodesInMermaid(updatedProject.mermaidCode),
  };

  const idx = personal.findIndex((p) => p.id === projToSave.id);

  let newList: Project[];
  if (idx !== -1) {
    newList = [...personal];
    newList[idx] = projToSave;
  } else {
    newList = [projToSave, ...personal];
  }

  savePersonalProjectsToStorage(newList);
  return [...newList, ...DEMO_EXAMPLES];
}

// Duplicar Projeto ou Exemplo -> gera Cópia Pessoal (isExample: false)
export function duplicateProjectInStorage(projectId: string): { updatedList: Project[]; newProject?: Project } {
  const allProjects = getStoredProjects();
  const target = allProjects.find((p) => p.id === projectId);
  if (!target) return { updatedList: allProjects };

  const now = new Date().toISOString();
  const isTargetExample = !!target.isExample;
  const copyName = isTargetExample ? `${target.name} (Meu Projeto)` : `${target.name} (Cópia)`;

  const copy: Project = {
    ...target,
    id: "proj-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
    name: copyName,
    createdAt: now,
    updatedAt: now,
    isExample: false, // Vira projeto pessoal
  };

  const personal = getPersonalProjects();
  const updatedPersonal = [copy, ...personal];
  savePersonalProjectsToStorage(updatedPersonal);

  return { updatedList: [...updatedPersonal, ...DEMO_EXAMPLES], newProject: copy };
}

// Excluir Projeto Pessoal
export function deleteProjectFromStorage(projectId: string): Project[] {
  const personal = getPersonalProjects();
  const updatedPersonal = personal.filter((p) => p.id !== projectId);
  savePersonalProjectsToStorage(updatedPersonal);
  return [...updatedPersonal, ...DEMO_EXAMPLES];
}
