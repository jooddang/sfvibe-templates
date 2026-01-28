'use client';

import { useState, useCallback } from 'react';

interface FileUploadProps {
  onUploadComplete?: (url: string, key: string) => void;
  accept?: string;
  maxSize?: number;
}

export function FileUpload({ onUploadComplete, accept = 'image/*', maxSize = 10 * 1024 * 1024 }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = useCallback(async (file: File) => {
    if (file.size > maxSize) {
      setError(`File size exceeds ${maxSize / 1024 / 1024}MB limit`);
      return;
    }

    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });

      if (!response.ok) throw new Error('Failed to get upload URL');

      const { url, key, publicUrl } = await response.json();

      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
      });

      await new Promise<void>((resolve, reject) => {
        xhr.onload = () => (xhr.status === 200 ? resolve() : reject(new Error('Upload failed')));
        xhr.onerror = () => reject(new Error('Upload failed'));
        xhr.open('PUT', url);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
      });

      onUploadComplete?.(publicUrl, key);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, [maxSize, onUploadComplete]);

  return (
    <div className="w-full">
      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
        <input
          type="file"
          className="hidden"
          accept={accept}
          onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
          disabled={uploading}
        />
        {uploading ? (
          <div className="text-center">
            <div className="text-sm text-gray-600">Uploading... {progress}%</div>
            <div className="w-48 h-2 bg-gray-200 rounded-full mt-2">
              <div className="h-full bg-blue-600 rounded-full" style={{ width: `${progress}%` }} />
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="text-gray-600">Click or drag to upload</div>
            <div className="text-sm text-gray-400">Max {maxSize / 1024 / 1024}MB</div>
          </div>
        )}
      </label>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
