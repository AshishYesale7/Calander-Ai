'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Upload, 
  Cloud, 
  HardDrive, 
  File, 
  Image, 
  FileText, 
  Video,
  Music,
  Archive,
  Search,
  Folder,
  FolderOpen,
  X,
  Download,
  Eye
} from 'lucide-react';
import { FileAttachment, CloudFile } from '@/types/ai-providers';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface FileAttachmentPanelProps {
  onAttachFile: (file: FileAttachment) => void;
  attachments: FileAttachment[];
  onRemoveAttachment: (fileId: string) => void;
}

export function FileAttachmentPanel({ 
  onAttachFile, 
  attachments, 
  onRemoveAttachment 
}: FileAttachmentPanelProps) {
  const [activeTab, setActiveTab] = useState<'local' | 'drive' | 'onedrive'>('local');
  const [searchQuery, setSearchQuery] = useState('');
  const [cloudFiles, setCloudFiles] = useState<CloudFile[]>([]);
  const [currentPath, setCurrentPath] = useState('/');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLocalFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const attachment: FileAttachment = {
        id: `local-${Date.now()}-${Math.random()}`,
        name: file.name,
        type: file.type,
        size: file.size,
        url: URL.createObjectURL(file),
        source: 'local',
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
      };
      
      onAttachFile(attachment);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const loadGoogleDriveFiles = async (path: string = '/') => {
    setIsLoading(true);
    try {
      // Mock Google Drive API call
      // In production, this would call the actual Google Drive API
      const mockFiles: CloudFile[] = [
        {
          id: 'folder-1',
          name: 'Documents',
          type: 'folder',
          mimeType: 'application/vnd.google-apps.folder',
          size: 0,
          modifiedTime: new Date().toISOString(),
          parents: ['/'],
          source: 'google-drive',
          path: '/Documents',
          isShared: false,
          permissions: ['read', 'write']
        },
        {
          id: 'file-1',
          name: 'Project Proposal.pdf',
          type: 'file',
          mimeType: 'application/pdf',
          size: 2048576,
          modifiedTime: new Date().toISOString(),
          parents: ['/'],
          source: 'google-drive',
          path: '/Project Proposal.pdf',
          isShared: true,
          permissions: ['read'],
          webViewLink: 'https://drive.google.com/file/d/example/view',
          downloadUrl: 'https://drive.google.com/file/d/example/export'
        },
        {
          id: 'file-2',
          name: 'Meeting Notes.docx',
          type: 'file',
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          size: 1024000,
          modifiedTime: new Date().toISOString(),
          parents: ['/'],
          source: 'google-drive',
          path: '/Meeting Notes.docx',
          isShared: false,
          permissions: ['read', 'write']
        }
      ];
      
      setCloudFiles(mockFiles);
      setCurrentPath(path);
    } catch (error) {
      console.error('Failed to load Google Drive files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadOneDriveFiles = async (path: string = '/') => {
    setIsLoading(true);
    try {
      // Mock OneDrive API call
      const mockFiles: CloudFile[] = [
        {
          id: 'onedrive-folder-1',
          name: 'Work Files',
          type: 'folder',
          mimeType: 'application/vnd.microsoft.folder',
          size: 0,
          modifiedTime: new Date().toISOString(),
          parents: ['/'],
          source: 'onedrive',
          path: '/Work Files',
          isShared: false,
          permissions: ['read', 'write']
        },
        {
          id: 'onedrive-file-1',
          name: 'Presentation.pptx',
          type: 'file',
          mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          size: 5120000,
          modifiedTime: new Date().toISOString(),
          parents: ['/'],
          source: 'onedrive',
          path: '/Presentation.pptx',
          isShared: true,
          permissions: ['read']
        }
      ];
      
      setCloudFiles(mockFiles);
      setCurrentPath(path);
    } catch (error) {
      console.error('Failed to load OneDrive files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const attachCloudFile = (cloudFile: CloudFile) => {
    const attachment: FileAttachment = {
      id: `cloud-${cloudFile.id}`,
      name: cloudFile.name,
      type: cloudFile.mimeType,
      size: cloudFile.size,
      url: cloudFile.downloadUrl || cloudFile.webViewLink || '',
      source: cloudFile.source,
      sourceId: cloudFile.id,
      preview: cloudFile.thumbnailLink
    };
    
    onAttachFile(attachment);
  };

  const getFileIcon = (mimeType: string, isFolder: boolean = false) => {
    if (isFolder) return <Folder className="h-4 w-4" />;
    
    if (mimeType.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (mimeType.startsWith('video/')) return <Video className="h-4 w-4" />;
    if (mimeType.startsWith('audio/')) return <Music className="h-4 w-4" />;
    if (mimeType.includes('pdf') || mimeType.includes('document')) return <FileText className="h-4 w-4" />;
    if (mimeType.includes('zip') || mimeType.includes('archive')) return <Archive className="h-4 w-4" />;
    
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredFiles = cloudFiles.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full h-full flex flex-col">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="flex-1">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="local" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Local
          </TabsTrigger>
          <TabsTrigger value="drive" className="flex items-center gap-2">
            <Cloud className="h-4 w-4" />
            Drive
          </TabsTrigger>
          <TabsTrigger value="onedrive" className="flex items-center gap-2">
            <HardDrive className="h-4 w-4" />
            OneDrive
          </TabsTrigger>
        </TabsList>

        <TabsContent value="local" className="flex-1 mt-4">
          <div className="space-y-4">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
              <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-medium mb-2">Upload Files</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Drag and drop files here or click to browse
              </p>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                Choose Files
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleLocalFileUpload}
                accept="*/*"
              />
            </div>

            {/* Current Attachments */}
            {attachments.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Attached Files</h4>
                <ScrollArea className="h-32">
                  <div className="space-y-2">
                    {attachments.map(attachment => (
                      <div key={attachment.id} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                        {getFileIcon(attachment.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{attachment.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(attachment.size)} • {attachment.source}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => onRemoveAttachment(attachment.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="drive" className="flex-1 mt-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search Google Drive..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadGoogleDriveFiles(currentPath)}
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : 'Refresh'}
              </Button>
            </div>

            <ScrollArea className="h-64">
              <div className="space-y-1">
                {filteredFiles.map(file => (
                  <Card key={file.id} className="p-0">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        {getFileIcon(file.mimeType, file.type === 'folder')}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{file.type === 'folder' ? 'Folder' : formatFileSize(file.size)}</span>
                            {file.isShared && <Badge variant="outline" className="text-xs">Shared</Badge>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {file.webViewLink && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => window.open(file.webViewLink, '_blank')}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          )}
                          {file.type === 'file' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => attachCloudFile(file)}
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {filteredFiles.length === 0 && !isLoading && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Cloud className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">No files found</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => loadGoogleDriveFiles()}
                    >
                      Load Google Drive Files
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </TabsContent>

        <TabsContent value="onedrive" className="flex-1 mt-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search OneDrive..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadOneDriveFiles(currentPath)}
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : 'Refresh'}
              </Button>
            </div>

            <ScrollArea className="h-64">
              <div className="space-y-1">
                {filteredFiles.map(file => (
                  <Card key={file.id} className="p-0">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        {getFileIcon(file.mimeType, file.type === 'folder')}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{file.type === 'folder' ? 'Folder' : formatFileSize(file.size)}</span>
                            {file.isShared && <Badge variant="outline" className="text-xs">Shared</Badge>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {file.type === 'file' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => attachCloudFile(file)}
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {filteredFiles.length === 0 && !isLoading && (
                  <div className="text-center py-8 text-muted-foreground">
                    <HardDrive className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">No files found</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => loadOneDriveFiles()}
                    >
                      Load OneDrive Files
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}