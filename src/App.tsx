import { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { DiagramCanvas } from "./components/DiagramCanvas";
import { ErrorModal } from "./components/ErrorModal";
import { LoadingModal } from "./components/LoadingModal";
import { DashboardView } from "./components/DashboardView";
import { CreateProjectModal } from "./components/CreateProjectModal";
import { DeleteWorkspaceModal } from "./components/DeleteWorkspaceModal";
import { DeleteSubProjectModal } from "./components/DeleteSubProjectModal";
import { LLMConfigModal } from "./components/LLMConfigModal";
import type { Workspace, SubProject } from "./types/project";
import type { LLMConfig } from "./types/llm";
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
  getStoredLLMConfig,
  saveLLMConfig,
  getActiveLLMKey,
  LLM_PROVIDERS,
} from "./utils/llmStorage";
import {
  generateArchitectureDiagram,
  generateFromImageSketch,
  regenerateGraphSyntax,
} from "./services/llmService";
import {
  COMPLETE_HIGH_LEVEL_PROMPT,
  COMPLETE_LOW_LEVEL_PROMPT,
  COMPLETE_LOW_LEVEL_WITH_EDGE_CASES_PROMPT,
} from "./constants";

const ACTIVE_WORKSPACE_STORAGE_KEY = "archm_active_workspace_id_v1";

