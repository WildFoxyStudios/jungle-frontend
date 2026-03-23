"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, Loader2, Mail } from "lucide-react";
import { authApi } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { Button } from "@/components/ui/button";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<
    "loading" | "success" | "error" | "no-token"
  >("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [resent, setResent] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("no-token");
      return;
    }
    authApi
      .verifyEmail(token)
      .then(() => setStatus("success"))
      .catch((e) => {
        setErrorMsg(getErrorMessage(e));
        setStatus("error");
      });
  }, [token]);

  const resend = async () => {
    setResending(true);
    try {
      await authApi.resendVerification("");
      setResent(true);
    } catch {
      // silent
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-indigo-950 via-indigo-800 to-purple-900 p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-fade-in-up">
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 text-center">
          {/* ── Loading ───────────────────────────────────────────────── */}
          {status === "loading" && (
            <>
              <Loader2
                size={48}
                className="animate-spin text-indigo-600 mx-auto mb-4"
              />
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Verificando tu correo…
              </h2>
              <p className="text-sm text-slate-500 mt-2">
                Por favor espera un momento.
              </p>
            </>
          )}

          {/* ── Success ───────────────────────────────────────────────── */}
          {status === "success" && (
            <>
              <div className="w-16 h-16 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                ¡Email verificado!
              </h2>
              <p className="text-sm text-slate-500 mb-6">
                Tu cuenta ha sido verificada exitosamente. Ya puedes iniciar
                sesión.
              </p>
              <Link href="/login">
                <Button className="w-full" size="lg" rounded>
                  Ir a iniciar sesión
                </Button>
              </Link>
            </>
          )}

          {/* ── Error ─────────────────────────────────────────────────── */}
          {status === "error" && (
            <>
              <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                <XCircle size={32} className="text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Error al verificar
              </h2>
              <p className="text-sm text-slate-500 mb-6">
                {errorMsg || "El enlace es inválido o ha expirado."}
              </p>
              {!resent ? (
                <Button
                  onClick={resend}
                  loading={resending}
                  variant="secondary"
                  className="w-full"
                  leftIcon={<Mail size={16} />}
                >
                  Reenviar correo de verificación
                </Button>
              ) : (
                <p className="text-sm text-green-600 font-medium">
                  ¡Correo reenviado! Revisa tu bandeja de entrada.
                </p>
              )}
              <div className="mt-4">
                <Link
                  href="/login"
                  className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                >
                  Volver al inicio de sesión
                </Link>
              </div>
            </>
          )}

          {/* ── No token ──────────────────────────────────────────────── */}
          {status === "no-token" && (
            <>
              <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
                <Mail size={32} className="text-amber-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Revisa tu correo
              </h2>
              <p className="text-sm text-slate-500 mb-6">
                Hemos enviado un enlace de verificación a tu correo electrónico.
                Haz clic en el enlace para activar tu cuenta.
              </p>
              <Link href="/login">
                <Button variant="secondary" className="w-full">
                  Ir al inicio de sesión
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
