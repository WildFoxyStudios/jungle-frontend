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
  Wallet,
  Building2,
  Mail,
  User,
  AtSign,
  Phone,
  Search,
} from "lucide-react";
import { settingsApi } from "@/lib/api-settings";
import { securityApi } from "@/lib/api-security";
import { notificationsApi } from "@/lib/api-notifications";
import { walletApi, type WalletSettings as WalletSettingsType } from "@/lib/api-wallet";
import { profileApi } from "@/lib/api-profile";
import { useApi, useMutation } from "@/hooks/useApi";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/lib/theme-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { InlineEdit } from "@/components/ui/inline-edit";
import { PrivacySelector } from "@/components/ui/privacy-selector";
import {
  SettingsSidebar,
  MobileCategoryList,
  MobileBackHeader,
  SETTINGS_CATEGORIES,
  type SettingsCategory,
} from "@/components/settings/settings-sidebar";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, format } from "date-fns";
import { es } from "date-fns/locale";
import type {
  UserSettings,
  NotificationPreferences,
  LoginSession,
} from "@/lib/types";

// ─── Shared components ────────────────────────────────────────────────────────

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={cn(
        "relative inline-flex w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
        checked ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-700",
        disabled && "opacity-50 cursor-not-allowed",
      )}
    >
      <span
        className="inline-block w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 mt-0.5"
        style={{ transform: checked ? "translateX(20px)" : "translateX(2px)" }}
      />
    </button>
  );
}

function SettingRow({ icon, label, description, children, danger, onClick }: {
  icon?: React.ReactNode; label: string; description?: string; children?: React.ReactNode; danger?: boolean; onClick?: () => void;
}) {
  const Wrapper = onClick ? "button" : "div";
  return (
    <Wrapper
      onClick={onClick}
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 py-3.5 first:pt-0 last:pb-0 w-full text-left",
        onClick && "hover:bg-slate-50 dark:hover:bg-slate-800/50 -mx-3 px-3 rounded-xl transition-colors cursor-pointer",
      )}
    >
      <div className="flex items-start gap-3 flex-1 min-w-0">
        {icon && <span className={cn("mt-0.5 shrink-0", danger ? "text-red-500" : "text-slate-500 dark:text-slate-400")}>{icon}</span>}
        <div className="flex-1 min-w-0">
          <p className={cn("text-sm font-medium", danger ? "text-red-600 dark:text-red-400" : "text-slate-800 dark:text-slate-100")}>{label}</p>
          {description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{description}</p>}
        </div>
      </div>
      {children && <div className="shrink-0 sm:ml-auto">{children}</div>}
      {onClick && !children && <ChevronRight size={16} className="text-slate-400 shrink-0 hidden sm:block" />}
    </Wrapper>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="surface p-4 sm:p-5 mb-4">
      <div className="mb-3">
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-50">{title}</h2>
        {description && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>}
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">{children}</div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [category, setCategory] = useState<SettingsCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // On desktop, default to "general"
  useEffect(() => {
    if (window.innerWidth >= 768 && !category) setCategory("general");
  }, []);

  const activeLabel = SETTINGS_CATEGORIES.find((c) => c.id === category)?.label ?? "";

  return (
    <div className="max-w-[960px] mx-auto px-4 py-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
          <Shield size={20} className="text-indigo-600 dark:text-indigo-400" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-50">Configuración</h1>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="search"
          placeholder="Buscar en configuración..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-base pl-10 w-full"
        />
      </div>

      <div className="flex gap-5">
        {/* Desktop sidebar */}
        <div className="hidden md:block w-[260px] shrink-0">
          <div className="sticky top-20">
            <SettingsSidebar active={category ?? "general"} onChange={setCategory} />
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 min-w-0">
          {/* Mobile: show category list or content */}
          <div className="md:hidden">
            {!category ? (
              <MobileCategoryList onSelect={setCategory} />
            ) : (
              <>
                <MobileBackHeader label="Configuración" onBack={() => setCategory(null)} />
                <CategoryContent category={category} />
              </>
            )}
          </div>

          {/* Desktop: always show content */}
          <div className="hidden md:block">
            <CategoryContent category={category ?? "general"} />
          </div>
        </div>
      </div>
    </div>
  );
}

