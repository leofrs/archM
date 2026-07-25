import { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { DiagramCanvas } from "./components/DiagramCanvas";
import { ErrorModal } from "./components/ErrorModal";
import { LoadingModal } from "./components/LoadingModal";
import { DashboardView } from "./components/DashboardView";
import { CreateProjectModal } from "./components/CreateProjectModal";
import { DeleteWorkspaceModal } from "./components/DeleteWorkspaceModal";
import { DeleteSubProjectModal } from "./components/DeleteSubProjectModal";
import type { Workspace, SubProject } from "./types/project";
import {
  getStoredWorkspaces,
  updateWorkspaceInStorage,
  createNewWorkspace,
  duplicateWorkspaceInStorage,
  deleteWorkspaceFromStorage,
  addSubProjectToWorkspace,
  duplicateSubProjectInWorkspace,
  deleteSubProjectFromWorkspace,
} from "./utils/projectStorage";
import {
  COMPLETE_HIGH_LEVEL_PROMPT,
  COMPLETE_LOW_LEVEL_PROMPT,
  COMPLETE_LOW_LEVEL_WITH_EDGE_CASES_PROMPT,
} from "./constants";

export default function App() {
  // Navegação: Dashboard vs Workspace do Projeto
  const [view, setView] = useState<"dashboard" | "workspace">("dashboard");

  // Lista de Workspaces & Workspace Ativo
  const [workspaces, setWorkspaces] = useState<Workspace[]>(() => getStoredWorkspaces());
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [activeSubProjectId, setActiveSubProjectId] = useState<string>("");

  // Modais de Criação/Edição/Exclusão de Workspaces e Sub-projetos
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [workspaceToEdit, setWorkspaceToEdit] = useState<Workspace | null>(null);
  const [workspaceToDelete, setWorkspaceToDelete] = useState<Workspace | null>(null);
  const [subProjectToDelete, setSubProjectToDelete] = useState<SubProject | null>(null);

  // Config da API Gemini (mantida no localStorage)
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("archm_gemini_key") || "");

  useEffect(() => {
    if (apiKey) {
      localStorage.setItem("archm_gemini_key", apiKey);
    }
  }, [apiKey]);

  // Estados Locais do Sub-projeto Ativo no Workspace
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

  // Carregar um Workspace Selecionado
  const handleSelectWorkspace = (workspace: Workspace) => {
    setActiveWorkspace(workspace);
    const subToSelect =
      workspace.subProjects.find((s) => s.id === workspace.activeSubProjectId) ||
      workspace.subProjects[0];

    if (subToSelect) {
      loadSubProjectState(subToSelect);
      setActiveSubProjectId(subToSelect.id);
    }
    setView("workspace");
  };

  // Carregar o estado local de um sub-projeto no workspace
  const loadSubProjectState = (sub: SubProject) => {
    setMode(sub.mode);
    setMermaidCode(sub.mermaidCode || "");
    setMermaidSequenceCode(sub.mermaidSequenceCode || "");
    setNodesMetadata(sub.nodesMetadata || {});
    setAgentPrompt(sub.agentPrompt || "");
    setLowLevelPrompt(sub.lowLevelPrompt || (sub.mode === "low-level" ? sub.agentPrompt || "" : ""));
    setHighLevelPrompt(sub.highLevelPrompt || (sub.mode === "high-level" ? sub.agentPrompt || "" : ""));
    setIncludeEdgeCases(sub.includeEdgeCases || false);
  };

  // Alternar entre Sub-projetos/Rotas dentro do Workspace
  const handleSelectSubProject = (subProjectId: string) => {
    if (!activeWorkspace) return;
    const targetSub = activeWorkspace.subProjects.find((s) => s.id === subProjectId);
    if (!targetSub) return;

    setActiveSubProjectId(subProjectId);
    loadSubProjectState(targetSub);

    // Atualiza activeSubProjectId no Workspace
    const updatedWs: Workspace = {
      ...activeWorkspace,
      activeSubProjectId: subProjectId,
    };
    setActiveWorkspace(updatedWs);
    const newList = updateWorkspaceInStorage(updatedWs);
    setWorkspaces(newList);
  };

  // Sincronizar alterações do sub-projeto ativo com o storage do Workspace
  useEffect(() => {
    if (!activeWorkspace || !activeSubProjectId || view !== "workspace") return;

    const subIdx = activeWorkspace.subProjects.findIndex((s) => s.id === activeSubProjectId);
    if (subIdx === -1) return;

    const currentSub = activeWorkspace.subProjects[subIdx];
    const updatedSub: SubProject = {
      ...currentSub,
      mode,
      mermaidCode,
      mermaidSequenceCode,
      nodesMetadata,
      agentPrompt,
      lowLevelPrompt,
      highLevelPrompt,
      includeEdgeCases,
      updatedAt: new Date().toISOString(),
    };

    // Só atualiza se houve mudança real nos campos
    if (
      currentSub.mode === updatedSub.mode &&
      currentSub.mermaidCode === updatedSub.mermaidCode &&
      currentSub.mermaidSequenceCode === updatedSub.mermaidSequenceCode &&
      currentSub.agentPrompt === updatedSub.agentPrompt &&
      currentSub.lowLevelPrompt === updatedSub.lowLevelPrompt &&
      currentSub.highLevelPrompt === updatedSub.highLevelPrompt &&
      currentSub.includeEdgeCases === updatedSub.includeEdgeCases &&
      JSON.stringify(currentSub.nodesMetadata) === JSON.stringify(updatedSub.nodesMetadata)
    ) {
      return;
    }

    const newSubProjects = [...activeWorkspace.subProjects];
    newSubProjects[subIdx] = updatedSub;

    const updatedWs: Workspace = {
      ...activeWorkspace,
      subProjects: newSubProjects,
      updatedAt: new Date().toISOString(),
    };

    setActiveWorkspace(updatedWs);
    const newList = updateWorkspaceInStorage(updatedWs);
    setWorkspaces(newList);
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

  // Criar ou Editar Workspace
  const handleSaveWorkspaceForm = (data: {
    name: string;
    description: string;
    mode: "low-level" | "high-level";
    initialSubProjectName?: string;
  }) => {
    if (workspaceToEdit) {
      // Edição de Workspace Existente
      const updated: Workspace = {
        ...workspaceToEdit,
        name: data.name,
        description: data.description,
      };
      const newList = updateWorkspaceInStorage(updated);
      setWorkspaces(newList);
      if (activeWorkspace?.id === workspaceToEdit.id) {
        setActiveWorkspace(updated);
      }
      setWorkspaceToEdit(null);
    } else {
      // Criação de Novo Workspace
      const newWs = createNewWorkspace(
        data.name,
        data.description,
        data.mode,
        undefined,
        data.initialSubProjectName
      );
      setWorkspaces(getStoredWorkspaces());
      handleSelectWorkspace(newWs);
    }
  };

  // Duplicar Workspace
  const handleDuplicateWorkspace = (workspaceId: string) => {
    const { updatedList } = duplicateWorkspaceInStorage(workspaceId);
    setWorkspaces(updatedList);
  };

  // Excluir Workspace
  const handleDeleteWorkspace = (workspaceId: string) => {
    const updated = deleteWorkspaceFromStorage(workspaceId);
    setWorkspaces(updated);
    if (activeWorkspace?.id === workspaceId) {
      setActiveWorkspace(null);
      setView("dashboard");
    }
  };

  // Gerenciamento de Sub-projetos/Rotas dentro do Workspace
  const handleAddSubProject = (name: string, subMode: "low-level" | "high-level") => {
    if (!activeWorkspace) return;
    const updated = addSubProjectToWorkspace(activeWorkspace.id, name, subMode);
    if (updated) {
      setActiveWorkspace(updated);
      setWorkspaces(getStoredWorkspaces());
      if (updated.activeSubProjectId) {
        handleSelectSubProject(updated.activeSubProjectId);
      }
    }
  };

  const handleRenameSubProject = (subId: string, newName: string) => {
    if (!activeWorkspace) return;
    const newSubProjects = activeWorkspace.subProjects.map((s) =>
      s.id === subId ? { ...s, name: newName, updatedAt: new Date().toISOString() } : s
    );
    const updatedWs: Workspace = {
      ...activeWorkspace,
      subProjects: newSubProjects,
    };
    setActiveWorkspace(updatedWs);
    const newList = updateWorkspaceInStorage(updatedWs);
    setWorkspaces(newList);
  };

  const handleDuplicateSubProject = (subId: string) => {
    if (!activeWorkspace) return;
    const updated = duplicateSubProjectInWorkspace(activeWorkspace.id, subId);
    if (updated) {
      setActiveWorkspace(updated);
      setWorkspaces(getStoredWorkspaces());
      if (updated.activeSubProjectId) {
        handleSelectSubProject(updated.activeSubProjectId);
      }
    }
  };

  const handleRequestDeleteSubProject = (subId: string) => {
    if (!activeWorkspace) return;
    const sub = activeWorkspace.subProjects.find((s) => s.id === subId);
    if (sub) {
      setSubProjectToDelete(sub);
    }
  };

  const handleConfirmDeleteSubProject = (subId: string) => {
    if (!activeWorkspace) return;
    const updated = deleteSubProjectFromWorkspace(activeWorkspace.id, subId);
    if (updated) {
      setActiveWorkspace(updated);
      setWorkspaces(getStoredWorkspaces());
      if (updated.activeSubProjectId) {
        handleSelectSubProject(updated.activeSubProjectId);
      }
    }
    setSubProjectToDelete(null);
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
    } finally {
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
    } finally {
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
    } finally {
      setIsLoading(false);
    }
  };

  const showErrorModal = (msg: string) => {
    setErrorMessage(msg);
    setStatusMsg("");
  };

  const activeSubProject = activeWorkspace?.subProjects.find(
    (s) => s.id === activeSubProjectId
  );

  return (
    <div className="relative flex flex-col h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 font-sans">
      <LoadingModal isOpen={isLoading} statusMsg={statusMsg} />

      <ErrorModal
        isOpen={!!errorMessage}
        errorText={errorMessage}
        onClose={() => setErrorMessage("")}
      />

      <CreateProjectModal
        isOpen={isCreateModalOpen || !!workspaceToEdit}
        onClose={() => {
          setIsCreateModalOpen(false);
          setWorkspaceToEdit(null);
        }}
        onSubmit={handleSaveWorkspaceForm}
        projectToEdit={workspaceToEdit}
      />

      <DeleteWorkspaceModal
        isOpen={!!workspaceToDelete}
        workspace={workspaceToDelete}
        onClose={() => setWorkspaceToDelete(null)}
        onConfirmDelete={handleDeleteWorkspace}
      />

      <DeleteSubProjectModal
        isOpen={!!subProjectToDelete}
        subProject={subProjectToDelete}
        onClose={() => setSubProjectToDelete(null)}
        onConfirmDelete={handleConfirmDeleteSubProject}
      />

      {view === "dashboard" ? (
        <DashboardView
          projects={workspaces}
          onSelectProject={handleSelectWorkspace}
          onCreateProject={() => setIsCreateModalOpen(true)}
          onEditProject={(ws) => setWorkspaceToEdit(ws)}
          onDuplicateProject={handleDuplicateWorkspace}
          onDeleteProject={(ws) => setWorkspaceToDelete(ws)}
          apiKey={apiKey}
          setApiKey={setApiKey}
        />
      ) : (
        <div className="relative flex h-full w-full overflow-hidden">
          {/* Backdrop para fechar Sidebar em telas móveis/tablets (< 1024px) */}
          {isSidebarOpen && (
            <div
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-30 lg:hidden cursor-pointer transition-opacity"
              title="Fechar menu lateral"
            />
          )}

          <Sidebar
            workspace={activeWorkspace}
            activeSubProjectId={activeSubProjectId}
            onSelectSubProject={handleSelectSubProject}
            onAddSubProject={handleAddSubProject}
            onRenameSubProject={handleRenameSubProject}
            onDuplicateSubProject={handleDuplicateSubProject}
            onDeleteSubProject={handleRequestDeleteSubProject}
            onDeleteWorkspace={(ws) => setWorkspaceToDelete(ws)}
            onBackToDashboard={() => setView("dashboard")}
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
            projectName={activeSubProject ? `${activeWorkspace?.name} • ${activeSubProject.name}` : activeWorkspace?.name}
          />
        </div>
      )}
    </div>
  );
}
