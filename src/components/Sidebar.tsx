import React, { useRef, useState } from "react";

export function Sidebar({
  apiKey,
  setApiKey,
  promptInput,
  setPromptInput,
  isLoading,
  onGenerate,
  statusMsg,
  mode,
  setMode,
  isSidebarOpen,
  setIsSidebarOpen,
  includeEdgeCases,
  setIncludeEdgeCases,
}) {
  if (!isSidebarOpen) return null;

  const isLowLevel = mode === "low-level";
  const fileInputRef = useRef(null);
  const [fileBadge, setFileBadge] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  // --- PARSER 1: OpenAPI / Swagger ---
  const formatOpenAPISpec = (spec) => {
    let output = `[ESPECIFICAÇÃO OPENAPI / SWAGGER IMPORTADA]\n`;
    output += `Título: ${spec.info?.title || "API Especificação"}\n`;
    if (spec.info?.description) {
      output += `Descrição: ${spec.info.description}\n`;
    }
    output += `\nENDPOINTS E FLUXOS DETECTADOS:\n`;

    if (spec.paths) {
      Object.entries(spec.paths).forEach(([path, methods]) => {
        Object.entries(methods).forEach(([method, details]) => {
          if (
            ["get", "post", "put", "delete", "patch"].includes(
              method.toLowerCase(),
            )
          ) {
            output += `\n- Rota: ${method.toUpperCase()} ${path}\n`;
            if (details.summary) output += `  Resumo: ${details.summary}\n`;
            if (details.responses) {
              const statusCodes = Object.keys(details.responses).join(", ");
              output += `  Status HTTP de Retorno: ${statusCodes}\n`;
            }
          }
        });
      });
    }

    const count = Object.keys(spec.paths || {}).length;
    return {
      text: output,
      badge: `OpenAPI: "${spec.info?.title || "API"}" (${count} rotas)`,
    };
  };

  // --- PARSER 2: Postman Collection ---
  const extractPostmanRequests = (items, result = []) => {
    if (!Array.isArray(items)) return result;

    for (const item of items) {
      if (item.request) {
        const method = item.request.method || "GET";
        let url = "";
        if (typeof item.request.url === "string") {
          url = item.request.url;
        } else if (item.request.url?.raw) {
          url = item.request.url.raw;
        } else if (Array.isArray(item.request.url?.path)) {
          url = "/" + item.request.url.path.join("/");
        }

        let bodySummary = "";
        if (item.request.body?.mode === "raw" && item.request.body?.raw) {
          bodySummary = item.request.body.raw.slice(0, 150);
        }

        result.push({
          name: item.name || "Sem nome",
          method: method.toUpperCase(),
          url,
          body: bodySummary,
        });
      }
      if (item.item) {
        extractPostmanRequests(item.item, result);
      }
    }
    return result;
  };

  const formatPostmanCollection = (data) => {
    const requests = extractPostmanRequests(data.item);
    let output = `[COLEÇÃO POSTMAN IMPORTADA]\n`;
    output += `Nome da Coleção: ${data.info?.name || "Postman Collection"}\n`;
    output += `Total de Requisições: ${requests.length}\n\n`;
    output += `REQUISIÇÕES E ROTAS DETECTADAS:\n`;

    requests.forEach((req, idx) => {
      output += `\n${idx + 1}. [${req.method}] ${req.name}\n`;
      if (req.url) output += `   URL/Rota: ${req.url}\n`;
      if (req.body) output += `   Payload Exemplo: ${req.body}\n`;
    });

    const name = data.info?.name || "Postman";
    return {
      text: output,
      badge: `Postman: "${name}" (${requests.length} requisições)`,
    };
  };

  // --- PARSER 3: Insomnia Export ---
  const formatInsomniaCollection = (data) => {
    const requests = (data.resources || []).filter(
      (r) => r._type === "request",
    );
    let output = `[COLEÇÃO INSOMNIA IMPORTADA]\n`;
    output += `Total de Requisições: ${requests.length}\n\n`;
    output += `REQUISIÇÕES E ROTAS DETECTADAS:\n`;

    requests.forEach((req, idx) => {
      const method = (req.method || "GET").toUpperCase();
      const name = req.name || "Sem nome";
      const url = req.url || "";
      output += `\n${idx + 1}. [${method}] ${name}\n`;
      if (url) output += `   URL/Rota: ${url}\n`;
      if (req.body?.text) {
        output += `   Payload Exemplo: ${req.body.text.slice(0, 150)}\n`;
      }
    });

    return {
      text: output,
      badge: `Insomnia Export (${requests.length} requisições)`,
    };
  };

  const processFile = (file) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (!content) return;

      let processedText = content;
      let badgeText = `Arquivo "${file.name}" importado`;

      if (file.name.endsWith(".json")) {
        try {
          const parsed = JSON.parse(content);

          if (parsed.openapi || parsed.swagger || parsed.paths) {
            const res = formatOpenAPISpec(parsed);
            processedText = res.text;
            badgeText = res.badge;
          } else if (
            parsed.info?._postman_id ||
            parsed.info?.schema?.includes("postman") ||
            (parsed.info?.name && Array.isArray(parsed.item))
          ) {
            const res = formatPostmanCollection(parsed);
            processedText = res.text;
            badgeText = res.badge;
          } else if (
            parsed._type === "export" ||
            (Array.isArray(parsed.resources) &&
              parsed.resources.some((r) => r._type === "request"))
          ) {
            const res = formatInsomniaCollection(parsed);
            processedText = res.text;
            badgeText = res.badge;
          }
        } catch (e) {
          // Ignora erros de parse
        }
      }

      setPromptInput(processedText);
      setFileBadge(badgeText);
    };

    reader.readAsText(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    processFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    processFile(file);
  };

  const handleClearFile = () => {
    setFileBadge("");
    setPromptInput("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <aside className="w-[380px] shrink-0 bg-white border-r border-slate-200 flex flex-col p-5 z-10 shadow-sm relative transition-all duration-300">
      {/* Header com Botão de Retração */}
      <div className="flex items-center justify-between mb-5">
        <div className="text-lg font-bold flex items-center gap-2.5 text-slate-900">
          <div className="bg-indigo-600 text-white w-8 h-8 rounded-lg grid place-items-center text-base">
            ✨
          </div>
          AI to Mermaid
        </div>
        <button
          type="button"
          onClick={() => setIsSidebarOpen(false)}
          className="w-7 h-7 rounded-md border border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-800 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
          title="Recolher Menu Lateral"
        >
          <i className="fa-solid fa-chevron-left text-xs"></i>
        </button>
      </div>

      {/* Mode Switcher */}
      <div className="mb-4 flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Tipo de Diagrama
        </label>
        <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            type="button"
            className={`py-1.5 px-2 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              isLowLevel
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
            onClick={() => setMode("low-level")}
          >
            ⚡ Baixo Nível (API)
          </button>
          <button
            type="button"
            className={`py-1.5 px-2 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              !isLowLevel
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
            onClick={() => setMode("high-level")}
          >
            🏛️ Alto Nível (Arquitetura)
          </button>
        </div>
      </div>

      {/* Input API Key */}
      <div className="mb-4 flex flex-col gap-1.5">
        <label
          htmlFor="apiKey"
          className="text-xs font-semibold uppercase tracking-wider text-slate-500"
        >
          Chave da API (Google Gemini)
        </label>
        <input
          type="password"
          id="apiKey"
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 outline-none transition-all focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 focus:bg-white"
          placeholder="Cole sua API Key aqui..."
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
        <a
          href="https://aistudio.google.com/app/apikey"
          target="_blank"
          rel="noreferrer"
          className="text-[10px] text-indigo-600 hover:underline"
        >
          Pegar uma chave grátis ↗
        </a>
      </div>

      {/* Seletor de Mapeamento de Casos de Borda */}
      {isLowLevel && (
        <div className="mb-4 p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-lg flex items-center justify-between transition-colors">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-triangle-exclamation text-amber-600 text-xs"></i>
            <div>
              <div className="text-xs font-semibold text-amber-950">
                Mapear Casos de Borda
              </div>
              <div className="text-[10px] text-amber-700">
                Simular timeouts, rate-limit, 500 e rollbacks
              </div>
            </div>
          </div>
          <input
            type="checkbox"
            checked={includeEdgeCases}
            onChange={(e) => setIncludeEdgeCases(e.target.checked)}
            className="w-4 h-4 accent-amber-600 cursor-pointer"
          />
        </div>
      )}

      {/* Botão de Upload / Dropzone */}
      <div className="mb-3 flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Importar Arquivo
          </label>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs text-indigo-600 font-medium hover:underline flex items-center gap-1 cursor-pointer"
          >
            <i className="fa-solid fa-file-arrow-up"></i>
            <span>Swagger / Postman / Insomnia</span>
          </button>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".json,.yaml,.yml,.ts,.js,.java,.cs,.py,.txt"
          onChange={handleFileChange}
        />

        {/* Badge de Arquivo Carregado */}
        {fileBadge && (
          <div className="flex items-center justify-between px-2.5 py-1.5 bg-indigo-50 border border-indigo-100 rounded-lg text-xs text-indigo-700">
            <span
              className="truncate max-w-[280px] font-medium"
              title={fileBadge}
            >
              <i className="fa-solid fa-circle-check text-emerald-500 mr-1.5"></i>
              {fileBadge}
            </span>
            <button
              type="button"
              onClick={handleClearFile}
              className="text-indigo-400 hover:text-indigo-700 font-bold ml-1 cursor-pointer"
              title="Remover arquivo"
            >
              &times;
            </button>
          </div>
        )}
      </div>

      {/* Textarea Description com Drag & Drop */}
      <div
        className={`mb-4 flex flex-col gap-1.5 flex-grow relative rounded-lg transition-all ${
          isDragging ? "ring-2 ring-indigo-500 bg-indigo-50/50" : ""
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <label
          htmlFor="promptInput"
          className="text-xs font-semibold uppercase tracking-wider text-slate-500"
        >
          {isLowLevel ? "Código ou Fluxo da API" : "Descrição da Arquitetura"}
        </label>

        <textarea
          id="promptInput"
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 outline-none transition-all focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 focus:bg-white resize-none flex-grow min-h-[160px] leading-relaxed"
          placeholder={
            isLowLevel
              ? "Cole a descrição/código da API OU arraste um arquivo Swagger, Postman ou Insomnia (.json) aqui..."
              : "Cole a descrição da arquitetura OU arraste um arquivo aqui..."
          }
          value={promptInput}
          onChange={(e) => setPromptInput(e.target.value)}
        ></textarea>

        {isDragging && (
          <div className="absolute inset-0 bg-indigo-600/10 backdrop-blur-[1px] border-2 border-dashed border-indigo-600 rounded-lg flex flex-col items-center justify-center text-indigo-700 font-semibold text-xs pointer-events-none">
            <i className="fa-solid fa-cloud-arrow-up text-2xl mb-1"></i>
            Solte o arquivo para importar!
          </div>
        )}
      </div>

      {/* Button */}
      <button
        className="bg-indigo-600 hover:bg-indigo-700 text-white border-0 py-3 px-4 rounded-lg font-semibold text-sm cursor-pointer flex justify-center items-center gap-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        onClick={onGenerate}
        disabled={isLoading}
      >
        {!isLoading ? (
          <span>
            {isLowLevel ? "Gerar Fluxo da API" : "Gerar Arquitetura Global"}
          </span>
        ) : (
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
        )}
      </button>

      {/* Status */}
      <div className="text-xs text-slate-500 mt-2.5 text-center h-4">
        {statusMsg}
      </div>
    </aside>
  );
}
