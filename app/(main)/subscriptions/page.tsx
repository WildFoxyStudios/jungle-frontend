"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { Crown, BadgeDollarSign, Heart, ExternalLink, CalendarDays, Loader2 } from "lucide-react";
import { monetizationApi, SubscriptionWithCreator } from "@/lib/api-monetization";
import { formatDistanceToNow, format } from "date-fns";
import { es } from "date-fns/locale";

export default function SubscriptionsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithCreator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchSubscriptions = async () => {
      try {
        setLoading(true);
        const res = await monetizationApi.getMySubscriptions();
        if (mounted) {
          setSubscriptions(res.data);
        }
      } catch (err) {
        toast.error("Error al cargar suscripciones");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    
    if (user?.id) fetchSubscriptions();
    
    return () => { mounted = false; };
  }, [user?.id, toast]);

  const handleUnsubscribe = async (creatorId: string) => {
    try {
      await monetizationApi.unsubscribe(creatorId);
      toast.success("Suscripción cancelada exitosamente");
      // Mantenemos la suscripción en la lista pero actualizamos su estado si se pudiera,
      // por ahora recargamos
      const res = await monetizationApi.getMySubscriptions();
      setSubscriptions(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error al cancelar la suscripción");
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#050505] dark:text-[#e4e6eb] flex items-center gap-3">
            <Crown className="text-[#1877f2] w-8 h-8" />
            Mis Suscripciones
          </h1>
          <p className="text-[#65676b] dark:text-[#b0b3b8] mt-2">
            Gestiona tu apoyo a creadores y accede a contenido exclusivo
          </p>
        </div>
        <Link href="/creator">
          <Button variant="outline" className="gap-2 border-[#1877f2] text-[#1877f2] hover:bg-[#e7f3ff] dark:hover:bg-[#263951]">
            <BadgeDollarSign size={18} />
            Mi panel de creador
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="surface p-5 animate-pulse">
              <div className="flex gap-4 items-center">
                <Skeleton className="w-16 h-16 rounded-full shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="w-3/4 h-5" />
                  <Skeleton className="w-1/2 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="surface p-12 text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4">
            <Heart className="w-10 h-10 text-amber-500" />
          </div>
          <h2 className="text-xl font-bold text-[#050505] dark:text-[#e4e6eb] mb-2">Aún no apoyas a ningún creador</h2>
          <p className="text-[#65676b] dark:text-[#b0b3b8] max-w-md mx-auto mb-6">
            Suscríbete a creadores para desbloquear su contenido premium, transmisiones en vivo exclusivas y unirte a su comunidad VIP.
          </p>
          <Link href="/">
            <Button className="bg-[#1877f2] hover:bg-[#166fe5] text-white">Explorar publicaciones</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {subscriptions.map((sub) => {
            const isActive = sub.subscription.status === "active";
            const expiresDate = new Date(sub.subscription.current_period_end);
            
            return (
              <div key={sub.subscription.id} className="surface overflow-hidden group hover:shadow-md transition-shadow">
                <div className="relative h-24 bg-gradient-to-r from-blue-600 to-indigo-600">
                  <div className="absolute -bottom-8 left-4 p-1 bg-white dark:bg-slate-900 rounded-full">
                    <Avatar 
                      src={sub.creator_picture} 
                      alt={sub.creator_name} 
                      size="lg" 
                      fallbackName={sub.creator_name} 
                    />
                  </div>
                </div>
                
                <div className="pt-10 p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-[#050505] dark:text-[#e4e6eb] truncate">
                      {sub.creator_name}
                    </h3>
                  </div>
                  
                  {sub.creator_bio && (
                    <p className="text-sm text-[#65676b] dark:text-[#b0b3b8] line-clamp-2 mb-4">
                      {sub.creator_bio}
                    </p>
                  )}

                  <div className="bg-[#f0f2f5] dark:bg-[#3a3b3c] rounded-lg p-3 space-y-2 mb-5">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#65676b] dark:text-[#b0b3b8]">Estado:</span>
                      <span className={isActive ? "text-green-600 font-semibold" : "text-amber-600 font-semibold"}>
                        {isActive ? "Activa" : sub.subscription.status === "cancelled" ? "Cancelada" : "Expirada"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#65676b] dark:text-[#b0b3b8]">Precio:</span>
                      <span className="font-semibold text-[#050505] dark:text-[#e4e6eb]">
                        {sub.subscription.is_free ? "Gratis" : `€${sub.subscription.price_paid}/mes`}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-[#65676b] dark:text-[#b0b3b8] pt-1 mt-1 border-t border-[#ced0d4] dark:border-[#4e4f50]">
                      <span className="flex items-center gap-1"><CalendarDays size={12}/> Vence:</span>
                      <span>{format(expiresDate, "d MMM yyyy", { locale: es })}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/profile/${sub.subscription.creator_id}`} className="flex-1">
                      <Button variant="outline" className="w-full text-xs h-9">
                        <ExternalLink size={14} className="mr-1.5" /> Ver Perfil
                      </Button>
                    </Link>
                    {isActive && !sub.subscription.cancelled_at && (
                      <Button 
                        variant="ghost" 
                        onClick={() => {
                          if (confirm("¿Estás seguro de cancelar tu suscripción? Podrás seguir viendo el contenido hasta el final del periodo de facturación actual.")) {
                            handleUnsubscribe(sub.subscription.creator_id);
                          }
                        }}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 text-xs h-9"
                      >
                        Cancelar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
