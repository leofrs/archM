export function ErrorModal({ isOpen, errorText, onClose }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 transition-opacity duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-[650px] rounded-xl shadow-2xl overflow-hidden flex flex-col transform transition-transform duration-200 translate-y-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center bg-red-50 text-red-600">
          <h3 className="m-0 text-sm font-bold flex items-center gap-2">
            🚨 Ocorreu um Erro
          </h3>
          <button
            className="bg-transparent border-none text-2xl cursor-pointer text-red-600 leading-none opacity-70 hover:opacity-100 transition-opacity"
            onClick={onClose}
          >
            &times;
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto max-h-[70vh]">
          <p className="text-xs text-slate-800 mb-3 leading-relaxed">
            Ocorreu um problema ao processar a requisição ou ao renderizar o
            diagrama Mermaid. Abaixo estão os detalhes completos:
          </p>
          <pre className="bg-slate-900 border border-slate-800 p-4 rounded-lg font-mono text-xs text-slate-200 whitespace-pre-wrap break-all">
            {errorText}
          </pre>
        </div>
      </div>
    </div>
  );
}
