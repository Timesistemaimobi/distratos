"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Building2, ArrowRight, Mail, Lock, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success("Login realizado com sucesso");
    router.push("/dashboard");
    router.refresh();
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen w-full flex bg-white dark:bg-zinc-950 font-sans selection:bg-blue-500/30 overflow-hidden">
      {/* Left Column - Decorative */}
      <div className="hidden lg:flex w-[55%] relative overflow-hidden bg-zinc-950 items-center justify-center border-r border-zinc-800/50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/40 via-zinc-950 to-zinc-950" />
        
        {/* Animated blobs */}
        <div className="absolute top-[-10%] -left-10 w-[600px] h-[600px] bg-blue-600/30 rounded-full mix-blend-screen filter blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full mix-blend-screen filter blur-[100px] animate-pulse" style={{ animationDuration: '10s', animationDelay: "1s" }} />
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] [mask-image:linear-gradient(to_bottom,white,transparent)]" />

        <div className="relative z-20 flex flex-col items-center text-center px-16 max-w-2xl">
          <div className="h-20 w-20 bg-white/5 backdrop-blur-3xl rounded-3xl flex items-center justify-center mb-10 shadow-2xl border border-white/10 ring-1 ring-white/5">
            <Building2 className="w-10 h-10 text-blue-400" strokeWidth={1.5} />
          </div>
          <h1 className="text-4xl md:text-6xl font-medium tracking-tight text-white mb-6 leading-tight">
            Gestão inteligente <br/> de <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 font-semibold">Distratos</span>
          </h1>
          <p className="text-zinc-400 text-lg md:text-xl font-light leading-relaxed max-w-lg">
            Acompanhe processos, exporte relatórios precisos e controle o status de forma simples, rápida e segura.
          </p>
        </div>
      </div>

      {/* Right Column - Form */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-8 relative bg-zinc-50 dark:bg-zinc-950">
        
        {/* Mobile background decor */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-900/10 dark:to-transparent lg:hidden" />
        
        <div className="w-full max-w-[400px] relative z-10 space-y-10">
          <div className="flex flex-col space-y-3">
            <div className="lg:hidden flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white mb-6 shadow-lg shadow-blue-600/20">
              <Building2 size={28} strokeWidth={1.5} />
            </div>
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">
              Acesso à plataforma
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-base">
              Entre com suas credenciais corporativas.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-5">
              <div className="space-y-2.5">
                <Label htmlFor="email" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  E-mail
                </Label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-zinc-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="nome@empresa.com.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-11 h-14 bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm text-base"
                  />
                </div>
              </div>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Senha
                  </Label>
                  <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 transition-colors">
                    Esqueceu a senha?
                  </a>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-zinc-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-11 h-14 bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm text-base"
                  />
                </div>
              </div>
            </div>

            <Button 
              className="w-full h-14 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 text-white rounded-2xl text-base font-medium transition-all group shadow-xl shadow-zinc-900/10 dark:shadow-white/10 hover:shadow-2xl disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98]" 
              type="submit" 
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <>
                  Entrar
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>

          <div className="pt-6 border-t border-zinc-200/60 dark:border-zinc-800/60">
            <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
              Sistema protegido por criptografia e monitoramento de segurança.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
