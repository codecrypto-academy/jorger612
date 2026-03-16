"use client";

interface JsonLdPopupProps {
  json: object;
  onClose: () => void;
}

export function JsonLdPopup({ json, onClose }: JsonLdPopupProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-lg border-4 border-black bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b-2 border-black bg-gray-100 px-4 py-3">
          <h3 className="text-lg font-black text-black">JSON-LD (Open Badges)</h3>
          <button
            onClick={onClose}
            className="rounded border-2 border-black px-4 py-1 font-bold text-black hover:bg-gray-200"
          >
            Cerrar
          </button>
        </div>
        <div className="json-ld-popup-content max-h-[70vh] overflow-auto p-4 text-black">
          <pre className="whitespace-pre-wrap break-words font-mono text-sm text-black">
            {JSON.stringify(json, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
