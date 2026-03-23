"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lock, Eye, EyeOff, CheckCircle, ArrowLeft } from "lucide-react";
import { authApi } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const schema = z
  .object({
    password: z
      .string()
      .min(8, "Mínimo 8 caracteres")
      .regex(/[A-Z]/, "Debe tener al menos una mayúscula")
      .regex(/[0-9]/, "Debe tener al menos un número"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Las contraseñas no coinciden",
    path: ["confirm"],
  });

type FormData = z.infer<typeof schema>;

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [showPass, setShowPass] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    if (!token) {
      setServerError("Token inválido o expirado.");
      return;
    }
    setServerError("");
    try {
      await authApi.resetPassword(token, data.password);
      setSuccess(true);
    } catch (e) {
      setServerError(getErrorMessage(e));
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8">
      {success ? (
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            ¡Contraseña actualizada!
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            Tu contraseña ha sido restablecida correctamente.
          </p>
          <Link href="/login">
            <Button
              className="w-full"
              leftIcon={<ArrowLeft size={16} />}
              variant="secondary"
            >
              Ir al inicio de sesión
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Nueva contraseña
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Elige una contraseña segura para tu cuenta.
            </p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              {...register("password")}
              label="Nueva contraseña"
              type={showPass ? "text" : "password"}
              placeholder="Mínimo 8 caracteres"
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
              autoComplete="new-password"
            />
            <Input
              {...register("confirm")}
              label="Confirmar nueva contraseña"
              type="password"
              placeholder="Repite tu contraseña"
              leftIcon={<Lock size={16} />}
              error={errors.confirm?.message}
              autoComplete="new-password"
            />

            {!token && (
              <p className="text-sm text-amber-600">
                Token de recuperación no encontrado en la URL.
              </p>
            )}

            {serverError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl text-sm text-red-600 font-medium">
                {serverError}
              </div>
            )}

            <Button
              type="submit"
              loading={isSubmitting}
              disabled={!token}
              className="w-full"
              size="lg"
              rounded
            >
              Actualizar contraseña
            </Button>
          </form>
        </>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-indigo-950 via-indigo-800 to-purple-900 p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-fade-in-up">
        <Suspense
          fallback={
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 flex items-center justify-center min-h-[200px]">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
