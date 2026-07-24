import { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { DiagramCanvas } from "./components/DiagramCanvas";
import { ErrorModal } from "./components/ErrorModal";
import {
  COMPLETE_HIGH_LEVEL_PROMPT,
  COMPLETE_LOW_LEVEL_PROMPT,
  COMPLETE_LOW_LEVEL_WITH_EDGE_CASES_PROMPT,
} from "./constants";

export default function App() {
  const [apiKey, setApiKey] = useState("");

  const [lowLevelPrompt, setLowLevelPrompt] = useState("");
  const [highLevelPrompt, setHighLevelPrompt] = useState("");

  const [mode, setMode] = useState<"low-level" | "high-level">("low-level");
  const [includeEdgeCases, setIncludeEdgeCases] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Guardamos o código Mermaid E os metadados dos nós gerados pela IA, além do prompt do agente
  const [mermaidCode, setMermaidCode] = useState("");
  const [nodesMetadata, setNodesMetadata] = useState<Record<string, any>>({});
  const [agentPrompt, setAgentPrompt] = useState("");

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

  const handleGenerate = async () => {
    if (!apiKey.trim()) {
      showErrorModal("Por favor, insira a chave da API do Google Gemini.");
      return;
    }
    if (!currentPrompt.trim()) {
      showErrorModal(
        "Por favor, insira a descrição ou código na caixa de texto.",
      );
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
              responseMimeType: "application/json", // Força resposta estritamente em JSON
            },
          }),
        },
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

      // Faz o parse do objeto JSON retornado pela IA
      const parsedData = JSON.parse(rawJsonText);

      if (!parsedData.mermaidCode) {
        throw new Error("A resposta da IA não contém o campo mermaidCode.");
      }

      setStatusMsg("Renderizando diagrama e atrelando metadados aos nós...");
      setMermaidCode(parsedData.mermaidCode);
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
        },
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
      setNodesMetadata(parsedData.nodes || {});
      setAgentPrompt(parsedData.agentPrompt || "");
    } catch (error: any) {
      showErrorModal(error.message || String(error));
    } finally {
      setIsLoading(false);
    }
  };

  const showErrorModal = (msg: string) => {
    setErrorMessage(msg);
    setStatusMsg("");
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 font-sans">
      <ErrorModal
        isOpen={!!errorMessage}
        errorText={errorMessage}
        onClose={() => setErrorMessage("")}
      />

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
        nodesMetadata={nodesMetadata}
        agentPrompt={agentPrompt}
        onError={showErrorModal}
        onRenderSuccess={() =>
          setStatusMsg("Diagrama e metadados carregados com sucesso!")
        }
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        onMermaidCodeChange={setMermaidCode}
        onAnalyzeDrawing={handleGenerateFromImage}
        isLoading={isLoading}
      />
    </div>
  );
}