function CategoryContent({ category }: { category: SettingsCategory }) {
  switch (category) {
    case "general": return <GeneralCategory />;
    case "security": return <SecurityCategory />;
    case "privacy": return <PrivacyCategory />;
    case "notifications": return <NotificationsCategory />;
    case "appearance": return <AppearanceCategory />;
    case "payments": return <PaymentsCategory />;
    case "data": return <DataCategory />;
    default: return null;
  }
}

// ─── General ──────────────────────────────────────────────────────────────────

function GeneralCategory() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const { data: settings, loading } = useApi(() => settingsApi.get(), []);

  if (loading || !user) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="surface p-5 space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <Section title="Información personal" description="Gestiona tu nombre y datos de contacto">
        <InlineEdit
          icon={<User size={17} />}
          label="Nombre completo"
          value={user.full_name ?? ""}
          placeholder="Tu nombre completo"
          onSave={async (v) => {
            const updated = await profileApi.updateProfile({ full_name: v });
            updateUser(updated);
            toast.success("Nombre actualizado");
          }}
        />
        <div className="py-1" />
        <InlineEdit
          icon={<AtSign size={17} />}
          label="Nombre de usuario"
          value={user.username ?? ""}
          placeholder="tu_usuario"
          disabled
          emptyText="No disponible"
        />
        <div className="py-1" />
        <InlineEdit
          icon={<Mail size={17} />}
          label="Correo electrónico"
          value={user.email ?? ""}
          type="email"
          disabled
          emptyText="Sin correo"
        />
        <div className="py-1" />
        <InlineEdit
          icon={<Phone size={17} />}
          label="Teléfono"
          value={user.phone_number ?? ""}
          type="tel"
          placeholder="+52 55 1234 5678"
          onSave={async (v) => {
            await profileApi.updateProfile({ phone_number: v });
            toast.success("Teléfono actualizado");
          }}
        />
      </Section>

      <Section title="Idioma y región">
        <SettingRow icon={<Languages size={17} />} label="Idioma" description={settings?.language === "en" ? "English" : "Español"}>
          <select
            value={settings?.language ?? "es"}
            onChange={async (e) => {
              await settingsApi.update({ language: e.target.value });
              toast.success("Idioma actualizado");
            }}
            className="input-base py-2 text-sm cursor-pointer w-full sm:w-36"
          >
            <option value="es">Español</option>
            <option value="en">English</option>
            <option value="pt">Português</option>
            <option value="fr">Français</option>
          </select>
        </SettingRow>
        <SettingRow icon={<Globe size={17} />} label="Zona horaria">
          <select
            value={settings?.timezone ?? "America/Mexico_City"}
            onChange={async (e) => {
              await settingsApi.update({ timezone: e.target.value });
              toast.success("Zona horaria actualizada");
            }}
            className="input-base py-2 text-sm cursor-pointer w-full sm:w-52"
          >
            <option value="America/Mexico_City">Ciudad de México (UTC-6)</option>
            <option value="America/New_York">Nueva York (UTC-5)</option>
            <option value="America/Los_Angeles">Los Ángeles (UTC-8)</option>
            <option value="America/Bogota">Bogotá (UTC-5)</option>
            <option value="America/Buenos_Aires">Buenos Aires (UTC-3)</option>
            <option value="Europe/Madrid">Madrid (UTC+1)</option>
            <option value="UTC">UTC</option>
          </select>
        </SettingRow>
      </Section>
    </div>
  );
}

// ─── Security ─────────────────────────────────────────────────────────────────

