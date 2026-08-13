'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import QRCode from 'qrcode';
import {
  Download,
  Copy,
  Share2,
  Printer,
  Check,
  QrCode,
  ExternalLink,
  Image,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useAuthStore, useAppStore } from '@/lib/store';
import type { Business } from '@/lib/types';
import { toast } from 'sonner';

function getPublicUrl(slug: string) {
  return `https://menuqr.app/menu/${slug}`;
}

export default function QRCodePanel() {
  const { token } = useAuthStore();
  const { currentBusiness } = useAppStore();
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const slug = currentBusiness?.slug;
  const menuUrl = slug ? getPublicUrl(slug) : '';

  // Fetch full business data
  useEffect(() => {
    if (!currentBusiness?.id || !token) return;
    async function fetchBusiness() {
      try {
        const res = await fetch(`/api/businesses/${currentBusiness.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setBusiness(data.business);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchBusiness();
  }, [currentBusiness?.id, token]);

  // Generate QR code
  useEffect(() => {
    if (!menuUrl) return;
    QRCode.toDataURL(menuUrl, {
      width: 512,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    })
      .then((url) => setQrDataUrl(url))
      .catch(() => {});
  }, [menuUrl]);

  const handleDownloadPNG = useCallback(() => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.download = `${business?.name || 'menu'}-qr-code.png`;
    link.href = qrDataUrl;
    link.click();
    toast.success('QR code downloaded as PNG');
  }, [qrDataUrl, business?.name]);

  const handleCopyLink = useCallback(async () => {
    if (!menuUrl) return;
    try {
      await navigator.clipboard.writeText(menuUrl);
      setCopied(true);
      toast.success('Menu link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  }, [menuUrl]);

  const handleShare = useCallback(async () => {
    if (!menuUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${business?.name || 'Menu'} - Digital Menu`,
          text: `Scan the QR code or visit to view our menu!`,
          url: menuUrl,
        });
      } catch {
        // user cancelled share
      }
    } else {
      handleCopyLink();
    }
  }, [menuUrl, business?.name, handleCopyLink]);

  const handlePrint = useCallback(() => {
    setPrintDialogOpen(false);
    setTimeout(() => {
      const printContent = printRef.current;
      if (!printContent) return;
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Please allow popups to print');
        return;
      }
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${business?.name || 'Menu'} - QR Code</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              font-family: system-ui, -apple-system, sans-serif;
              background: white;
            }
            .print-card {
              text-align: center;
              padding: 40px;
              border: 2px solid #e5e7eb;
              border-radius: 16px;
              max-width: 400px;
              width: 100%;
            }
            .print-card h1 {
              font-size: 24px;
              font-weight: 700;
              margin-bottom: 8px;
              color: #111827;
            }
            .print-card .subtitle {
              font-size: 14px;
              color: #6b7280;
              margin-bottom: 24px;
            }
            .print-card img {
              width: 280px;
              height: 280px;
              margin: 0 auto 24px;
              display: block;
            }
            .print-card .scan-text {
              font-size: 16px;
              font-weight: 600;
              color: #374151;
            }
            .print-card .url {
              font-size: 12px;
              color: #9ca3af;
              margin-top: 8px;
            }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="print-card">
            <h1>${business?.name || 'Our Menu'}</h1>
            <p class="subtitle">${business?.category || 'Restaurant'}</p>
            <img src="${qrDataUrl}" alt="QR Code" />
            <p class="scan-text">Scan to view our menu</p>
            <p class="url">${menuUrl}</p>
          </div>
          <script>window.onload = function() { window.print(); window.close(); }</script>
        </body>
        </html>
      `);
      printWindow.document.close();
    }, 100);
  }, [qrDataUrl, business, menuUrl]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-64 w-64 rounded-xl bg-muted" />
          <div className="h-4 w-48 rounded bg-muted" />
        </div>
      </div>
    );
  }

  if (!currentBusiness || !slug) {
    return (
      <Card className="mx-auto max-w-md">
        <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
          <QrCode className="h-16 w-16 text-muted-foreground" />
          <p className="text-muted-foreground text-center">
            Select a business to generate a QR code
          </p>
        </CardContent>
      </Card>
    );
  }

  const isPublished = business?.status === 'published';

  return (
    <div className="flex flex-col items-center gap-6">
      {/* QR Code Card */}
      <Card className="w-full max-w-lg overflow-hidden">
        <CardContent className="flex flex-col items-center gap-6 pt-8 pb-6">
          {/* QR Code Image */}
          <div className="relative">
            <div className="rounded-xl bg-white p-4 shadow-lg ring-1 ring-black/5">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Menu QR Code"
                  className="h-56 w-56 sm:h-64 sm:w-64"
                />
              ) : (
                <div className="flex h-56 w-56 items-center justify-center sm:h-64 sm:w-64">
                  <QrCode className="h-16 w-16 animate-pulse text-muted-foreground/50" />
                </div>
              )}
            </div>
            {/* Status badge */}
            <div className="absolute -top-2 -right-2">
              <Badge
                variant={isPublished ? 'default' : 'secondary'}
                className={isPublished ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
              >
                {isPublished ? 'Active' : 'Draft'}
              </Badge>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button variant="outline" size="sm" onClick={handleDownloadPNG}>
              <Download className="mr-1.5 h-4 w-4" />
              PNG
            </Button>
            <Button variant="outline" size="sm" onClick={handleCopyLink}>
              {copied ? (
                <Check className="mr-1.5 h-4 w-4 text-emerald-600" />
              ) : (
                <Copy className="mr-1.5 h-4 w-4" />
              )}
              {copied ? 'Copied!' : 'Copy Link'}
            </Button>
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="mr-1.5 h-4 w-4" />
              Share
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPrintDialogOpen(true)}>
              <Printer className="mr-1.5 h-4 w-4" />
              Print
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Business Info Card */}
      <Card className="w-full max-w-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Business Information</CardTitle>
          <CardDescription>Details for your QR code</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="font-semibold truncate">{business?.name || currentBusiness.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                <p className="text-sm text-muted-foreground truncate">{menuUrl}</p>
              </div>
            </div>
            <Badge variant={isPublished ? 'default' : 'outline'} className={isPublished ? 'bg-emerald-600 hover:bg-emerald-700 flex-shrink-0' : 'flex-shrink-0'}>
              {business?.status || 'draft'}
            </Badge>
          </div>
          <Separator />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Category</span>
            <span className="font-medium">{business?.category || 'Not set'}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Menu Status</span>
            <Badge variant={isPublished ? 'default' : 'secondary'} className={isPublished ? 'bg-emerald-600 hover:bg-emerald-700' : ''}>
              {isPublished ? 'Published - QR Active' : 'Draft - QR Not Active'}
            </Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Last Updated</span>
            <span className="font-medium">
              {business?.createdAt
                ? new Date(business.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })
                : 'N/A'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Hidden print content */}
      <div ref={printRef} className="hidden">
        <div className="text-center">
          <h1>{business?.name || 'Our Menu'}</h1>
          <img src={qrDataUrl} alt="QR Code" />
          <p>Scan to view our menu</p>
        </div>
      </div>

      {/* Print Confirmation Dialog */}
      <Dialog open={printDialogOpen} onOpenChange={setPrintDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Print QR Code</DialogTitle>
            <DialogDescription>
              This will open a print dialog with your QR code formatted for printing.
              The printed page will include your business name and a call-to-action.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="rounded-lg border p-3 bg-white">
              {qrDataUrl && (
                <img src={qrDataUrl} alt="Preview" className="h-32 w-32" />
              )}
            </div>
            <div className="text-center text-sm text-muted-foreground">
              <p className="font-medium">{business?.name}</p>
              <p>Scan to view our menu</p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPrintDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
