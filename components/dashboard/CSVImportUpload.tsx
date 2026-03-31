"use client";
import { useState, useRef, useCallback } from "react";
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Platform, CSVImportResult } from "@/types";

interface Props {
  onImportComplete?: (result: CSVImportResult) => void;
}

const ACCEPTED_EXTENSIONS = [".csv", ".json", ".txt"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const EXPORT_STEPS: Record<string, { title: string; steps: string[] }> = {
  tiktok: {
    title: "How to export from TikTok",
    steps: [
      "Open TikTok and go to your Profile",
      "Tap the menu icon (three lines) at the top",
      'Go to Settings > Account > "Download your data"',
      "Select JSON or TXT format, then tap Request data",
      "Wait for TikTok to prepare the file (can take a few days)",
      "Download the .zip, extract it, and upload the JSON or TXT file here",
    ],
  },
  instagram: {
    title: "How to export from Instagram",
    steps: [
      "Go to Meta Business Suite on desktop (business.facebook.com)",
      "Click Insights in the left menu",
      "Select the Content tab",
      'Click "Export Data" in the top right corner',
      "Choose your date range and download as CSV",
      "Upload the .csv file here",
    ],
  },
};

export default function CSVImportUpload({ onImportComplete }: Props) {
  const [platform, setPlatform] = useState<Platform>("tiktok");
  const [username, setUsername] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<CSVImportResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFile = useCallback((f: File) => {
    const ext = `.${f.name.split(".").pop()?.toLowerCase()}`;
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      toast({ title: "Accepted formats: .csv, .json, .txt", variant: "destructive" });
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      toast({ title: "File too large. Max 10MB.", variant: "destructive" });
      return;
    }
    setFile(f);
    setResult(null);
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const upload = async () => {
    if (!file) {
      toast({ title: "Select a file to import", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("platform", platform);
      formData.append("username", username.trim());

      const res = await fetch("/api/import/csv", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Import failed");

      setResult(data.data);
      toast({ title: `Imported ${data.data.posts_imported} posts` });
      onImportComplete?.(data.data);
      if (fileRef.current) fileRef.current.value = "";
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Import failed";
      toast({ title: "Import failed", description: message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const steps = EXPORT_STEPS[platform];
  const acceptStr = ACCEPTED_EXTENSIONS.join(",");
  const formatLabel = platform === "tiktok" ? ".json, .txt, or .csv" : ".csv";

  return (
    <div className="glass rounded-2xl p-6 space-y-4">
      <h3 className="font-semibold text-sm flex items-center gap-2">
        <Upload className="w-4 h-4 text-blue-400" />
        Import your data
      </h3>
      <p className="text-xs text-muted-foreground">
        Upload your exported analytics file to create a connected account for analysis.
        {platform === "tiktok"
          ? " TikTok exports as JSON or TXT — both are supported."
          : " Instagram exports as CSV from Meta Business Suite."}
      </p>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Platform</Label>
          <Select
            value={platform}
            onValueChange={(v) => {
              setPlatform(v as Platform);
              setFile(null);
              setResult(null);
              if (fileRef.current) fileRef.current.value = "";
            }}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="tiktok">TikTok</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Username (optional)</Label>
          <Input
            placeholder="Auto-detected from file if available"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
      </div>

      {/* Export instructions */}
      {steps && (
        <div className="bg-card border border-white/[0.06] rounded-xl p-4 space-y-2">
          <p className="text-xs font-medium text-slate-300">{steps.title}</p>
          <ol className="space-y-1">
            {steps.steps.map((step, i) => (
              <li key={i} className="text-xs text-muted-foreground flex gap-2">
                <span className="text-blue-400 font-mono flex-shrink-0">{i + 1}.</span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          dragOver
            ? "border-blue-500 bg-blue-500/5"
            : file
            ? "border-emerald-500/30 bg-emerald-500/5"
            : "border-border hover:border-white/20"
        }`}
      >
        <input
          ref={fileRef}
          type="file"
          accept={acceptStr}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
        {file ? (
          <div className="flex items-center justify-center gap-2">
            <FileText className="w-5 h-5 text-emerald-500" />
            <span className="text-sm">{file.name}</span>
            <span className="text-xs text-muted-foreground">({(file.size / 1024).toFixed(0)} KB)</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
                setResult(null);
                if (fileRef.current) fileRef.current.value = "";
              }}
              className="ml-2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Drag & drop a {formatLabel} file, or click to browse
            </p>
            <p className="text-xs text-muted-foreground mt-1">Max 10MB</p>
          </>
        )}
      </div>

      <Button
        onClick={upload}
        disabled={!file || uploading}
        className="gap-2"
      >
        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        {uploading ? "Importing..." : "Import data"}
      </Button>

      {/* Result */}
      {result && (
        <div className="border border-emerald-500/20 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-medium">Import complete</span>
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span className="text-emerald-500">{result.posts_imported} imported</span>
            {result.posts_skipped > 0 && <span className="text-yellow-400">{result.posts_skipped} skipped</span>}
          </div>
          {result.errors.length > 0 && (
            <div className="space-y-1">
              {result.errors.slice(0, 3).map((err, i) => (
                <div key={i} className="flex items-start gap-1.5 text-xs text-yellow-400">
                  <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                  {err}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
