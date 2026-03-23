"use client";

import { useState, useEffect } from "react";
import {
  Shield,
  Bell,
  Lock,
  Monitor,
  Trash2,
  Download,
  LogOut,
  Eye,
  EyeOff,
  Smartphone,
  Globe,
  Users,
  MessageCircle,
  Tag,
  CheckCircle,
  AlertTriangle,
  Key,
  RefreshCw,
  MapPin,
  Clock,
  ChevronRight,
  Moon,
  Sun,
  Languages,
  Palette,
  Info,
} from "lucide-react";
import { settingsApi } from "@/lib/api-settings";
import { securityApi } from "@/lib/api-security";
import { notificationsApi } from "@/lib/api-notifications";
import { useApi, useMutation } from "@/hooks/useApi";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/lib/theme-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabList, Tab, TabPanel } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Modal } from "@/components/ui/modal";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, format } from "date-fns";
import { es } from "date-fns/locale";
import type {
  UserSettings,
  NotificationPreferences,
  LoginSession,
} from "@/lib/types";

// ─── Toggle component ─────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={cn(
        "relative inline-flex w-11 h-6 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
        checked ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-700",
        disabled && "opacity-50 cursor-not-allowed",
      )}
    >
      <span
        className={cn(
          "inline-block w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform duration-200 mt-0.5",
          checked ? "translate-x-5.5" : "translate-x-0.5",
        )}
        style={{ transform: checked ? "translateX(20px)" : "translateX(2px)" }}
      />
    </button>
  );
}

// ─── Select component ─────────────────────────────────────────────────────────

function Select({
  value,
  options,
  onChange,
  className,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn("input-base py-2 text-sm cursor-pointer", className)}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

// ─── Setting row component ────────────────────────────────────────────────────

function SettingRow({
  icon,
  label,
  description,
  children,
  danger,
}: {
  icon?: React.ReactNode;
  label: string;
  description?: string;
  children?: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        {icon && (
          <span
            className={cn(
              "mt-0.5 shrink-0",
              danger ? "text-red-500" : "text-slate-500 dark:text-slate-400",
            )}
          >
            {icon}
          </span>
        )}
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "text-sm font-medium",
              danger
                ? "text-red-600 dark:text-red-400"
                : "text-slate-800 dark:text-slate-100",
            )}
          >
            {label}
          </p>
          {description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>
      {children && <div className="shrink-0">{children}</div>}
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="surface p-5 mb-4 animate-fade-in-up">
      <div className="mb-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-50">
          {title}
        </h2>
        {description && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {description}
          </p>
        )}
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {children}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  return (
    <div className="max-w-[760px] mx-auto px-4 py-6 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
          <Shield size={20} className="text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-50">
            Configuración
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Gestiona tu cuenta, privacidad y preferencias
          </p>
        </div>
      </div>

      <Tabs defaultTab="privacy">
        <div className="surface mb-4 overflow-x-auto no-scrollbar">
          <TabList className="px-2 min-w-max">
            <Tab value="privacy">
              <span className="flex items-center gap-1.5">
                <Lock size={14} />
                Privacidad
              </span>
            </Tab>
            <Tab value="notifications">
              <span className="flex items-center gap-1.5">
                <Bell size={14} />
                Notificaciones
              </span>
            </Tab>
            <Tab value="security">
              <span className="flex items-center gap-1.5">
                <Shield size={14} />
                Seguridad
              </span>
            </Tab>
            <Tab value="appearance">
              <span className="flex items-center gap-1.5">
                <Palette size={14} />
                Apariencia
              </span>
            </Tab>
            <Tab value="sessions">
              <span className="flex items-center gap-1.5">
                <Monitor size={14} />
                Sesiones
              </span>
            </Tab>
            <Tab value="data">
              <span className="flex items-center gap-1.5">
                <Download size={14} />
                Mis datos
              </span>
            </Tab>
          </TabList>
        </div>

        <TabPanel value="privacy">
          <PrivacyTab />
        </TabPanel>
        <TabPanel value="notifications">
          <NotificationsTab />
        </TabPanel>
        <TabPanel value="security">
          <SecurityTab />
        </TabPanel>
        <TabPanel value="appearance">
          <AppearanceTab />
        </TabPanel>
        <TabPanel value="sessions">
          <SessionsTab />
        </TabPanel>
        <TabPanel value="data">
          <DataTab />
        </TabPanel>
      </Tabs>
    </div>
  );
}

