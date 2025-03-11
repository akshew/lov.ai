import { useState } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import ThemeToggle from "@/components/theme/theme-toggle";
import { CharacterType } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Heart, User } from "lucide-react";

export default function CharacterSelect() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [character, setCharacter] = useState<CharacterType>("AI-GF");

  const handleStart = async () => {
    try {
      await apiRequest("POST", "/api/users", { 
        characterType: character,
        theme: "light"  // Default theme
      });
      setLocation("/chat");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create user profile",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-primary/10 to-background">
      <Card className="w-full max-w-md p-8 space-y-8 shadow-lg backdrop-blur-sm bg-card/80">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>

        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-primary">Choose Your AI Companion</h1>
          <p className="text-muted-foreground">Your personal AI friend is waiting to meet you</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Button
            variant={character === "AI-GF" ? "default" : "outline"}
            className={`h-32 flex flex-col items-center justify-center gap-2 ${
              character === "AI-GF" ? "bg-pink-500 hover:bg-pink-600" : ""
            }`}
            onClick={() => setCharacter("AI-GF")}
          >
            <Heart className="h-8 w-8" />
            <span>AI Girlfriend</span>
          </Button>

          <Button
            variant={character === "AI-BF" ? "default" : "outline"}
            className={`h-32 flex flex-col items-center justify-center gap-2 ${
              character === "AI-BF" ? "bg-blue-500 hover:bg-blue-600" : ""
            }`}
            onClick={() => setCharacter("AI-BF")}
          >
            <User className="h-8 w-8" />
            <span>AI Boyfriend</span>
          </Button>
        </div>

        <Button 
          className={`w-full h-12 text-lg font-semibold ${
            character === "AI-GF" ? "bg-pink-500 hover:bg-pink-600" : "bg-blue-500 hover:bg-blue-600"
          }`}
          onClick={handleStart}
        >
          Start Chat
        </Button>
      </Card>
    </div>
  );
}