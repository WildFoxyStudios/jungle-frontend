"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Mail, Lock, User, UserPlus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getErrorMessage } from "@/lib/errors";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const schema = z
  .object({
    full_name: z.string().min(2, "Mínimo 2 caracteres").max(60),
    username: z
      .string()
      .min(3, "Mínimo 3 caracteres")
      .max(30)
      .regex(/^[a-zA-Z0-9_]+$/, "Solo letras, números y _"),
    email: z.string().email("Email inválido"),
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

export default function RegisterPage() {
  const { register: authRegister } = useAuth();
  const [showPass, setShowPass] = useState(false);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const password = watch("password", "");
  const strength = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^a-zA-Z0-9]/.test(password),
  ].filter(Boolean).length;

  const strengthLabels = ["", "Débil", "Regular", "Buena", "Fuerte"];
  const strengthColors = [
    "",
    "bg-red-500",
    "bg-amber-500",
    "bg-blue-500",
    "bg-green-500",
  ];

  const onSubmit = async (data: FormData) => {
    setServerError("");
    try {
      await authRegister({
        email: data.email,
        username: data.username,
        password: data.password,
        full_name: data.full_name,
      });
    } catch (e) {
      setServerError(getErrorMessage(e));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-indigo-950 via-indigo-800 to-purple-900 p-4 py-8">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-fade-in-up">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-white/10 backdrop-blur items-center justify-center mb-3">
            <span className="text-white font-black text-2xl">S</span>
          </div>
          <h1 className="text-2xl font-black text-white">Crear cuenta</h1>
          <p className="text-indigo-200 text-sm mt-1">
            Únete a nuestra comunidad
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              {...register("full_name")}
              label="Nombre completo"
              placeholder="Ana García"
              leftIcon={<User size={16} />}
              error={errors.full_name?.message}
              autoComplete="name"
            />
            <Input
              {...register("username")}
              label="Nombre de usuario"
              placeholder="ana_garcia"
              leftIcon={
                <span className="text-slate-400 font-medium text-sm">@</span>
              }
              error={errors.username?.message}
              autoComplete="username"
            />
            <Input
              {...register("email")}
              label="Correo electrónico"
              type="email"
              placeholder="ana@ejemplo.com"
              leftIcon={<Mail size={16} />}
              error={errors.email?.message}
              autoComplete="email"
            />
            <div>
              <Input
                {...register("password")}
                label="Contraseña"
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
              {password && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          i <= strength
                            ? strengthColors[strength]
                            : "bg-slate-200 dark:bg-slate-700"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-slate-500">
                    {strengthLabels[strength]}
                  </p>
                </div>
              )}
            </div>
            <Input
              {...register("confirm")}
              label="Confirmar contraseña"
              type="password"
              placeholder="Repite tu contraseña"
              leftIcon={<Lock size={16} />}
              error={errors.confirm?.message}
              autoComplete="new-password"
            />

            {serverError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl text-sm text-red-600 dark:text-red-400 font-medium">
                {serverError}
              </div>
            )}

            <p className="text-xs text-slate-500">
              Al crear tu cuenta aceptas nuestros{" "}
              <Link
                href="/terms"
                className="text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Términos de servicio
              </Link>{" "}
              y{" "}
              <Link
                href="/privacy"
                className="text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Política de privacidad
              </Link>
              .
            </p>

            <Button
              type="submit"
              loading={isSubmitting}
              leftIcon={<UserPlus size={18} />}
              className="w-full"
              size="lg"
              rounded
            >
              Crear cuenta
            </Button>
          </form>

          <div className="relative my-5">
            <hr className="border-slate-200 dark:border-slate-700" />
          </div>

          <p className="text-center text-sm text-slate-600 dark:text-slate-400">
            ¿Ya tienes cuenta?{" "}
            <Link
              href="/login"
              className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
