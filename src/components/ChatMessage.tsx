import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Copy, Check, Bot, User, Volume2, VolumeX } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { Message } from "@/hooks/useChat";

interface ChatMessageProps {
  message: Message;
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function ChatMessage({ message }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const isUser = message.role === "user";

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`group w-full py-6 ${isUser ? "bg-transparent" : "bg-chat-assistant"}`}
    >
      <div className="mx-auto flex max-w-3xl gap-4 px-4 md:px-6">
        {/* Avatar */}
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isUser ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
        }`}>
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">{isUser ? "You" : "Assistant"}</span>
            <span className="text-[11px] text-muted-foreground">{formatTime(message.created_at)}</span>
          </div>

          <div className="prose prose-sm max-w-none text-foreground dark:prose-invert [&_p]:my-1 [&_p]:leading-relaxed [&_pre]:rounded-lg [&_pre]:bg-secondary [&_code]:rounded [&_code]:bg-secondary [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[13px]">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>

          {/* Actions */}
          {!isUser && message.content && (
            <div className="mt-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
