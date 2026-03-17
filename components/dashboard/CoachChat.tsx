"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MessageSquare, AlertCircle, Sparkles, ArrowUp, Bookmark, BookmarkCheck } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import type { CoachMessage, CoachMessageRow } from "@/types";

interface CoachChatProps {
  accounts: Array<{ id: string; platform: string; username: string }>;
  conversationId: string | null;
  onConversationCreated?: (id: string, title: string) => void;
  onTitleGenerated?: (conversationId: string, title: string) => void;
}

interface CommandOption {
  command: string;
  label: string;
  description: string;
  provider: "claude" | "openai";
}

const COMMANDS: CommandOption[] = [
  { command: "/ideas", label: "Ideas", description: "Generate creative content ideas", provider: "openai" },
  { command: "/plan", label: "Plan", description: "2-week action plan from your data", provider: "claude" },
  { command: "/fix", label: "Fix", description: "What should I fix first?", provider: "claude" },
  { command: "/hooks", label: "Hooks", description: "Why are my hooks underperforming?", provider: "claude" },
];

const SUGGESTED_QUESTIONS = [
  "What's my biggest weakness right now?",
  "Which content format should I double down on?",
  "How does my engagement rate compare to my niche?",
  "Give me a 2-week action plan based on my data.",
];

function useAutoResizeTextarea(value: string, maxHeight = 160) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
  }, [value, maxHeight]);

  return ref;
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-0.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-brand-400"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  );
}

