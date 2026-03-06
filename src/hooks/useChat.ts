import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export function useChat(userId: string | undefined) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadConversations = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("conversations")
      .select("*")
      .order("updated_at", { ascending: false });
    if (data) setConversations(data as Conversation[]);
  }, [userId]);

  const loadMessages = useCallback(async (conversationId: string) => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    if (data) setMessages(data as Message[]);
    setCurrentConversation(conversationId);
  }, []);

  const createConversation = useCallback(async (title: string = "New Chat") => {
    if (!userId) return null;
    const { data, error } = await supabase
      .from("conversations")
      .insert({ user_id: userId, title })
      .select()
      .single();
    if (error) {
      toast.error("Failed to create conversation");
      return null;
    }
    await loadConversations();
    return data as Conversation;
  }, [userId, loadConversations]);

  const deleteConversation = useCallback(async (id: string) => {
    await supabase.from("conversations").delete().eq("id", id);
    if (currentConversation === id) {
      setCurrentConversation(null);
      setMessages([]);
    }
    await loadConversations();
  }, [currentConversation, loadConversations]);

  const sendMessage = useCallback(async (content: string) => {
    if (!userId) return;

    let convId = currentConversation;

    if (!convId) {
      const conv = await createConversation(content.slice(0, 50));
      if (!conv) return;
      convId = conv.id;
      setCurrentConversation(convId);
    }

    // Insert user message
    const { data: userMsg } = await supabase
      .from("messages")
      .insert({ conversation_id: convId, user_id: userId, role: "user", content })
      .select()
      .single();

    if (userMsg) {
      setMessages(prev => [...prev, userMsg as Message]);
    }

    // Update conversation title if first message
    if (messages.length === 0) {
      await supabase
        .from("conversations")
        .update({ title: content.slice(0, 50), updated_at: new Date().toISOString() })
        .eq("id", convId);
      await loadConversations();
    }

    setIsLoading(true);

    try {
      const { data: session } = await supabase.auth.getSession();
      const allMessages = [...messages, { role: "user" as const, content }];
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.session?.access_token}`,
          },
          body: JSON.stringify({
            messages: allMessages.map(m => ({ role: m.role, content: m.content })),
            conversationId: convId,
          }),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to get AI response");
      }

      const data = await response.json();

      // Save assistant message
      const { data: assistantMsg } = await supabase
        .from("messages")
        .insert({
          conversation_id: convId,
          user_id: userId,
          role: "assistant",
          content: data.content,
        })
        .select()
        .single();

      if (assistantMsg) {
        setMessages(prev => [...prev, assistantMsg as Message]);
      }

      // Update conversation timestamp
      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", convId);
      await loadConversations();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send message");
    } finally {
      setIsLoading(false);
    }
  }, [userId, currentConversation, messages, createConversation, loadConversations]);

  const clearChat = useCallback(() => {
    setCurrentConversation(null);
    setMessages([]);
  }, []);

  return {
    conversations,
    currentConversation,
    messages,
    isLoading,
    loadConversations,
    loadMessages,
    createConversation,
    deleteConversation,
    sendMessage,
    clearChat,
    setCurrentConversation,
  };
}
