"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { authApi } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const schema = z.object({ email: z.string().email("Ingresa un email válido") });
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setServerError("");
    try {
      await authApi.forgotPassword(data.email);
      setSent(true);
    } catch (e) {
      setServerError(getErrorMessage(e));
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
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                ¡Correo enviado!
              </h2>
              <p className="text-sm text-slate-500 mb-6">
                Enviamos un enlace de recuperación a{" "}
                <strong>{getValues("email")}</strong>. Revisa tu bandeja de
                entrada.
              </p>
              <Link href="/login">
                <Button
                  variant="secondary"
                  leftIcon={<ArrowLeft size={16} />}
                  className="w-full"
                  size="lg"
                  rounded
                >
                  Volver al inicio de sesión
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <Link
                  href="/login"
                  className="text-sm text-slate-500 hover:text-indigo-600 flex items-center gap-1 mb-4 transition-colors"
                >
                  <ArrowLeft size={15} /> Volver
                </Link>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Recuperar contraseña
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Te enviaremos un enlace para restablecer tu contraseña.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                  {...register("email")}
                  label="Correo electrónico"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  leftIcon={<Mail size={16} />}
                  error={errors.email?.message}
                  autoComplete="email"
                  autoFocus
                />

                {serverError && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl text-sm text-red-600 dark:text-red-400 font-medium">
                    {serverError}
                  </div>
                )}

                <Button
                  type="submit"
                  loading={isSubmitting}
                  leftIcon={<Mail size={18} />}
                  className="w-full"
                  size="lg"
                  rounded
                >
                  Enviar enlace
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
