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
