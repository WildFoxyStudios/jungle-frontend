"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/toast";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabList, Tab, TabPanel } from "@/components/ui/tabs";
import {
  LineChart,
  Wallet,
  Users,
  BadgeDollarSign,
  Gift,
  Coins,
  Settings,
  CreditCard,
  Video
} from "lucide-react";
import { monetizationApi, CreatorProfile, CreatorEarnings } from "@/lib/api-monetization";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export default function CreatorDashboardPage() {
  const { user } = useAuth();
  const toast = useToast();
  
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  
  // Data State
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [earnings, setEarnings] = useState<CreatorEarnings | null>(null);

  // Form State
  const [price, setPrice] = useState("");
  const [bio, setBio] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchDashboardData = async () => {
      if (!user?.id) return;
      try {
        setLoading(true);
        const [profileRes, earningsRes] = await Promise.all([
          monetizationApi.getCreatorProfile(user.id).catch(() => null),
          monetizationApi.getCreatorEarnings().catch(() => null),
        ]);
        
        if (mounted) {
          if (profileRes?.data) {
            setProfile(profileRes.data);
            setPrice(profileRes.data.subscription_price || "5.00");
            setBio(profileRes.data.bio || "");
            setWelcomeMessage(profileRes.data.welcome_message || "");
            setIsActive(profileRes.data.is_active);
          }
          if (earningsRes?.data) {
            setEarnings(earningsRes.data);
          }
        }
      } catch (err) {
        toast.error("Error al cargar los datos del dashboard");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchDashboardData();
    return () => { mounted = false; };
  }, [user?.id, toast]);

  const handleSaveProfile = async () => {
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) < 1) {
      toast.error("El precio mensual mínimo es €1.00");
      return;
    }
    
    setSaving(true);
    try {
      const res = await monetizationApi.updateCreatorProfile({
        subscription_price: parseFloat(price),
        bio,
        welcome_message: welcomeMessage,
        is_active: isActive,
      });
      setProfile(res.data);
      toast.success("Perfil de creador actualizado exitosamente");
    } catch (err) {
      toast.error("Error al guardar la configuración");
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className="w-64 h-10 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="w-full h-[400px]" />
      </div>
    );
  }

  const getTransactionIcon = (type: string) => {
    switch(type) {
      case "subscription": return <Users className="text-blue-500" />;
      case "tip": return <Gift className="text-amber-500" />;
      case "post_purchase": return <BadgeDollarSign className="text-green-500" />;
      case "stream_tip": return <Coins className="text-yellow-500" />;
      default: return <CreditCard className="text-gray-500" />;
    }
  };

  const getTransactionLabel = (type: string) => {
    switch(type) {
      case "subscription": return "Suscripción mensual";
      case "tip": return "Propina en publicación";
      case "post_purchase": return "Venta de publicación";
      case "stream_tip": return "Propina en transmisión";
      default: return "Ingreso";
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 pb-20">
      {/* Header Profile Area */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl p-6 md:p-8 text-white shadow-xl mb-8 relative overflow-hidden">
        {/* Decoración */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 opacity-10 blur-2xl">
          <BadgeDollarSign size={200} />
        </div>

        <Avatar 
          src={user.profile_picture_url} 
          alt={user.full_name} 
          size="2xl" 
          fallbackName={user.full_name}
          className="ring-4 ring-indigo-500/30"
        />
        <div className="flex-1 text-center md:text-left z-10">
          <h1 className="text-2xl sm:text-3xl font-black mb-1">{user.full_name}</h1>
          <p className="text-indigo-200">@{user.username}</p>
          
          <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4">
            <div className="bg-black/20 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/10">
              <p className="text-sm text-indigo-200 mb-0.5">Ganancias Totales</p>
              <p className="text-xl font-bold">€{earnings?.total_earnings || "0.00"}</p>
            </div>
            <div className="bg-black/20 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/10">
              <p className="text-sm text-indigo-200 mb-0.5">Suscriptores</p>
              <p className="text-xl font-bold flex items-center gap-1.5">
                <Users size={18} />
                {earnings?.total_subscribers || 0}
              </p>
            </div>
          </div>
        </div>
        
        <div className="z-10 mt-4 md:mt-0">
          <label className="flex items-center gap-3 bg-black/20 backdrop-blur-sm border border-white/10 px-5 py-3 rounded-xl cursor-pointer hover:bg-black/30 transition-colors">
            <div className="flex flex-col">
              <span className="font-semibold text-sm">Perfil de Creador</span>
              <span className="text-xs text-indigo-200">{isActive ? "Activo" : "Pausado"}</span>
            </div>
            <div className="relative inline-flex items-center">
              <input type="checkbox" className="sr-only peer" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
              <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
            </div>
          </label>
        </div>
      </div>

      <Tabs defaultTab="overview" onChange={setActiveTab} className="w-full">
        <TabList className="mb-6 overflow-x-auto no-scrollbar" variant="line">
          <Tab value="overview" icon={<LineChart size={18} />}>Resumen</Tab>
          <Tab value="transactions" icon={<Wallet size={18} />}>Transacciones</Tab>
          <Tab value="configuration" icon={<Settings size={18} />}>Configuración</Tab>
        </TabList>

        {/* Resumen Tab */}
        <TabPanel value="overview">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="surface p-5 rounded-2xl hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
                <Users size={24} />
              </div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Suscripciones</p>
              <p className="text-2xl font-bold mt-1 text-[#050505] dark:text-[#e4e6eb]">€{earnings?.total_subscription_revenue || "0.00"}</p>
            </div>
            
            <div className="surface p-5 rounded-2xl hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 flex items-center justify-center mb-3">
                <BadgeDollarSign size={24} />
              </div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Ventas Directas</p>
              <p className="text-2xl font-bold mt-1 text-[#050505] dark:text-[#e4e6eb]">€{earnings?.total_post_sales || "0.00"}</p>
            </div>

            <div className="surface p-5 rounded-2xl hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
                <Gift size={24} />
              </div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Propinas en Posts</p>
              <p className="text-2xl font-bold mt-1 text-[#050505] dark:text-[#e4e6eb]">€{earnings?.total_tips || "0.00"}</p>
            </div>

            <div className="surface p-5 rounded-2xl hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400 flex items-center justify-center mb-3">
                <Video size={24} />
              </div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Propinas en Streams</p>
              <p className="text-2xl font-bold mt-1 text-[#050505] dark:text-[#e4e6eb]">€{earnings?.total_stream_tips || "0.00"}</p>
            </div>
          </div>

          <h3 className="text-xl font-bold mb-4 text-[#050505] dark:text-[#e4e6eb]">Actividad Reciente</h3>
          <div className="surface rounded-2xl overflow-hidden">
            {earnings?.recent_transactions && earnings.recent_transactions.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {earnings.recent_transactions.slice(0, 5).map(tx => (
                  <div key={tx.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                      {getTransactionIcon(tx.earning_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-[#050505] dark:text-[#e4e6eb] truncate">
                        {tx.from_user_name || "Usuario anónimo"}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {getTransactionLabel(tx.earning_type)} {tx.description ? `- ${tx.description}` : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600 dark:text-green-400">
                        +€{tx.amount}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true, locale: es })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-10 text-center text-slate-500">
                Aún no tienes actividad reciente. ¡Sigue creando contenido!
              </div>
            )}
            {earnings?.recent_transactions && earnings.recent_transactions.length > 5 && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/20 text-center border-t border-slate-100 dark:border-slate-800">
                <Button variant="ghost" onClick={() => setActiveTab("transactions")} className="text-indigo-600 w-full font-medium">
                  Ver todas las transacciones
                </Button>
              </div>
            )}
          </div>
        </TabPanel>

        {/* Transacciones Full Tab */}
        <TabPanel value="transactions">
          <div className="surface rounded-2xl overflow-hidden">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 font-medium text-sm grid grid-cols-12 gap-4 text-slate-500">
              <div className="col-span-6 md:col-span-4">Detalle</div>
              <div className="col-span-0 md:col-span-4 hidden md:block">Descripción</div>
              <div className="col-span-3 text-right">Fecha</div>
              <div className="col-span-3 text-right">Ingreso Neto</div>
            </div>
            
            {earnings?.recent_transactions && earnings.recent_transactions.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {earnings.recent_transactions.map(tx => (
                  <div key={tx.id} className="p-4 text-sm grid grid-cols-12 gap-4 items-center hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <div className="col-span-6 md:col-span-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        {getTransactionIcon(tx.earning_type)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-[#050505] dark:text-[#e4e6eb] truncate">{tx.from_user_name || "Anónimo"}</p>
                        <p className="text-xs text-slate-500 truncate">{getTransactionLabel(tx.earning_type)}</p>
                      </div>
                    </div>
                    <div className="col-span-0 md:col-span-4 hidden md:block text-slate-500 truncate">
                      {tx.description || "-"}
                    </div>
                    <div className="col-span-3 text-right text-slate-500 text-xs">
                      {format(new Date(tx.created_at), "dd MMM yyyy", { locale: es })}
                    </div>
                    <div className="col-span-3 text-right font-bold text-green-600 dark:text-green-400">
                      +€{tx.amount}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
               <div className="p-10 text-center text-slate-500">No hay transacciones registradas.</div>
            )}
          </div>
        </TabPanel>

        {/* Configuration Tab */}
        <TabPanel value="configuration">
          <div className="surface rounded-2xl p-6 md:p-8 max-w-3xl">
            <h2 className="text-xl font-bold mb-6 text-[#050505] dark:text-[#e4e6eb]">Tarifas y configuración de perfil</h2>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Precio de Suscripción Mensual (€)
                </label>
                <p className="text-xs text-slate-500 mb-2">Lo que cobrarás por mes a tus suscriptores para acceder a tu contenido exclusivo. (Mínimo €1.00)</p>
                <Input
                  type="number"
                  min="1.00"
                  step="0.50"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  className="max-w-[200px]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Biografía de Creador
                </label>
                <p className="text-xs text-slate-500 mb-2">Cuéntales a tus futuros suscriptores los beneficios que obtendrán al apoyarte.</p>
                <Textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="Obtén fotos detrás de escena, videos exclusivos y más..."
                  rows={4}
                  className="resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Mensaje de Bienvenida Automático
                </label>
                <p className="text-xs text-slate-500 mb-2">Este mensaje puede enviarse automáticamente cuando un nuevo usuario se suscriba.</p>
                <Textarea
                  value={welcomeMessage}
                  onChange={e => setWelcomeMessage(e.target.value)}
                  placeholder="¡Gracias por suscribirte! Aquí te dejo un regalito..."
                  rows={3}
                  className="resize-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                <Button 
                  onClick={handleSaveProfile} 
                  loading={saving}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2 md:py-3 h-auto text-sm md:text-base font-semibold border-none"
                >
                  Guardar Cambios
                </Button>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
               <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Acerca del modelo de ingresos</h3>
               <p className="text-xs text-slate-500 leading-relaxed">
                 Esta plataforma retiene una comisión del 20% de todas tus ganancias por concepto de uso de infraestructura, procesamiento de pagos con Stripe y mantenimiento. Tú retienes el 80% neto de todos los ingresos por suscripciones, donaciones y ventas directas. <br/>
                 Los ingresos se reflejarán inmediatamente en tu billetera y podrás retirarlos usando la pestaña "Billetera y Retiros".
               </p>
            </div>
          </div>
        </TabPanel>
      </Tabs>
    </div>
  );
}
