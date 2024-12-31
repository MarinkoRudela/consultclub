import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Navigation } from "@/components/Navigation";
import { AuthForm } from "@/components/auth/AuthForm";
import { Session } from "@supabase/supabase-js";
import { toast } from "@/components/ui/use-toast";

const Login = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      // Keep this log as it's critical for debugging auth state changes
      console.log('Auth state changed:', event, currentSession?.user?.email);
      if (event === 'SIGNED_IN' && currentSession) {
        setSession(currentSession);
        toast({
          title: "Welcome back!",
          description: "You have been successfully logged in.",
        });
        navigate("/dashboard");
      }
    });

    // Check for existing session
    const checkSession = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (currentSession) {
          setSession(currentSession);
          navigate("/dashboard");
        }
      } catch (error: any) {
        console.error('Session check failed:', error);
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setIsAuthReady(true);
      }
    };

    checkSession();

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-medspa-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-medspa-50 to-white">
      <Navigation session={session} />
      <div className="container max-w-md mx-auto px-4 py-8">
        {isAuthReady && <Header />}
        <AuthForm session={session} />
      </div>
    </div>
  );
};

export default Login;
