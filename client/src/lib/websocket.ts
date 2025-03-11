import { useState, useEffect, useCallback } from "react";
import { ChatMessage, WebSocketMessage } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useWebSocket() {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setConnected(true);
    };

    ws.onclose = () => {
      setConnected(false);
    };

    ws.onmessage = (event) => {
      const message: WebSocketMessage = JSON.parse(event.data);
      if (message.type === "typing") {
        setIsTyping(message.data.isTyping);
      } else if (message.type === "message") {
        setIsTyping(false);
        setMessages((prev) => [...prev, message.data]);
      } else if (message.type === "error") {
        setIsTyping(false);
        toast({
          title: "Error",
          description: message.data.content,
          variant: "destructive",
        });
      }
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, [toast]);

  const sendMessage = useCallback(
    (content: string) => {
      if (socket?.readyState === WebSocket.OPEN && !isTyping) {
        socket.send(JSON.stringify({ content }));
        setMessages((prev) => [
          ...prev,
          { content, isAi: false, timestamp: new Date() },
        ]);
        setIsTyping(true);
      }
    },
    [socket, isTyping]
  );

  return { connected, messages, sendMessage, isTyping };
}