function SecurityCategory() {
  const toast = useToast();
  const { data: settings, refresh: refreshSettings } = useApi(() => settingsApi.get(), []);
  const { data: sessions, loading: loadingSessions, refresh: refreshSessions } = useApi(() => securityApi.getSessions(), []);
  const { data: auditLog, loading: loadingAudit } = useApi(() => securityApi.getAuditLog({ limit: 10 }), []);

  const [setupOpen, setSetupOpen] = useState(false);
  const [setupData, setSetupData] = useState<{ qr_code_url: string; secret: string } | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [loading2FA, setLoading2FA] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackup, setShowBackup] = useState(false);
  const [changePassOpen, setChangePassOpen] = useState(false);
  const [revoking, setRevoking] = useState<Set<string>>(new Set());

  const is2FAEnabled = settings?.two_factor_enabled ?? false;

  const handleSetup2FA = async () => {
    setLoading2FA(true);
    try {
      const data = await securityApi.setup2FA();
      setSetupData(data);
      setSetupOpen(true);
    } catch { toast.error("Error al configurar 2FA"); }
    finally { setLoading2FA(false); }
  };

  const handleEnable2FA = async () => {
    if (!verifyCode || verifyCode.length !== 6) { toast.error("Ingresa el código de 6 dígitos"); return; }
    setLoading2FA(true);
    try {
      const result = await securityApi.enable2FA({ code: verifyCode });
      setBackupCodes(result.backup_codes);
      setSetupOpen(false);
      setShowBackup(true);
      refreshSettings();
      toast.success("2FA activado");
    } catch { toast.error("Código incorrecto"); }
    finally { setLoading2FA(false); }
  };

  const handleRevoke = async (id: string) => {
    setRevoking((p) => new Set([...p, id]));
    try {
      await securityApi.revokeSession(id);
      refreshSessions();
      toast.success("Sesión cerrada");
    } catch { toast.error("Error al cerrar sesión"); }
    finally { setRevoking((p) => { const n = new Set(p); n.delete(id); return n; }); }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Active sessions */}
      <Section title="Dónde has iniciado sesión" description="Dispositivos con acceso a tu cuenta">
        {loadingSessions ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1 space-y-1.5"><Skeleton className="h-3.5 w-40" /><Skeleton className="h-2.5 w-56" /></div>
            </div>
          ))
        ) : sessions?.map((s: LoginSession, i: number) => (
          <div key={s.id} className={cn("flex items-center gap-3 py-3", i === 0 && "bg-green-50/50 dark:bg-green-900/10 -mx-3 px-3 rounded-xl")}>
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
              {s.device_type?.includes("mobile") ? <Smartphone size={18} className="text-indigo-500" /> : <Monitor size={18} className="text-indigo-500" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                  {s.device_name ?? s.user_agent?.split(" ")[0] ?? "Dispositivo"}
                </p>
                {i === 0 && <Badge variant="success" size="sm" dot>Actual</Badge>}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {s.ip_address}{s.location && ` · ${s.location}`} · {formatDistanceToNow(new Date(s.last_active_at), { addSuffix: true, locale: es })}
              </p>
            </div>
            {i !== 0 && (
              <Button size="sm" variant="ghost" onClick={() => handleRevoke(s.id)} loading={revoking.has(s.id)} className="text-red-500 shrink-0">
                Cerrar
              </Button>
            )}
          </div>
        ))}
      </Section>

      {/* Password */}
      <Section title="Contraseña">
        <SettingRow icon={<Lock size={17} />} label="Cambiar contraseña" description="Usa una contraseña única de al menos 12 caracteres">
          <Button size="sm" variant="secondary" onClick={() => toast.info("Recibirás un correo para cambiar tu contraseña")}>
            Cambiar
          </Button>
        </SettingRow>
      </Section>

      {/* 2FA */}
      <Section title="Autenticación en dos pasos" description="Capa extra de seguridad">
        <SettingRow icon={<Smartphone size={17} />} label="Autenticador" description={is2FAEnabled ? "Activo — tu cuenta está protegida" : "Usa Google Authenticator o Authy"}>
          {is2FAEnabled ? (
            <div className="flex items-center gap-2">
              <Badge variant="success" dot>Activo</Badge>
              <Button size="sm" variant="ghost" className="text-red-500" onClick={async () => {
                try { await securityApi.disable2FA({ code: "", password: "" }); refreshSettings(); toast.success("2FA desactivado"); } catch { toast.error("Error"); }
              }}>Desactivar</Button>
            </div>
          ) : (
            <Button size="sm" leftIcon={<Shield size={14} />} onClick={handleSetup2FA} loading={loading2FA}>Activar</Button>
          )}
        </SettingRow>
        {is2FAEnabled && (
          <SettingRow icon={<Key size={17} />} label="Códigos de respaldo" description="Úsalos si pierdes tu autenticador">
            <Button size="sm" variant="secondary" leftIcon={<RefreshCw size={13} />} onClick={async () => {
              try { const r = await securityApi.regenerateBackupCodes(); setBackupCodes(r.backup_codes); setShowBackup(true); toast.success("Códigos regenerados"); } catch { toast.error("Error"); }
            }}>Regenerar</Button>
          </SettingRow>
        )}
      </Section>

      {/* Login alerts */}
      <Section title="Alertas de inicio de sesión">
        <SettingRow icon={<AlertTriangle size={17} />} label="Alertas por correo" description="Notificación cuando alguien acceda desde un nuevo dispositivo">
          <Toggle checked={settings?.login_alerts ?? true} onChange={async (v) => {
            try { await settingsApi.update({ login_alerts: v }); refreshSettings(); toast.success(v ? "Activadas" : "Desactivadas"); } catch { toast.error("Error"); }
          }} />
        </SettingRow>
      </Section>

      {/* Audit log */}
      {auditLog && auditLog.length > 0 && (
        <Section title="Actividad de seguridad reciente">
          {auditLog.slice(0, 5).map((entry) => (
            <div key={entry.id} className="flex items-start gap-3 py-2.5">
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                <Shield size={14} className="text-slate-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-800 dark:text-slate-100">{entry.action}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {format(new Date(entry.created_at), "d MMM yyyy, HH:mm", { locale: es })}
                  {entry.ip_address && ` · ${entry.ip_address}`}
                </p>
              </div>
            </div>
          ))}
        </Section>
      )}

      {/* 2FA Setup Modal */}
      <Modal open={setupOpen} onClose={() => setSetupOpen(false)} title="Configurar 2FA" size="md" footer={
        <><Button variant="ghost" onClick={() => setSetupOpen(false)}>Cancelar</Button><Button onClick={handleEnable2FA} loading={loading2FA}>Verificar y activar</Button></>
      }>
        {setupData && (
          <div className="space-y-6">
            <p className="text-sm text-slate-600 dark:text-slate-300 text-center">Escanea este código QR con tu app de autenticación</p>
            {setupData.qr_code_url && (
              <div className="w-48 h-48 mx-auto border-2 border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-white flex items-center justify-center">
                <img src={setupData.qr_code_url} alt="QR 2FA" className="w-full h-full object-contain" />
              </div>
            )}
            <div className="w-full p-3 bg-slate-100 dark:bg-gray-800 rounded-xl text-center">
              <p className="text-xs text-slate-500 mb-1">O ingresa manualmente:</p>
              <code className="text-sm font-mono font-bold text-slate-800 dark:text-slate-100 tracking-widest">{setupData.secret}</code>
            </div>
            <input type="text" inputMode="numeric" maxLength={6} placeholder="000000" value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ""))}
              className="input-base text-center text-2xl font-mono tracking-[0.5em]" autoFocus />
          </div>
        )}
      </Modal>

      {/* Backup Codes Modal */}
      <Modal open={showBackup} onClose={() => setShowBackup(false)} title="Códigos de respaldo" size="md" footer={<Button onClick={() => setShowBackup(false)}>Entendido</Button>}>
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
            <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700 dark:text-amber-300">Guarda estos códigos en un lugar seguro. Cada uno puede usarse una sola vez.</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {backupCodes.map((code, i) => (
              <div key={i} className="p-2.5 bg-slate-100 dark:bg-gray-800 rounded-lg text-center font-mono text-sm font-bold text-slate-800 dark:text-slate-100 tracking-widest">{code}</div>
            ))}
          </div>
          <Button variant="secondary" className="w-full" onClick={() => { navigator.clipboard.writeText(backupCodes.join("\n")); toast.success("Códigos copiados"); }}>
            Copiar todos
          </Button>
        </div>
      </Modal>
    </div>
  );
}

