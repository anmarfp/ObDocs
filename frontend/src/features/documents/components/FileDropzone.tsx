import React, { useRef, useState, DragEvent, KeyboardEvent } from 'react';
import { UploadCloud, FileText, Image as ImageIcon, X, AlertCircle } from 'lucide-react';

interface FileDropzoneProps {
  selectedFile: File | null;
  onFileSelect: (file: File | null) => void;
  uploadProgress?: number | null;
  existingFileName?: string | null;
  existingFileSize?: number | null;
  disabled?: boolean;
}

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
];

const ALLOWED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export const formatFileSize = (bytes?: number | null): string => {
  if (!bytes || isNaN(bytes)) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  selectedFile,
  onFileSelect,
  uploadProgress,
  existingFileName,
  existingFileSize,
  disabled = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    setErrorMessage(null);

    // Validate size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage(`O arquivo excede o limite máximo permitido de 10 MB (${formatFileSize(file.size)}).`);
      return false;
    }

    // Validate MIME type and extension
    const extension = `.${file.name.split('.').pop()?.toLowerCase()}`;
    const isValidMime = ALLOWED_MIME_TYPES.includes(file.type);
    const isValidExt = ALLOWED_EXTENSIONS.includes(extension);

    if (!isValidMime && !isValidExt) {
      setErrorMessage('Formato não suportado. Envie apenas arquivos PDF, PNG, JPG ou JPEG.');
      return false;
    }

    return true;
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (validateFile(file)) {
      onFileSelect(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (disabled) return;
    handleFiles(e.dataTransfer.files);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  const isPdf = selectedFile
    ? selectedFile.type === 'application/pdf' || selectedFile.name.toLowerCase().endsWith('.pdf')
    : existingFileName?.toLowerCase().endsWith('.pdf');

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          handleFiles(e.target.files);
          // reset input so same file can be chosen again if needed
          e.target.value = '';
        }}
        aria-label="Upload de anexo do documento"
      />

      {/* Selected new file or existing file view */}
      {selectedFile || (existingFileName && !errorMessage) ? (
        <div className="border border-slate-200 bg-slate-50/80 rounded-xl p-3.5 transition">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-navy-100/60 text-navy-800 flex items-center justify-center flex-shrink-0">
                {isPdf ? <FileText className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">
                  {selectedFile ? selectedFile.name : existingFileName}
                </p>
                <div className="flex items-center space-x-2 text-xs text-slate-500 mt-0.5">
                  <span>{formatFileSize(selectedFile ? selectedFile.size : existingFileSize)}</span>
                  {selectedFile && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                      Novo Arquivo
                    </span>
                  )}
                  {!selectedFile && existingFileName && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-200 text-slate-700">
                      Anexo Atual
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 flex-shrink-0">
              <button
                type="button"
                disabled={disabled}
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-semibold text-navy-700 hover:text-navy-900 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg shadow-sm hover:bg-slate-50 transition"
              >
                Substituir
              </button>
              {selectedFile && (
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onFileSelect(null)}
                  className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                  title="Remover anexo selecionado"
                  aria-label="Remover anexo selecionado"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Upload progress bar if actively uploading */}
          {uploadProgress !== undefined && uploadProgress !== null && uploadProgress > 0 && (
            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-xs text-slate-600 font-medium">
                <span>Enviando anexo...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-navy-600 h-1.5 rounded-full transition-all duration-200 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Empty dropzone */
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          onKeyDown={handleKeyDown}
          aria-label="Área de upload de documento. Clique ou arraste um arquivo PDF ou imagem até 10 MB."
          className={`relative border-2 border-dashed rounded-xl p-6 text-center transition cursor-pointer outline-none focus:ring-2 focus:ring-navy-600 focus:ring-offset-2 ${
            disabled ? 'opacity-60 cursor-not-allowed bg-slate-50 border-slate-200' : ''
          } ${
            isDragOver
              ? 'border-navy-600 bg-navy-50/60'
              : 'border-slate-300 hover:border-navy-400 bg-slate-50/50 hover:bg-slate-50'
          }`}
        >
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-navy-50 text-navy-600 flex items-center justify-center">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div className="text-sm">
              <span className="font-semibold text-navy-800 hover:underline">
                Clique para selecionar
              </span>{' '}
              <span className="text-slate-500">ou arraste o arquivo até aqui</span>
            </div>
            <p className="text-xs text-slate-400">
              PDF, PNG, JPG ou JPEG (Máximo de 10 MB)
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="flex items-center space-x-1.5 text-xs text-red-600 font-medium">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};

export default FileDropzone;
