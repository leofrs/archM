import mermaid from "mermaid";

export interface FallbackInfo {
  originalError: string;
  strategyUsed: string;
  description: string;
}

/**
 * Conta a quantidade de arestas declaradas no código Mermaid
 */
export function countMermaidEdges(code: string): number {
  // Captura linhas contendo conectores de arestas
  const edgeRegex = /-->|-.->|==>|---|--\|/g;
  const matches = code.match(edgeRegex);
  return matches ? matches.length : 0;
}

/**
 * Aplica técnicas de sanitização progressiva no código Mermaid
 */
export function sanitizeMermaidCode(
  code: string,
  level: number,
): { sanitizedCode: string; description: string } {
  switch (level) {
    case 1: {
      // Nível 1: Ajustar/remover linkStyle com índices out-of-bounds (>= total de arestas)
      const totalEdges = countMermaidEdges(code);
      const lines = code.split("\n");
      const filteredLines = lines.filter((line) => {
        const match = line.trim().match(/^linkStyle\s+(\d+)/);
        if (match) {
          const index = parseInt(match[1], 10);
          return index < totalEdges;
        }
        return true;
      });
      return {
        sanitizedCode: filteredLines.join("\n"),
        description: `Limpeza de diretivas linkStyle com índice out-of-bounds (superior ao total de ${totalEdges} arestas).`,
      };
    }

    case 2: {
      // Nível 2: Remover todas as linhas de linkStyle (mantém classDef)
      const lines = code.split("\n");
      const filteredLines = lines.filter(
        (line) => !line.trim().startsWith("linkStyle "),
      );
      return {
        sanitizedCode: filteredLines.join("\n"),
        description: "Remoção de todas as diretivas de estilo de link (linkStyle).",
      };
    }

    case 3: {
      // Nível 3: Limpar tags HTML/FontAwesome em rótulos de nós e remover linkStyles
      let cleaned = code.replace(/linkStyle\s+\d+[^;\n]*;?/g, "");
      cleaned = cleaned.replace(/<i\s+class='[^']+'><\/i>\s*/g, "");
      cleaned = cleaned.replace(/<i\s+class="[^"]+"><\/i>\s*/g, "");
      return {
        sanitizedCode: cleaned,
        description: "Remoção de formatação HTML/ícones complexos dos rótulos dos nós.",
      };
    }

    case 4: {
      // Nível 4: Estrutura puramente limpa (sem classDef e sem linkStyle)
      const lines = code.split("\n");
      const filteredLines = lines.filter(
        (line) =>
          !line.trim().startsWith("classDef ") &&
          !line.trim().startsWith("linkStyle "),
      );
      return {
        sanitizedCode: filteredLines.join("\n"),
        description:
          "Simplificação para estrutura pura (remoção completa de estilos classDef e linkStyle).",
      };
    }

    default:
      return { sanitizedCode: code, description: "Código original." };
  }
}

/**
 * Tenta renderizar o diagrama com o código original; se falhar, aplica sanitização em níveis progressivos
 */
export async function renderMermaidWithFallback(
  id: string,
  codeToRender: string,
): Promise<{ svg: string; fallbackInfo: FallbackInfo | null; finalCode: string }> {
  // 1. Tentar renderizar o código original
  try {
    const { svg } = await mermaid.render(id, codeToRender);
    return { svg, fallbackInfo: null, finalCode: codeToRender };
  } catch (originalErr: any) {
    const originalErrorMsg = originalErr.message || String(originalErr);

    // Limpa contêiner de renderização residual se criado pelo Mermaid em caso de erro
    const errorSvg = document.getElementById(id);
    if (errorSvg) errorSvg.remove();
    const errorWrapper = document.getElementById(`d${id}`);
    if (errorWrapper) errorWrapper.remove();

    // 2. Tentar níveis progressivos de sanitização (1 a 4)
    for (let level = 1; level <= 4; level++) {
      const { sanitizedCode, description } = sanitizeMermaidCode(
        codeToRender,
        level,
      );

      if (sanitizedCode === codeToRender && level > 1) continue;

      try {
        const retryId = `${id}-fb${level}`;
        const { svg } = await mermaid.render(retryId, sanitizedCode);

        return {
          svg,
          finalCode: sanitizedCode,
          fallbackInfo: {
            originalError: originalErrorMsg,
            strategyUsed: `Nível ${level}`,
            description,
          },
        };
      } catch (fbErr) {
        // Limpa resíduos da tentativa que falhou
        const errElement = document.getElementById(`${id}-fb${level}`);
        if (errElement) errElement.remove();
        const errWrap = document.getElementById(`d${id}-fb${level}`);
        if (errWrap) errWrap.remove();
      }
    }

    // Se todos os níveis falharem, lança a exceção original
    throw originalErr;
  }
}