// ─── Privacy ──────────────────────────────────────────────────────────────────

function PrivacyCategory() {
  const toast = useToast();
  const { data: settings, loading, refresh } = useApi(() => settingsApi.get(), []);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const save = async (key: string, value: unknown) => {
    try {
      await settingsApi.update({ [key]: value } as any);
      refresh();
      toast.success("Privacidad actualizada");
    } catch { toast.error("Error al guardar"); }
  };

  if (loading) return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="surface p-5"><Skeleton className="h-4 w-40 mb-3" /><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full mt-2" /></div>)}</div>;

  const privacyItems = [
    { key: "who_can_see_posts", icon: <Eye size={17} />, label: "Quién puede ver tus publicaciones", value: settings?.who_can_see_posts ?? "friends" },
    { key: "who_can_send_requests", icon: <Users size={17} />, label: "Quién puede enviarte solicitudes de amistad", value: settings?.who_can_send_requests ?? "everyone" },
    { key: "who_can_see_friends", icon: <Users size={17} />, label: "Quién puede ver tu lista de amigos", value: settings?.who_can_see_friends ?? "friends" },
    { key: "profile_visibility", icon: <Globe size={17} />, label: "Quién puede ver tu perfil", value: settings?.profile_visibility ?? "friends" },
    { key: "search_visibility", icon: <Search size={17} />, label: "Quién puede encontrarte en búsquedas", value: settings?.search_visibility ?? "friends" },
    { key: "who_can_message", icon: <MessageCircle size={17} />, label: "Quién puede enviarte mensajes", value: settings?.who_can_message ?? "friends" },
    { key: "who_can_comment", icon: <MessageCircle size={17} />, label: "Quién puede comentar en tus publicaciones", value: settings?.who_can_comment ?? "friends" },
    { key: "who_can_tag", icon: <Tag size={17} />, label: "Quién puede etiquetarte", value: settings?.who_can_tag ?? "friends" },
  ];

  const getLabel = (v: string) => v === "public" ? "Público" : v === "friends" ? "Amigos" : v === "everyone" ? "Todos" : v === "friends_of_friends" ? "Amigos de amigos" : v === "nobody" ? "Nadie" : "Solo yo";

  return (
    <div className="space-y-4 animate-fade-in">
      <Section title="Quién puede ver tu contenido" description="Controla la visibilidad de tu información">
        {privacyItems.map((item) => (
          <div key={item.key}>
            <SettingRow
              icon={item.icon}
              label={item.label}
              description={getLabel(item.value)}
              onClick={() => setExpandedItem(expandedItem === item.key ? null : item.key)}
            />
            {expandedItem === item.key && (
              <div className="pl-8 sm:pl-11 pb-3 animate-fade-in">
                <PrivacySelector value={item.value} onChange={(v) => { save(item.key, v); setExpandedItem(null); }} />
              </div>
            )}
          </div>
        ))}
      </Section>

      <Section title="Actividad">
        <SettingRow icon={<Clock size={17} />} label="Mostrar estado en línea" description="Tus amigos ven cuándo estás activo">
          <Toggle checked={settings?.online_status_visible ?? true} onChange={(v) => save("online_status_visible", v)} />
        </SettingRow>
        <SettingRow icon={<Monitor size={17} />} label="Mostrar actividad reciente" description="Muestra cuándo fue tu última conexión">
          <Toggle checked={settings?.show_active_status ?? true} onChange={(v) => save("show_active_status", v)} />
        </SettingRow>
      </Section>
    </div>
  );
}

