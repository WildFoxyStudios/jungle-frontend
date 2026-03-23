"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Mail, Lock, LogIn } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getErrorMessage } from "@/lib/errors";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const schema = z.object({
  email_or_username: z.string().min(1, "Ingresa tu email o usuario"),
  password: z.string().min(1, "Ingresa tu contraseña"),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { login, pending2FAToken, verify2FA } = useAuth();
  const [showPass, setShowPass] = useState(false);
  const [serverError, setServerError] = useState("");
  const [twoFACode, setTwoFACode] = useState("");
  const [twoFALoading, setTwoFALoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setServerError("");
    try {
      await login(data);
    } catch (e) {
      setServerError(getErrorMessage(e));
    }
  };

  const handle2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setTwoFALoading(true);
    try {
      await verify2FA(twoFACode);
    } catch (e) {
      setServerError(getErrorMessage(e));
    } finally {
      setTwoFALoading(false);
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
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-white/10 backdrop-blur items-center justify-center mb-4">
            <span className="text-white font-black text-3xl">S</span>
          </div>
          <h1 className="text-3xl font-black text-white">Social</h1>
          <p className="text-indigo-200 mt-1">
            Conecta con tus amigos y el mundo
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8">
          {pending2FAToken ? (
            /* ── 2FA verification ── */
            <form onSubmit={handle2FA} className="space-y-5">
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mx-auto mb-3">
                  <Lock size={24} className="text-indigo-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Verificación en dos pasos
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Ingresa el código de tu app de autenticación
                </p>
              </div>

              <div>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  placeholder="000000"
                  value={twoFACode}
                  onChange={(e) =>
                    setTwoFACode(e.target.value.replace(/\D/g, ""))
                  }
                  className="input-base text-center text-2xl font-mono tracking-[0.5em]"
                  autoFocus
                />
              </div>

              {serverError && (
                <p className="text-sm text-red-500 text-center">
                  {serverError}
                </p>
              )}

              <Button
                type="submit"
                loading={twoFALoading}
                className="w-full"
                size="lg"
                rounded
              >
                Verificar
              </Button>
            </form>
          ) : (
            /* ── Login form ── */
            <>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                Iniciar sesión
              </h2>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                  {...register("email_or_username")}
                  label="Correo o usuario"
                  placeholder="correo@ejemplo.com"
                  type="text"
                  autoComplete="username"
                  leftIcon={<Mail size={16} />}
                  error={errors.email_or_username?.message}
                />

                <div>
                  <Input
                    {...register("password")}
                    label="Contraseña"
                    placeholder="••••••••"
                    type={showPass ? "text" : "password"}
                    autoComplete="current-password"
                    leftIcon={<Lock size={16} />}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowPass((v) => !v)}
                        className="hover:text-slate-600 transition-colors"
                      >
                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    }
                    error={errors.password?.message}
                  />
                  <div className="flex justify-end mt-1.5">
                    <Link
                      href="/forgot-password"
                      className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>
                </div>

                {serverError && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl text-sm text-red-600 dark:text-red-400 font-medium">
                    {serverError}
                  </div>
                )}

                <Button
                  type="submit"
                  loading={isSubmitting}
                  leftIcon={<LogIn size={18} />}
                  className="w-full"
                  size="lg"
                  rounded
                >
                  Iniciar sesión
                </Button>
              </form>

              <div className="relative my-6">
                <hr className="border-slate-200 dark:border-slate-700" />
                <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-white dark:bg-gray-900 px-3 text-xs text-slate-400">
                  o
                </span>
              </div>

              <p className="text-center text-sm text-slate-600 dark:text-slate-400">
                ¿No tienes cuenta?{" "}
                <Link
                  href="/register"
                  className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Regístrate gratis
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
