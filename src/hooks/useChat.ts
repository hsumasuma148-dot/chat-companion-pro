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

  const sendMessage = useCallback(async (content: string, model?: string, translate?: string) => {
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
            model,
            translate,
          }),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to get AI response");
      }

      // Stream the response
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let assistantContent = "";
      let textBuffer = "";
      const tempId = crypto.randomUUID();

      // Add empty assistant message
      setMessages(prev => [...prev, {
        id: tempId,
        role: "assistant" as const,
        content: "",
        created_at: new Date().toISOString(),
      }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantContent += delta;
              setMessages(prev =>
                prev.map(m => m.id === tempId ? { ...m, content: assistantContent } : m)
              );
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Flush remaining buffer
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) assistantContent += delta;
          } catch { /* ignore */ }
        }
        if (assistantContent) {
          setMessages(prev =>
            prev.map(m => m.id === tempId ? { ...m, content: assistantContent } : m)
          );
        }
      }

      // Save assistant message to DB
      if (assistantContent) {
        const { data: savedMsg } = await supabase
          .from("messages")
          .insert({
            conversation_id: convId,
            user_id: userId,
            role: "assistant",
            content: assistantContent,
          })
          .select()
          .single();

        if (savedMsg) {
          setMessages(prev =>
            prev.map(m => m.id === tempId ? (savedMsg as Message) : m)
          );
        }
      }

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
