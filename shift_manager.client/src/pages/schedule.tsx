import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    ChevronLeft, ChevronRight, Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
    format, addWeeks, subWeeks, addMonths, subMonths, addYears, subYears,
    startOfWeek, endOfWeek, eachDayOfInterval, isSameDay,
    startOfMonth, endOfMonth, startOfYear, endOfYear, eachMonthOfInterval,
} from "date-fns";
import { es } from "date-fns/locale";
import type { Officer, Beat, Shift } from "@/lib/types";

const SHIFT_TYPE_CONFIG: Record<string, {
    label: string; shortLabel: string; hours: string;
    bg: string; text: string; border: string; dot: string;
}> = {
    diurno: { label: "Diurno", shortLabel: "D", hours: "07–18", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", dot: "bg-blue-500" },
    vespertino_lj: { label: "Vesp. L–J", shortLabel: "VLJ", hours: "18–07", bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", dot: "bg-purple-500" },
    vespertino_vd: { label: "Vesp. V–D", shortLabel: "VVD", hours: "18–07", bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", dot: "bg-orange-500" },
    nocturno: { label: "Nocturno", shortLabel: "N", hours: "22–06", bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200", dot: "bg-slate-500" },
};

function getTypeConfig(shiftType: string) {
    return SHIFT_TYPE_CONFIG[shiftType] ?? SHIFT_TYPE_CONFIG["diurno"];
}

export default function Schedule() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState<"week" | "month" | "year">("week");
    const [selectedBeat, setSelectedBeat] = useState<string>("all");
    const [selectedType, setSelectedType] = useState<string>("all");

    const { data: officers } = useQuery<Officer[]>({ queryKey: ["/api/officers"], refetchInterval: 15000, refetchOnWindowFocus: true });
    const { data: beats } = useQuery<Beat[]>({ queryKey: ["/api/beats"], refetchInterval: 60000, refetchOnWindowFocus: true });
    const { data: shifts } = useQuery<Shift[]>({ queryKey: ["/api/shifts"], refetchInterval: 15000, refetchOnWindowFocus: true });

    const filteredShifts = useMemo(() => {
        if (!shifts) return [];
        return shifts.filter(s =>
            (selectedBeat === "all" || s.beatId === selectedBeat) &&
            (selectedType === "all" || s.shiftType === selectedType)
        );
    }, [shifts, selectedBeat, selectedType]);

    const navigate = (dir: "prev" | "next") => {
        if (view === "week") setCurrentDate(p => dir === "prev" ? subWeeks(p, 1) : addWeeks(p, 1));
        else if (view === "month") setCurrentDate(p => dir === "prev" ? subMonths(p, 1) : addMonths(p, 1));
        else setCurrentDate(p => dir === "prev" ? subYears(p, 1) : addYears(p, 1));
    };

    const weekDays = useMemo(() => eachDayOfInterval({ start: startOfWeek(currentDate, { weekStartsOn: 1 }), end: endOfWeek(currentDate, { weekStartsOn: 1 }) }), [currentDate]);
    const monthDays = useMemo(() => eachDayOfInterval({ start: startOfMonth(currentDate), end: endOfMonth(currentDate) }), [currentDate]);
    const yearMonths = useMemo(() => eachMonthOfInterval({ start: startOfYear(currentDate), end: endOfYear(currentDate) }), [currentDate]);

    const activeShiftTypes = useMemo(() => {
        if (!shifts) return Object.keys(SHIFT_TYPE_CONFIG);
        const inView = new Set(
            shifts
                .filter(s => selectedBeat === "all" || s.beatId === selectedBeat)
                .map(s => s.shiftType)
        );
        return Object.keys(SHIFT_TYPE_CONFIG).filter(t => inView.has(t));
    }, [shifts, selectedBeat]);

    const getOfficerName = (id?: string) =>
        !id ? "Sin asignar" : (officers?.find(o => o.id === id)?.name?.split(" ").slice(-1)[0] ?? "—");

    const exportToCSV = () => {
        if (!shifts || !officers || !beats) return;
        const headers = ["Fecha", "Tipo", "Inicio", "Fin", "Oficial", "Rango", "Cuadrante", "Circunscripción", "Estado", "Notas"];
        const rows = shifts.map(s => {
            const o = officers.find(x => x.id === s.officerId);
            const b = beats.find(x => x.id === s.beatId);
            const cfg = getTypeConfig(s.shiftType);
            return [s.date, cfg.label, s.startTime, s.endTime,
            o?.name || "No asignado", o?.rank || "N/A", b?.name || "No asignado",
            b?.circunscripcion || "N/A", s.status, s.notes || ""];
        });
        const csv = [headers.join(","), ...rows.map(r => r.map(c => `"${c}"`).join(","))].join("\n");
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
        a.download = `horario_policial_${format(currentDate, "yyyy-MM-dd")}.csv`;
        a.style.visibility = "hidden";
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
    };

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-police-blue-900">Gestión de Horarios</h1>
                    <p className="text-gray-500 text-sm">Planificación y seguimiento de turnos policiales</p>
                </div>

                {/* Leyenda */}
                <div className="flex flex-wrap gap-2">
                    {Object.entries(SHIFT_TYPE_CONFIG).map(([key, cfg]) => (
                        <div key={key} className="flex items-center gap-1.5 text-xs text-gray-600">
                            <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                            <span>{cfg.label}</span>
                            <span className="text-gray-400">{cfg.hours}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Controles */}
            <div className="flex flex-wrap items-center gap-3">
                <Select value={selectedBeat} onValueChange={setSelectedBeat}>
                    <SelectTrigger className="w-48"><SelectValue placeholder="Todos los cuadrantes" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos los cuadrantes</SelectItem>
                        {beats?.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                    </SelectContent>
                </Select>

                <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="w-44"><SelectValue placeholder="Todos los turnos" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos los turnos</SelectItem>
                        {Object.entries(SHIFT_TYPE_CONFIG).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v.label} ({v.hours})</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Tabs value={view} onValueChange={v => setView(v as any)} className="w-fit">
                    <TabsList>
                        <TabsTrigger value="week">Semana</TabsTrigger>
                        <TabsTrigger value="month">Mes</TabsTrigger>
                        <TabsTrigger value="year">Año</TabsTrigger>
                    </TabsList>
                </Tabs>

                <Button variant="outline" size="icon" onClick={exportToCSV} title="Exportar CSV">
                    <Download className="h-4 w-4" />
                </Button>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle className="text-lg font-bold capitalize">
                        {view === "week" && `Semana del ${format(weekDays[0], "d 'de' MMMM", { locale: es })}`}
                        {view === "month" && format(currentDate, "MMMM yyyy", { locale: es })}
                        {view === "year" && format(currentDate, "yyyy", { locale: es })}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={() => navigate("prev")}><ChevronLeft className="h-4 w-4" /></Button>
                        <Button variant="outline" onClick={() => setCurrentDate(new Date())}>Hoy</Button>
                        <Button variant="outline" size="icon" onClick={() => navigate("next")}><ChevronRight className="h-4 w-4" /></Button>
                    </div>
                </CardHeader>

                <CardContent>

                    {/* ── VISTA SEMANA ───────────────────────────────────────────── */}
                    {view === "week" && (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-sm">
                                <thead>
                                    <tr>
                                        <th className="p-3 border text-left bg-gray-50 w-36 text-xs font-semibold text-gray-500 uppercase">Turno</th>
                                        {weekDays.map(day => (
                                            <th key={day.toString()} className={`p-3 border text-center min-w-[130px] ${isSameDay(day, new Date()) ? "bg-police-blue-50" : "bg-gray-50"}`}>
                                                <div className="text-xs uppercase text-gray-400 font-semibold">{format(day, "eee", { locale: es })}</div>
                                                <div className={`text-lg font-bold ${isSameDay(day, new Date()) ? "text-police-blue-700" : "text-gray-800"}`}>{format(day, "d")}</div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {(selectedType === "all" ? Object.keys(SHIFT_TYPE_CONFIG) : [selectedType]).map(type => {
                                        const cfg = getTypeConfig(type);
                                        return (
                                            <tr key={type}>
                                                <td className="p-3 border bg-gray-50">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                                                        <div>
                                                            <div className="text-xs font-semibold text-gray-700">{cfg.label}</div>
                                                            <div className="text-[10px] text-gray-400">{cfg.hours}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                {weekDays.map(day => {
                                                    const dateStr = format(day, "yyyy-MM-dd");
                                                    const dayShifts = filteredShifts.filter(s => s.date === dateStr && s.shiftType === type);
                                                    return (
                                                        <td key={day.toString()} className="p-1.5 border align-top h-24">
                                                            {dayShifts.length > 0 ? (
                                                                <div className="space-y-1 h-full">
                                                                    {dayShifts.map(shift => (
                                                                        <div key={shift.id} className={`px-2 py-1.5 rounded border text-xs flex flex-col gap-0.5 ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                                                                            <span className="font-bold truncate">{getOfficerName(shift.officerId)}</span>
                                                                            <span className="text-[10px] opacity-70 truncate">
                                                                                {beats?.find(b => b.id === shift.beatId)?.name || "Sin cuadrante"}
                                                                            </span>
                                                                            <Badge className={`text-[9px] w-fit px-1 py-0 h-4 ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
                                                                                {shift.status === "active" ? "Activo" : shift.status === "completed" ? "Completado" : "Programado"}
                                                                            </Badge>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <div className="h-full border border-dashed border-gray-200 rounded flex items-center justify-center">
                                                                    <span className="text-[10px] text-gray-300">—</span>
                                                                </div>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* ── VISTA MES ──────────────────────────────────────────────── */}
                    {view === "month" && (
                        <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-lg overflow-hidden">
                            {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map(d => (
                                <div key={d} className="bg-gray-50 p-2 text-center text-xs font-bold text-gray-500 uppercase">{d}</div>
                            ))}
                            {Array.from({ length: (startOfMonth(currentDate).getDay() + 6) % 7 }).map((_, i) => (
                                <div key={`e-${i}`} className="bg-white p-1 h-28" />
                            ))}
                            {monthDays.map(day => {
                                const dateStr = format(day, "yyyy-MM-dd");
                                const dayShifts = filteredShifts.filter(s => s.date === dateStr);
                                const isToday = isSameDay(day, new Date());
                                return (
                                    <div key={day.toString()} className={`bg-white p-1.5 h-28 border-t flex flex-col gap-0.5 ${isToday ? "bg-blue-50" : ""}`}>
                                        <span className={`text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full ${isToday ? "bg-police-blue-600 text-white" : "text-gray-700"
                                            }`}>
                                            {format(day, "d")}
                                        </span>
                                        <div className="flex flex-col gap-0.5 overflow-y-auto flex-1">
                                            {dayShifts.map(s => {
                                                const cfg = getTypeConfig(s.shiftType);
                                                return (
                                                    <div key={s.id} className={`text-[9px] px-1 py-0.5 rounded border truncate ${cfg.bg} ${cfg.text} ${cfg.border}`}
                                                        title={`${cfg.label} — ${getOfficerName(s.officerId)}`}>
                                                        <span className="font-bold">{cfg.shortLabel}</span> {getOfficerName(s.officerId)}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* ── VISTA AÑO ──────────────────────────────────────────────── */}
                    {view === "year" && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {yearMonths.map(month => {
                                const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
                                const counts = Object.keys(SHIFT_TYPE_CONFIG).reduce((acc, type) => {
                                    acc[type] = filteredShifts.filter(s => {
                                        const d = new Date(s.date);
                                        return s.shiftType === type && d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear();
                                    }).length;
                                    return acc;
                                }, {} as Record<string, number>);
                                const totalMonth = Object.values(counts).reduce((a, b) => a + b, 0);

                                return (
                                    <div key={month.toString()} className="space-y-2">
                                        <div className="flex items-center justify-between border-b pb-1">
                                            <span className="font-bold text-police-blue-800 capitalize text-sm">
                                                {format(month, "MMMM", { locale: es })}
                                            </span>
                                            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{totalMonth}</span>
                                        </div>
                                        {/* Mini conteo por tipo */}
                                        <div className="flex flex-wrap gap-1">
                                            {Object.entries(counts).filter(([, n]) => n > 0).map(([type, n]) => {
                                                const cfg = getTypeConfig(type);
                                                return (
                                                    <span key={type} className={`text-[9px] px-1.5 py-0.5 rounded border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                                                        {cfg.shortLabel}:{n}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                        {/* Mini calendario */}
                                        <div className="grid grid-cols-7 gap-px text-[9px]">
                                            {days.map(day => {
                                                const dateStr = format(day, "yyyy-MM-dd");
                                                const dayShifts = filteredShifts.filter(s => s.date === dateStr);
                                                const isToday = isSameDay(day, new Date());
                                                const dominantType = dayShifts[0]?.shiftType;
                                                const cfg = dominantType ? getTypeConfig(dominantType) : null;
                                                return (
                                                    <div key={day.toString()}
                                                        className={`w-full aspect-square flex items-center justify-center rounded-sm font-bold
                              ${isToday ? "ring-2 ring-police-blue-600" : ""}
                              ${cfg ? `${cfg.bg} ${cfg.text}` : "bg-gray-50 text-gray-300"}`}
                                                        title={dayShifts.map(s => `${getTypeConfig(s.shiftType).label} — ${getOfficerName(s.officerId)}`).join("\n") || format(day, "PP", { locale: es })}>
                                                        {dayShifts.length > 1 ? (
                                                            <span className="relative">
                                                                {format(day, "d")}
                                                                <span className="absolute -top-1 -right-2 text-[7px] font-bold opacity-70">{dayShifts.length}</span>
                                                            </span>
                                                        ) : format(day, "d")}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                </CardContent>
            </Card>
        </div>
    );
}