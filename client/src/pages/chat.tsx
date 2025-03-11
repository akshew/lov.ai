import { useEffect } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import MessageList from "@/components/chat/message-list";
import MessageInput from "@/components/chat/message-input";
import ThemeToggle from "@/components/theme/theme-toggle";
import { useWebSocket } from "@/lib/websocket";
import { useQuery } from "@tanstack/react-query";

export default function Chat() {
  const [, setLocation] = useLocation();
  const { messages, sendMessage, connected, isTyping } = useWebSocket();

  const { data: user, isLoading } = useQuery({ 
    queryKey: ["/api/users/current"]
  });

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background to-primary/5">
      <div className="flex justify-between items-center p-4 border-b bg-background/80 backdrop-blur-sm">
        <h1 className="text-xl font-semibold">
          {user?.characterType === "AI-GF" ? "AI Girlfriend" : "AI Boyfriend"}
        </h1>
        <ThemeToggle />
      </div>

      <div className="flex-1 flex justify-center items-start p-4 max-w-4xl mx-auto w-full">
        <Card className="w-full flex flex-col h-[calc(100vh-8rem)] shadow-lg bg-card/80 backdrop-blur-sm">
          <MessageList messages={messages} isTyping={isTyping} />
          <MessageInput 
            onSendMessage={sendMessage}
            disabled={!connected || isTyping}
          />
        </Card>
      </div>
    </div>
  );
}