// ─── Privacy tab ──────────────────────────────────────────────────────────────

function PrivacyTab() {
  const toast = useToast();
  const { data: settings, loading } = useApi(() => settingsApi.get(), []);
  const [local, setLocal] = useState<Partial<UserSettings>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) setLocal(settings);
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsApi.update(local);
      toast.success("Ajustes de privacidad guardados");
    } catch {
      toast.error("Error al guardar los ajustes");
    } finally {
      setSaving(false);
    }
  };

  const set = (key: keyof UserSettings, value: unknown) => {
    setLocal((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="surface p-5 space-y-4">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="flex justify-between items-center py-2">
                <div className="space-y-2">
                  <Skeleton className="h-3.5 w-40" />
                  <Skeleton className="h-2.5 w-60" />
                </div>
                <Skeleton className="h-6 w-11" />
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  const visOpts = [
    { value: "public", label: "Público" },
    { value: "friends", label: "Amigos" },
    { value: "only_me", label: "Solo yo" },
  ];

  const msgOpts = [
    { value: "everyone", label: "Todos" },
    { value: "friends", label: "Solo amigos" },
    { value: "nobody", label: "Nadie" },
  ];

  return (
    <div className="space-y-4">
      {/* Profile visibility */}
      <SettingsSection
        title="Visibilidad del perfil"
        description="Controla quién puede ver tu información personal"
      >
        <SettingRow
          icon={<Globe size={17} />}
          label="Visibilidad del perfil"
          description="Quién puede ver tu perfil y publicaciones"
        >
          <Select
            value={local.profile_visibility ?? "friends"}
            options={visOpts}
            onChange={(v) => set("profile_visibility", v)}
            className="w-36"
          />
        </SettingRow>

        <SettingRow
          icon={<Eye size={17} />}
          label="Visibilidad en búsquedas"
          description="Permite que otros te encuentren por nombre o correo"
        >
          <Select
            value={local.search_visibility ?? "friends"}
            options={visOpts}
            onChange={(v) => set("search_visibility", v)}
            className="w-36"
          />
        </SettingRow>

        <SettingRow
          icon={<Clock size={17} />}
          label="Mostrar estado en línea"
          description="Permite que tus amigos vean cuándo estás activo"
        >
          <Toggle
            checked={local.online_status_visible ?? true}
            onChange={(v) => set("online_status_visible", v)}
          />
        </SettingRow>

        <SettingRow
          icon={<Monitor size={17} />}
          label="Mostrar actividad reciente"
          description="Muestra cuándo fue tu última conexión"
        >
          <Toggle
            checked={local.show_active_status ?? true}
            onChange={(v) => set("show_active_status", v)}
          />
        </SettingRow>
      </SettingsSection>

      {/* Interactions */}
      <SettingsSection
        title="Interacciones"
        description="Controla quién puede interactuar contigo"
      >
        <SettingRow
          icon={<Users size={17} />}
          label="Solicitudes de amistad"
          description="Quién puede enviarte solicitudes de amistad"
        >
          <Select
            value={local.who_can_send_requests ?? "everyone"}
            options={[
              { value: "everyone", label: "Todos" },
              { value: "friends_of_friends", label: "Amigos de amigos" },
              { value: "nobody", label: "Nadie" },
            ]}
            onChange={(v) => set("who_can_send_requests", v)}
            className="w-44"
          />
        </SettingRow>

        <SettingRow
          icon={<MessageCircle size={17} />}
          label="Mensajes directos"
          description="Quién puede enviarte mensajes directos"
        >
          <Select
            value={local.who_can_message ?? "friends"}
            options={msgOpts}
            onChange={(v) => set("who_can_message", v)}
            className="w-36"
          />
        </SettingRow>

        <SettingRow
          icon={<Users size={17} />}
          label="Ver lista de amigos"
          description="Quién puede ver tu lista de amigos"
        >
          <Select
            value={local.who_can_see_friends ?? "friends"}
            options={visOpts}
            onChange={(v) => set("who_can_see_friends", v)}
            className="w-36"
          />
        </SettingRow>

        <SettingRow
          icon={<Eye size={17} />}
          label="Ver publicaciones"
          description="Quién puede ver tus publicaciones por defecto"
        >
          <Select
            value={local.who_can_see_posts ?? "friends"}
            options={visOpts}
            onChange={(v) => set("who_can_see_posts", v)}
            className="w-36"
          />
        </SettingRow>

        <SettingRow
          icon={<MessageCircle size={17} />}
          label="Comentar en mis publicaciones"
          description="Quién puede comentar en tus publicaciones"
        >
          <Select
            value={local.who_can_comment ?? "friends"}
            options={[
              { value: "public", label: "Todos" },
              { value: "friends", label: "Amigos" },
              { value: "only_me", label: "Nadie" },
            ]}
            onChange={(v) => set("who_can_comment", v)}
            className="w-36"
          />
        </SettingRow>

        <SettingRow
          icon={<Tag size={17} />}
          label="Etiquetarme"
          description="Quién puede etiquetarte en publicaciones y fotos"
        >
          <Select
            value={local.who_can_tag ?? "friends"}
            options={visOpts}
            onChange={(v) => set("who_can_tag", v)}
            className="w-36"
          />
        </SettingRow>
      </SettingsSection>

      {/* Save button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} loading={saving} size="lg" rounded>
          Guardar cambios
        </Button>
      </div>
    </div>
  );
}

// ─── Notifications tab ────────────────────────────────────────────────────────

function NotificationsTab() {
  const toast = useToast();
  const { data: prefs, loading } = useApi(
    () => notificationsApi.getPreferences(),
    [],
  );
  const [local, setLocal] = useState<Partial<NotificationPreferences>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (prefs) setLocal(prefs);
  }, [prefs]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await notificationsApi.updatePreferences(local);
      toast.success("Preferencias de notificaciones guardadas");
    } catch {
      toast.error("Error al guardar las preferencias");
    } finally {
      setSaving(false);
    }
  };

  const set = (key: keyof NotificationPreferences, value: boolean) => {
    setLocal((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="surface p-5 space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex justify-between items-center py-2">
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-44" />
              <Skeleton className="h-2.5 w-64" />
            </div>
            <Skeleton className="h-6 w-11" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Email notifications */}
      <SettingsSection
        title="Notificaciones por correo"
        description="Recibe un correo electrónico cuando ocurra alguna de estas acciones"
      >
        <SettingRow
          icon={<Users size={17} />}
          label="Solicitudes de amistad"
          description="Cuando alguien te envíe una solicitud de amistad"
        >
          <Toggle
            checked={local.email_friend_requests ?? true}
            onChange={(v) => set("email_friend_requests", v)}
          />
        </SettingRow>

        <SettingRow
          icon={<Eye size={17} />}
          label="Interacciones en publicaciones"
          description="Reacciones y menciones en tus publicaciones"
        >
          <Toggle
            checked={local.email_post_interactions ?? true}
            onChange={(v) => set("email_post_interactions", v)}
          />
        </SettingRow>

        <SettingRow
          icon={<MessageCircle size={17} />}
          label="Comentarios"
          description="Cuando alguien comente en tus publicaciones"
        >
          <Toggle
            checked={local.email_comments ?? true}
            onChange={(v) => set("email_comments", v)}
          />
        </SettingRow>

        <SettingRow
          icon={<Tag size={17} />}
          label="Etiquetas"
          description="Cuando alguien te etiquete en una publicación o foto"
        >
          <Toggle
            checked={local.email_tags ?? true}
            onChange={(v) => set("email_tags", v)}
          />
        </SettingRow>

        <SettingRow
          icon={<Globe size={17} />}
          label="Eventos"
          description="Invitaciones a eventos y recordatorios"
        >
          <Toggle
            checked={local.email_events ?? true}
            onChange={(v) => set("email_events", v)}
          />
        </SettingRow>
      </SettingsSection>

      {/* Push notifications */}
      <SettingsSection
        title="Notificaciones push"
        description="Notificaciones en el navegador y dispositivos móviles"
      >
        <SettingRow icon={<Users size={17} />} label="Solicitudes de amistad">
          <Toggle
            checked={local.push_friend_requests ?? true}
            onChange={(v) => set("push_friend_requests", v)}
          />
        </SettingRow>

        <SettingRow
          icon={<Eye size={17} />}
          label="Interacciones en publicaciones"
        >
          <Toggle
            checked={local.push_post_interactions ?? true}
            onChange={(v) => set("push_post_interactions", v)}
          />
        </SettingRow>

        <SettingRow icon={<MessageCircle size={17} />} label="Comentarios">
          <Toggle
            checked={local.push_comments ?? true}
            onChange={(v) => set("push_comments", v)}
          />
        </SettingRow>

        <SettingRow icon={<Tag size={17} />} label="Etiquetas">
          <Toggle
            checked={local.push_tags ?? true}
            onChange={(v) => set("push_tags", v)}
          />
        </SettingRow>

        <SettingRow icon={<Globe size={17} />} label="Eventos">
          <Toggle
            checked={local.push_events ?? true}
            onChange={(v) => set("push_events", v)}
          />
        </SettingRow>

        <SettingRow
          icon={<MessageCircle size={17} />}
          label="Mensajes directos"
          description="Notificaciones de nuevos mensajes"
        >
          <Toggle
            checked={local.push_messages ?? true}
            onChange={(v) => set("push_messages", v)}
          />
        </SettingRow>
      </SettingsSection>

      {/* Save */}
      <div className="flex justify-end">
        <Button onClick={handleSave} loading={saving} size="lg" rounded>
          Guardar cambios
        </Button>
      </div>
    </div>
  );
}

// ─── Security tab ─────────────────────────────────────────────────────────────

function SecurityTab() {
  const toast = useToast();
  const [setupOpen, setSetupOpen] = useState(false);
  const [disableOpen, setDisableOpen] = useState(false);
  const [setupData, setSetupData] = useState<{
    qr_code_url: string;
    secret: string;
    backup_codes: string[];
  } | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [loading2FA, setLoading2FA] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackup, setShowBackup] = useState(false);

  const { data: settings } = useApi(() => settingsApi.get(), []);
  const is2FAEnabled = settings?.two_factor_enabled ?? false;

  const handleSetup2FA = async () => {
    setLoading2FA(true);
    try {
      const data = await securityApi.setup2FA();
      setSetupData(data);
      setSetupOpen(true);
    } catch {
      toast.error("Error al configurar 2FA");
    } finally {
      setLoading2FA(false);
    }
  };

  const handleEnable2FA = async () => {
    if (!verifyCode || verifyCode.length !== 6) {
      toast.error("Ingresa el código de 6 dígitos");
      return;
    }
    setLoading2FA(true);
    try {
      const result = await securityApi.enable2FA({ code: verifyCode });
      setBackupCodes(result.backup_codes);
      setSetupOpen(false);
      setShowBackup(true);
      toast.success("Autenticación en dos pasos activada");
    } catch {
      toast.error("Código incorrecto. Intenta de nuevo.");
    } finally {
      setLoading2FA(false);
    }
  };

  const handleDisable2FA = async () => {
    setLoading2FA(true);
    try {
      await securityApi.disable2FA({ code: verifyCode, password: "" });
      setDisableOpen(false);
      setVerifyCode("");
      toast.success("Autenticación en dos pasos desactivada");
    } catch {
      toast.error("Código incorrecto");
    } finally {
      setLoading2FA(false);
    }
  };

  const handleRegenerateCodes = async () => {
    try {
      const result = await securityApi.regenerateBackupCodes();
      setBackupCodes(result.backup_codes);
      setShowBackup(true);
      toast.success("Códigos de respaldo regenerados");
    } catch {
      toast.error("Error al regenerar códigos");
    }
  };

  return (
    <div className="space-y-4">
      {/* 2FA */}
      <SettingsSection
        title="Autenticación en dos pasos (2FA)"
        description="Agrega una capa extra de seguridad a tu cuenta"
      >
        <SettingRow
          icon={<Smartphone size={17} />}
          label="Autenticador de dos pasos"
          description={
            is2FAEnabled
              ? "Tu cuenta está protegida con 2FA."
              : "Usa una app de autenticación (Google Authenticator, Authy, etc.)"
          }
        >
          <div className="flex items-center gap-2">
            {is2FAEnabled ? (
              <>
                <Badge variant="success" dot>
                  Activo
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDisableOpen(true)}
                  className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  Desactivar
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                leftIcon={<Shield size={14} />}
                onClick={handleSetup2FA}
                loading={loading2FA}
              >
                Activar
              </Button>
            )}
          </div>
        </SettingRow>

        {is2FAEnabled && (
          <SettingRow
            icon={<Key size={17} />}
            label="Códigos de respaldo"
            description="Úsalos si pierdes acceso a tu app de autenticación"
          >
            <Button
              size="sm"
              variant="secondary"
              leftIcon={<RefreshCw size={13} />}
              onClick={handleRegenerateCodes}
            >
              Regenerar
            </Button>
          </SettingRow>
        )}
      </SettingsSection>

      {/* Password */}
      <SettingsSection
        title="Contraseña"
        description="Mantén tu contraseña segura y actualizada"
      >
        <SettingRow
          icon={<Lock size={17} />}
          label="Cambiar contraseña"
          description="Recomendamos usar una contraseña única de al menos 12 caracteres"
        >
          <Button
            size="sm"
            variant="secondary"
            rightIcon={<ChevronRight size={14} />}
            onClick={() =>
              toast.info("Recibirás un correo para cambiar tu contraseña")
            }
          >
            Cambiar
          </Button>
        </SettingRow>
      </SettingsSection>

      {/* Login alerts */}
      <SettingsSection
        title="Alertas de inicio de sesión"
        description="Recibe notificaciones cuando se inicie sesión en tu cuenta"
      >
        <SettingRow
          icon={<AlertTriangle size={17} />}
          label="Alertas de inicio de sesión"
          description="Notificación por correo cuando alguien acceda desde un nuevo dispositivo"
        >
          <Toggle
            checked={settings?.login_alerts ?? true}
            onChange={() => {}}
          />
        </SettingRow>
      </SettingsSection>

      {/* Setup 2FA modal */}
      <Modal
        open={setupOpen}
        onClose={() => setSetupOpen(false)}
        title="Configurar autenticación en dos pasos"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setSetupOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEnable2FA} loading={loading2FA}>
              Verificar y activar
            </Button>
          </>
        }
      >
        {setupData && (
          <div className="space-y-6">
            <div className="flex flex-col items-center gap-4">
              <p className="text-sm text-slate-600 dark:text-slate-300 text-center">
                Escanea este código QR con tu app de autenticación (Google
                Authenticator, Authy, etc.)
              </p>
              {setupData.qr_code_url && (
                <div className="w-48 h-48 border-2 border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-white flex items-center justify-center">
                  <img
                    src={setupData.qr_code_url}
                    alt="QR Code 2FA"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              <div className="w-full p-3 bg-slate-100 dark:bg-gray-800 rounded-xl text-center">
                <p className="text-xs text-slate-500 mb-1">
                  O ingresa este código manualmente:
                </p>
                <code className="text-sm font-mono font-bold text-slate-800 dark:text-slate-100 tracking-widest">
                  {setupData.secret}
                </code>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Ingresa el código de verificación de la app
              </p>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                placeholder="000000"
                value={verifyCode}
                onChange={(e) =>
                  setVerifyCode(e.target.value.replace(/\D/g, ""))
                }
                className="input-base text-center text-2xl font-mono tracking-[0.5em]"
                autoFocus
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Disable 2FA modal */}
      <Modal
        open={disableOpen}
        onClose={() => setDisableOpen(false)}
        title="Desactivar autenticación en dos pasos"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDisableOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleDisable2FA}
              loading={loading2FA}
            >
              Desactivar 2FA
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
            <AlertTriangle
              size={18}
              className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"
            />
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Desactivar 2FA hará tu cuenta menos segura. Asegúrate de que esto
              es lo que quieres hacer.
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Código de verificación
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder="000000"
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ""))}
              className="input-base text-center text-xl font-mono tracking-[0.4em]"
              autoFocus
            />
          </div>
        </div>
      </Modal>

      {/* Backup codes modal */}
      <Modal
        open={showBackup}
        onClose={() => setShowBackup(false)}
        title="Códigos de respaldo"
        size="md"
        footer={<Button onClick={() => setShowBackup(false)}>Entendido</Button>}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
            <AlertTriangle
              size={18}
              className="text-amber-600 shrink-0 mt-0.5"
            />
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Guarda estos códigos en un lugar seguro. Cada código puede usarse
              una sola vez si pierdes acceso a tu app de autenticación.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {backupCodes.map((code, i) => (
              <div
                key={i}
                className="p-2.5 bg-slate-100 dark:bg-gray-800 rounded-lg text-center font-mono text-sm font-bold text-slate-800 dark:text-slate-100 tracking-widest"
              >
                {code}
              </div>
            ))}
          </div>
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => {
              const text = backupCodes.join("\n");
              navigator.clipboard.writeText(text);
            }}
          >
            Copiar todos los códigos
          </Button>
        </div>
      </Modal>
    </div>
  );
}

