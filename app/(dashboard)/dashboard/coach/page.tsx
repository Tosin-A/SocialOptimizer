"use client";

import { useState, useEffect, useCallback } from "react";
import { MessageSquare, Loader2, PanelLeftOpen } from "lucide-react";
import CoachChat from "@/components/dashboard/CoachChat";
import CoachConversationList from "@/components/dashboard/CoachConversationList";
import { useFeatureAccess } from "@/hooks/use-feature-access";
import { requiredPlanFor } from "@/lib/plans/feature-gate";
import type { CoachConversation } from "@/types";

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
    const requiredPlan = requiredPlanFor("coach");
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mx-auto mb-4">
          <MessageSquare className="w-6 h-6 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold mb-2">Content Coach</h2>
        <p className="text-muted-foreground text-sm mb-6">
          Get personalized, data-backed coaching for your content strategy.
          Available on the <span className="capitalize font-medium text-foreground">{requiredPlan}</span> plan and above.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-6rem)] flex flex-col">
      <div className="mb-4 flex-shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-brand-400" /> Content Coach
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Ask specific questions about your page — the coach knows your metrics. Type <kbd className="text-xs px-1 py-0.5 rounded bg-white/10 font-mono">/</kbd> for commands.
          </p>
        </div>
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden p-2 rounded-lg hover:bg-white/5 text-muted-foreground transition-colors"
        >
          <PanelLeftOpen className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 min-h-0 flex gap-4">
        {/* Conversation sidebar — desktop */}
        <div className="hidden lg:block w-72 flex-shrink-0 glass rounded-2xl overflow-hidden">
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
            <div className="lg:hidden fixed inset-y-0 left-0 w-[85vw] max-w-72 z-50 bg-slate-950 border-r border-white/5">
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
        <div className="flex-1 min-w-0">
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
