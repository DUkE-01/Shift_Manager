import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Officer, Shift } from "@/lib/types";

// Configuración de visualización de los turnos idéntica a la vista global
const SHIFT_TYPE_CONFIG: Record<string, {
    label: string; hours: string; bg: string; text: string; border: string; dot: string;
}> = {
    diurno: { label: "Diurno", hours: "07:00 – 18:00", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", dot: "bg-blue-500" },
    vespertino_lj: { label: "Vesp. L-J", hours: "18:00 – 07:00", bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", dot: "bg-purple-500" },
    vespertino_vd: { label: "Vesp. V-D", hours: "18:00 – 07:00", bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", dot: "bg-orange-500" },
    nocturno: { label: "Nocturno", hours: "22:00 – 06:00", bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200", dot: "bg-slate-500" },
};

function getTypeConfig(shiftType: string) {
    return SHIFT_TYPE_CONFIG[shiftType] ?? SHIFT_TYPE_CONFIG["diurno"];
}

interface OfficerScheduleModalProps {
    officer: Officer;
    isOpen: boolean;
    onClose: () => void;
}

export function OfficerScheduleModal({ officer, isOpen, onClose }: OfficerScheduleModalProps) {
    const [currentDate, setCurrentDate] = useState(new Date());

    // Obtener todos los turnos del backend (la cache probablemente ya lo tenga gracias a react-query)
    const { data: shifts, isLoading } = useQuery<Shift[]>({ 
        queryKey: ["/api/shifts"],
        refetchInterval: 30000 
    });

    // Filtrar unicamente los turnos del oficial seleccionado
    const officerShifts = useMemo(() => {
        if (!shifts) return [];
        return shifts.filter(s => s.officerId === officer.id);
    }, [shifts, officer.id]);

    // Lógica para la navegación del calendario mensual
    const monthDays = useMemo(() => {
        return eachDayOfInterval({ 
            start: startOfMonth(currentDate), 
            end: endOfMonth(currentDate) 
        });
    }, [currentDate]);

    const navigateMonth = (direction: "prev" | "next") => {
        setCurrentDate(prev => direction === "prev" ? subMonths(prev, 1) : addMonths(prev, 1));
    };

    // Para centrar adecuadamente los dias bajo las columnas de Lun-Dom
    const startDayOfWeek = startOfMonth(currentDate).getDay();
    // getDay() devuelve 0 para domingo. En nuestro diseño "Lunes" es la primera columna
    const offset = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1; 

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto" data-testid={`modal-schedule-${officer.id}`}>
                <DialogHeader className="mb-4 text-center sm:text-left">
                    <DialogTitle className="flex items-center justify-center sm:justify-start gap-2 text-xl font-bold text-police-blue-900">
                        <CalendarIcon className="w-5 h-5 text-police-blue-600" />
                        Horario Asignado: {officer.name}
                    </DialogTitle>
                    <p className="text-sm text-gray-500">
                        {officer.rank} • Código: {officer.badge} • Puesto: {officer.puestoAsignado || "N/A"}
                    </p>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Controles del Mes */}
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-800 capitalize">
                            {format(currentDate, "MMMM yyyy", { locale: es })}
                        </h3>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                                Hoy
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Calendario Mensual */}
                    <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
                        {/* Cabecera Dias de la Semana */}
                        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-100">
                            {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map(d => (
                                <div key={d} className="p-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    {d}
                                </div>
                            ))}
                        </div>

                        {/* Cuadrícula de Dias */}
                        <div className="grid grid-cols-7 bg-gray-200 gap-px">
                            {/* Celdas vacías para alienación correcta del mes */}
                            {Array.from({ length: offset }).map((_, i) => (
                                <div key={`empty-${i}`} className="bg-gray-50/50 p-2 min-h-[100px]" />
                            ))}

                            {monthDays.map(day => {
                                const dateStr = format(day, "yyyy-MM-dd");
                                const dayShifts = officerShifts.filter(s => s.date === dateStr);
                                const isToday = isSameDay(day, new Date());
                                
                                return (
                                    <div key={day.toString()} className={`bg-white hover:bg-gray-50 transition-colors p-2 min-h-[100px] flex flex-col gap-1 ${isToday ? "ring-inset ring-2 ring-police-blue-500" : ""}`}>
                                        <div className="flex justify-between items-start">
                                            <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? "bg-police-blue-600 text-white" : "text-gray-700"}`}>
                                                {format(day, "d")}
                                            </span>
                                            {dayShifts.length > 0 && <span className="text-[10px] bg-gray-100 px-1.5 rounded-full text-gray-500 font-medium">{dayShifts.length}</span>}
                                        </div>

                                        <div className="flex flex-col gap-1.5 mt-1 overflow-y-auto max-h-[80px]">
                                            {isLoading ? (
                                                <div className="h-4 w-full bg-gray-100 animate-pulse rounded" />
                                            ) : dayShifts.map(s => {
                                                const cfg = getTypeConfig(s.shiftType);
                                                return (
                                                    <div key={s.id} className={`p-1.5 rounded-md border flex flex-col gap-0.5 ${cfg.bg} ${cfg.border}`}>
                                                        <div className="flex items-center gap-1">
                                                            <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                                                            <span className={`text-[10px] font-bold ${cfg.text}`}>{cfg.label}</span>
                                                        </div>
                                                        <div className={`text-[9.5px] ${cfg.text} font-medium tracking-tight flex items-center gap-1 opacity-90`}>
                                                            <Clock className="w-2.5 h-2.5" />
                                                            {s.startTime} - {s.endTime}
                                                        </div>
                                                        {s.status === "completed" && (
                                                            <Badge className="text-[8px] px-1 py-0 h-3 leading-none bg-green-500 scale-90 origin-left">Completado</Badge>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Rellenar final del mes */}
                            {Array.from({ length: (7 - ((offset + monthDays.length) % 7)) % 7 }).map((_, i) => (
                                <div key={`end-empty-${i}`} className="bg-gray-50/50 p-2 min-h-[100px]" />
                            ))}
                        </div>
                    </div>

                    {/* Resumen Rápid */}
                    <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4 flex items-start gap-3">
                        <Clock className="w-5 h-5 text-police-blue-600 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-sm font-semibold text-police-blue-900">Sobre los turnos</h4>
                            <p className="text-xs text-police-blue-700/80 mt-1">
                                Se muestran todas las asignaciones programadas, activas y pasadas del oficial en el mes actual. La información de horas proviene del patrón oficial global.
                            </p>
                        </div>
                    </div>

                </div>
            </DialogContent>
        </Dialog>
    );
}
