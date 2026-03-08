import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Menu, Sun, Moon, LogOut, Bot, Eraser } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useChat } from "@/hooks/useChat";
import { useTheme } from "@/hooks/useTheme";
import { ChatSidebar } from "@/components/ChatSidebar";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { TypingIndicator } from "@/components/TypingIndicator";

const Chat = () => {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const {
    conversations,
    currentConversation,
    messages,
    isLoading,
    loadConversations,
    loadMessages,
    sendMessage,
    clearChat,
    deleteConversation,
  } = useChat(user?.id);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className="flex h-screen bg-background">
      <ChatSidebar
        conversations={conversations}
        currentConversation={currentConversation}
        onSelect={loadMessages}
        onNew={clearChat}
        onDelete={deleteConversation}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex flex-1 flex-col">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">MistralChat</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {currentConversation && (
              <button
                onClick={clearChat}
                className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                title="New chat"
              >
                <Eraser className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={toggleTheme}
              className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
              title="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              onClick={signOut}
              className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {messages.length === 0 && !isLoading ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex h-full flex-col items-center justify-center px-4"
            >
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10">
                <Bot className="h-10 w-10 text-primary" />
              </div>
              <h2 className="mb-2 text-2xl font-bold text-foreground">Hello! How can I help you today?</h2>
              <p className="max-w-md text-center text-muted-foreground">
                Ask me anything — I'm powered by AI and ready to assist with writing, analysis, coding, and more.
              </p>
            </motion.div>
          ) : (
            <div className="mx-auto max-w-3xl py-4">
              {messages.map(msg => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              {isLoading && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <ChatInput onSend={sendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default Chat;
