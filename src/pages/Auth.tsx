import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Mail, Lock, ArrowRight, Loader2, Zap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = isLogin
      ? await signIn(email, password)
      : await signUp(email, password);

    if (error) {
      toast.error(error.message);
    } else if (!isLogin) {
      toast.success("Account created! You're now signed in.");
    }

    setLoading(false);
  };

  const handleDemoLogin = async () => {
    setDemoLoading(true);
    const demoEmail = `demo-${Date.now()}@demo.local`;
    const demoPassword = "demo-password-123";

    const { error: signUpError } = await signUp(demoEmail, demoPassword);
    if (signUpError) {
      // If signup fails, try signing in (account may already exist)
      const { error: signInError } = await signIn(demoEmail, demoPassword);
      if (signInError) {
        toast.error("Demo login failed. Please try again.");
        setDemoLoading(false);
        return;
      }
    }
    setDemoLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary"
          >
            <Bot className="h-8 w-8 text-primary-foreground" />
          </motion.div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">MistralChat</h1>
          <p className="mt-2 text-muted-foreground">Your AI-powered conversation partner</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-lg">
          {/* Demo Login Button */}
          <button
            onClick={handleDemoLogin}
            disabled={demoLoading}
            className="mb-6 flex w-full items-center justify-center gap-2 rounded-xl bg-secondary py-3 font-medium text-foreground transition-all hover:bg-accent disabled:opacity-50"
          >
            {demoLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Zap className="h-4 w-4 text-primary" />
                Try Demo — No Sign Up Required
              </>
            )}
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-2 text-muted-foreground">or continue with email</span>
            </div>
          </div>

          <div className="mb-6 flex rounded-xl bg-secondary p-1">
            {["Sign In", "Sign Up"].map((label, i) => (
              <button
                key={label}
                onClick={() => setIsLogin(i === 0)}
                className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all ${
                  (i === 0 ? isLogin : !isLogin)
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.form
              key={isLogin ? "login" : "signup"}
              initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isLogin ? 20 : -20 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full rounded-xl border border-input bg-background py-3 pl-10 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full rounded-xl border border-input bg-background py-3 pl-10 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-medium text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    {isLogin ? "Sign In" : "Create Account"}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </motion.form>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