// ─── Notifications ────────────────────────────────────────────────────────────

function NotificationsCategory() {
  const toast = useToast();
  const { data: prefs, loading, refresh } = useApi(() => notificationsApi.getPreferences(), []);

  const save = async (key: string, value: boolean) => {
    try {
      await notificationsApi.updatePreferences({ [key]: value } as any);
      refresh();
    } catch { toast.error("Error al guardar"); }
  };

  if (loading) return <div className="space-y-4">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="surface p-5 space-y-3">{Array.from({ length: 4 }).map((_, j) => <div key={j} className="flex justify-between py-2"><Skeleton className="h-3.5 w-40" /><Skeleton className="h-6 w-11" /></div>)}</div>)}</div>;

  return (
    <div className="space-y-4 animate-fade-in">
      <Section title="Notificaciones por correo" description="Recibe un email cuando ocurra alguna acción">
        <SettingRow icon={<Users size={17} />} label="Solicitudes de amistad"><Toggle checked={prefs?.email_friend_requests ?? true} onChange={(v) => save("email_friend_requests", v)} /></SettingRow>
        <SettingRow icon={<Eye size={17} />} label="Interacciones en publicaciones"><Toggle checked={prefs?.email_post_interactions ?? true} onChange={(v) => save("email_post_interactions", v)} /></SettingRow>
        <SettingRow icon={<MessageCircle size={17} />} label="Comentarios"><Toggle checked={prefs?.email_comments ?? true} onChange={(v) => save("email_comments", v)} /></SettingRow>
        <SettingRow icon={<Tag size={17} />} label="Etiquetas"><Toggle checked={prefs?.email_tags ?? true} onChange={(v) => save("email_tags", v)} /></SettingRow>
        <SettingRow icon={<Globe size={17} />} label="Eventos"><Toggle checked={prefs?.email_events ?? true} onChange={(v) => save("email_events", v)} /></SettingRow>
      </Section>

      <Section title="Notificaciones push" description="Notificaciones en el navegador y dispositivos">
        <SettingRow icon={<Users size={17} />} label="Solicitudes de amistad"><Toggle checked={prefs?.push_friend_requests ?? true} onChange={(v) => save("push_friend_requests", v)} /></SettingRow>
        <SettingRow icon={<Eye size={17} />} label="Interacciones"><Toggle checked={prefs?.push_post_interactions ?? true} onChange={(v) => save("push_post_interactions", v)} /></SettingRow>
        <SettingRow icon={<MessageCircle size={17} />} label="Comentarios"><Toggle checked={prefs?.push_comments ?? true} onChange={(v) => save("push_comments", v)} /></SettingRow>
        <SettingRow icon={<Tag size={17} />} label="Etiquetas"><Toggle checked={prefs?.push_tags ?? true} onChange={(v) => save("push_tags", v)} /></SettingRow>
        <SettingRow icon={<Globe size={17} />} label="Eventos"><Toggle checked={prefs?.push_events ?? true} onChange={(v) => save("push_events", v)} /></SettingRow>
        <SettingRow icon={<MessageCircle size={17} />} label="Mensajes directos"><Toggle checked={prefs?.push_messages ?? true} onChange={(v) => save("push_messages", v)} /></SettingRow>
      </Section>
    </div>
  );
}