// ─── Appearance tab ───────────────────────────────────────────────────────────

function AppearanceTab() {
  const { theme, setTheme } = useTheme();
  const toast = useToast();
  const { data: settings, loading } = useApi(() => settingsApi.get(), []);
  const [local, setLocal] = useState<Partial<UserSettings>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) setLocal(settings);
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsApi.update({
        language: local.language,
        timezone: local.timezone,
      });
      toast.success("Preferencias guardadas");
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Theme */}
      <SettingsSection
        title="Tema"
        description="Personaliza el aspecto visual de la aplicación"
      >
        <SettingRow
          icon={theme === "dark" ? <Moon size={17} /> : <Sun size={17} />}
          label="Modo oscuro"
          description="Cambia entre el tema claro y oscuro"
        >
          <Toggle
            checked={theme === "dark"}
            onChange={(v) => setTheme(v ? "dark" : "light")}
          />
        </SettingRow>

        <div className="py-4">
          <p className="text-sm font-medium text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
            <Palette size={16} className="text-slate-500" />
            Elige tu tema
          </p>
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                id: "light",
                label: "Claro",
                icon: <Sun size={18} />,
                bg: "bg-white border-slate-200",
              },
              {
                id: "dark",
                label: "Oscuro",
                icon: <Moon size={18} />,
                bg: "bg-gray-900 border-gray-700",
              },
              {
                id: "system",
                label: "Sistema",
                icon: <Monitor size={18} />,
                bg: "bg-gradient-to-r from-white to-gray-900 border-slate-300",
              },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() =>
                  setTheme(
                    t.id === "system" ? "light" : (t.id as "light" | "dark"),
                  )
                }
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                  t.bg,
                  theme === t.id
                    ? "border-indigo-500 ring-2 ring-indigo-500/30"
                    : "border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700",
                )}
              >
                <span
                  className={cn(
                    theme === "dark" || t.id === "dark"
                      ? "text-white"
                      : "text-slate-700",
                  )}
                >
                  {t.icon}
                </span>
                <span
                  className={cn(
                    "text-xs font-semibold",
                    theme === "dark" || t.id === "dark"
                      ? "text-slate-300"
                      : "text-slate-700",
                  )}
                >
                  {t.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </SettingsSection>

      {/* Language & region */}
      <SettingsSection
        title="Idioma y región"
        description="Configura el idioma y zona horaria de la aplicación"
      >
        <SettingRow
          icon={<Languages size={17} />}
          label="Idioma de la aplicación"
          description="El idioma en que se mostrará la interfaz"
        >
          <Select
            value={local.language ?? "es"}
            options={[
              { value: "es", label: "Español" },
              { value: "en", label: "English" },
              { value: "pt", label: "Português" },
              { value: "fr", label: "Français" },
              { value: "de", label: "Deutsch" },
            ]}
            onChange={(v) => setLocal((p) => ({ ...p, language: v }))}
            className="w-36"
          />
        </SettingRow>

        <SettingRow
          icon={<Globe size={17} />}
          label="Zona horaria"
          description="Usada para mostrar fechas y horas correctamente"
        >
          <Select
            value={local.timezone ?? "America/Mexico_City"}
            options={[
              {
                value: "America/Mexico_City",
                label: "Ciudad de México (UTC-6)",
              },
              { value: "America/New_York", label: "Nueva York (UTC-5)" },
              { value: "America/Los_Angeles", label: "Los Ángeles (UTC-8)" },
              { value: "America/Bogota", label: "Bogotá (UTC-5)" },
              { value: "America/Buenos_Aires", label: "Buenos Aires (UTC-3)" },
              { value: "America/Santiago", label: "Santiago (UTC-4)" },
              { value: "Europe/Madrid", label: "Madrid (UTC+1)" },
              { value: "UTC", label: "UTC" },
            ]}
            onChange={(v) => setLocal((p) => ({ ...p, timezone: v }))}
            className="w-52"
          />
        </SettingRow>
      </SettingsSection>

      <div className="flex justify-end">
        <Button onClick={handleSave} loading={saving} size="lg" rounded>
          Guardar cambios
        </Button>
      </div>
    </div>
  );
}