export default function App() {
  // Navegação: Dashboard vs Workspace do Projeto
  const [view, setView] = useState<"dashboard" | "workspace">("dashboard");

  // Lista de Workspaces & Workspace Ativo
  const [workspaces, setWorkspaces] = useState<Workspace[]>(() => getStoredWorkspaces());
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [activeSubProjectId, setActiveSubProjectId] = useState<string>("");

  // Restaurar workspace ativo gravado no localStorage ao montar o componente (evita redirecionamento para o dashboard no F5)
  useEffect(() => {
    const savedWsId = localStorage.getItem(ACTIVE_WORKSPACE_STORAGE_KEY);
    if (savedWsId) {
      const storedWorkspaces = getStoredWorkspaces();
      const targetWorkspace = storedWorkspaces.find((w) => w.id === savedWsId);
      if (targetWorkspace) {
        setActiveWorkspace(targetWorkspace);
        const subToSelect =
          targetWorkspace.subProjects.find(
            (s) => s.id === targetWorkspace.activeSubProjectId
          ) || targetWorkspace.subProjects[0];

        if (subToSelect) {
          loadSubProjectState(subToSelect);
          setActiveSubProjectId(subToSelect.id);
        }
        setView("workspace");
      }
    }
  }, []);

  // Modais de Criação/Edição/Exclusão de Workspaces e Sub-projetos
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [workspaceToEdit, setWorkspaceToEdit] = useState<Workspace | null>(null);
  const [workspaceToDelete, setWorkspaceToDelete] = useState<Workspace | null>(null);
  const [subProjectToDelete, setSubProjectToDelete] = useState<SubProject | null>(null);

  // Config de Provedor LLM (Multi-Provedor: Google, Anthropic, OpenAI)
  const [llmConfig, setLlmConfig] = useState<LLMConfig>(() => getStoredLLMConfig());
  const [isLLMModalOpen, setIsLLMModalOpen] = useState(false);

  const handleSaveLLMConfig = (newConfig: LLMConfig) => {
    setLlmConfig(newConfig);
    saveLLMConfig(newConfig);
  };

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
    localStorage.setItem(ACTIVE_WORKSPACE_STORAGE_KEY, workspace.id);
    const subToSelect =
      workspace.subProjects.find((s) => s.id === workspace.activeSubProjectId) ||
      workspace.subProjects[0];

    if (subToSelect) {
      loadSubProjectState(subToSelect);
      setActiveSubProjectId(subToSelect.id);
    } else {
      setActiveSubProjectId("");
      setMermaidCode("");
      setMermaidSequenceCode("");
      setNodesMetadata({});
      setAgentPrompt("");
      setLowLevelPrompt("");
      setHighLevelPrompt("");
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
    setLowLevelPrompt(sub.lowLevelPrompt || sub.agentPrompt || "");
    setHighLevelPrompt(sub.highLevelPrompt || sub.agentPrompt || "");
  };

  // Salvar estado atual do sub-projeto (aceita workspace opcional para evitar closures desatualizadas)
  const saveCurrentSubProjectState = (
    targetWorkspace: Workspace | null = activeWorkspace,
    targetSubId: string = activeSubProjectId
  ): Workspace | null => {
    if (!targetWorkspace || !targetSubId) return null;
    const updatedSubProjects = targetWorkspace.subProjects.map((sub) => {
      if (sub.id === targetSubId) {
        return {
          ...sub,
          mode,
          mermaidCode,
          mermaidSequenceCode,
          nodesMetadata,
          agentPrompt,
          lowLevelPrompt,
          highLevelPrompt,
        };
      }
      return sub;
    });

    const updatedWs = { ...targetWorkspace, subProjects: updatedSubProjects };
    setActiveWorkspace(updatedWs);
    updateWorkspaceInStorage(updatedWs);
    setWorkspaces(getStoredWorkspaces());
    return updatedWs;
  };

  // Seleção e alteração de Sub-projeto
  const handleSelectSubProject = (subProjectId: string) => {
    if (!activeWorkspace || subProjectId === activeSubProjectId) return;
    const syncedWs = saveCurrentSubProjectState() || activeWorkspace;

    const targetSub = syncedWs.subProjects.find((s) => s.id === subProjectId);
    if (targetSub) {
      loadSubProjectState(targetSub);
      setActiveSubProjectId(subProjectId);
      const updatedWs = { ...syncedWs, activeSubProjectId: subProjectId };
      setActiveWorkspace(updatedWs);
      updateWorkspaceInStorage(updatedWs);
      setWorkspaces(getStoredWorkspaces());
    }
  };

  // Atualiza autosave local quando os dados alteram
  useEffect(() => {
    if (!activeWorkspace || !activeSubProjectId) return;
    const currentSub = activeWorkspace.subProjects.find((s) => s.id === activeSubProjectId);
    if (!currentSub) return;

    if (
      currentSub.mermaidCode !== mermaidCode ||
      currentSub.mermaidSequenceCode !== mermaidSequenceCode ||
      currentSub.mode !== mode ||
      currentSub.lowLevelPrompt !== lowLevelPrompt ||
      currentSub.highLevelPrompt !== highLevelPrompt ||
      JSON.stringify(currentSub.nodesMetadata) !== JSON.stringify(nodesMetadata)
    ) {
      const timer = setTimeout(() => {
        saveCurrentSubProjectState();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [mermaidCode, mermaidSequenceCode, currentPrompt, mode, nodesMetadata, lowLevelPrompt, highLevelPrompt]);

  // Criar / Editar Workspace via Modal
  const handleSaveWorkspaceForm = (data: {
    name: string;
    description: string;
    mode: "low-level" | "high-level";
    initialSubProjectName?: string;
  }) => {
    if (workspaceToEdit) {
      const updated = {
        ...workspaceToEdit,
        name: data.name,
        description: data.description,
      };
      updateWorkspaceInStorage(updated);
      if (activeWorkspace?.id === updated.id) {
        setActiveWorkspace(updated);
      }
    } else {
      const newWs = createNewWorkspace(
        data.name,
        data.description,
        data.mode,
        undefined,
        data.initialSubProjectName
      );
      setActiveWorkspace(newWs);
      localStorage.setItem(ACTIVE_WORKSPACE_STORAGE_KEY, newWs.id);
      if (newWs.subProjects.length > 0) {
        setActiveSubProjectId(newWs.subProjects[0].id);
        loadSubProjectState(newWs.subProjects[0]);
      }
      setView("workspace");
    }
    setWorkspaces(getStoredWorkspaces());
    setIsCreateModalOpen(false);
    setWorkspaceToEdit(null);
  };

  const handleDuplicateWorkspace = (workspaceId: string) => {
    const dup = duplicateWorkspaceInStorage(workspaceId);
    if (dup) {
      setWorkspaces(getStoredWorkspaces());
    }
  };

  const handleDeleteWorkspace = (workspaceId: string) => {
    deleteWorkspaceFromStorage(workspaceId);
    setWorkspaces(getStoredWorkspaces());
    if (activeWorkspace?.id === workspaceId) {
      localStorage.removeItem(ACTIVE_WORKSPACE_STORAGE_KEY);
      setActiveWorkspace(null);
      setView("dashboard");
    }
    setWorkspaceToDelete(null);
  };

  // Gerenciamento de Sub-projetos
  const handleAddSubProject = (name: string, subMode: "low-level" | "high-level") => {
    if (!activeWorkspace) return;
    const syncedWs = saveCurrentSubProjectState() || activeWorkspace;

    const updated = addSubProjectToWorkspace(syncedWs.id, name, subMode);
    if (updated) {
      setActiveWorkspace(updated);
      setWorkspaces(getStoredWorkspaces());
      const newSub = updated.subProjects.find((s) => s.id === updated.activeSubProjectId);
      if (newSub) {
        setActiveSubProjectId(newSub.id);
        loadSubProjectState(newSub);
      }
    }
  };

  const handleRenameSubProject = (subId: string, newName: string) => {
    if (!activeWorkspace) return;
    const updatedSubProjects = activeWorkspace.subProjects.map((s) =>
      s.id === subId ? { ...s, name: newName } : s
    );
    const updatedWs = { ...activeWorkspace, subProjects: updatedSubProjects };
    setActiveWorkspace(updatedWs);
    updateWorkspaceInStorage(updatedWs);
    setWorkspaces(getStoredWorkspaces());
  };

  const handleDuplicateSubProject = (subId: string) => {
    if (!activeWorkspace) return;
    const syncedWs = saveCurrentSubProjectState() || activeWorkspace;

    const updated = duplicateSubProjectInWorkspace(syncedWs.id, subId);
    if (updated) {
      setActiveWorkspace(updated);
      setWorkspaces(getStoredWorkspaces());
      const newSub = updated.subProjects.find((s) => s.id === updated.activeSubProjectId);
      if (newSub) {
        setActiveSubProjectId(newSub.id);
        loadSubProjectState(newSub);
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
        const nextSub = updated.subProjects.find((s) => s.id === updated.activeSubProjectId);
        if (nextSub) {
          setActiveSubProjectId(nextSub.id);
          loadSubProjectState(nextSub);
        }
      } else {
        setActiveSubProjectId("");
        setMermaidCode("");
        setMermaidSequenceCode("");
        setNodesMetadata({});
        setAgentPrompt("");
        setLowLevelPrompt("");
        setHighLevelPrompt("");
      }
    }
    setSubProjectToDelete(null);
  };

  // Gerar Diagrama e Metadados via Provedor de IA Selecionado
  const handleGenerate = async () => {
    const activeKey = getActiveLLMKey(llmConfig);
    const providerInfo = LLM_PROVIDERS[llmConfig.activeProvider];

    if (!activeKey.trim()) {
      showErrorModal(`Por favor, insira a chave da API do ${providerInfo.name} nas configurações de IA.`);
      setIsLLMModalOpen(true);
      return;
    }
    if (!currentPrompt.trim()) {
      showErrorModal("Por favor, insira a descrição ou código na caixa de texto.");
      return;
    }

    setIsLoading(true);
    setStatusMsg(`Analisando contexto com a IA (${providerInfo.name})...`);

    let selectedSystemPrompt =
      mode === "low-level"
        ? COMPLETE_LOW_LEVEL_PROMPT
        : COMPLETE_HIGH_LEVEL_PROMPT;

    if (mode === "low-level" && includeEdgeCases) {
      selectedSystemPrompt += `\n${COMPLETE_LOW_LEVEL_WITH_EDGE_CASES_PROMPT}`;
    }

    try {
      const result = await generateArchitectureDiagram(llmConfig, currentPrompt, selectedSystemPrompt);

      setStatusMsg("Renderizando diagrama e atrelando metadados aos nós...");
      setMermaidCode(result.mermaidCode);
      setMermaidSequenceCode(result.mermaidSequenceCode || "");
      setNodesMetadata(result.nodes || {});
      setAgentPrompt(result.agentPrompt || "");
    } catch (error: any) {
      showErrorModal(error.message || String(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateFromImage = async (base64Image: string) => {
    const activeKey = getActiveLLMKey(llmConfig);
    const providerInfo = LLM_PROVIDERS[llmConfig.activeProvider];

    if (!activeKey.trim()) {
      showErrorModal(`Por favor, insira a chave da API do ${providerInfo.name} nas configurações de IA.`);
      setIsLLMModalOpen(true);
      return;
    }

    setIsLoading(true);
    setStatusMsg(`Analisando o desenho feito a mão livre com a IA multimodal (${providerInfo.name})...`);

    let selectedSystemPrompt =
      mode === "low-level"
        ? COMPLETE_LOW_LEVEL_PROMPT
        : COMPLETE_HIGH_LEVEL_PROMPT;

    if (mode === "low-level" && includeEdgeCases) {
      selectedSystemPrompt += `\n${COMPLETE_LOW_LEVEL_WITH_EDGE_CASES_PROMPT}`;
    }

    try {
      const result = await generateFromImageSketch(llmConfig, base64Image, selectedSystemPrompt);

      setStatusMsg("Desenho analisado com sucesso! Renderizando diagrama e metadados...");
      setMermaidCode(result.mermaidCode);
      setMermaidSequenceCode(result.mermaidSequenceCode || "");
      setNodesMetadata(result.nodes || {});
      setAgentPrompt(result.agentPrompt || "");
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
    const activeKey = getActiveLLMKey(llmConfig);
    const providerInfo = LLM_PROVIDERS[llmConfig.activeProvider];

    if (!activeKey.trim()) {
      showErrorModal(`Por favor, insira a chave da API do ${providerInfo.name} nas configurações de IA.`);
      setIsLLMModalOpen(true);
      return;
    }

    setIsLoading(true);
    setStatusMsg(`Regerando exclusivamente o gráfico Mermaid com a IA (${providerInfo.name})...`);

    try {
      const result = await regenerateGraphSyntax(llmConfig, brokenCode, errorMsg);
      setMermaidCode(result.mermaidCode);
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

  const handleBackToDashboard = () => {
    saveCurrentSubProjectState();
    localStorage.removeItem(ACTIVE_WORKSPACE_STORAGE_KEY);
    setView("dashboard");
  };

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

      <LLMConfigModal
        isOpen={isLLMModalOpen}
        onClose={() => setIsLLMModalOpen(false)}
        config={llmConfig}
        onSaveConfig={handleSaveLLMConfig}
      />

      {view === "dashboard" ? (
        <DashboardView
          projects={workspaces}
          onSelectProject={handleSelectWorkspace}
          onCreateProject={() => setIsCreateModalOpen(true)}
          onEditProject={(ws) => setWorkspaceToEdit(ws)}
          onDuplicateProject={handleDuplicateWorkspace}
          onDeleteProject={(ws) => setWorkspaceToDelete(ws)}
          llmConfig={llmConfig}
          onOpenLLMConfig={() => setIsLLMModalOpen(true)}
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
            onBackToDashboard={handleBackToDashboard}
            llmConfig={llmConfig}
            onOpenLLMConfig={() => setIsLLMModalOpen(true)}
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
            onReturnToDashboard={handleBackToDashboard}
            projectName={activeSubProject ? `${activeWorkspace?.name} • ${activeSubProject.name}` : activeWorkspace?.name}
          />
        </div>
      )}
    </div>
  );
}
