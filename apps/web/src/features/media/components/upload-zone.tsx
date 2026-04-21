import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils/cn';
import { UploadCloud } from 'lucide-react';
import { type DragEvent, useRef, useState } from 'react';

interface UploadZoneProps {
  isUploading: boolean;
  onFileSelect: (file: File) => void;
}

export function UploadZone({ isUploading, onFileSelect }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDrag(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(e.type === 'dragenter' || e.type === 'dragover');
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFileSelect(file);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
    e.target.value = '';
  }

  return (
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={cn(
        'w-full p-12 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all',
        isDragging
          ? 'border-blue-500 bg-blue-500/10'
          : 'border-neutral-700 bg-neutral-900/50 hover:bg-neutral-900 hover:border-neutral-600',
      )}
    >
      <UploadCloud
        className={cn('w-12 h-12 mb-4', isDragging ? 'text-blue-400' : 'text-neutral-500')}
      />
      <h3 className="text-lg font-semibold text-white mb-1">Upload Media</h3>
      <p className="text-sm text-neutral-400 mb-5">Drag and drop images or videos here</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleInputChange}
        className="hidden"
      />
      <Button
        type="button"
        variant="outline"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
      >
        {isUploading ? 'Uploading…' : 'Select File'}
      </Button>
    </div>
  );
}
