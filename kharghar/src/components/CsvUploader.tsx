import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File as LucideFile, AlertCircle, X } from 'lucide-react';
import { generateDemoData, Transaction } from '../demoData';

interface CsvUploaderProps {
  onUpload: (transactions: Transaction[]) => void;
}

const CsvUploader: React.FC<CsvUploaderProps> = ({ onUpload }) => {
  const [error, setError] = useState<string | null>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const transactions = generateDemoData();
      onUpload(transactions);
      setCurrentFile(new File([], 'demo_data.csv'));
      setError(null);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    multiple: false,
  });

  const removeFile = () => {
    setCurrentFile(null);
    setError(null);
  };

  const handleGenerateDemo = () => {
    const transactions = generateDemoData();
    onUpload(transactions);
    setError(null);
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer
          ${isDragActive ? 'border-cyber-primary bg-cyber-primary/10' : 'border-cyber-primary/20 hover:border-cyber-primary/40'}
          ${error ? 'border-cyber-alert bg-cyber-alert/10' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center space-y-4">
          <Upload className={`w-12 h-12 ${error ? 'text-cyber-alert' : 'text-cyber-primary'}`} />
          {currentFile ? (
            <div className="flex items-center gap-2">
              <LucideFile className="w-6 h-6 text-cyber-primary" />
              <span className="text-cyber-primary font-semibold">{currentFile.name}</span>
              <button onClick={removeFile} className="text-cyber-alert hover:text-cyber-alert/80">
                <X className="w-5 h-5" />
              </button>
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
                >
                  Browse Files
                </button>
                <button
                  type="button"
                  onClick={handleGenerateDemo}
                  className="px-4 py-2 bg-cyber-primary text-cyber-dark rounded-lg hover:bg-cyber-primary/90 transition"
                >
                  Generate Data
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      {error && !currentFile && (
        <div className="flex items-center gap-2 text-cyber-alert">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm">{error}</span>
        </div>
      )}
      <div className="text-sm text-cyber-primary/80">
        Supported formats: .csv (Max 100MB)
      </div>
    </div>
  );
};

export default CsvUploader;