// ─── Appearance ───────────────────────────────────────────────────────────────

function AppearanceCategory() {
  const { theme, setTheme } = useTheme();

  const themes = [
    { id: "light" as const, label: "Claro", icon: <Sun size={20} />, bg: "bg-white border-slate-200" },
    { id: "dark" as const, label: "Oscuro", icon: <Moon size={20} />, bg: "bg-gray-900 border-gray-700" },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      <Section title="Tema" description="Personaliza el aspecto visual">
        <div className="py-3">
          <div className="grid grid-cols-2 gap-3">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={cn(
                  "flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all",
                  t.bg,
                  theme === t.id ? "border-indigo-500 ring-2 ring-indigo-500/30" : "hover:border-indigo-300 dark:hover:border-indigo-700",
                )}
              >
                <span className={t.id === "dark" ? "text-white" : "text-slate-700"}>{t.icon}</span>
                <span className={cn("text-sm font-semibold", t.id === "dark" ? "text-slate-300" : "text-slate-700")}>{t.label}</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
              setTheme(prefersDark ? "dark" : "light");
            }}
            className="w-full mt-3 flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all text-sm font-medium text-slate-600 dark:text-slate-300"
          >
            <Monitor size={16} />
            Usar tema del sistema
          </button>
        </div>
      </Section>
    </div>
  );
}

