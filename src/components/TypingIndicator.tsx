import { Bot } from "lucide-react";

export function TypingIndicator() {
  return (
    <div className="flex gap-4 bg-chat-assistant px-4 py-6 md:px-8">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground">
        <Bot className="h-4 w-4" />
      </div>
      <div className="flex items-center gap-1.5 pt-2">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="h-2 w-2 rounded-full bg-muted-foreground animate-pulse-dot"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  );
}