export default function CoachChat({ accounts, conversationId, onConversationCreated, onTitleGenerated }: CoachChatProps) {
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState(accounts[0]?.id ?? "");
  const [showCommands, setShowCommands] = useState(false);
  const [activeProvider, setActiveProvider] = useState<"claude" | "openai">("claude");
  const [commandFilter, setCommandFilter] = useState("");
  const [savedIndices, setSavedIndices] = useState<Set<number>>(new Set());
  const [savingIndex, setSavingIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useAutoResizeTextarea(input);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Load messages when conversationId changes
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setSavedIndices(new Set());
      return;
    }

    let cancelled = false;
    setLoadingHistory(true);
    setError(null);

    fetch(`/api/coach/conversations/${conversationId}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d.data?.messages) {
          const loaded: CoachMessage[] = d.data.messages.map((m: CoachMessageRow) => ({
            role: m.role,
            content: m.content,
            timestamp: m.created_at,
            provider: m.provider,
          }));
          setMessages(loaded);
        } else {
          setMessages([]);
        }
        setSavedIndices(new Set());
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load conversation history");
      })
      .finally(() => {
        if (!cancelled) setLoadingHistory(false);
      });

    return () => { cancelled = true; };
  }, [conversationId]);

  // Track / input for command palette
  useEffect(() => {
    if (input === "/") {
      setShowCommands(true);
      setCommandFilter("");
    } else if (input.startsWith("/")) {
      setShowCommands(true);
      setCommandFilter(input.slice(1).toLowerCase());
    } else {
      setShowCommands(false);
      setCommandFilter("");
    }
  }, [input]);

  const selectCommand = (cmd: CommandOption) => {
    setActiveProvider(cmd.provider);
    setShowCommands(false);

    if (cmd.command === "/ideas") {
      setInput("");
      sendMessage("Generate creative content ideas for my page", cmd.provider);
    } else if (cmd.command === "/plan") {
      setInput("");
      sendMessage("Give me a 2-week action plan based on my data.", cmd.provider);
    } else if (cmd.command === "/fix") {
      setInput("");
      sendMessage("What should I fix first to grow faster?", cmd.provider);
    } else if (cmd.command === "/hooks") {
      setInput("");
      sendMessage("Why are my hooks underperforming?", cmd.provider);
    }
  };

  const createConversationAndSend = async (text: string, provider: "claude" | "openai"): Promise<string | null> => {
    const res = await fetch("/api/coach/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ account_id: selectedAccount || undefined }),
    });
    const d = await res.json();
    if (!res.ok || !d.data) {
      setError(d.error ?? "Failed to create conversation");
      return null;
    }
    const newId = d.data.id as string;
    onConversationCreated?.(newId, d.data.title);
    return newId;
  };

  const sendMessage = async (content?: string, providerOverride?: "claude" | "openai") => {
    const text = content ?? input.trim();
    if (!text || loading) return;

    const provider = providerOverride ?? activeProvider;

    setError(null);
    setShowCommands(false);

    const userMessage: CoachMessage = {
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
      provider,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    // Reset provider to claude after sending (one-shot for openai)
    if (!providerOverride) {
      setActiveProvider("claude");
    }

    try {
      // Auto-create conversation if none selected
      let activeConvId = conversationId;
      if (!activeConvId) {
        activeConvId = await createConversationAndSend(text, provider);
        if (!activeConvId) {
          setLoading(false);
          return;
        }
      }

      const res = await fetch(`/api/coach/conversations/${activeConvId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text, provider }),
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
        content: data.data.assistantMessage.content,
        timestamp: data.data.assistantMessage.created_at,
        provider: data.data.assistantMessage.provider,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Notify parent of auto-generated title
      if (data.data.title && activeConvId) {
        onTitleGenerated?.(activeConvId, data.data.title);
      }
    } catch {
      setError("Failed to reach the coach. Check your connection and try again.");
    } finally {
      setLoading(false);
      setActiveProvider("claude");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (showCommands) {
        const filtered = filteredCommands;
        if (filtered.length > 0) {
          selectCommand(filtered[0]);
        }
        return;
      }
      sendMessage();
    }
    if (e.key === "Escape") {
      setShowCommands(false);
    }
  };

  const filteredCommands = COMMANDS.filter(
    (c) =>
      !commandFilter ||
      c.command.slice(1).includes(commandFilter) ||
      c.label.toLowerCase().includes(commandFilter)
  );

  const saveIdea = async (msgIndex: number) => {
    if (savedIndices.has(msgIndex) || savingIndex === msgIndex) return;
    const msg = messages[msgIndex];
    if (!msg || msg.role !== "assistant") return;

    // Find the preceding user message as source_prompt
    let sourcePrompt: string | undefined;
    for (let j = msgIndex - 1; j >= 0; j--) {
      if (messages[j].role === "user") {
        sourcePrompt = messages[j].content;
        break;
      }
    }

    setSavingIndex(msgIndex);
    try {
      const res = await fetch("/api/saved-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: msg.content,
          provider: msg.provider ?? "claude",
          source_prompt: sourcePrompt,
        }),
      });
      if (res.ok) {
        setSavedIndices((prev) => new Set(prev).add(msgIndex));
      }
    } finally {
      setSavingIndex(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
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
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex-1 glass rounded-2xl flex flex-col overflow-hidden"
      >
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loadingHistory ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <div className="w-4 h-4 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
                Loading messages...
              </div>
            </div>
          ) : messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="flex flex-col items-center justify-center h-full text-center px-4"
            >
              <div className="w-12 h-12 rounded-xl bg-brand-600/20 flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-brand-400" />
              </div>
              <h3 className="font-semibold text-lg mb-1">Content Coach</h3>
              <p className="text-muted-foreground text-sm mb-6 max-w-md">
                Ask anything about your page performance. Type <kbd className="text-xs px-1.5 py-0.5 rounded bg-white/10 font-mono">/</kbd> for commands.
              </p>

              {/* Quick action pills */}
              <div className="flex flex-wrap gap-2 justify-center mb-4">
                {COMMANDS.map((cmd) => (
                  <button
                    key={cmd.command}
                    onClick={() => selectCommand(cmd)}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors border border-white/5"
                  >
                    {cmd.provider === "openai" && <Sparkles className="w-3 h-3 text-emerald-400" />}
                    <span className="font-mono text-brand-400">{cmd.command}</span>
                    <span>{cmd.label}</span>
                  </button>
                ))}
              </div>

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
            </motion.div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-brand-600/30 text-foreground rounded-br-md"
                        : "bg-white/5 text-foreground rounded-bl-md"
                    }`}
                  >
                    {msg.role === "assistant" && msg.provider && (
                      <span
                        className={`inline-block text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded mb-2 ${
                          msg.provider === "openai"
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-brand-500/15 text-brand-400"
                        }`}
                      >
                        {msg.provider === "openai" ? "GPT-4o" : "Claude"}
                      </span>
                    )}
                    {msg.role === "assistant" ? (
                      <div
                        className="prose prose-invert prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                        dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.content) }}
                      />
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                    {msg.role === "assistant" && (
                      <button
                        onClick={() => saveIdea(i)}
                        disabled={savedIndices.has(i) || savingIndex === i}
                        className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors disabled:cursor-default"
                        title={savedIndices.has(i) ? "Saved" : "Save idea"}
                      >
                        {savedIndices.has(i) ? (
                          <BookmarkCheck className="w-3.5 h-3.5 text-brand-400" />
                        ) : (
                          <Bookmark className="w-3.5 h-3.5" />
                        )}
                        <span>{savedIndices.has(i) ? "Saved" : "Save"}</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}

          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="bg-white/5 rounded-2xl rounded-bl-md px-4 py-3">
                <TypingDots />
              </div>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-center"
            >
              <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {error}
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="border-t border-white/5 p-4">
          <div className="relative">
            {/* Command palette */}
            <AnimatePresence>
              {showCommands && filteredCommands.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-full left-0 right-0 mb-2 bg-slate-900 border border-white/10 rounded-xl overflow-hidden shadow-xl"
                >
                  {filteredCommands.map((cmd) => (
                    <button
                      key={cmd.command}
                      onClick={() => selectCommand(cmd)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left"
                    >
                      <span className="font-mono text-sm text-brand-400">{cmd.command}</span>
                      <span className="text-sm text-foreground">{cmd.description}</span>
                      {cmd.provider === "openai" && (
                        <span className="ml-auto text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                          GPT-4o
                        </span>
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your content performance... Type / for commands"
                rows={1}
                className="flex-1 resize-none bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-brand-500/50 focus:border-brand-500/50 transition-colors"
                disabled={loading}
              />
              <motion.button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                whileTap={{ scale: 0.95 }}
                className="h-[46px] w-[46px] rounded-xl flex-shrink-0 flex items-center justify-center bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:hover:bg-brand-600 transition-colors"
              >
                <AnimatePresence mode="wait">
                  {loading ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0, rotate: -90 }}
                      animate={{ opacity: 1, rotate: 0 }}
                      exit={{ opacity: 0, rotate: 90 }}
                    >
                      <TypingDots />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="send"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                    >
                      <ArrowUp className="w-4 h-4 text-white" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            Shift+Enter for new line. Type <kbd className="font-mono text-brand-400">/</kbd> for commands.
          </p>
        </div>
      </motion.div>
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
