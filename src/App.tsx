import { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { DiagramCanvas } from "./components/DiagramCanvas";
import { ErrorModal } from "./components/ErrorModal";
import { LoadingModal } from "./components/LoadingModal";
import { DashboardView } from "./components/DashboardView";
import { CreateProjectModal } from "./components/CreateProjectModal";
import type { Project } from "./types/project";
import {
  getStoredProjects,
  updateProjectInStorage,
  createNewProject,
  duplicateProjectInStorage,
  deleteProjectFromStorage,
} from "./utils/projectStorage";
import {
  COMPLETE_HIGH_LEVEL_PROMPT,
  COMPLETE_LOW_LEVEL_PROMPT,
  COMPLETE_LOW_LEVEL_WITH_EDGE_CASES_PROMPT,
} from "./constants";

export default function App() {
  // Navegação: Dashboard vs Workspace do Projeto
  const [view, setView] = useState<"dashboard" | "workspace">("dashboard");

  // Projetos & Projeto Ativo
  const [projects, setProjects] = useState<Project[]>(() => getStoredProjects());
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  // Modais de Criação/Edição de Projetos
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);

  // Config da API Gemini (mantida persistida no localStorage)
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("archm_gemini_key") || "");

  useEffect(() => {
    if (apiKey) {
      localStorage.setItem("archm_gemini_key", apiKey);
    }
  }, [apiKey]);

  // Estados do Workspace do Projeto
  const [lowLevelPrompt, setLowLevelPrompt] = useState("");
  const [highLevelPrompt, setHighLevelPrompt] = useState("");

  const [mode, setMode] = useState<"low-level" | "high-level">("low-level");
  const [includeEdgeCases, setIncludeEdgeCases] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Código Mermaid, Metadados dos nós e Prompt do Agente
  const [mermaidCode, setMermaidCode] = useState("");
  const [mermaidSequenceCode, setMermaidSequenceCode] = useState("");
  const [nodesMetadata, setNodesMetadata] = useState<Record<string, any>>({});
  const [agentPrompt, setAgentPrompt] = useState("");

  // Estados Globais de Carregamento e Erro
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const currentPrompt = mode === "low-level" ? lowLevelPrompt : highLevelPrompt;

  const setCurrentPrompt = (value: string) => {
    if (mode === "low-level") {
      setLowLevelPrompt(value);
    } else {
      setHighLevelPrompt(value);
    }
  };

  // Carregar um Projeto Selecionado no Workspace
  const handleSelectProject = (project: Project) => {
    setActiveProject(project);
    setMode(project.mode);
    setMermaidCode(project.mermaidCode || "");
    setMermaidSequenceCode(project.mermaidSequenceCode || "");
    setNodesMetadata(project.nodesMetadata || {});
    setAgentPrompt(project.agentPrompt || "");
    setLowLevelPrompt(project.lowLevelPrompt || (project.mode === "low-level" ? project.agentPrompt || "" : ""));
    setHighLevelPrompt(project.highLevelPrompt || (project.mode === "high-level" ? project.agentPrompt || "" : ""));
    setIncludeEdgeCases(project.includeEdgeCases || false);
    setView("workspace");
  };

  // Sincronizar alterações do Workspace de volta com o projeto ativo no localStorage
  useEffect(() => {
    if (!activeProject || view !== "workspace") return;

    const updated: Project = {
      ...activeProject,
      mode,
      mermaidCode,
      mermaidSequenceCode,
      nodesMetadata,
      agentPrompt,
      lowLevelPrompt,
      highLevelPrompt,
      includeEdgeCases,
    };

    const newList = updateProjectInStorage(updated);
    setProjects(newList);
  }, [
    mermaidCode,
    mermaidSequenceCode,
    nodesMetadata,
    agentPrompt,
    lowLevelPrompt,
    highLevelPrompt,
    mode,
    includeEdgeCases,
  ]);

  // Criar ou Salvar Edição de Projeto
  const handleSaveProjectForm = (data: {
    name: string;
    description: string;
    mode: "low-level" | "high-level";
    templateId?: string;
  }) => {
    if (projectToEdit) {
      // Edição de Projeto Existente
      const updated = {
        ...projectToEdit,
        name: data.name,
        description: data.description,
        mode: data.mode,
      };
      const newList = updateProjectInStorage(updated);
      setProjects(newList);
      if (activeProject?.id === projectToEdit.id) {
        setActiveProject(updated);
        setMode(data.mode);
      }
      setProjectToEdit(null);
    } else {
      // Criação de Novo Projeto
      const newProj = createNewProject(
        data.name,
        data.description,
        data.mode,
        data.templateId
      );
      setProjects(getStoredProjects());
      handleSelectProject(newProj);
    }
  };

  // Duplicar Projeto
  const handleDuplicateProject = (projectId: string) => {
    const { updatedList } = duplicateProjectInStorage(projectId);
    setProjects(updatedList);
  };

  // Excluir Projeto
  const handleDeleteProject = (projectId: string) => {
    const updated = deleteProjectFromStorage(projectId);
    setProjects(updated);
    if (activeProject?.id === projectId) {
      setActiveProject(null);
      setView("dashboard");
    }
  };

  // Gerar Diagrama e Metadados via IA Gemini
  const handleGenerate = async () => {
    if (!apiKey.trim()) {
      showErrorModal("Por favor, insira a chave da API do Google Gemini no menu lateral ou dashboard.");
      return;
    }
    if (!currentPrompt.trim()) {
      showErrorModal("Por favor, insira a descrição ou código na caixa de texto.");
      return;
    }

    setIsLoading(true);
    setStatusMsg("Analisando contexto e gerando metadados reais com a IA...");

    let selectedSystemPrompt =
      mode === "low-level"
        ? COMPLETE_LOW_LEVEL_PROMPT
        : COMPLETE_HIGH_LEVEL_PROMPT;

    if (mode === "low-level" && includeEdgeCases) {
      selectedSystemPrompt += `\n${COMPLETE_LOW_LEVEL_WITH_EDGE_CASES_PROMPT}`;
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: `${selectedSystemPrompt}\n\nCÓDIGO/CONTEXTO A ANALISAR:\n${currentPrompt}`,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: "application/json",
            },
          }),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || "Erro na chamada da API");
      }

      const data = await response.json();
      const rawJsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawJsonText) {
        throw new Error("O modelo não retornou resposta.");
      }

      const parsedData = JSON.parse(rawJsonText);

      if (!parsedData.mermaidCode) {
        throw new Error("A resposta da IA não contém o campo mermaidCode.");
      }

      setStatusMsg("Renderizando diagrama e atrelando metadados aos nós...");
      setMermaidCode(parsedData.mermaidCode);
      setMermaidSequenceCode(parsedData.mermaidSequenceCode || "");
      setNodesMetadata(parsedData.nodes || {});
      setAgentPrompt(parsedData.agentPrompt || "");
    } catch (error: any) {
      showErrorModal(error.message || String(error));
    } flex: {
      setIsLoading(false);
    }
  };

  const handleGenerateFromImage = async (base64Image: string) => {
    if (!apiKey.trim()) {
      showErrorModal("Por favor, insira a chave da API do Google Gemini no menu lateral.");
      return;
    }

    setIsLoading(true);
    setStatusMsg("Analisando o desenho feito a mão livre com a IA multimodal...");

    let selectedSystemPrompt =
      mode === "low-level"
        ? COMPLETE_LOW_LEVEL_PROMPT
        : COMPLETE_HIGH_LEVEL_PROMPT;

    if (mode === "low-level" && includeEdgeCases) {
      selectedSystemPrompt += `\n${COMPLETE_LOW_LEVEL_WITH_EDGE_CASES_PROMPT}`;
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: `${selectedSystemPrompt}\n\nANALISE O DESENHO/ESBOÇO ANEXADO E CONVERTA-O PARA A ESTRUTURA PEDIDA NO CONTRATO JSON:`,
                  },
                  {
                    inlineData: {
                      mimeType: "image/png",
                      data: base64Image,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: "application/json",
            },
          }),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || "Erro na chamada da API Multimodal");
      }

      const data = await response.json();
      const rawJsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawJsonText) {
        throw new Error("O modelo multimodal não retornou resposta.");
      }

      const parsedData = JSON.parse(rawJsonText);

      if (!parsedData.mermaidCode) {
        throw new Error("A resposta da IA não contém o campo mermaidCode.");
      }

      setStatusMsg("Desenho analisado com sucesso! Renderizando diagrama e metadados...");
      setMermaidCode(parsedData.mermaidCode);
      setMermaidSequenceCode(parsedData.mermaidSequenceCode || "");
      setNodesMetadata(parsedData.nodes || {});
      setAgentPrompt(parsedData.agentPrompt || "");
    } catch (error: any) {
      showErrorModal(error.message || String(error));
    } flex: {
      setIsLoading(false);
    }
  };

  const handleRegenerateGraphOnly = async (
    brokenCode: string,
    errorMsg: string
  ) => {
    if (!apiKey.trim()) {
      showErrorModal("Por favor, insira a chave da API do Google Gemini no menu lateral.");
      return;
    }

    setIsLoading(true);
    setStatusMsg("Regerando exclusivamente o gráfico Mermaid com a IA...");

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: `O código Mermaid a seguir apresentou um erro ao ser montado na biblioteca Mermaid:\n\nERRO: ${errorMsg}\n\nCÓDIGO COM ERRO:\n${brokenCode}\n\nInstrução: Corrija a sintaxe do código Mermaid. Garanta estritamente que se houver N arestas, os índices das diretivas linkStyle devem ir APENAS de 0 a N-1.\n\nRetorne EXCLUSIVAMENTE um objeto JSON no formato:\n{\n  "mermaidCode": "graph TD\\n  ..."\n}`,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: "application/json",
            },
          }),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || "Erro na chamada da API");
      }

      const data = await response.json();
      const rawJsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawJsonText) {
        throw new Error("O modelo não retornou resposta.");
      }

      const parsedData = JSON.parse(rawJsonText);

      if (!parsedData.mermaidCode) {
        throw new Error("A resposta não contém o campo mermaidCode.");
      }

      setMermaidCode(parsedData.mermaidCode);
      setStatusMsg("Gráfico regerado com sucesso pela IA!");
    } catch (error: any) {
      showErrorModal("Erro ao regerar gráfico: " + (error.message || String(error)));
    } flex: {
      setIsLoading(false);
    }
  };

  const showErrorModal = (msg: string) => {
    setErrorMessage(msg);
    setStatusMsg("");
  };

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 font-sans">
      <LoadingModal isOpen={isLoading} statusMsg={statusMsg} />

      <ErrorModal
        isOpen={!!errorMessage}
        errorText={errorMessage}
        onClose={() => setErrorMessage("")}
      />

      <CreateProjectModal
        isOpen={isCreateModalOpen || !!projectToEdit}
        onClose={() => {
          setIsCreateModalOpen(false);
          setProjectToEdit(null);
        }}
        onSubmit={handleSaveProjectForm}
        projectToEdit={projectToEdit}
      />

      {view === "dashboard" ? (
        <DashboardView
          projects={projects}
          onSelectProject={handleSelectProject}
          onCreateProject={() => setIsCreateModalOpen(true)}
          onEditProject={(proj) => setProjectToEdit(proj)}
          onDuplicateProject={handleDuplicateProject}
          onDeleteProject={handleDeleteProject}
          apiKey={apiKey}
          setApiKey={setApiKey}
        />
      ) : (
        <>
          {/* Backdrop para fechar Sidebar em telas móveis/tablets (< 1024px) */}
          {isSidebarOpen && (
            <div
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-30 lg:hidden cursor-pointer transition-opacity"
              title="Fechar menu lateral"
            />
          )}

          <Sidebar
            apiKey={apiKey}
            setApiKey={setApiKey}
            promptInput={currentPrompt}
            setPromptInput={setCurrentPrompt}
            mode={mode}
            setMode={setMode}
            isLoading={isLoading}
            onGenerate={handleGenerate}
            statusMsg={statusMsg}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            includeEdgeCases={includeEdgeCases}
            setIncludeEdgeCases={setIncludeEdgeCases}
          />

          <DiagramCanvas
            mermaidCode={mermaidCode}
            mermaidSequenceCode={mermaidSequenceCode}
            mode={mode}
            nodesMetadata={nodesMetadata}
            agentPrompt={agentPrompt}
            onError={showErrorModal}
            onRenderSuccess={() =>
              setStatusMsg("Diagrama e metadados carregados com sucesso!")
            }
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            onMermaidCodeChange={setMermaidCode}
            onMermaidSequenceCodeChange={setMermaidSequenceCode}
            onAnalyzeDrawing={handleGenerateFromImage}
            onRegenerateGraphOnly={handleRegenerateGraphOnly}
            isLoading={isLoading}
            onReturnToDashboard={() => setView("dashboard")}
            projectName={activeProject?.name}
          />
        </>
      )}
    </div>
  );
}
