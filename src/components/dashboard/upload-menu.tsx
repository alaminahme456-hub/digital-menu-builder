'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Upload, FileImage, FileText, Trash2, Eye, RefreshCw, CloudUpload, Image as ImageIcon, X, CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useAuthStore } from '@/lib/store';
import { useAppStore } from '@/lib/store';
import type { MenuUpload } from '@/lib/types';
import { formatFileSize } from '@/lib/auth';
import { toast } from 'sonner';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const ACCEPTED_EXTENSIONS = '.jpg,.jpeg,.png,.webp,.pdf';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function UploadMenu() {
  const { token } = useAuthStore();
  const { currentBusiness } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploads, setUploads] = useState<MenuUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [previewType, setPreviewType] = useState<string>('');
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchUploads = useCallback(async () => {
    if (!currentBusiness?.id || !token) return;
    try {
      const res = await fetch(`/api/menu/upload?businessId=${currentBusiness.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setUploads(data.uploads);
      }
    } catch {
      toast.error('Failed to load uploads');
    } finally {
      setLoading(false);
    }
  }, [currentBusiness?.id, token]);

  useEffect(() => {
    fetchUploads();
  }, [fetchUploads]);

  const simulateProgress = () => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5;
      if (progress >= 95) {
        progress = 95;
        clearInterval(interval);
      }
      setUploadProgress(Math.min(progress, 95));
    }, 200);
    return interval;
  };

  const uploadFile = async (file: File, replaceId?: string) => {
    if (!currentBusiness?.id || !token) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error('Invalid file type. Please upload JPG, PNG, WEBP, or PDF.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error('File too large. Maximum size is 10MB.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    const interval = simulateProgress();

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('businessId', currentBusiness.id);

      const res = await fetch('/api/menu/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      clearInterval(interval);
      setUploadProgress(100);

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Upload failed');
        return;
      }

      if (replaceId) {
        // Delete old file first
        await fetch(`/api/menu/upload?id=${replaceId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        setUploads(prev => prev.filter(u => u.id !== replaceId));
      }

      setUploads(prev => [data.upload, ...prev]);
      toast.success(replaceId ? 'Menu replaced successfully!' : 'Menu uploaded successfully!');
    } catch {
      clearInterval(interval);
      toast.error('Upload failed. Please try again.');
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
        setReplacingId(null);
      }, 500);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }, [currentBusiness?.id, token]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = '';
  }, [currentBusiness?.id, token]);

  const handleDelete = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/menu/upload?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setUploads(prev => prev.filter(u => u.id !== id));
        toast.success('Upload deleted successfully');
      } else {
        toast.error('Failed to delete upload');
      }
    } catch {
      toast.error('Failed to delete upload');
    }
  };

  const handleTogglePublish = async (upload: MenuUpload) => {
    if (!token || !currentBusiness?.id) return;

    if (!upload.published) {
      // Unpublish all others first
      const otherPublished = uploads.find(u => u.published && u.id !== upload.id);
      if (otherPublished) {
        toast.info('Unpublishing current menu...');
      }
    }

    try {
      const res = await fetch('/api/menu/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: upload.id, businessId: currentBusiness.id, published: !upload.published }),
      });
      const data = await res.json();

      if (data.upload) {
        setUploads(prev =>
          prev.map(u => ({
            ...u,
            published: u.id === upload.id ? !upload.published : false,
          }))
        );
        toast.success(upload.published ? 'Menu unpublished' : 'Menu published!');
      }
    } catch {
      toast.error('Failed to update publish status');
    }
  };

  const handleReplace = (upload: MenuUpload) => {
    setReplacingId(upload.id);
    fileInputRef.current?.click();
  };

  const handlePreview = (upload: MenuUpload) => {
    setPreviewUrl(upload.url);
    setPreviewType(upload.fileType);
    setPreviewOpen(true);
  };

  const getFileIcon = (fileType: string) => {
    if (fileType === 'application/pdf') return <FileText className="h-5 w-5 text-red-500" />;
    return <FileImage className="h-5 w-5 text-emerald-500" />;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!currentBusiness) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Upload className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Please select a business first.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CloudUpload className="h-5 w-5 text-emerald-500" />
            Upload Menu
          </CardTitle>
          <CardDescription>
            Upload your menu as an image or PDF file. Drag and drop or click to browse.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer ${
              dragOver
                ? 'border-emerald-500 bg-ivory dark:bg-emerald-950/20'
                : 'border-muted-foreground/25 hover:border-emerald-400 hover:bg-muted/50'
            } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setDragOver(false);
            }}
            onDrop={handleDrop}
            onClick={() => !uploading && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_EXTENSIONS}
              onChange={handleFileSelect}
              className="hidden"
            />

            {uploading ? (
              <div className="space-y-4">
                <Loader2 className="h-10 w-10 text-emerald-500 mx-auto animate-spin" />
                <p className="text-sm font-medium text-muted-foreground">
                  Uploading{replacingId ? ' replacement' : ''}...
                </p>
                <Progress value={uploadProgress} className="max-w-xs mx-auto" />
                <p className="text-xs text-muted-foreground">{Math.round(uploadProgress)}%</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="mx-auto w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <Upload className="h-7 w-7 text-charcoal dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {dragOver ? 'Drop your file here' : 'Drag and drop your menu file here'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    or <span className="text-charcoal dark:text-emerald-400 font-medium underline">browse files</span>
                  </p>
                </div>
                <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <ImageIcon className="h-3.5 w-3.5" />
                    <span>JPG, PNG, WEBP, PDF</span>
                  </div>
                  <span className="text-muted-foreground/40">•</span>
                  <span>Max 10MB</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Files List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Uploaded Menus</CardTitle>
          <CardDescription>
            {uploads.length} file{uploads.length !== 1 ? 's' : ''} uploaded
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : uploads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <FileImage className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">No menus uploaded yet</p>
              <p className="text-xs text-muted-foreground mt-1">Upload your first menu file above</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {uploads.map((upload) => (
                <div
                  key={upload.id}
                  className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                    upload.published
                      ? 'bg-gold/15 bg-ivory/50 dark:border-emerald-800 dark:bg-emerald-950/20'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  {/* Thumbnail / File Icon */}
                  <div className="flex-shrink-0">
                    {upload.fileType.startsWith('image/') ? (
                      <div
                        className="h-14 w-14 rounded-md overflow-hidden bg-muted flex items-center justify-center cursor-pointer"
                        onClick={() => handlePreview(upload)}
                      >
                        <img
                          src={upload.url}
                          alt={upload.fileName}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-14 w-14 rounded-md bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
                        <FileText className="h-7 w-7 text-red-500" />
                      </div>
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{upload.fileName}</p>
                      {upload.published ? (
                        <Badge className="bg-emerald-100 text-gold-dark dark:bg-emerald-900/40 dark:text-emerald-400 border-0 shrink-0">
                          <CheckCircle2 className="h-3 w-3 mr-0.5" />
                          Published
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="shrink-0">
                          <Circle className="h-3 w-3 mr-0.5" />
                          Draft
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">{getFileIcon(upload.fileType)} {upload.fileType.split('/')[1]?.toUpperCase()}</span>
                      <span>{formatFileSize(upload.fileSize)}</span>
                      <span>{formatDate(upload.createdAt)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handlePreview(upload)}
                      title="Preview"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleReplace(upload)}
                      title="Replace"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={upload.published ? 'outline' : 'default'}
                      size="sm"
                      className={`h-8 text-xs ${!upload.published ? 'bg-charcoal hover:bg-charcoal-light text-white' : ''}`}
                      onClick={() => handleTogglePublish(upload)}
                    >
                      {upload.published ? 'Unpublish' : 'Publish'}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Menu Upload</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete &quot;{upload.fileName}&quot;? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(upload.id)}
                            className="bg-destructive text-white hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl w-full p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-0">
            <div className="flex items-center justify-between">
              <DialogTitle>Menu Preview</DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setPreviewOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          <div className="p-6 pt-2">
            {previewType === 'application/pdf' ? (
              <div className="rounded-lg border bg-muted/30 flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <FileText className="h-12 w-12 text-red-500 mx-auto mb-3" />
                  <p className="text-sm font-medium">PDF Preview</p>
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-charcoal hover:underline mt-1 inline-block"
                  >
                    Open PDF in new tab
                  </a>
                </div>
              </div>
            ) : (
              <div className="rounded-lg overflow-hidden border bg-muted/30 flex items-center justify-center min-h-[400px]">
                <img
                  src={previewUrl}
                  alt="Menu preview"
                  className="max-w-full max-h-[70vh] object-contain"
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
