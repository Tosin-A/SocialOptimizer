"use client";

import { useState } from "react";
import { X, Download, Copy, Check, Share2, Gift } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShareData {
  share_token: string;
  image_url: string;
  public_url: string;
  caption: string;
  already_shared: boolean;
  bonus_earned?: number;
}

interface Props {
  reportId: string;
  open: boolean;
  onClose: () => void;
}

export default function ShareReportModal({ reportId, open, onClose }: Props) {
  const [shareData, setShareData] = useState<ShareData | null>(null);
  const [loading, setLoading] = useState(false);
  const [captionCopied, setCaptionCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleShare() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/reports/${reportId}/share`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to create share");
        return;
      }
      setShareData(json.data);
    } catch {
      setError("Failed to create share");
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadImage() {
    if (!shareData) return;
    try {
      const res = await fetch(shareData.image_url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `clout-score-${shareData.share_token}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // fallback: open in new tab
      window.open(shareData.image_url, "_blank");
    }
  }

  function handleCopyCaption() {
    if (!shareData) return;
    navigator.clipboard.writeText(shareData.caption);
    setCaptionCopied(true);
    setTimeout(() => setCaptionCopied(false), 2000);
  }

  function handleCopyLink() {
    if (!shareData) return;
    navigator.clipboard.writeText(shareData.public_url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Share2 className="w-4 h-4 text-brand-400" />
            Share your results
          </h3>
          <button onClick={onClose} className="text-white/30 hover:text-white/60 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {!shareData && !loading && (
          <div className="space-y-4">
            <div className="bg-brand-600/10 border border-brand-600/20 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-brand-400" />
                <span className="text-sm font-medium text-brand-300">Earn 3 bonus scans</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Share your score card on TikTok or Instagram and get 3 extra analysis scans for free. One reward per report.
              </p>
            </div>

            {error && (
              <p className="text-xs text-red-400">{error}</p>
            )}

            <button
              onClick={handleShare}
              className="w-full bg-brand-600 hover:bg-brand-500 text-white font-medium text-sm py-2.5 rounded-lg transition-colors"
            >
              Generate shareable card
            </button>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {shareData && (
          <div className="space-y-4">
            {/* Reward banner */}
            <div className={cn(
              "rounded-xl p-3 text-center text-sm font-medium",
              shareData.already_shared
                ? "bg-white/5 border border-white/10 text-muted-foreground"
                : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
            )}>
              {shareData.already_shared
                ? "Already shared — +3 scans earned"
                : `+${shareData.bonus_earned} bonus scans earned!`
              }
            </div>

            {/* Card preview */}
            <div className="rounded-xl overflow-hidden border border-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={shareData.image_url}
                alt="Share card preview"
                className="w-full h-auto"
                loading="lazy"
              />
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleDownloadImage}
                className="flex items-center justify-center gap-1.5 text-xs font-medium bg-brand-600 hover:bg-brand-500 text-white py-2.5 rounded-lg transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Download Image
              </button>
              <button
                onClick={handleCopyCaption}
                className="flex items-center justify-center gap-1.5 text-xs font-medium bg-white/5 hover:bg-white/10 border border-white/10 text-foreground py-2.5 rounded-lg transition-colors"
              >
                {captionCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {captionCopied ? "Copied!" : "Copy Caption"}
              </button>
            </div>

            {/* Public link */}
            <div className="space-y-1.5">
              <span className="text-xs text-muted-foreground">Public link</span>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-muted-foreground truncate font-mono">
                  {shareData.public_url}
                </div>
                <button
                  onClick={handleCopyLink}
                  className="flex-shrink-0 p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
                >
                  {linkCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
