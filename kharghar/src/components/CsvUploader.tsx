import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File as LucideFile, AlertCircle, X, Loader2 } from 'lucide-react';
import { api } from '../services/api';

interface CsvUploaderProps {
  onUploadSuccess: () => void;
}

const CsvUploader: React.FC<CsvUploaderProps> = ({ onUploadSuccess }) => {
  const [error, setError] = useState<string | null>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<{ processed: number; errors: number } | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setCurrentFile(file);
      setError(null);
      setResult(null);
      setIsUploading(true);

      try {
        const response = await api.transactions.upload(file);
        setResult({ processed: response.processed, errors: response.errors?.length || 0 });
        onUploadSuccess();
      } catch (err: any) {
        setError(err.message || 'Failed to upload CSV');
      } finally {
        setIsUploading(false);
      }
    }
  }, [onUploadSuccess]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    multiple: false,
    disabled: isUploading
  });

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentFile(null);
    setError(null);
    setResult(null);
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer
          ${isDragActive ? 'border-cyber-primary bg-cyber-primary/10' : 'border-cyber-primary/20 hover:border-cyber-primary/40'}
          ${error ? 'border-cyber-alert bg-cyber-alert/10' : ''}
          ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center space-y-4">
          {isUploading ? (
            <Loader2 className="w-12 h-12 text-cyber-primary animate-spin" />
          ) : (
            <Upload className={`w-12 h-12 ${error ? 'text-cyber-alert' : 'text-cyber-primary'}`} />
          )}

          {currentFile ? (
            <div className="flex items-center gap-2">
              <LucideFile className="w-6 h-6 text-cyber-primary" />
              <span className="text-cyber-primary font-semibold">{currentFile.name}</span>
              {!isUploading && (
                <button onClick={removeFile} className="text-cyber-alert hover:text-cyber-alert/80">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          ) : (
            <>
              <p className={`text-md ${error ? 'text-cyber-alert' : 'text-cyber-primary'}`}>
                {error || 'Drag & drop a CSV file or click to browse'}
              </p>
              <div className="flex gap-4">
                <button
                  type="button"
                  className="px-4 py-2 border border-cyber-primary/20 rounded-lg hover:bg-cyber-primary/10 transition"
                  disabled={isUploading}
                >
                  Browse Files
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      {error && !currentFile && (
        <div className="flex items-center gap-2 text-cyber-alert pb-2">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm">{error}</span>
        </div>
      )}
      {result && (
        <div className="text-sm text-green-400">
          Successfully processed {result.processed} transactions ({result.errors} errors).
        </div>
      )}
      <div className="text-sm text-cyber-primary/80">
        Supported formats: .csv (Max 100MB)
      </div>
    </div>
  );
};

export default CsvUploader;
