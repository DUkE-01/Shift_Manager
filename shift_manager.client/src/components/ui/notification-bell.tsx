import { useState, useEffect } from "react";
import { Bell, Check, Info } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { fetchAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface Notificacion {
    id: number;
    titulo: string;
    mensaje: string;
    tipoReferencia: string;
    leida: boolean;
    fechaCreacion: string;
}

export function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: noLeidasCount = 0 } = useQuery({
        queryKey: ["notificaciones-count"],
        queryFn: async () => {
            const res = await fetchAPI(`/api/notificaciones/no-leidas`);
            if (!res.ok) return 0;
            const data = await res.json();
            return data.count || 0;
        },
        refetchInterval: 15000 // Hacer polling cada 15 seg
    });

    const { data: notificaciones = [] } = useQuery<Notificacion[]>({
        queryKey: ["notificaciones"],
        queryFn: async () => {
            const res = await fetchAPI(`/api/notificaciones/mis-notificaciones`);
            if (!res.ok) return [];
            return await res.json();
        },
        enabled: isOpen // Solo si se abre
    });

    const marcarLeidaMutation = useMutation({
        mutationFn: async (id: number) => {
            await fetchAPI(`/api/notificaciones/marcar-leida/${id}`, { method: "PUT" });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notificaciones-count"] });
            queryClient.invalidateQueries({ queryKey: ["notificaciones"] });
        }
    });

    const marcarTodasLeidasMutation = useMutation({
        mutationFn: async () => {
            await fetchAPI(`/api/notificaciones/marcar-todas-leidas`, { method: "PUT" });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notificaciones-count"] });
            queryClient.invalidateQueries({ queryKey: ["notificaciones"] });
        }
    });

    // Detectar nueva notificación (Push-Up via polling local)
    const [prevCount, setPrevCount] = useState(noLeidasCount);
    useEffect(() => {
        if (noLeidasCount > prevCount) {
             toast({
                 title: "¡Nueva Notificación!",
                 description: "Se te ha asignado una nueva tarea o reporte.",
             });
        }
        setPrevCount(noLeidasCount);
    }, [noLeidasCount, prevCount, toast]);

    const handleRead = (n: Notificacion) => {
        if (!n.leida) {
            marcarLeidaMutation.mutate(n.id);
        }
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <div className="relative p-2 cursor-pointer text-gray-400 hover:text-white transition-colors" data-testid="notification-bell">
                    <Bell className="w-5 h-5" />
                    {noLeidasCount > 0 && (
                        <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm ring-1 ring-white">
                            {noLeidasCount > 9 ? "9+" : noLeidasCount}
                        </span>
                    )}
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 mr-4 mt-2 shadow-xl border-gray-100 rounded-xl" align="end">
                <div className="flex items-center justify-between p-4 border-b bg-gray-50/80 rounded-t-xl">
                    <h4 className="font-semibold text-police-blue-900 text-sm">Notificaciones</h4>
                    {noLeidasCount > 0 && (
                        <button 
                            className="text-[10px] text-blue-600 font-medium hover:underline flex items-center gap-1"
                            onClick={() => marcarTodasLeidasMutation.mutate()}
                        >
                            <Check className="w-3 h-3" />
                            Marcar leídas
                        </button>
                    )}
                </div>
                <div className="max-h-80 overflow-y-auto w-full">
                    {notificaciones.length === 0 ? (
                        <div className="p-6 text-center text-gray-400">
                            <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                            <p className="text-sm">No tienes notificaciones en este momento.</p>
                        </div>
                    ) : (
                        notificaciones.map(n => (
                            <div 
                                key={n.id} 
                                onClick={() => handleRead(n)}
                                className={`p-4 border-b last:border-0 cursor-pointer transition-colors ${!n.leida ? "bg-blue-50/40 hover:bg-blue-50/70" : "bg-white hover:bg-gray-50"}`}
                            >
                                <div className="flex gap-3">
                                    <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${!n.leida ? "bg-police-blue-500" : "bg-transparent"}`} />
                                    <div className="flex-1 space-y-1">
                                        <p className={`text-sm tracking-tight ${!n.leida ? "font-semibold text-police-blue-900" : "font-medium text-gray-700"}`}>
                                            {n.titulo}
                                        </p>
                                        <p className="text-xs text-gray-500 leading-snug">
                                            {n.mensaje}
                                        </p>
                                        <p className="text-[10px] text-gray-400 font-medium mt-2 flex items-center gap-1">
                                            {formatDistanceToNow(new Date(n.fechaCreacion), { addSuffix: true, locale: es })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
