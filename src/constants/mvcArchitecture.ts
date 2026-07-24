import type { ArchitectureDefinition } from "../types/architecture";

export const MVC_ARCHITECTURE: ArchitectureDefinition = {
  id: "mvc-api",
  name: "Arquitetura MVC (API / Backend)",
  description:
    "Padrão arquitetural focado na separação de responsabilidades para serviços e APIs (sem camada View frontend).",
  icon: "fa-layer-group",
  etapas: [
    {
      faseId: "Entrada",
      faseNome: "Entrada (HTTP & Validação)",
      icon: "fa-door-open",
      color: "border-indigo-200 text-indigo-700 hover:bg-indigo-50",
      badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-200",
      blocos: [
        {
          id: "mvc-router",
          titulo: "Roteador / Router",
          descricao:
            "Define os endpoints da API e direciona cada requisição HTTP para o fluxo de processamento correspondente.",
          responsabilidades: [
            "Registrar rotas, métodos HTTP e caminhos dos endpoints.",
            "Associar cada rota ao controller ou handler responsável.",
            "Organizar rotas por recurso, módulo ou contexto de negócio.",
            "Aplicar middlewares específicos no nível da rota.",
            "Extrair e encaminhar parâmetros de rota, query string e metadados da requisição.",
          ],
          fase: "Entrada",
          icon: "fa-route",
          cssClass: "gateway",
          color: "border-purple-200 text-purple-700 hover:bg-purple-50",
          expectedInput: "Requisição HTTP (Método, URI, Query Params, Headers)",
          expectedOutput: "Encaminhamento da requisição para Controller/Handler",
          headers: [
            "Content-Type: application/json",
            "Authorization: Bearer <jwt_token>",
            "X-Correlation-ID: uuid-v4",
          ],
          dtoSample: JSON.stringify(
            {
              method: "POST",
              path: "/api/v1/pedidos",
              queryParams: { expand: "items" },
            },
            null,
            2,
          ),
          payloadSample: JSON.stringify(
            { clienteId: "cli_991", total: 250.0 },
            null,
            2,
          ),
          codeSnippet: `// Express.js Route Router
router.post('/pedidos', authMiddleware, orderController.create);`,
        },
        {
          id: "mvc-controller",
          titulo: "Controller",
          descricao:
            "Atua como ponto de entrada da camada de aplicação, coordenando a requisição HTTP e delegando a execução da regra de negócio.",
          responsabilidades: [
            "Receber os dados e metadados da requisição HTTP.",
            "Converter os dados recebidos para o formato esperado pela camada de aplicação.",
            "Acionar o service ou caso de uso correspondente.",
            "Selecionar o status HTTP adequado para o resultado da operação.",
            "Encaminhar o resultado para serializadores, presenters ou response helpers.",
            "Evitar a implementação direta de regras de negócio.",
          ],
          fase: "Entrada",
          icon: "fa-sliders",
          cssClass: "gateway",
          color: "border-blue-200 text-blue-700 hover:bg-blue-50",
          expectedInput: "Request DTO, Path Variables, User Context",
          expectedOutput: "Response DTO / HTTP 200 (OK) / HTTP 201 (Created)",
          headers: [
            "Content-Type: application/json",
            "Accept: application/json",
          ],
          dtoSample: JSON.stringify(
            {
              clienteId: "cli_102",
              itens: [{ produtoId: "p_10", quantidade: 2 }],
            },
            null,
            2,
          ),
          payloadSample: JSON.stringify(
            {
              status: "sucesso",
              pedidoId: "ped_5591",
            },
            null,
            2,
          ),
          codeSnippet: `async function createOrder(req: Request, res: Response) {
  const dto = new CreateOrderDTO(req.body);
  const result = await orderService.execute(dto);
  return res.status(201).json(result);
}`,
        },
        {
          id: "mvc-req-dto",
          titulo: "DTOs de Requisição (Data Transfer Objects)",
          descricao:
            "Representam o contrato estruturado dos dados recebidos pela API, isolando o formato externo dos modelos internos da aplicação.",
          responsabilidades: [
            "Definir os campos aceitos em cada operação.",
            "Especificar tipos, formatos e obrigatoriedade dos dados de entrada.",
            "Impedir que propriedades não autorizadas sejam encaminhadas ao domínio.",
            "Documentar o contrato de entrada dos endpoints.",
            "Transportar dados validados entre a camada HTTP e a camada de aplicação.",
          ],
          fase: "Entrada",
          icon: "fa-file-import",
          cssClass: "gateway",
          color: "border-sky-200 text-sky-700 hover:bg-sky-50",
          expectedInput: "Corpo JSON / Form Data bruto da requisição",
          expectedOutput: "Objeto DTO tipado e sanitizado",
          headers: ["Content-Type: application/json"],
          dtoSample: JSON.stringify(
            {
              nomeCliente: "João Silva",
              email: "joao@email.com",
              valorTotal: 150.75,
            },
            null,
            2,
          ),
          payloadSample: JSON.stringify(
            {
              nomeCliente: "string (obrigatorio)",
              email: "string (email valido)",
              valorTotal: "number (positivo)",
            },
            null,
            2,
          ),
          codeSnippet: `export interface CreateOrderDTO {
  nomeCliente: string;
  email: string;
  valorTotal: number;
}`,
        },
        {
          id: "mvc-validators",
          titulo: "Validadores e Sanitizadores",
          descricao:
            "Verificam a conformidade dos dados recebidos e normalizam valores antes que sejam processados pela aplicação.",
          responsabilidades: [
            "Validar tipos, formatos, limites e campos obrigatórios.",
            "Rejeitar entradas inválidas antes da execução da regra de negócio.",
            "Normalizar textos, datas, números e identificadores.",
            "Remover ou neutralizar conteúdo potencialmente malicioso.",
            "Produzir erros de validação estruturados e associados aos campos inválidos.",
            "Garantir que apenas dados esperados sejam encaminhados ao controller ou caso de uso.",
          ],
          fase: "Entrada",
          icon: "fa-shield-halved",
          cssClass: "gateway",
          color: "border-indigo-200 text-indigo-700 hover:bg-indigo-50",
          expectedInput: "DTO bruto ou req.body",
          expectedOutput: "Status de Validação OK ou HTTP 422 Unprocessable Entity",
          headers: ["Content-Type: application/json"],
          dtoSample: JSON.stringify(
            {
              valido: true,
              erros: [],
            },
            null,
            2,
          ),
          payloadSample: JSON.stringify(
            {
              campo: "email",
              mensagem: "Email inválido ou malformatado",
            },
            null,
            2,
          ),
          codeSnippet: `const schema = z.object({
  email: z.string().email(),
  valorTotal: z.number().positive(),
});
const validador = schema.parse(req.body);`,
        },
      ],
    },
    {
      faseId: "Processamento",
      faseNome: "Processamento (Regras de Negócio)",
      icon: "fa-gears",
      color: "border-slate-200 text-slate-700 hover:bg-slate-50",
      badgeColor: "bg-slate-100 text-slate-800 border-slate-200",
      blocos: [
        {
          id: "mvc-service",
          titulo: "Services / Use Cases (Camada Model)",
          descricao:
            "Implementam os casos de uso da aplicação e coordenam a execução das regras de negócio necessárias para atender uma operação.",
          responsabilidades: [
            "Executar regras de negócio e fluxos de aplicação.",
            "Coordenar entidades de domínio, repositories, cache e serviços externos.",
            "Controlar transações e operações que exigem consistência.",
            "Aplicar verificações de autorização relacionadas ao caso de uso.",
            "Retornar resultados independentes do protocolo HTTP.",
            "Manter controllers e componentes de infraestrutura desacoplados da lógica de negócio.",
          ],
          fase: "Processamento",
          icon: "fa-gears",
          cssClass: "default",
          color: "border-slate-300 text-slate-800 hover:bg-slate-100",
          expectedInput: "Command / Query DTO de Negócio",
          expectedOutput: "Resultado do Caso de Uso / Entidade de Domínio",
          headers: ["X-Tenant-ID: tenant_01"],
          dtoSample: JSON.stringify(
            {
              pedidoId: "ped_7741",
              status: "APROVADO",
              itensProcessados: 2,
            },
            null,
            2,
          ),
          payloadSample: JSON.stringify(
            {
              sucesso: true,
              detalhes: "Pedido aprovado e estoque reservado",
            },
            null,
            2,
          ),
          codeSnippet: `class OrderService {
  async execute(dto: CreateOrderDTO) {
    const order = new Order(dto);
    await this.orderRepo.save(order);
    return order;
  }
}`,
        },
        {
          id: "mvc-middlewares",
          titulo: "Middlewares de Negócio e Sessão",
          descricao:
            "Executam verificações e comportamentos transversais relacionados à sessão, ao contexto da requisição e às políticas de negócio.",
          responsabilidades: [
            "Validar autenticação e estado da sessão.",
            "Carregar o usuário, tenant ou contexto associado à requisição.",
            "Aplicar regras de autorização e controle de acesso.",
            "Verificar pré-condições compartilhadas por múltiplos endpoints.",
            "Propagar informações de contexto para os componentes subsequentes.",
            "Interromper o fluxo quando uma condição obrigatória não for atendida.",
          ],
          fase: "Processamento",
          icon: "fa-user-lock",
          cssClass: "default",
          color: "border-indigo-300 text-indigo-800 hover:bg-indigo-50",
          expectedInput: "Cabeçalho Authorization / Cookies de Sessão",
          expectedOutput: "Objeto de Contexto do Usuário (req.user) ou HTTP 401/403",
          headers: [
            "Authorization: Bearer <jwt_token>",
            "X-Session-ID: sess_99812",
          ],
          dtoSample: JSON.stringify(
            {
              usuarioId: "usr_401",
              roles: ["ADMIN", "MANAGER"],
              autenticado: true,
            },
            null,
            2,
          ),
          payloadSample: JSON.stringify(
            {
              sub: "usr_401",
              exp: 1718000000,
            },
            null,
            2,
          ),
          codeSnippet: `function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token ausente' });
  req.user = verifyJwt(token);
  next();
}`,
        },
        {
          id: "mvc-entities",
          titulo: "Entidades de Domínio (Domain Entities)",
          descricao:
            "Representam os conceitos centrais do negócio, preservando estado, identidade, comportamentos e invariantes do domínio.",
          responsabilidades: [
            "Modelar objetos e conceitos relevantes para o negócio.",
            "Encapsular regras diretamente relacionadas ao estado da entidade.",
            "Garantir invariantes durante a criação e alteração dos dados.",
            "Proteger o estado interno contra modificações inválidas.",
            "Representar identidade e ciclo de vida dos objetos de domínio.",
            "Permanecer independente de protocolos HTTP e detalhes de persistência.",
          ],
          fase: "Processamento",
          icon: "fa-cube",
          cssClass: "default",
          color: "border-violet-300 text-violet-800 hover:bg-violet-50",
          expectedInput: "Parâmetros de instanciação e regras de negócio",
          expectedOutput: "Estado interno válido do objeto de domínio",
          headers: [],
          dtoSample: JSON.stringify(
            {
              id: "ent_8841",
              status: "ATIVO",
              criadoEm: "2026-07-24T00:00:00Z",
            },
            null,
            2,
          ),
          payloadSample: JSON.stringify(
            {
              id: "string",
              regrasInvariantes: "Validadas no construtor",
            },
            null,
            2,
          ),
          codeSnippet: `class OrderEntity {
  constructor(private id: string, private total: number) {
    if (total <= 0) throw new DomainException('Total inválido');
  }
}`,
        },
      ],
    },
    {
      faseId: "Armazenamento",
      faseNome: "Armazenamento (Persistência & Cache)",
      icon: "fa-database",
      color: "border-amber-200 text-amber-800 hover:bg-amber-50",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
      blocos: [
        {
          id: "mvc-orm",
          titulo: "ORM / Query Builder / Data Mappers",
          descricao:
            "Fornecem mecanismos para consultar, inserir, atualizar e remover dados, realizando a comunicação técnica com o banco de dados.",
          responsabilidades: [
            "Traduzir operações da aplicação em comandos de persistência.",
            "Mapear registros do banco de dados para objetos utilizados pela aplicação.",
            "Construir e executar consultas de forma parametrizada.",
            "Gerenciar conexões, transações e unidades de trabalho.",
            "Aplicar configurações de relacionamentos, índices e mapeamentos.",
            "Reduzir o acoplamento entre a aplicação e a linguagem específica do banco de dados.",
          ],
          fase: "Armazenamento",
          icon: "fa-database",
          cssClass: "database",
          color: "border-amber-300 text-amber-900 hover:bg-amber-100",
          expectedInput: "Comandos SQL / Queries ORM (SELECT, INSERT, UPDATE)",
          expectedOutput: "Registros mapeados ou contagem de linhas afetadas",
          headers: [],
          dtoSample: JSON.stringify(
            {
              tabela: "pedidos",
              comando: "SELECT * FROM pedidos WHERE id = ?",
              parametros: ["ped_100"],
            },
            null,
            2,
          ),
          payloadSample: JSON.stringify(
            {
              affectedRows: 1,
              insertId: "ped_100",
            },
            null,
            2,
          ),
          codeSnippet: `const orderRecord = await prisma.order.findUnique({
  where: { id: orderId }
});`,
        },
        {
          id: "mvc-repositories",
          titulo: "Repositories / DAOs (Data Access Objects)",
          descricao:
            "Encapsulam as operações de acesso aos dados e oferecem interfaces orientadas às necessidades da aplicação ou do domínio.",
          responsabilidades: [
            "Disponibilizar operações de consulta e persistência para entidades ou agregados.",
            "Ocultar detalhes do ORM, query builder ou banco de dados.",
            "Centralizar consultas reutilizáveis e critérios de busca.",
            "Converter modelos de persistência em entidades ou objetos da aplicação.",
            "Manter a camada de negócio desacoplada da tecnologia de armazenamento.",
            "Aplicar estratégias de paginação, filtros e ordenação.",
          ],
          fase: "Armazenamento",
          icon: "fa-table-cells",
          cssClass: "database",
          color: "border-orange-300 text-orange-900 hover:bg-orange-100",
          expectedInput: "Entidade de Domínio / Critérios de Busca",
          expectedOutput: "Coleção de Entidades / Registro Persistido",
          headers: [],
          dtoSample: JSON.stringify(
            {
              metodo: "findById",
              id: "ped_9901",
            },
            null,
            2,
          ),
          payloadSample: JSON.stringify(
            {
              id: "ped_9901",
              clienteId: "cli_12",
              valor: 199.9,
            },
            null,
            2,
          ),
          codeSnippet: `interface OrderRepository {
  findById(id: string): Promise<Order | null>;
  save(order: Order): Promise<void>;
}`,
        },
        {
          id: "mvc-cache",
          titulo: "Cache Manager",
          descricao:
            "Gerencia o armazenamento temporário de dados frequentemente acessados para reduzir latência e carga sobre fontes persistentes.",
          responsabilidades: [
            "Ler e gravar dados em mecanismos de cache.",
            "Definir chaves, namespaces e tempos de expiração.",
            "Invalidar entradas após alterações nos dados de origem.",
            "Aplicar estratégias como cache-aside, write-through ou read-through.",
            "Evitar colisões e inconsistências entre contextos ou tenants.",
            "Controlar a serialização e desserialização dos valores armazenados.",
          ],
          fase: "Armazenamento",
          icon: "fa-bolt",
          cssClass: "cache",
          color: "border-yellow-300 text-yellow-900 hover:bg-yellow-100",
          expectedInput: "Chave do Cache (Key) & Tempo de Expiração (TTL)",
          expectedOutput: "Valor em Cache (HIT) ou nulo (MISS)",
          headers: [],
          dtoSample: JSON.stringify(
            {
              chave: "pedidos:usuario:usr_401",
              ttlSegundos: 300,
              hit: true,
            },
            null,
            2,
          ),
          payloadSample: JSON.stringify(
            {
              cachedAt: "2026-07-24T09:00:00Z",
              data: { status: "OK" },
            },
            null,
            2,
          ),
          codeSnippet: `const cachedData = await redis.get(\`user:\${userId}\`);
if (!cachedData) {
  // Fetch from DB and set in Redis
}`,
        },
      ],
    },
    {
      faseId: "Saida_de_Sucesso",
      faseNome: "Saída de Sucesso",
      icon: "fa-circle-check",
      color: "border-emerald-200 text-emerald-800 hover:bg-emerald-50",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
      blocos: [
        {
          id: "mvc-presenters",
          titulo: "Serializadores / Presenters / Transformers",
          descricao:
            "Transformam os resultados internos da aplicação em representações adequadas ao contrato público da API.",
          responsabilidades: [
            "Converter entidades e modelos internos em estruturas de resposta.",
            "Selecionar apenas os campos permitidos para exposição.",
            "Renomear, combinar ou formatar propriedades.",
            "Ocultar dados internos, técnicos ou sensíveis.",
            "Normalizar formatos de datas, números, enums e identificadores.",
            "Manter o contrato de saída desacoplado das estruturas internas.",
          ],
          fase: "Saida_de_Sucesso",
          icon: "fa-arrow-right-arrow-left",
          cssClass: "success",
          color: "border-emerald-300 text-emerald-900 hover:bg-emerald-100",
          expectedInput: "Entidade Interna de Domínio",
          expectedOutput: "DTO de Resposta formatado para a API externa",
          headers: ["Content-Type: application/json"],
          dtoSample: JSON.stringify(
            {
              id: "ped_771",
              formattedTotal: "R$ 150,00",
              dataCriacao: "24/07/2026",
            },
            null,
            2,
          ),
          payloadSample: JSON.stringify(
            {
              data: { id: "ped_771", total: 150.0 },
            },
            null,
            2,
          ),
          codeSnippet: `class OrderPresenter {
  static toHTTP(order: Order) {
    return { id: order.id, total: order.totalFormatted };
  }
}`,
        },
        {
          id: "mvc-response-helpers",
          titulo: "Response Helpers / Encoders",
          descricao:
            "Padronizam a construção e a codificação das respostas HTTP bem-sucedidas enviadas ao cliente.",
          responsabilidades: [
            "Definir status HTTP, cabeçalhos e corpo da resposta.",
            "Aplicar uma estrutura consistente às respostas da API.",
            "Codificar o conteúdo no formato de transporte configurado.",
            "Tratar respostas sem conteúdo, paginadas ou com metadados.",
            "Adicionar cabeçalhos relacionados a localização, cache ou versionamento.",
            "Evitar duplicação da lógica de construção de respostas nos controllers.",
          ],
          fase: "Saida_de_Sucesso",
          icon: "fa-reply",
          cssClass: "success",
          color: "border-green-300 text-green-900 hover:bg-green-100",
          expectedInput: "Objeto de dados e Código HTTP (200, 201, 204)",
          expectedOutput: "Resposta HTTP estruturada com headers",
          headers: [
            "Content-Type: application/json",
            "Cache-Control: no-store",
          ],
          dtoSample: JSON.stringify(
            {
              statusCode: 200,
              meta: { page: 1, limit: 10, total: 1 },
            },
            null,
            2,
          ),
          payloadSample: JSON.stringify(
            {
              success: true,
              data: [],
            },
            null,
            2,
          ),
          codeSnippet: `return res.status(200).json({
  success: true,
  data: result
});`,
        },
        {
          id: "mvc-resp-dto",
          titulo: "DTOs de Resposta (Response DTOs)",
          descricao:
            "Definem o contrato explícito dos dados retornados pela API em operações concluídas com sucesso.",
          responsabilidades: [
            "Especificar os campos presentes no corpo da resposta.",
            "Definir tipos, formatos e estruturas aninhadas.",
            "Documentar o contrato público de saída dos endpoints.",
            "Impedir o vazamento acidental de propriedades internas.",
            "Garantir consistência entre implementação, documentação e consumidores.",
            "Representar respostas individuais, coleções, paginações e metadados.",
          ],
          fase: "Saida_de_Sucesso",
          icon: "fa-file-export",
          cssClass: "success",
          color: "border-teal-300 text-teal-900 hover:bg-teal-100",
          expectedInput: "Payload de saída serializado",
          expectedOutput: "Contrato público JSON documentado",
          headers: ["Content-Type: application/json"],
          dtoSample: JSON.stringify(
            {
              id: "string",
              status: "COMPLETED",
              criadoEm: "ISO-8601",
            },
            null,
            2,
          ),
          payloadSample: JSON.stringify(
            {
              id: "ped_1102",
              status: "COMPLETED",
              criadoEm: "2026-07-24T09:30:00Z",
            },
            null,
            2,
          ),
          codeSnippet: `export interface OrderResponseDTO {
  id: string;
  status: string;
  criadoEm: string;
}`,
        },
      ],
    },
    {
      faseId: "Saida_de_Erro",
      faseNome: "Saída de Erro",
      icon: "fa-circle-xmark",
      color: "border-red-200 text-red-800 hover:bg-red-50",
      badgeColor: "bg-red-100 text-red-800 border-red-200",
      blocos: [
        {
          id: "mvc-exception-handler",
          titulo: "Handler Global de Exceções (Exception Handler)",
          descricao:
            "Centraliza a captura de exceções não tratadas e converte falhas da aplicação em respostas HTTP controladas.",
          responsabilidades: [
            "Capturar exceções propagadas durante o processamento da requisição.",
            "Classificar erros esperados, técnicos e desconhecidos.",
            "Associar cada categoria de erro ao status HTTP adequado.",
            "Evitar a exposição de stack traces e informações sensíveis.",
            "Registrar falhas com contexto suficiente para diagnóstico.",
            "Encaminhar os erros para o mapeador e formatador de respostas.",
          ],
          fase: "Saida_de_Erro",
          icon: "fa-triangle-exclamation",
          cssClass: "error",
          color: "border-red-300 text-red-900 hover:bg-red-100",
          expectedInput: "Objeto Error / Exception lançado na aplicação",
          expectedOutput: "Resposta HTTP de Erro (400, 401, 404, 500)",
          headers: ["Content-Type: application/problem+json"],
          dtoSample: JSON.stringify(
            {
              erro: "DomainException",
              mensagem: "Saldo insuficiente para o pagamento",
              statusCode: 400,
            },
            null,
            2,
          ),
          payloadSample: JSON.stringify(
            {
              title: "Bad Request",
              status: 400,
              detail: "Saldo insuficiente",
            },
            null,
            2,
          ),
          codeSnippet: `app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  res.status(status).json({ error: err.message });
});`,
        },
        {
          id: "mvc-error-mapper",
          titulo: "Mapeador de Erros / Formatador de Resposta de Erro",
          descricao:
            "Converte erros internos em contratos de resposta padronizados, podendo seguir especificações como a RFC 7807.",
          responsabilidades: [
            "Mapear exceções e códigos internos para erros públicos da API.",
            "Construir uma estrutura consistente para respostas de erro.",
            "Incluir código, título, detalhe, status e identificador da ocorrência.",
            "Representar erros de validação associados a campos específicos.",
            "Remover mensagens internas ou informações que não devem ser expostas.",
            "Manter compatibilidade com o padrão de erros documentado pela API.",
          ],
          fase: "Saida_de_Erro",
          icon: "fa-bug",
          cssClass: "error",
          color: "border-rose-300 text-rose-900 hover:bg-rose-100",
          expectedInput: "Exceção mapeada com código interno",
          expectedOutput: "Estrutura RFC 7807 Problem Details JSON",
          headers: ["Content-Type: application/problem+json"],
          dtoSample: JSON.stringify(
            {
              type: "https://api.empresa.com/errors/invalid-input",
              title: "Entrada Inválida",
              status: 400,
              instance: "/errors/err_9901",
            },
            null,
            2,
          ),
          payloadSample: JSON.stringify(
            {
              type: "about:blank",
              title: "Validation Failed",
              status: 422,
              invalidParams: [{ name: "email", reason: "Inválido" }],
            },
            null,
            2,
          ),
          codeSnippet: `function mapErrorToRFC7807(error) {
  return {
    type: 'about:blank',
    title: error.name,
    status: error.status || 500,
    detail: error.message,
  };
}`,
        },
      ],
    },
  ],
};

export const AVAILABLE_ARCHITECTURES: ArchitectureDefinition[] = [
  MVC_ARCHITECTURE,
];
