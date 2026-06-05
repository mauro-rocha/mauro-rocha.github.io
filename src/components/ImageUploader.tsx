// ImageUploader.tsx
// Uploads images to Vercel Blob storage (client-side direct upload) and
// returns the resulting public URL via onChange. Falls back to letting the
// user paste a URL manually.
import { upload } from "@vercel/blob/client";
import { ImageIcon, Loader, UploadCloud, X } from "lucide-react";
import React, { useRef, useState } from "react";

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export const ImageUploader: React.FC<ImageUploaderProps> = ({ value, onChange, label }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("Selecione um arquivo de imagem.");
      return;
    }
    if (file.size > MAX_SIZE) {
      setError("Imagem muito grande (máx. 10 MB).");
      return;
    }

    setUploading(true);
    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
      });
      onChange(blob.url);
    } catch (err) {
      setError((err as Error).message || "Falha no upload.");
    } finally {
      setUploading(false);
    }
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
    // allow re-selecting the same file
    e.target.value = "";
  };

  return (
    <div>
      {label && (
        <label className="text-xs text-gray-500 mb-1 block uppercase tracking-wider">{label}</label>
      )}

      <div className="flex items-center gap-4">
        {/* Preview */}
        <div className="w-20 h-20 shrink-0 bg-background border border-white/20 rounded overflow-hidden flex items-center justify-center">
          {value ? (
            <img src={value} alt="preview" className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="w-6 h-6 text-gray-600" />
          )}
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-4 py-2 rounded text-white text-xs font-bold uppercase tracking-wider transition-colors"
            >
              {uploading ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <UploadCloud className="w-4 h-4" />
              )}
              {uploading ? "Enviando..." : "Upload"}
            </button>

            {value && (
              <button
                type="button"
                onClick={() => onChange("")}
                disabled={uploading}
                className="flex items-center gap-1 border border-white/20 text-gray-400 hover:text-white px-3 py-2 rounded text-xs uppercase tracking-wider transition-colors"
              >
                <X className="w-4 h-4" /> Remover
              </button>
            )}
          </div>

          {/* URL fallback / display */}
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Cole uma URL ou faça upload"
            className="w-full bg-background border border-white/20 p-2 rounded text-white text-xs font-mono focus:border-blue-500 transition-colors"
          />

          {error && <p className="text-red-500 text-xs">{error}</p>}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onInputChange}
        />
      </div>
    </div>
  );
};
