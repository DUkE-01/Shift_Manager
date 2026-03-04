import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Calendar as CalendarIcon,
  LayoutGrid,
  List
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  format, 
  addWeeks, 
  subWeeks, 
  addMonths, 
  subMonths, 
  addYears, 
  subYears,
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameDay,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  eachMonthOfInterval
} from "date-fns";
import { es } from "date-fns/locale";
import { type Officer, type Beat, type Shift } from "@shared/schema";

export default function Schedule() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"week" | "month" | "year">("week");

  const { data: officers } = useQuery<Officer[]>({
    queryKey: ["/api/officers"],
  });

  const { data: beats } = useQuery<Beat[]>({
    queryKey: ["/api/beats"],
  });

  const { data: shifts } = useQuery<Shift[]>({
    queryKey: ["/api/shifts"],
  });

  const [selectedBeat, setSelectedBeat] = useState<string>("all");

  const filteredShifts = useMemo(() => {
    if (!shifts) return [];
    if (selectedBeat === "all") return shifts;
    return shifts.filter(s => s.beatId === selectedBeat);
  }, [shifts, selectedBeat]);

  const navigate = (direction: "prev" | "next") => {
    if (view === "week") {
      setCurrentDate(prev => direction === "prev" ? subWeeks(prev, 1) : addWeeks(prev, 1));
    } else if (view === "month") {
      setCurrentDate(prev => direction === "prev" ? subMonths(prev, 1) : addMonths(prev, 1));
    } else {
      setCurrentDate(prev => direction === "prev" ? subYears(prev, 1) : addYears(prev, 1));
    }
  };

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const monthDays = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const yearMonths = useMemo(() => {
    const start = startOfYear(currentDate);
    const end = endOfYear(currentDate);
    return eachMonthOfInterval({ start, end });
  }, [currentDate]);

  const shiftSlots = [
    { name: "Diurno", time: "07:00 - 18:00", type: "diurno" },
    { name: "Nocturno", time: "18:00 - 07:00", type: "nocturno" }
  ];

  const getOfficerName = (officerId?: string | null) => {
    if (!officerId) return "Sin asignar";
    const officer = officers?.find(o => o.id === officerId);
    return officer ? officer.name.split(' ').pop() : "Desconocido";
  };

  const getShiftColor = (shift: Shift | undefined) => {
    if (!shift) return "bg-gray-50 border-gray-100";
    if (!shift.officerId) return "bg-red-50 text-red-700 border-red-100";
    
    const colors = [
      "bg-blue-50 text-blue-700 border-blue-100",
      "bg-green-50 text-green-700 border-green-100",
      "bg-purple-50 text-purple-700 border-purple-100",
      "bg-orange-50 text-orange-700 border-orange-100",
      "bg-cyan-50 text-cyan-700 border-cyan-100"
    ];
    
    const hash = (shift.officerId || '').split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
  };

  const exportToCSV = () => {
    if (!shifts || !officers || !beats) return;

    const headers = ["Fecha", "Tipo de Turno", "Hora Inicio", "Hora Fin", "Oficial", "Rango", "Cuadrante", "Circunscripción", "Estado", "Notas"];
    const rows = shifts.map(shift => {
      const officer = officers.find(o => o.id === shift.officerId);
      const beat = beats.find(b => b.id === shift.beatId);
      return [
        shift.date,
        shift.shiftType === "diurno" ? "Diurno" : "Nocturno",
        shift.startTime,
        shift.endTime,
        officer?.name || "No asignado",
        officer?.rank || "N/A",
        beat?.name || "No asignado",
        beat?.circunscripcion || "N/A",
        shift.status,
        shift.notes || ""
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `horario_policial_${format(currentDate, "yyyy-MM-dd")}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-police-blue-900">Gestión de Horarios</h1>
          <p className="text-gray-500">Planificación y seguimiento de turnos policiales</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedBeat} onValueChange={setSelectedBeat}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por Cuadrante" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los Cuadrantes</SelectItem>
              {beats?.map(beat => (
                <SelectItem key={beat.id} value={beat.id}>{beat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Tabs value={view} onValueChange={(v) => setView(v as any)} className="w-fit">
            <TabsList>
              <TabsTrigger value="week">Semana</TabsTrigger>
              <TabsTrigger value="month">Mes</TabsTrigger>
              <TabsTrigger value="year">Año</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" size="icon" onClick={exportToCSV} title="Exportar a CSV">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-bold capitalize">
            {view === "week" && `Semana del ${format(weekDays[0], "d 'de' MMMM", { locale: es })}`}
            {view === "month" && format(currentDate, "MMMM yyyy", { locale: es })}
            {view === "year" && format(currentDate, "yyyy", { locale: es })}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => navigate("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => setCurrentDate(new Date())}>Hoy</Button>
            <Button variant="outline" size="icon" onClick={() => navigate("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {view === "week" && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="p-3 border text-left bg-gray-50 w-32">Turno</th>
                    {weekDays.map(day => (
                      <th key={day.toString()} className="p-3 border text-center bg-gray-50">
                        <div className="text-xs uppercase text-gray-500 font-semibold">{format(day, "eee", { locale: es })}</div>
                        <div className="text-lg font-bold">{format(day, "d")}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {shiftSlots.map(slot => (
                    <tr key={slot.type}>
                      <td className="p-3 border font-medium bg-gray-50">
                        <div className="text-sm">{slot.name}</div>
                        <div className="text-[10px] text-gray-500">{slot.time}</div>
                      </td>
                      {weekDays.map(day => {
                        const dateStr = format(day, "yyyy-MM-dd");
                        const shift = filteredShifts?.find(s => s.date === dateStr && s.shiftType === slot.type);
                        return (
                          <td key={day.toString()} className="p-2 border align-top h-24 min-w-[120px]">
                            {shift ? (
                              <div className={`p-2 rounded border text-xs h-full flex flex-col justify-between ${getShiftColor(shift)}`}>
                                <div className="font-bold truncate">{getOfficerName(shift.officerId)}</div>
                                <div className="text-[10px] opacity-80">
                                  {beats?.find(b => b.id === shift.beatId)?.name || "Sin cuadrante"}
                                </div>
                              </div>
                            ) : (
                              <div className="h-full border border-dashed rounded flex items-center justify-center text-gray-300">
                                <span className="text-[10px]">Vacío</span>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {view === "month" && (
            <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-lg overflow-hidden">
              {["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"].map(d => (
                <div key={d} className="bg-gray-50 p-2 text-center text-xs font-bold text-gray-500 uppercase">{d}</div>
              ))}
              {Array.from({ length: (startOfMonth(currentDate).getDay() + 6) % 7 }).map((_, i) => (
                <div key={`empty-${i}`} className="bg-white p-2 h-32 opacity-50" />
              ))}
              {monthDays.map(day => {
                const dateStr = format(day, "yyyy-MM-dd");
                const dayShifts = filteredShifts?.filter(s => s.date === dateStr);
                return (
                  <div key={day.toString()} className="bg-white p-2 h-32 border-t flex flex-col gap-1">
                    <span className={`text-sm font-bold ${isSameDay(day, new Date()) ? 'bg-police-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center' : ''}`}>
                      {format(day, "d")}
                    </span>
                    <div className="flex flex-col gap-1 overflow-y-auto">
                      {dayShifts?.map(s => (
                        <div key={s.id} className={`text-[10px] px-1 py-0.5 rounded border truncate ${getShiftColor(s)}`}>
                          {s.shiftType === "diurno" ? "☀️" : "🌙"} {getOfficerName(s.officerId)}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {view === "year" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {yearMonths.map(month => {
                const monthStart = startOfMonth(month);
                const monthEnd = endOfMonth(month);
                const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
                const monthShiftsCount = filteredShifts?.filter(s => {
                  const d = new Date(s.date);
                  return d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear();
                }).length || 0;

                return (
                  <div key={month.toString()} className="space-y-2">
                    <div className="flex items-center justify-between border-b pb-1">
                      <span className="font-bold text-police-blue-800 capitalize">{format(month, "MMMM", { locale: es })}</span>
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{monthShiftsCount} turnos</span>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-[10px]">
                      {days.map(day => {
                        const dateStr = format(day, "yyyy-MM-dd");
                        const hasShift = filteredShifts?.some(s => s.date === dateStr);
                        return (
                          <div 
                            key={day.toString()} 
                            className={`w-full aspect-square flex items-center justify-center rounded-sm ${hasShift ? 'bg-police-blue-600 text-white font-bold' : 'bg-gray-50 text-gray-400'}`}
                            title={format(day, "PP", { locale: es })}
                          >
                            {format(day, "d")}
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
