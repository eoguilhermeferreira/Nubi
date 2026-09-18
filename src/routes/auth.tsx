import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Toaster } from "../components/ui/sonner";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Entrar na Nubi.ia" },
      {
        name: "description",
        content:
          "Acesse sua conta Nubi.ia para retomar suas conversas com histórico salvo e sincronizado.",
      },
      { property: "og:title", content: "Entrar na Nubi.ia" },
      {
        property: "og:description",
        content: "Acesse sua conta Nubi.ia e retome suas conversas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        navigate({ to: "/", replace: true });
      } else {
        setChecking(false);
      }
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: name.trim() || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("Conta criada");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
      }
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        navigate({ to: "/", replace: true });
      } else {
        toast.info("Confirme seu e-mail para acessar a Nubi.ia.");
      }
    } catch (err) {
      console.error("[auth]", err);
      const message = err instanceof Error ? err.message : "";
      toast.error(
        message.toLowerCase().includes("invalid login")
          ? "E-mail ou senha inválidos"
          : mode === "signup"
            ? "Não foi possível criar a conta"
            : "Não foi possível entrar",
      );
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        console.error("[auth:google]", result.error);
        toast.error("Não foi possível entrar com o Google");
        setBusy(false);
        return;
      }
      if (result.redirected) return;
      navigate({ to: "/", replace: true });
    } catch (err) {
      console.error("[auth:google]", err);
      toast.error("Não foi possível entrar com o Google");
      setBusy(false);
    }
  };

  if (checking) {
    return (
      <div className="flex h-dvh w-screen items-center justify-center bg-[#050B14]">
        <Loader2 className="w-4 h-4 text-slate-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-dvh w-screen items-center justify-center bg-[#050B14] text-slate-100 font-sans antialiased px-4">
      <Toaster position="top-right" theme="dark" />

      <div className="w-full max-w-[360px]">
        <div className="mb-8 text-center">
          <div className="w-9 h-9 rounded-lg bg-[#0A1424] border border-[#0F1C30] text-slate-200 text-sm font-semibold flex items-center justify-center mx-auto mb-4">
            N
          </div>
          <h1 className="text-lg font-medium text-slate-100">
            {mode === "login" ? "Entrar na Nubi.ia" : "Criar conta na Nubi.ia"}
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Suas conversas ficam salvas e sincronizadas.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "signup" && (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome"
              autoComplete="name"
              className="w-full bg-[#091322] border border-[#0F1C30] rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-[#1B2F4C] transition-colors"
            />
          )}
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-mail"
            autoComplete="email"
            className="w-full bg-[#091322] border border-[#0F1C30] rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-[#1B2F4C] transition-colors"
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            className="w-full bg-[#091322] border border-[#0F1C30] rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-[#1B2F4C] transition-colors"
          />

          <button
            type="submit"
            disabled={busy}
            className="w-full flex items-center justify-center gap-2 bg-[#12223C] hover:bg-[#172C4D] disabled:opacity-50 text-slate-100 text-sm font-medium rounded-lg px-3 py-2.5 transition-colors"
          >
            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {mode === "login" ? "Entrar" : "Criar conta"}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3 text-[11px] text-slate-600">
          <div className="h-px flex-1 bg-[#0F1C30]" />
          ou
          <div className="h-px flex-1 bg-[#0F1C30]" />
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={busy}
          className="w-full bg-[#0A1424] hover:bg-[#0F1E36] border border-[#0F1C30] disabled:opacity-50 text-slate-200 text-sm rounded-lg px-3 py-2.5 transition-colors"
        >
          Continuar com Google
        </button>

        <p className="mt-6 text-center text-xs text-slate-500">
          {mode === "login" ? "Ainda não tem conta?" : "Já tem uma conta?"}{" "}
          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="text-slate-300 hover:text-white transition-colors"
          >
            {mode === "login" ? "Criar conta" : "Entrar"}
          </button>
        </p>
      </div>
    </div>
  );
}