// ─── Sessions tab ─────────────────────────────────────────────────────────────

function SessionsTab() {
  const toast = useToast();
  const {
    data: sessions,
    loading,
    refresh,
  } = useApi(() => securityApi.getSessions(), []);
  const [revoking, setRevoking] = useState<Set<string>>(new Set());

  const handleRevoke = async (sessionId: string) => {
    setRevoking((prev) => new Set([...prev, sessionId]));
    try {
      await securityApi.revokeSession(sessionId);
      toast.success("Sesión cerrada");
      refresh();
    } catch {
      toast.error("Error al cerrar la sesión");
    } finally {
      setRevoking((prev) => {
        const next = new Set(prev);
        next.delete(sessionId);
        return next;
      });
    }
  };

  const handleRevokeAll = async () => {
    if (!confirm("¿Cerrar sesión en todos los otros dispositivos?")) return;
    try {
      await securityApi.revokeAllSessions();
      toast.success("Todas las sesiones cerradas");
      refresh();
    } catch {
      toast.error("Error al cerrar sesiones");
    }
  };

  const deviceIcon = (type?: string) => {
    if (type?.includes("mobile") || type?.includes("phone"))
      return <Smartphone size={20} className="text-indigo-500" />;
    return <Monitor size={20} className="text-indigo-500" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
            Dispositivos conectados
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Gestiona los dispositivos que tienen acceso a tu cuenta
          </p>
        </div>
        {sessions && sessions.length > 1 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRevokeAll}
            className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
            leftIcon={<LogOut size={14} />}
          >
            Cerrar todas
          </Button>
        )}
      </div>

      {loading && (
        <div className="surface divide-y divide-slate-100 dark:divide-slate-800">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <Skeleton className="w-10 h-10 shrink-0" rounded />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-48" />
                <Skeleton className="h-2.5 w-64" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>
      )}

      {!loading && sessions?.length === 0 && (
        <div className="surface p-8 text-center text-slate-500 dark:text-slate-400">
          Sin sesiones activas
        </div>
      )}

      {!loading && sessions && sessions.length > 0 && (
        <div className="surface divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
          {sessions.map((session: LoginSession, i) => (
            <div
              key={session.id}
              className={cn(
                "flex items-center gap-4 p-4 animate-fade-in",
                `stagger-${(i % 5) + 1}`,
                session.is_active &&
                  i === 0 &&
                  "bg-green-50/50 dark:bg-green-900/10",
              )}
            >
              {/* Device icon */}
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                {deviceIcon(session.device_type)}
              </div>

              {/* Session info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                    {session.device_name ??
                      session.user_agent?.split(" ")[0] ??
                      "Dispositivo desconocido"}
                  </p>
                  {i === 0 && (
                    <Badge variant="success" size="sm" dot>
                      Actual
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  {session.ip_address && (
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <MapPin size={10} />
                      {session.ip_address}
                      {session.location && ` · ${session.location}`}
                    </span>
                  )}
                  <span className="text-xs text-slate-400">
                    {formatDistanceToNow(new Date(session.last_active), {
                      addSuffix: true,
                      locale: es,
                    })}
                  </span>
                </div>
              </div>

              {/* Revoke button */}
              {i !== 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRevoke(session.id)}
                  loading={revoking.has(session.id)}
                  className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0"
                >
                  Cerrar
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Data tab (GDPR) ──────────────────────────────────────────────────────────

function DataTab() {
  const toast = useToast();
  const { logout } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");

  const handleExport = async () => {
    setExporting(true);
    try {
      await securityApi.requestDataExport();
      toast.success(
        "Solicitud enviada. Recibirás un correo cuando tus datos estén listos (puede tardar hasta 48h).",
      );
    } catch {
      toast.error("Error al solicitar la exportación");
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteInput !== "ELIMINAR") {
      toast.error('Escribe "ELIMINAR" para confirmar');
      return;
    }
    setDeleting(true);
    try {
      await securityApi.requestDataDeletion();
      toast.success(
        "Solicitud de eliminación enviada. Tu cuenta será eliminada en 30 días.",
      );
      setDeleteConfirmOpen(false);
      setTimeout(() => logout(), 3000);
    } catch {
      toast.error("Error al procesar la solicitud");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Export data */}
      <SettingsSection
        title="Exportar mis datos"
        description="Descarga una copia de toda la información que tenemos sobre tu cuenta"
      >
        <SettingRow
          icon={<Download size={17} />}
          label="Descargar mis datos"
          description="Incluye publicaciones, fotos, mensajes, amigos y toda tu actividad. Puede tardar hasta 48 horas en generarse."
        >
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<Download size={14} />}
            onClick={handleExport}
            loading={exporting}
          >
            Solicitar
          </Button>
        </SettingRow>
      </SettingsSection>

      {/* Data usage info */}
      <SettingsSection
        title="Información sobre tus datos"
        description="Cómo usamos y protegemos tu información"
      >
        <div className="py-3 space-y-3">
          {[
            {
              icon: <Shield size={16} className="text-green-500" />,
              title: "Datos cifrados",
              desc: "Tu contraseña y datos sensibles están cifrados con AES-256",
            },
            {
              icon: <Eye size={16} className="text-blue-500" />,
              title: "Sin publicidad dirigida",
              desc: "No vendemos tus datos ni los usamos para publicidad de terceros",
            },
            {
              icon: <Download size={16} className="text-indigo-500" />,
              title: "Portabilidad de datos",
              desc: "Siempre puedes exportar y llevar tus datos donde quieras",
            },
            {
              icon: <Trash2 size={16} className="text-red-500" />,
              title: "Derecho al olvido",
              desc: "Puedes solicitar la eliminación completa de tu cuenta y datos",
            },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="mt-0.5">{item.icon}</span>
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {item.title}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </SettingsSection>

      {/* Delete account */}
      <div className="surface p-5 border-2 border-red-200 dark:border-red-900/50">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle size={20} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-red-600 dark:text-red-400">
              Eliminar cuenta
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              Esta acción es{" "}
              <strong className="text-red-500">
                permanente e irreversible
              </strong>
              . Todos tus datos (publicaciones, fotos, mensajes, amistades)
              serán eliminados después de 30 días de gracia.
            </p>
          </div>
        </div>
        <Button
          variant="danger"
          leftIcon={<Trash2 size={15} />}
          onClick={() => setDeleteConfirmOpen(true)}
        >
          Solicitar eliminación de cuenta
        </Button>
      </div>

      {/* Delete confirmation modal */}
      <Modal
        open={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setDeleteInput("");
        }}
        title="Eliminar cuenta definitivamente"
        size="sm"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setDeleteInput("");
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteAccount}
              loading={deleting}
              disabled={deleteInput !== "ELIMINAR"}
            >
              Eliminar mi cuenta
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-700 dark:text-red-300 font-medium">
              ⚠️ Esta acción no se puede deshacer. Tu cuenta y todos tus datos
              serán eliminados permanentemente en 30 días.
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Para confirmar, escribe{" "}
              <code className="bg-slate-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-bold text-red-600 dark:text-red-400">
                ELIMINAR
              </code>
            </label>
            <input
              type="text"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder="ELIMINAR"
              className={cn(
                "input-base",
                deleteInput === "ELIMINAR" &&
                  "border-red-500 focus:border-red-500 focus:shadow-red-100 dark:focus:shadow-red-900/30",
              )}
              autoFocus
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
