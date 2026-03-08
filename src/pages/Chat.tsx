import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Menu, Sun, Moon, LogOut, Bot, Download, ChevronDown, Globe, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useChat } from "@/hooks/useChat";
import { useTheme } from "@/hooks/useTheme";
import { ChatSidebar } from "@/components/ChatSidebar";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput, type Attachment } from "@/components/ChatInput";
import { TypingIndicator } from "@/components/TypingIndicator";
import { toast } from "sonner";

const AI_MODELS = [
  { id: "google/gemini-3-flash-preview", label: "Gemini Flash", desc: "Fast & capable" },
  { id: "google/gemini-2.5-pro", label: "Gemini Pro", desc: "Most powerful" },
  { id: "openai/gpt-5-mini", label: "GPT-5 Mini", desc: "Balanced" },
  { id: "openai/gpt-5-nano", label: "GPT-5 Nano", desc: "Fast & light" },
];

const LANGUAGES = [
  { code: "", label: "Default" },
  { code: "Spanish", label: "Spanish" },
  { code: "French", label: "French" },
  { code: "German", label: "German" },
  { code: "Japanese", label: "Japanese" },
  { code: "Chinese", label: "Chinese" },
  { code: "Arabic", label: "Arabic" },
  { code: "Hindi", label: "Hindi" },
  { code: "Portuguese", label: "Portuguese" },
];

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
    regenerateLastMessage,
  } = useChat(user?.id);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState(AI_MODELS[0].id);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [translateLang, setTranslateLang] = useState("");
  const [showLangMenu, setShowLangMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = (content: string, attachments?: Attachment[]) => {
    sendMessage(content, selectedModel, translateLang || undefined, attachments);
  };

  const handleRegenerate = () => {
    regenerateLastMessage(selectedModel, translateLang || undefined);
  };

  const handleClearChat = () => {
    clearChat();
    toast.success("Chat cleared");
  };

  const handleDownloadPDF = () => {
    if (messages.length === 0) {
      toast.error("No messages to download");
      return;
    }
    const text = messages
      .map(m => `[${m.role === "user" ? "You" : "Assistant"}] ${m.content}`)
      .join("\n\n---\n\n");

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Chat downloaded");
  };

  const currentModelLabel = AI_MODELS.find(m => m.id === selectedModel)?.label || "Select Model";

  // Find last assistant message index for regenerate
  const lastAssistantIdx = messages.reduceRight((acc, m, i) => acc === -1 && m.role === "assistant" ? i : acc, -1);

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
        <header className="flex items-center justify-between border-b border-border bg-background px-4 py-2.5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Model Selector */}
            <div className="relative">
              <button
                onClick={() => { setShowModelMenu(!showModelMenu); setShowLangMenu(false); }}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent transition-colors"
              >
                <Bot className="h-4 w-4 text-primary" />
                {currentModelLabel}
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
              {showModelMenu && (
                <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-xl border border-border bg-popover p-1 shadow-lg">
                  {AI_MODELS.map(model => (
                    <button
                      key={model.id}
                      onClick={() => { setSelectedModel(model.id); setShowModelMenu(false); }}
                      className={`flex w-full flex-col rounded-lg px-3 py-2 text-left transition-colors ${
                        selectedModel === model.id ? "bg-accent" : "hover:bg-accent/50"
                      }`}
                    >
                      <span className="text-sm font-medium text-foreground">{model.label}</span>
                      <span className="text-xs text-muted-foreground">{model.desc}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Language */}
            <div className="relative">
              <button
                onClick={() => { setShowLangMenu(!showLangMenu); setShowModelMenu(false); }}
                className={`rounded-lg p-2 transition-colors ${translateLang ? "text-primary" : "text-muted-foreground"} hover:bg-accent hover:text-foreground`}
                title="Translate responses"
              >
                <Globe className="h-4 w-4" />
              </button>
              {showLangMenu && (
                <div className="absolute right-0 top-full z-50 mt-1 w-40 rounded-xl border border-border bg-popover p-1 shadow-lg">
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => { setTranslateLang(lang.code); setShowLangMenu(false); }}
                      className={`flex w-full rounded-lg px-3 py-1.5 text-left text-sm transition-colors ${
                        translateLang === lang.code ? "bg-accent font-medium text-foreground" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleClearChat}
              className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
              title="Clear chat"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              onClick={handleDownloadPDF}
              className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
              title="Download chat"
            >
              <Download className="h-4 w-4" />
            </button>
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
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <h2 className="mb-2 text-2xl font-semibold text-foreground">Hello! How can I help you today?</h2>
              <p className="max-w-md text-center text-sm text-muted-foreground">
                Ask me anything — I can help with writing, analysis, coding, translation, and more.
              </p>
              <div className="mt-8 grid gap-2 sm:grid-cols-2">
                {[
                  "Explain quantum computing simply",
                  "Write a Python function to sort a list",
                  "What are the best practices for React?",
                  "Help me draft a professional email",
                ].map(suggestion => (
                  <button
                    key={suggestion}
                    onClick={() => handleSend(suggestion)}
                    className="rounded-xl border border-border px-4 py-3 text-left text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <div>
              {messages.map((msg, idx) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  onRegenerate={idx === lastAssistantIdx && !isLoading ? handleRegenerate : undefined}
                />
              ))}
              {isLoading && messages[messages.length - 1]?.role !== "assistant" && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <ChatInput onSend={handleSend} isLoading={isLoading} />
      </div>

      {/* Close menus on click outside */}
      {(showModelMenu || showLangMenu) && (
        <div className="fixed inset-0 z-40" onClick={() => { setShowModelMenu(false); setShowLangMenu(false); }} />
      )}
    </div>
  );
};

export default Chat;
