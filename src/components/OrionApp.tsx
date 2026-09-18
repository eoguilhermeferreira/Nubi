import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Conversation, Message, Attachment, UserProfile } from "../types/chat";
import { supabase } from "@/integrations/supabase/client";
import { generateAssistantReplyFn } from "../lib/nubi-ai.functions";
import {
  buildTitle,
  createConversation,
  deleteConversation as deleteConversationApi,
  deleteConversationMessages,
  fetchConversations,
  fetchMessages,
  fetchProfile,
  insertMessage,
  renameConversation as renameConversationApi,
} from "../lib/nubi-api";
import { Sidebar } from "./Sidebar";
import { ChatHeader } from "./ChatHeader";
import { ChatEmptyState } from "./ChatEmptyState";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { SettingsModal } from "./SettingsModal";
import { AboutModal } from "./AboutModal";
import { Toaster } from "./ui/sonner";
import { toast } from "sonner";

const FALLBACK_USER: UserProfile = {
  name: "Você",
  email: "",
  avatarText: "N",
  plan: "Conta pessoal",
};

export const OrionApp: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [userId, setUserId] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile>(FALLBACK_USER);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // resposta da IA / envio
  const [busyConvId, setBusyConvId] = useState<string | null>(null);

  const [selectedModel, setSelectedModel] = useState<string>("3.5");
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isAboutOpen, setIsAboutOpen] = useState<boolean>(false);

  // Sessão + perfil
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (cancelled) return;
      const authUser = data.user;
      if (!authUser) return;
      setUserId(authUser.id);
      const email = authUser.email ?? "";
      let displayName = email.split("@")[0] ?? "Você";
      try {
        const profile = await fetchProfile(authUser.id);
        if (profile?.display_name) displayName = profile.display_name;
      } catch (err) {
        console.error("[nubi] erro ao carregar perfil:", err);
      }
      if (cancelled) return;
      setUser({
        name: displayName,
        email,
        avatarText: (displayName.trim()[0] ?? "N").toUpperCase(),
        plan: "Conta pessoal",
      });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Conversas do usuário
  const loadConversations = useCallback(async () => {
    setIsLoadingConversations(true);
    try {
      const list = await fetchConversations();
      setConversations(list);
    } catch (err) {
      console.error("[nubi] erro ao carregar conversas:", err);
      toast.error("Não foi possível carregar seu histórico");
    } finally {
      setIsLoadingConversations(false);
    }
  }, []);

  useEffect(() => {
    if (userId) void loadConversations();
  }, [userId, loadConversations]);

  // Mensagens da conversa ativa
  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    setIsLoadingMessages(true);
    fetchMessages(activeId)
      .then((rows) => {
        if (!cancelled) setMessages(rows);
      })
      .catch((err) => {
        console.error("[nubi] erro ao carregar mensagens:", err);
        if (!cancelled) toast.error("Não foi possível carregar as mensagens");
      })
      .finally(() => {
        if (!cancelled) setIsLoadingMessages(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeId]);

  const bumpConversation = (id: string) => {
    setConversations((prev) => {
      const target = prev.find((c) => c.id === id);
      if (!target) return prev;
      return [target, ...prev.filter((c) => c.id !== id)];
    });
  };

  const handleNewConversation = () => {
    setActiveId(null);
    setMessages([]);
    setIsMobileOpen(false);
  };

  const handleSelectConversation = (id: string) => {
    setActiveId(id);
    setIsMobileOpen(false);
  };

  const handleRenameConversation = async (id: string, newTitle: string) => {
    const title = newTitle.trim();
    if (!title) return;
    const previous = conversations;
    setBusyConvId(id);
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, title } : c)));
    try {
      await renameConversationApi(id, title);
      toast.success("Conversa renomeada");
    } catch (err) {
      console.error("[nubi] erro ao renomear conversa:", err);
      setConversations(previous);
      toast.error("Não foi possível renomear a conversa");
    } finally {
      setBusyConvId(null);
    }
  };

  const handleDeleteConversation = async (id: string) => {
    setBusyConvId(id);
    try {
      await deleteConversationApi(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeId === id) {
        setActiveId(null);
        setMessages([]);
      }
      toast.success("Conversa excluída");
    } catch (err) {
      console.error("[nubi] erro ao excluir conversa:", err);
      toast.error("Não foi possível excluir a conversa");
    } finally {
      setBusyConvId(null);
    }
  };

  const handleSignOut = async () => {
    try {
      await queryClient.cancelQueries();
      queryClient.clear();
      await supabase.auth.signOut();
    } catch (err) {
      console.error("[nubi] erro ao sair:", err);
    }
    navigate({ to: "/auth", replace: true });
  };

  const handleClearCurrentChat = async () => {
    if (!activeId) return;
    const previous = messages;
    setMessages([]);
    try {
      await deleteConversationMessages(activeId);
      toast.success("Chat limpo");
    } catch (err) {
      console.error("[nubi] erro ao limpar conversa:", err);
      setMessages(previous);
      toast.error("Não foi possível limpar a conversa");
    }
  };

  const triggerAiResponse = async (targetConvId: string, history: Message[]) => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const { content: reply } = await generateAssistantReplyFn({
        data: {
          messages: history.map((m) => ({ role: m.role, content: m.content })),
        },
      });
      const saved = await insertMessage({
        conversationId: targetConvId,
        userId,
        role: "assistant",
        content: reply,
      });
      setMessages((prev) => (targetConvId === activeIdRef.current ? [...prev, saved] : prev));
      bumpConversation(targetConvId);
    } catch (err) {
      console.error("[nubi] erro ao gerar/salvar resposta:", err);
      toast.error("Não foi possível gerar a resposta da IA");
    } finally {
      setIsLoading(false);
    }
  };

  // Mantém o id ativo acessível dentro de callbacks assíncronos
  const activeIdRef = React.useRef<string | null>(activeId);
  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  const handleSendMessage = async (text: string, attachments?: Attachment[]) => {
    if (!userId || isLoading) return;
    const content = text.trim() || (attachments?.length ? "Anexo enviado" : "");
    if (!content) return;

    let conversationId = activeId;
    let historyBase = messages;

    try {
      if (!conversationId) {
        setIsCreating(true);
        const conv = await createConversation(userId, buildTitle(content));
        conversationId = conv.id;
        setConversations((prev) => [conv, ...prev]);
        setActiveId(conv.id);
        activeIdRef.current = conv.id;
        setMessages([]);
        historyBase = [];
        setIsCreating(false);
      }

      const saved = await insertMessage({
        conversationId,
        userId,
        role: "user",
        content,
      });
      setMessages((prev) => [...prev, saved]);
      bumpConversation(conversationId);
      void triggerAiResponse(conversationId, [...historyBase, saved]);
    } catch (err) {
      console.error("[nubi] erro ao enviar mensagem:", err);
      setIsCreating(false);
      toast.error("Não foi possível enviar a mensagem");
    }
  };

  const handleSelectPrompt = (promptText: string) => {
    void handleSendMessage(promptText);
  };

  const handleRegenerateResponse = () => {
    if (!activeId || messages.length === 0) return;
    const lastUserIndex = messages.map((m) => m.role).lastIndexOf("user");
    const history = lastUserIndex === -1 ? messages : messages.slice(0, lastUserIndex + 1);
    void triggerAiResponse(activeId, history);
  };

  const showEmptyState = !activeId || (!isLoadingMessages && messages.length === 0);

  return (
    <div className="flex h-dvh w-screen bg-[#050B14] text-slate-100 overflow-hidden font-sans antialiased">
      <Toaster position="top-right" theme="dark" />

      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-black/60 z-30 lg:hidden transition-opacity"
        />
      )}

      <Sidebar
        conversations={conversations}
        activeId={activeId}
        isLoading={isLoadingConversations}
        busyId={busyConvId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onRenameConversation={handleRenameConversation}
        onDeleteConversation={handleDeleteConversation}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onSignOut={handleSignOut}
        user={user}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      <main className="flex-1 flex flex-col h-full min-w-0 bg-[#050B14] relative">
        <ChatHeader
          modelName={selectedModel}
          onOpenMobileSidebar={() => setIsMobileOpen(true)}
          onClearChat={handleClearCurrentChat}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenAbout={() => setIsAboutOpen(true)}
          hasMessages={messages.length > 0}
        />

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          {isLoadingMessages ? (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-600">
              Carregando mensagens...
            </div>
          ) : showEmptyState && !isLoading ? (
            <ChatEmptyState onSelectPrompt={handleSelectPrompt} />
          ) : (
            <MessageList
              messages={messages}
              isLoading={isLoading}
              onRegenerate={handleRegenerateResponse}
            />
          )}
        </div>

        <ChatInput
          onSendMessage={handleSendMessage}
          isLoading={isLoading || isCreating}
          selectedModel={selectedModel}
          onSelectModel={setSelectedModel}
        />
      </main>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </div>
  );
};