// ─── Payments ─────────────────────────────────────────────────────────────────

function PaymentsCategory() {
  const toast = useToast();
  const { data: settings, loading, refresh } = useApi(() => walletApi.getSettings(), []);
  const [local, setLocal] = useState<Partial<WalletSettingsType>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (settings) setLocal(settings); }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try { await walletApi.updateSettings(local); refresh(); toast.success("Configuración guardada"); }
    catch { toast.error("Error al guardar"); }
    finally { setSaving(false); }
  };

  const set = (key: keyof WalletSettingsType, value: unknown) => setLocal((p) => ({ ...p, [key]: value }));

  if (loading) return <div className="space-y-4">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="surface p-5 space-y-3"><Skeleton className="h-4 w-40" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>)}</div>;

  return (
    <div className="space-y-4 animate-fade-in">
      <Section title="Métodos de pago" description="Configura tus métodos de retiro">
        <SettingRow icon={<Building2 size={17} />} label="IBAN" description="Cuenta bancaria para transferencias">
          <input type="text" value={local.default_iban || ""} onChange={(e) => set("default_iban", e.target.value)} placeholder="ES00 0000 0000 ..." className="input-base w-full sm:w-64 text-sm" />
        </SettingRow>
        <SettingRow icon={<User size={17} />} label="Titular de la cuenta">
          <input type="text" value={local.default_account_holder_name || ""} onChange={(e) => set("default_account_holder_name", e.target.value)} placeholder="Nombre Apellidos" className="input-base w-full sm:w-64 text-sm" />
        </SettingRow>
        <SettingRow icon={<Mail size={17} />} label="Email de PayPal">
          <input type="email" value={local.default_paypal_email || ""} onChange={(e) => set("default_paypal_email", e.target.value)} placeholder="tu@email.com" className="input-base w-full sm:w-64 text-sm" />
        </SettingRow>
      </Section>

      <Section title="Preferencias de retiro">
        <SettingRow icon={<Wallet size={17} />} label="Método preferido">
          <select value={local.preferred_withdrawal_method || "iban"} onChange={(e) => set("preferred_withdrawal_method", e.target.value)} className="input-base py-2 text-sm cursor-pointer w-full sm:w-44">
            <option value="iban">Transferencia bancaria</option>
            <option value="paypal">PayPal</option>
          </select>
        </SettingRow>
        <SettingRow icon={<Shield size={17} />} label="Requerir 2FA para retiros">
          <Toggle checked={local.require_2fa_for_withdrawal ?? true} onChange={(v) => set("require_2fa_for_withdrawal", v)} />
        </SettingRow>
      </Section>

      <Section title="Información">
        <div className="py-2 space-y-3">
          {[
            { icon: <AlertTriangle size={15} className="text-amber-500" />, text: "Monto mínimo de retiro: €100.00" },
            { icon: <Clock size={15} className="text-blue-500" />, text: "Procesamiento: 1-3 días hábiles" },
            { icon: <Shield size={15} className="text-green-500" />, text: "Transacciones cifradas y protegidas" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300">{item.icon}<span>{item.text}</span></div>
          ))}
        </div>
      </Section>

      <div className="flex justify-end">
        <Button onClick={handleSave} loading={saving} size="lg" rounded>Guardar cambios</Button>
      </div>
    </div>
  );
}

