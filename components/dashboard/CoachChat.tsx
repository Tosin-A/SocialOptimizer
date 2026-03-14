"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2, MessageSquare, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { CoachMessage } from "@/types";

interface CoachChatProps {
  accounts: Array<{ id: string; platform: string; username: string }>;
}

const SUGGESTED_QUESTIONS = [
  "What's my biggest weakness right now?",
  "Which content format should I double down on?",
  "How does my engagement rate compare to my niche?",
  "What should I fix first to grow faster?",
  "Why are my hooks underperforming?",
  "Give me a 2-week action plan based on my data.",
];

export default function CoachChat({ accounts }: CoachChatProps) {
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState(accounts[0]?.id ?? "");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const sendMessage = async (content?: string) => {
    const text = content ?? input.trim();
    if (!text || loading) return;

    setError(null);
    const userMessage: CoachMessage = {
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
          account_id: selectedAccount || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errMsg = typeof data.error === "string" ? data.error : "Something went wrong";
        setError(errMsg);
        setLoading(false);
        return;
      }

      const assistantMessage: CoachMessage = {
        role: "assistant",
        content: data.data.reply,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      setError("Failed to reach the coach. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-h-[700px]">
      {/* Account selector */}
      {accounts.length > 1 && (
        <div className="mb-4">
          <Label className="text-xs text-muted-foreground mb-1.5 block">Coaching based on data from</Label>
          <Select value={selectedAccount} onValueChange={setSelectedAccount}>
            <SelectTrigger className="w-full sm:w-72">
              <SelectValue placeholder="Select account..." />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  <span className="capitalize">{a.platform}</span> @{a.username}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Chat area */}
      <div className="flex-1 glass rounded-2xl flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-12 h-12 rounded-xl bg-brand-600/20 flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-brand-400" />
              </div>
              <h3 className="font-semibold text-lg mb-1">Content Coach</h3>
              <p className="text-muted-foreground text-sm mb-6 max-w-md">
                Ask anything about your page performance. The coach uses your latest analysis data to give specific, metric-backed answers.
              </p>
              <div className="grid sm:grid-cols-2 gap-2 w-full max-w-lg">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="text-left text-xs px-3 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors border border-white/5"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-brand-600/30 text-foreground rounded-br-md"
                      : "bg-white/5 text-foreground rounded-bl-md"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div
                      className="prose prose-invert prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                      dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.content) }}
                    />
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
              </div>
            ))
          )}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white/5 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Analyzing your data...
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex justify-center">
              <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {error}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="border-t border-white/5 p-4">
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your content performance..."
              rows={1}
              className="flex-1 resize-none bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-brand-500/50 focus:border-brand-500/50 transition-colors"
              disabled={loading}
            />
            <Button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              size="icon"
              className="h-[46px] w-[46px] rounded-xl flex-shrink-0"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            Shift+Enter for new line. Responses based on your latest analysis report.
          </p>
        </div>
      </div>
    </div>
  );
}

function formatMarkdown(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code class='bg-white/10 px-1 py-0.5 rounded text-xs'>$1</code>")
    .replace(/^### (.+)$/gm, "<h3 class='font-semibold text-base mt-3 mb-1'>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2 class='font-semibold text-lg mt-3 mb-1'>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1 class='font-bold text-xl mt-3 mb-1'>$1</h1>")
    .replace(/^- (.+)$/gm, "<li class='ml-4 list-disc'>$1</li>")
    .replace(/^(\d+)\. (.+)$/gm, "<li class='ml-4 list-decimal'>$1. $2</li>")
    .replace(/\n{2,}/g, "<br/><br/>")
    .replace(/\n/g, "<br/>");
}
