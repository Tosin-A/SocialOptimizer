"use client";

import { useState, useEffect, useCallback } from "react";
import { MessageSquare, Loader2, PanelLeftOpen, Bot, User } from "lucide-react";
import CoachChat from "@/components/dashboard/CoachChat";
import CoachConversationList from "@/components/dashboard/CoachConversationList";
import UpgradeGate from "@/components/dashboard/UpgradeGate";
import { useFeatureAccess } from "@/hooks/use-feature-access";
import type { CoachConversation } from "@/types";

function CoachTeaser() {
  const messages = [
    { role: "user" as const, text: "My last 5 videos averaged 2.1% engagement but my hook scores are low. What should I change?" },
    { role: "assistant" as const, text: "Your hook scores average 34/100 — that's 2.8x below the fitness niche median. The main issue: your first 2 seconds are visual (b-roll), not verbal. Top performers in your niche open with a direct statement or question. Try: \"Here's why your bench isn't growing\" instead of showing the gym. Expect hook-through rate to improve 40-60% within 3 videos." },
    { role: "user" as const, text: "What about my posting schedule? I post whenever I feel like it." },
  ];

  return (
    <div className="glass rounded-2xl p-4 space-y-3">
      {messages.map((msg, i) => (
        <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
          {msg.role === "assistant" && (
            <div className="w-7 h-7 rounded-full bg-blue-600/30 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Bot className="w-3.5 h-3.5 text-blue-300" />
            </div>
          )}
          <div
            className={`rounded-xl px-3.5 py-2.5 text-sm leading-relaxed max-w-[80%] ${
              msg.role === "user"
                ? "bg-blue-600/20 text-blue-100"
                : "bg-white/5 text-slate-300"
            }`}
          >
            {msg.text}
          </div>
          {msg.role === "user" && (
            <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5">
              <User className="w-3.5 h-3.5 text-slate-300" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function CoachPage() {
  const { access, loading: accessLoading } = useFeatureAccess();
  const [accounts, setAccounts] = useState<Array<{ id: string; platform: string; username: string }>>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [conversations, setConversations] = useState<CoachConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetch("/api/accounts")
      .then((r) => r.json())
      .then((d) => setAccounts(d.data ?? []))
      .finally(() => setAccountsLoading(false));
  }, []);

  // Load conversations
  useEffect(() => {
    fetch("/api/coach/conversations")
      .then((r) => r.json())
      .then((d) => {
        if (d.data) {
          setConversations(d.data);
        }
      });
  }, []);

  const handleNewConversation = useCallback(async () => {
    const res = await fetch("/api/coach/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const d = await res.json();
    if (d.data) {
      setConversations((prev) => [d.data, ...prev]);
      setActiveConversationId(d.data.id);
      setSidebarOpen(false);
    }
  }, []);

  const handleSelectConversation = useCallback((id: string) => {
    setActiveConversationId(id);
    setSidebarOpen(false);
  }, []);

  const handleDeleteConversation = useCallback(async (id: string) => {
    await fetch(`/api/coach/conversations/${id}`, { method: "DELETE" });
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConversationId === id) {
      setActiveConversationId(null);
    }
  }, [activeConversationId]);

  const handleConversationCreated = useCallback((id: string, title: string) => {
    const newConv: CoachConversation = {
      id,
      user_id: "",
      account_id: null,
      title,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveConversationId(id);
  }, []);

  const handleTitleGenerated = useCallback((conversationId: string, title: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId ? { ...c, title, updated_at: new Date().toISOString() } : c
      )
    );
  }, []);

  if (accessLoading || accountsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!access.coach) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-blue-400" /> Content Coach
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Get personalized, data-backed coaching for your content strategy
          </p>
        </div>
        <UpgradeGate feature="coach" teaser={<CoachTeaser />}>
          <div />
        </UpgradeGate>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] h-[calc(100vh-4.75rem)] flex flex-col">
      <div className="mb-2 flex-shrink-0 flex items-center justify-end">
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden p-2 rounded-lg hover:bg-white/5 text-muted-foreground transition-colors"
          aria-label="Open conversations"
        >
          <PanelLeftOpen className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 min-h-0 flex gap-3">
        {/* Conversation sidebar — desktop */}
        <div className="hidden lg:block w-64 xl:w-72 flex-shrink-0 glass rounded-2xl overflow-hidden">
          <CoachConversationList
            conversations={conversations}
            activeId={activeConversationId}
            onSelect={handleSelectConversation}
            onNew={handleNewConversation}
            onDelete={handleDeleteConversation}
          />
        </div>

        {/* Conversation sidebar — mobile slide-over */}
        {sidebarOpen && (
          <>
            <div
              className="lg:hidden fixed inset-0 bg-black/50 z-40"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="lg:hidden fixed inset-y-0 left-0 w-[85vw] max-w-72 z-50 bg-slate-950 border-r border-border">
              <CoachConversationList
                conversations={conversations}
                activeId={activeConversationId}
                onSelect={handleSelectConversation}
                onNew={handleNewConversation}
                onDelete={handleDeleteConversation}
                onClose={() => setSidebarOpen(false)}
              />
            </div>
          </>
        )}

        {/* Chat panel */}
        <div className="flex-1 min-w-0 min-h-0">
          <CoachChat
            accounts={accounts}
            conversationId={activeConversationId}
            onConversationCreated={handleConversationCreated}
            onTitleGenerated={handleTitleGenerated}
          />
        </div>
      </div>
    </div>
  );
}
