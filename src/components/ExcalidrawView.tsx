import { useState, useImperativeHandle, forwardRef } from "react";
import { Excalidraw, exportToBlob } from "@excalidraw/excalidraw";

export interface ExcalidrawViewRef {
  analyzeDrawing: () => Promise<void>;
}

interface ExcalidrawViewProps {
  onAnalyzeDrawing: (base64Image: string) => void;
  isLoading: boolean;
}

export const ExcalidrawView = forwardRef<ExcalidrawViewRef, ExcalidrawViewProps>(
  ({ onAnalyzeDrawing }, ref) => {
    const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);

    const handleExportAndAnalyze = async () => {
      if (!excalidrawAPI) return;

      const elements = excalidrawAPI.getSceneElements();
      if (!elements || elements.length === 0) {
        alert("Por favor, desenhe algo no canvas antes de solicitar a análise da IA.");
        return;
      }

      try {
        const blob = await exportToBlob({
          elements,
          appState: {
            ...excalidrawAPI.getAppState(),
            exportBackground: true,
          },
          files: excalidrawAPI.getFiles(),
          mimeType: "image/png",
        });

        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          if (result) {
            const base64Data = result.split(",")[1];
            onAnalyzeDrawing(base64Data);
          }
        };
        reader.readAsDataURL(blob);
      } catch (err: any) {
        console.error("Erro ao exportar desenho do Excalidraw:", err);
        alert(
          "Não foi possível processar a imagem do desenho: " +
            (err.message || String(err))
        );
      }
    };

    useImperativeHandle(ref, () => ({
      analyzeDrawing: handleExportAndAnalyze,
    }));

    return (
      <div className="w-full h-full relative overflow-hidden flex flex-col">
        <div className="w-full h-full flex-1">
          <Excalidraw
            excalidrawAPI={(api) => setExcalidrawAPI(api)}
            UIOptions={{
              canvasActions: {
                changeViewBackgroundColor: true,
                clearCanvas: true,
                export: { saveFileToDisk: true },
                loadScene: true,
                saveToActiveFile: true,
                toggleTheme: true,
              },
            }}
          />
        </div>
      </div>
    );
  }
);

ExcalidrawView.displayName = "ExcalidrawView";
