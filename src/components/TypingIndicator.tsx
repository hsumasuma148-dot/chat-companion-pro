import { Bot } from "lucide-react";

export function TypingIndicator() {
  return (
    <div className="w-full bg-chat-assistant py-6">
      <div className="mx-auto flex max-w-3xl gap-4 px-4 md:px-6">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground">
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
    </div>
  );
}
