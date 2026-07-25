import type { LLMConfig, LLMDiagramResult } from "../types/llm";
import { getActiveLLMKey, getActiveLLMModel, LLM_PROVIDERS } from "../utils/llmStorage";

function extractAndParseJson(rawText: string): any {
  let cleaned = rawText.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }
  return JSON.parse(cleaned);
}

export async function generateArchitectureDiagram(
  config: LLMConfig,
  prompt: string,
  systemPrompt: string
): Promise<LLMDiagramResult> {
  const apiKey = getActiveLLMKey(config);
  const provider = config.activeProvider;
  const model = getActiveLLMModel(config);

  if (!apiKey.trim()) {
    throw new Error(`Por favor, insira a chave da API do ${LLM_PROVIDERS[provider].name} nas configurações.`);
  }

  let rawJsonText = "";

  if (provider === "google") {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: `${systemPrompt}\n\nCÓDIGO/CONTEXTO A ANALISAR:\n${prompt}` }],
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
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `Erro na chamada da API do Google Gemini (${response.status})`);
    }

    const data = await response.json();
    rawJsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  } else if (provider === "anthropic") {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 8192,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: `CÓDIGO/CONTEXTO A ANALISAR:\n${prompt}\n\nImportante: Retorne EXCLUSIVAMENTE um objeto JSON válido sem formatações adicionais fora do JSON.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || err.message || `Erro na chamada da API do Anthropic Claude (${response.status})`);
    }

    const data = await response.json();
    rawJsonText = data.content?.[0]?.text;
  } else if (provider === "openai") {
    const payload: any = {
      model: model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `CÓDIGO/CONTEXTO A ANALISAR:\n${prompt}` },
      ],
    };

    if (model !== "o3-mini") {
      payload.temperature = 0.1;
      payload.response_format = { type: "json_object" };
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `Erro na chamada da API da OpenAI (${response.status})`);
    }

    const data = await response.json();
    rawJsonText = data.choices?.[0]?.message?.content;
  }

  if (!rawJsonText) {
    throw new Error(`O modelo ${model} do provedor ${LLM_PROVIDERS[provider].name} não retornou nenhuma resposta.`);
  }

  const parsedData = extractAndParseJson(rawJsonText);
  if (!parsedData.mermaidCode) {
    throw new Error("A resposta da IA não contém o campo 'mermaidCode'.");
  }

  return {
    mermaidCode: parsedData.mermaidCode,
    mermaidSequenceCode: parsedData.mermaidSequenceCode || "",
    nodes: parsedData.nodes || {},
    agentPrompt: parsedData.agentPrompt || "",
  };
}

export async function generateFromImageSketch(
  config: LLMConfig,
  base64Image: string,
  systemPrompt: string
): Promise<LLMDiagramResult> {
  const apiKey = getActiveLLMKey(config);
  const provider = config.activeProvider;
  const model = getActiveLLMModel(config);

  if (!apiKey.trim()) {
    throw new Error(`Por favor, insira a chave da API do ${LLM_PROVIDERS[provider].name} nas configurações.`);
  }

  let rawJsonText = "";

  if (provider === "google") {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                { text: `${systemPrompt}\n\nANALISE O DESENHO/ESBOÇO ANEXADO E CONVERTA-O PARA A ESTRUTURA PEDIDA NO CONTRATO JSON:` },
                { inlineData: { mimeType: "image/png", data: base64Image } },
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
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `Erro na chamada da API Multimodal Google Gemini (${response.status})`);
    }

    const data = await response.json();
    rawJsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  } else if (provider === "anthropic") {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 8192,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "ANALISE O DESENHO/ESBOÇO ANEXADO E CONVERTA-O PARA A ESTRUTURA PEDIDA NO CONTRATO JSON:" },
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: "image/png",
                  data: base64Image,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `Erro na chamada da API Multimodal Anthropic Claude (${response.status})`);
    }

    const data = await response.json();
    rawJsonText = data.content?.[0]?.text;
  } else if (provider === "openai") {
    const payload: any = {
      model: model,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: "ANALISE O DESENHO/ESBOÇO ANEXADO E CONVERTA-O PARA A ESTRUTURA PEDIDA NO CONTRATO JSON:" },
            {
              type: "image_url",
              image_url: {
                url: `data:image/png;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
    };

    if (model !== "o3-mini") {
      payload.temperature = 0.1;
      payload.response_format = { type: "json_object" };
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `Erro na chamada da API Multimodal OpenAI (${response.status})`);
    }

    const data = await response.json();
    rawJsonText = data.choices?.[0]?.message?.content;
  }

  if (!rawJsonText) {
    throw new Error("O modelo de visão não retornou nenhuma resposta.");
  }

  const parsedData = extractAndParseJson(rawJsonText);
  if (!parsedData.mermaidCode) {
    throw new Error("A resposta da IA não contém o campo 'mermaidCode'.");
  }

  return {
    mermaidCode: parsedData.mermaidCode,
    mermaidSequenceCode: parsedData.mermaidSequenceCode || "",
    nodes: parsedData.nodes || {},
    agentPrompt: parsedData.agentPrompt || "",
  };
}

export async function regenerateGraphSyntax(
  config: LLMConfig,
  brokenCode: string,
  errorMsg: string
): Promise<{ mermaidCode: string }> {
  const apiKey = getActiveLLMKey(config);
  const provider = config.activeProvider;
  const model = getActiveLLMModel(config);

  if (!apiKey.trim()) {
    throw new Error(`Por favor, insira a chave da API do ${LLM_PROVIDERS[provider].name} nas configurações.`);
  }

  const correctionPrompt = `O código Mermaid a seguir apresentou um erro ao ser montado na biblioteca Mermaid:\n\nERRO: ${errorMsg}\n\nCÓDIGO COM ERRO:\n${brokenCode}\n\nInstrução: Corrija a sintaxe do código Mermaid. Garanta estritamente que se houver N arestas, os índices das diretivas linkStyle devem ir APENAS de 0 a N-1.\n\nRetorne EXCLUSIVAMENTE um objeto JSON no formato:\n{\n  "mermaidCode": "graph TD\\n  ..."\n}`;

  let rawJsonText = "";

  if (provider === "google") {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: correctionPrompt }],
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
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `Erro na chamada da API do Google Gemini (${response.status})`);
    }

    const data = await response.json();
    rawJsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  } else if (provider === "anthropic") {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 4096,
        messages: [{ role: "user", content: correctionPrompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `Erro na chamada da API do Anthropic Claude (${response.status})`);
    }

    const data = await response.json();
    rawJsonText = data.content?.[0]?.text;
  } else if (provider === "openai") {
    const payload: any = {
      model: model,
      messages: [{ role: "user", content: correctionPrompt }],
    };

    if (model !== "o3-mini") {
      payload.temperature = 0.1;
      payload.response_format = { type: "json_object" };
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `Erro na chamada da API da OpenAI (${response.status})`);
    }

    const data = await response.json();
    rawJsonText = data.choices?.[0]?.message?.content;
  }

  if (!rawJsonText) {
    throw new Error("O modelo não retornou nenhuma resposta.");
  }

  const parsedData = extractAndParseJson(rawJsonText);
  if (!parsedData.mermaidCode) {
    throw new Error("A resposta da IA não contém o campo 'mermaidCode'.");
  }

  return { mermaidCode: parsedData.mermaidCode };
}