// ─── Data / GDPR ──────────────────────────────────────────────────────────────

function DataCategory() {
  const toast = useToast();
  const { logout } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleting, setDeleting] = useState(false);

  return (
    <div className="space-y-4 animate-fade-in">
      <Section title="Descargar tu información" description="Obtén una copia de todos tus datos">
        <SettingRow icon={<Download size={17} />} label="Solicitar exportación" description="Incluye publicaciones, fotos, mensajes y toda tu actividad. Puede tardar hasta 48h.">
          <Button size="sm" variant="secondary" leftIcon={<Download size={14} />} loading={exporting} onClick={async () => {
            setExporting(true);
            try { await securityApi.requestDataExport(); toast.success("Solicitud enviada. Recibirás un correo cuando esté listo."); }
            catch { toast.error("Error al solicitar"); }
            finally { setExporting(false); }
          }}>Solicitar</Button>
        </SettingRow>
      </Section>

      <Section title="Sobre tus datos">
        <div className="py-2 space-y-3">
          {[
            { icon: <Shield size={15} className="text-green-500" />, title: "Datos cifrados", desc: "Contraseña y datos sensibles cifrados con AES-256" },
            { icon: <Eye size={15} className="text-blue-500" />, title: "Sin publicidad dirigida", desc: "No vendemos tus datos a terceros" },
            { icon: <Download size={15} className="text-indigo-500" />, title: "Portabilidad", desc: "Exporta y lleva tus datos donde quieras" },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="mt-0.5">{item.icon}</span>
              <div><p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{item.title}</p><p className="text-xs text-slate-500 mt-0.5">{item.desc}</p></div>
            </div>
          ))}
        </div>
      </Section>

      <div className="surface p-5 border-2 border-red-200 dark:border-red-900/50">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle size={20} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-red-600 dark:text-red-400">Eliminar cuenta</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              Esta acción es <strong className="text-red-500">permanente e irreversible</strong>. Todos tus datos serán eliminados después de 30 días de gracia.
            </p>
          </div>
        </div>
        <Button variant="danger" leftIcon={<Trash2 size={15} />} onClick={() => setDeleteOpen(true)}>
          Solicitar eliminación
        </Button>
      </div>

      <Modal open={deleteOpen} onClose={() => { setDeleteOpen(false); setDeleteInput(""); }} title="Eliminar cuenta" size="sm" footer={
        <><Button variant="ghost" onClick={() => { setDeleteOpen(false); setDeleteInput(""); }}>Cancelar</Button>
        <Button variant="danger" onClick={async () => {
          if (deleteInput !== "ELIMINAR") { toast.error('Escribe "ELIMINAR"'); return; }
          setDeleting(true);
          try { await securityApi.requestDataDeletion(); toast.success("Solicitud enviada. Tu cuenta será eliminada en 30 días."); setDeleteOpen(false); setTimeout(() => logout(), 3000); }
          catch { toast.error("Error"); }
          finally { setDeleting(false); }
        }} loading={deleting} disabled={deleteInput !== "ELIMINAR"}>Eliminar mi cuenta</Button></>
      }>
        <div className="space-y-4">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-700 dark:text-red-300 font-medium">⚠️ Esta acción no se puede deshacer. Tu cuenta y datos serán eliminados en 30 días.</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Escribe <code className="bg-slate-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-bold text-red-600 dark:text-red-400">ELIMINAR</code> para confirmar
            </label>
            <input type="text" value={deleteInput} onChange={(e) => setDeleteInput(e.target.value)} placeholder="ELIMINAR"
              className={cn("input-base", deleteInput === "ELIMINAR" && "border-red-500")} autoFocus />
          </div>
        </div>
      </Modal>
    </div>
  );
}
