import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
  accept?: string;
  maxSize?: number; // in bytes
}

export default function FileUpload({ onFileSelect, selectedFile, accept = "*/*", maxSize = 10 * 1024 * 1024 }: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string>('');

  const validateFile = (file: File): boolean => {
    setError('');

    if (maxSize && file.size > maxSize) {
      setError(`File size must be less than ${Math.round(maxSize / (1024 * 1024))}MB`);
      return false;
    }

    if (accept !== "*/*") {
      const acceptedTypes = accept.split(',').map(type => type.trim());
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      const mimeType = file.type;

      const isValidType = acceptedTypes.some(type => {
        if (type.startsWith('.')) {
          return fileExtension === type.toLowerCase();
        }
        return mimeType.match(type.replace('*', '.*'));
      });

      if (!isValidType) {
        setError(`File type not supported. Accepted types: ${accept}`);
        return false;
      }
    }

    return true;
  };

  const handleFileSelect = (file: File) => {
    if (validateFile(file)) {
      onFileSelect(file);
    } else {
      onFileSelect(null);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  return (
    <div className="w-full">
      <Card
        className={`border-2 border-dashed transition-all duration-300 cursor-pointer ${
          dragOver
            ? 'border-nexus-green bg-nexus-green bg-opacity-10'
            : selectedFile
            ? 'border-nexus-green bg-nexus-green bg-opacity-5'
            : 'border-gray-600 hover:border-nexus-green glass-effect'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="p-8 text-center">
          {selectedFile ? (
            <div>
              <i className="fas fa-file-pdf text-4xl text-nexus-green mb-4"></i>
              <h3 className="text-lg font-semibold mb-2">{selectedFile.name}</h3>
              <p className="text-gray-400 mb-4">
                Size: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
              <Button
                onClick={() => onFileSelect(null)}
                variant="outline"
                className="border-gray-600 hover:border-red-500 hover:text-red-500"
              >
                Remove File
              </Button>
            </div>
          ) : (
            <div>
              <i className="fas fa-cloud-upload-alt text-4xl text-nexus-green mb-4"></i>
              <h3 className="text-lg font-semibold mb-2">Drag and drop your file here</h3>
              <p className="text-gray-400 mb-4">or click to browse files</p>
              <input
                type="file"
                accept={accept}
                onChange={handleFileInputChange}
                className="hidden"
                id="file-input"
              />
              <label htmlFor="file-input">
                <Button className="bg-nexus-green text-black hover:bg-nexus-gold">
                  Choose File
                </Button>
              </label>
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <div className="mt-2 text-red-500 text-sm">
          <i className="fas fa-exclamation-triangle mr-2"></i>
          {error}
        </div>
      )}
    </div>
  );
}
