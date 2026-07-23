import React, { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { DiagramCanvas } from "./components/DiagramCanvas";
import { ErrorModal } from "./components/ErrorModal";
import {
  LOW_LEVEL_PROMPT,
  HIGH_LEVEL_PROMPT,
  EDGE_CASE_INSTRUCTION,
} from "./constants/prompts";

export default function App() {
  const [apiKey, setApiKey] = useState("");

  const [lowLevelPrompt, setLowLevelPrompt] = useState("");
  const [highLevelPrompt, setHighLevelPrompt] = useState("");

  const [mode, setMode] = useState("low-level"); // 'low-level' | 'high-level'
  const [includeEdgeCases, setIncludeEdgeCases] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [mermaidCode, setMermaidCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const currentPrompt = mode === "low-level" ? lowLevelPrompt : highLevelPrompt;

  const setCurrentPrompt = (value) => {
    if (mode === "low-level") {
      setLowLevelPrompt(value);
    } else {
      setHighLevelPrompt(value);
    }
  };

  const extractMermaidCode = (text) => {
    const match = text.match(/```(?:mermaid)?\n([\s\S]*?)```/);
    return match ? match[1].trim() : text.replace(/^mermaid\n/, "").trim();
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
    setStatusMsg("Analisando o contexto e gerando diagrama...");

    // Seleciona o prompt base
    let selectedSystemPrompt =
      mode === "low-level" ? LOW_LEVEL_PROMPT : HIGH_LEVEL_PROMPT;

    // Se o modo for Baixo Nível e o usuário ativou o mapeamento de casos de borda
    if (mode === "low-level" && includeEdgeCases) {
      selectedSystemPrompt += `\n${EDGE_CASE_INSTRUCTION}`;
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
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
            generationConfig: { temperature: 0.1 },
          }),
        },
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || "Erro na chamada da API");
      }

      const data = await response.json();
      const llmOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;

      const code = extractMermaidCode(llmOutput || "");

      if (!code) {
        throw new Error(
          "O modelo não retornou código Mermaid válido.\nResposta bruta:\n" +
            llmOutput,
        );
      }

      setStatusMsg("Renderizando diagrama...");
      setMermaidCode(code);
    } catch (error) {
      showErrorModal(error.message || String(error));
    } finally {
      setIsLoading(false);
    }
  };

  const showErrorModal = (msg) => {
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
        onError={showErrorModal}
        onRenderSuccess={() => setStatusMsg("Diagrama gerado com sucesso!")}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />
    </div>
  );
}
