'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  Paperclip, 
  Upload, 
  File, 
  Image, 
  FileText, 
  Archive, 
  Video, 
  Music,
  X, 
  Download, 
  Eye,
  Search,
  Folder,
  Cloud,
  HardDrive,
  GoogleDrive,
  Dropbox
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProviderIcon } from '@/components/ui/provider-icons';
import { FileAttachment, CloudFile } from '@/types/ai-providers';

interface EnhancedFileAttachmentProps {
  attachments: FileAttachment[];
  onAttachmentsChange: (attachments: FileAttachment[]) => void;
  onCloudFileSelect?: (file: CloudFile) => void;
  maxFileSize?: number; // in MB
  allowedTypes?: string[];
  className?: string;
}

export function EnhancedFileAttachment({
  attachments,
  onAttachmentsChange,
  onCloudFileSelect,
  maxFileSize = 50,
  allowedTypes = ['*'],
  className
}: EnhancedFileAttachmentProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [cloudFiles, setCloudFiles] = useState<CloudFile[]>([]);
  const [currentPath, setCurrentPath] = useState('/');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'local' | 'drive' | 'onedrive' | 'dropbox'>('local');

  const getFileIcon = (type: string, name: string) => {
    const extension = name.split('.').pop()?.toLowerCase();
    
    if (type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '')) {
      return <Image className="h-5 w-5 text-blue-500" />;
    }
    if (type.startsWith('video/') || ['mp4', 'avi', 'mov', 'wmv', 'flv'].includes(extension || '')) {
      return <Video className="h-5 w-5 text-purple-500" />;
    }
    if (type.startsWith('audio/') || ['mp3', 'wav', 'flac', 'm4a', 'ogg'].includes(extension || '')) {
      return <Music className="h-5 w-5 text-green-500" />;
    }
    if (['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(extension || '')) {
      return <FileText className="h-5 w-5 text-red-500" />;
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension || '')) {
      return <Archive className="h-5 w-5 text-orange-500" />;
    }
    return <File className="h-5 w-5 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size exceeds ${maxFileSize}MB limit`;
    }
    
    if (allowedTypes.length > 0 && !allowedTypes.includes('*')) {
      const fileType = file.type;
      const extension = file.name.split('.').pop()?.toLowerCase();
      const isAllowed = allowedTypes.some(type => 
        fileType.includes(type) || type === extension
      );
      
      if (!isAllowed) {
        return `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`;
      }
    }
    
    return null;
  };

  const handleFileSelect = useCallback(async (files: FileList) => {
    const newAttachments: FileAttachment[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validation = validateFile(file);
      
      if (validation) {
        console.error(`File ${file.name}: ${validation}`);
        continue;
      }

      const fileId = `file-${Date.now()}-${i}`;
      
      // Create file attachment
      const attachment: FileAttachment = {
        id: fileId,
        name: file.name,
        type: file.type,
        size: file.size,
        url: URL.createObjectURL(file),
        source: 'local',
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
      };

      newAttachments.push(attachment);

      // Simulate upload progress
      setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));
      
      // Simulate upload
      const uploadInterval = setInterval(() => {
        setUploadProgress(prev => {
          const currentProgress = prev[fileId] || 0;
          const newProgress = Math.min(currentProgress + Math.random() * 30, 100);
          
          if (newProgress >= 100) {
            clearInterval(uploadInterval);
            setTimeout(() => {
              setUploadProgress(prev => {
                const { [fileId]: _, ...rest } = prev;
                return rest;
              });
            }, 1000);
          }
          
          return { ...prev, [fileId]: newProgress };
        });
      }, 200);
    }
    
    onAttachmentsChange([...attachments, ...newAttachments]);
  }, [attachments, onAttachmentsChange, maxFileSize, allowedTypes]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  }, [handleFileSelect]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      handleFileSelect(files);
    }
  };

  const removeAttachment = (id: string) => {
    const updatedAttachments = attachments.filter(att => att.id !== id);
    onAttachmentsChange(updatedAttachments);
    
    // Clean up object URL
    const attachment = attachments.find(att => att.id === id);
    if (attachment && attachment.source === 'local') {
      URL.revokeObjectURL(attachment.url);
      if (attachment.preview) {
        URL.revokeObjectURL(attachment.preview);
      }
    }
  };

  const loadCloudFiles = async (source: 'drive' | 'onedrive' | 'dropbox', path: string = '/') => {
    // Simulate loading cloud files
    const mockFiles: CloudFile[] = [
      {
        id: '1',
        name: 'Project Documents',
        type: 'folder',
        mimeType: 'application/vnd.google-apps.folder',
        size: 0,
        modifiedTime: '2024-01-15T10:30:00Z',
        parents: ['/'],
        source,
        path: '/Project Documents',
        isShared: false,
        permissions: ['read', 'write']
      },
      {
        id: '2',
        name: 'Meeting Notes.docx',
        type: 'file',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: 245760,
        modifiedTime: '2024-01-14T15:45:00Z',
        parents: ['/'],
        source,
        path: '/Meeting Notes.docx',
        isShared: true,
        permissions: ['read'],
        webViewLink: 'https://docs.google.com/document/d/abc123',
        downloadUrl: 'https://drive.google.com/file/d/abc123/view'
      },
      {
        id: '3',
        name: 'Presentation.pptx',
        type: 'file',
        mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        size: 1024000,
        modifiedTime: '2024-01-13T09:20:00Z',
        parents: ['/'],
        source,
        path: '/Presentation.pptx',
        isShared: false,
        permissions: ['read', 'write'],
        thumbnailLink: 'https://drive.google.com/thumbnail/abc123'
      },
      {
        id: '4',
        name: 'Budget.xlsx',
        type: 'file',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: 512000,
        modifiedTime: '2024-01-12T14:10:00Z',
        parents: ['/'],
        source,
        path: '/Budget.xlsx',
        isShared: true,
        permissions: ['read'],
        webViewLink: 'https://docs.google.com/spreadsheets/d/def456'
      }
    ];
    
    setCloudFiles(mockFiles);
  };

  const handleCloudFileSelect = (file: CloudFile) => {
    if (file.type === 'folder') {
      setCurrentPath(file.path);
      loadCloudFiles(file.source, file.path);
      return;
    }

    // Convert cloud file to attachment
    const attachment: FileAttachment = {
      id: `cloud-${file.id}`,
      name: file.name,
      type: file.mimeType,
      size: file.size,
      url: file.webViewLink || file.downloadUrl || '',
      source: file.source,
      sourceId: file.id,
      preview: file.thumbnailLink
    };

    onAttachmentsChange([...attachments, attachment]);
    onCloudFileSelect?.(file);
  };

  const handleTabChange = (tab: 'local' | 'drive' | 'onedrive' | 'dropbox') => {
    setActiveTab(tab);
    if (tab !== 'local') {
      loadCloudFiles(tab);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileInputChange}
        className="hidden"
        accept={allowedTypes.includes('*') ? undefined : allowedTypes.join(',')}
      />

      {/* Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
          isDragging 
            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20" 
            : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
        )}
      >
        <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          Drag & drop files here, or click to browse
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
          Supports images, documents, archives, videos, and more (max {maxFileSize}MB)
        </p>
        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="outline"
          size="sm"
        >
          <Paperclip className="h-4 w-4 mr-2" />
          Choose Files
        </Button>
      </div>

      {/* Cloud Storage Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
        <button
          onClick={() => handleTabChange('local')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
            activeTab === 'local'
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          )}
        >
          <HardDrive className="h-4 w-4" />
          Local
        </button>
        <button
          onClick={() => handleTabChange('drive')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
            activeTab === 'drive'
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          )}
        >
          <ProviderIcon provider="google-drive" size="sm" />
          Drive
        </button>
        <button
          onClick={() => handleTabChange('onedrive')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
            activeTab === 'onedrive'
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          )}
        >
          <ProviderIcon provider="onedrive" size="sm" />
          OneDrive
        </button>
        <button
          onClick={() => handleTabChange('dropbox')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
            activeTab === 'dropbox'
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          )}
        >
          <ProviderIcon provider="dropbox" size="sm" />
          Dropbox
        </button>
      </div>

      {/* Cloud File Browser */}
      {activeTab !== 'local' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {activeTab === 'drive' && 'Google Drive'}
                {activeTab === 'onedrive' && 'OneDrive'}
                {activeTab === 'dropbox' && 'Dropbox'}
              </CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-48"
                  />
                </div>
              </div>
            </div>
            <CardDescription>
              Current path: {currentPath}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {cloudFiles
                  .filter(file => 
                    searchQuery === '' || 
                    file.name.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((file) => (
                    <div
                      key={file.id}
                      onClick={() => handleCloudFileSelect(file)}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                    >
                      {file.type === 'folder' ? (
                        <Folder className="h-5 w-5 text-blue-500" />
                      ) : (
                        getFileIcon(file.mimeType, file.name)
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {file.name}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <span>{new Date(file.modifiedTime).toLocaleDateString()}</span>
                          {file.type === 'file' && (
                            <>
                              <span>•</span>
                              <span>{formatFileSize(file.size)}</span>
                            </>
                          )}
                          {file.isShared && (
                            <>
                              <span>•</span>
                              <Badge variant="secondary" className="text-xs">Shared</Badge>
                            </>
                          )}
                        </div>
                      </div>

                      {file.type === 'file' && (
                        <div className="flex items-center gap-1">
                          {file.webViewLink && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(file.webViewLink, '_blank');
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          {file.downloadUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(file.downloadUrl, '_blank');
                              }}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Attached Files */}
      {attachments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Attached Files ({attachments.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  {getFileIcon(attachment.type, attachment.name)}
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {attachment.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>{formatFileSize(attachment.size)}</span>
                      <span>•</span>
                      <Badge variant="outline" className="text-xs">
                        {attachment.source}
                      </Badge>
                    </div>
                    
                    {/* Upload Progress */}
                    {uploadProgress[attachment.id] !== undefined && (
                      <div className="mt-2">
                        <Progress value={uploadProgress[attachment.id]} className="h-1" />
                        <p className="text-xs text-gray-500 mt-1">
                          Uploading... {Math.round(uploadProgress[attachment.id])}%
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {attachment.preview && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(attachment.preview, '_blank')}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAttachment(attachment.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}