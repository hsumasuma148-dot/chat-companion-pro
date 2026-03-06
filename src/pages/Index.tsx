import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import Auth from "./Auth";
import Chat from "./Chat";

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return user ? <Chat /> : <Auth />;
};

export default Index;
