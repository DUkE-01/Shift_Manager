import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, UserCheck, Clock, AlertTriangle, Save, X, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { updateEmergencyReport } from "@/lib/api";
import { invalidateReportRelated } from "@/lib/queryClient";
import { NewReportModal } from "@/components/modals/new-report-modal";
import { EmergencyReport, Officer, Beat } from "@/lib/types";

export default function Reports() {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [priorityFilter, setPriorityFilter] = useState("all");
    const [editingReportId, setEditingReportId] = useState<string | null>(null);
    const [editFormData, setEditFormData] = useState<Partial<EmergencyReport> | null>(null);
    const [isNewReportModalOpen, setIsNewReportModalOpen] = useState(false);

    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: reports, isLoading } = useQuery<EmergencyReport[]>({ queryKey: ["/api/emergency-reports"], refetchInterval: 15000, refetchOnWindowFocus: true });
    const { data: officers } = useQuery<Officer[]>({ queryKey: ["/api/officers"], refetchInterval: 15000, refetchOnWindowFocus: true });
    const { data: beats } = useQuery<Beat[]>({ queryKey: ["/api/beats"], refetchInterval: 60000, refetchOnWindowFocus: true });

    const assignOfficerMutation = useMutation({
        mutationFn: ({ reportId, officerId, beatId }: { reportId: string; officerId: string; beatId?: string }) =>
            updateEmergencyReport(reportId, { assignedOfficerId: officerId, beatId: beatId ?? undefined, status: "assigned" }),
        onSuccess: async () => {
            toast({ title: "Éxito", description: "Oficial asignado correctamente" });
            await invalidateReportRelated();
        },
        onError: (err: Error) =>
            toast({ title: "Error", description: err.message || "No se pudo asignar el oficial", variant: "destructive" }),
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ reportId, status }: { reportId: string; status: string }) =>
            updateEmergencyReport(reportId, { status }),
        onSuccess: async () => {
            toast({ title: "Éxito", description: "Estado actualizado correctamente" });
            await invalidateReportRelated();
        },
        onError: (err: Error) =>
            toast({ title: "Error", description: err.message || "No se pudo actualizar el estado", variant: "destructive" }),
    });

    const updateReportMutation = useMutation({
        mutationFn: ({ reportId, data }: { reportId: string; data: Partial<EmergencyReport> }) =>
            updateEmergencyReport(reportId, data),
        onSuccess: async () => {
            toast({ title: "Éxito", description: "Reporte actualizado correctamente" });
            await invalidateReportRelated();
            setEditingReportId(null);
            setEditFormData(null);
        },
        onError: (err: Error) =>
            toast({ title: "Error", description: err.message || "No se pudo actualizar el reporte", variant: "destructive" }),
    });

    const filteredReports = (reports ?? []).filter(r => {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
            r.reportNumber?.toLowerCase?.() ?? ""
            r.description.toLowerCase().includes(q) ||
            r.location.toLowerCase().includes(q) ||
            (r.callerName && r.callerName.toLowerCase().includes(q));
        return matchesSearch
            && (statusFilter === "all" || r.status === statusFilter)
            && (priorityFilter === "all" || r.priority === priorityFilter);
    });

    const getTypeIcon = (type: string) => ({ emergency: "exclamation-triangle", traffic: "car", domestic: "home", theft: "shield-alt", assault: "fist-raised", non_emergency: "info-circle" }[type] ?? "file-alt");
    const getTypeBadge = (type: string) => ({ emergency: { label: "Emergencia", className: "bg-red-100 text-red-800" }, traffic: { label: "Tráfico", className: "bg-blue-100 text-blue-800" }, domestic: { label: "Doméstico", className: "bg-purple-100 text-purple-800" }, theft: { label: "Robo", className: "bg-orange-100 text-orange-800" }, assault: { label: "Agresión", className: "bg-red-100 text-red-800" }, non_emergency: { label: "No Emergencia", className: "bg-gray-100 text-gray-800" } }[type] ?? { label: type, className: "bg-gray-100 text-gray-800" });
    const getPriorityBadge = (p: string) => ({ high: { label: "Alta", className: "bg-red-100 text-red-800" }, medium: { label: "Media", className: "bg-yellow-100 text-yellow-800" }, low: { label: "Baja", className: "bg-green-100 text-green-800" } }[p] ?? { label: p, className: "bg-gray-100 text-gray-800" });
    const getStatusBadge = (s: string) => ({ pending: { label: "Pendiente", className: "bg-yellow-100 text-yellow-800" }, assigned: { label: "Asignado", className: "bg-blue-100 text-blue-800" }, in_progress: { label: "En Progreso", className: "bg-purple-100 text-purple-800" }, resolved: { label: "Resuelto", className: "bg-green-100 text-green-800" }, closed: { label: "Cerrado", className: "bg-gray-100 text-gray-800" } }[s] ?? { label: s, className: "bg-gray-100 text-gray-800" });

    const getOfficerName = (id?: string) => !id ? "Sin asignar" : (officers?.find(o => o.id === id)?.name ?? "Oficial desconocido");
    const getBeatName = (id?: string) => !id ? "Sin cuadrante" : (beats?.find(b => b.id === id)?.name ?? "Cuadrante desconocido");

    const formatDateTime = (d: Date | string) =>
        new Date(d).toLocaleString("es-ES", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });

    const getTimeElapsed = (d: Date | string) => {
        const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
        if (mins < 60) return `${mins} min`;
        const h = Math.floor(mins / 60);
        if (h < 24) return `${h}h ${mins % 60}min`;
        return `${Math.floor(h / 24)}d ${h % 24}h`;
    };

    const handleEditClick = (r: EmergencyReport) => {
        setEditingReportId(r.id);
        setEditFormData({
            description: r.description, location: r.location, type: r.type,
            priority: r.priority, status: r.status, assignedOfficerId: r.assignedOfficerId,
            beatId: r.beatId, callerName: r.callerName, callerPhone: r.callerPhone, notes: r.notes
        });
    };
    const handleInputChange = (field: keyof EmergencyReport, value: string) =>
        setEditFormData(prev => ({ ...prev, [field]: value }));

    const stats = {
        total: reports?.length ?? 0,
        pending: reports?.filter(r => r.status === "pending").length ?? 0,
        inProgress: reports?.filter(r => r.status === "in_progress").length ?? 0,
        highPriority: reports?.filter(r => r.priority === "high" && r.status !== "resolved" && r.status !== "closed").length ?? 0,
    };

    if (isLoading) return (
        <div className="h-full flex items-center justify-center">
            <p className="text-gray-500">Cargando reportes...</p>
        </div>
    );

    return (
        <div className="h-full overflow-auto">
            <div className="p-6 space-y-6">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Reportes de Emergencia</h2>
                        <p className="text-gray-600 mt-1">Gestión de llamadas y reportes de emergencia</p>
                    </div>
                    <div className="mt-4 sm:mt-0">
                        <Button onClick={() => setIsNewReportModalOpen(true)} className="bg-red-600 hover:bg-red-700" data-testid="button-new-report">
                            <Plus className="w-4 h-4 mr-2" />Nuevo Reporte
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: "Total Reportes", value: stats.total, bg: "bg-blue-100", icon: <i className="fas fa-file-alt text-blue-600 text-xl" />, testId: "stats-total" },
                        { label: "Pendientes", value: stats.pending, bg: "bg-yellow-100", icon: <Clock className="text-yellow-600 w-6 h-6" />, testId: "stats-pending" },
                        { label: "En Progreso", value: stats.inProgress, bg: "bg-purple-100", icon: <UserCheck className="text-purple-600 w-6 h-6" />, testId: "stats-in-progress" },
                        { label: "Alta Prioridad", value: stats.highPriority, bg: "bg-red-100", icon: <AlertTriangle className="text-red-600 w-6 h-6" />, testId: "stats-high-priority" },
                    ].map(s => (
                        <Card key={s.label}><CardContent className="p-6">
                            <div className="flex items-center">
                                <div className={`p-3 rounded-full ${s.bg}`}>{s.icon}</div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">{s.label}</p>
                                    <p className="text-2xl font-bold text-gray-900" data-testid={s.testId}>{s.value}</p>
                                </div>
                            </div>
                        </CardContent></Card>
                    ))}
                </div>

                {/* Filtros */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input placeholder="Buscar por número, descripción, ubicación o nombre..."
                            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                            className="pl-10" data-testid="input-search" />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-48" data-testid="select-status-filter"><SelectValue placeholder="Estado" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los estados</SelectItem>
                            <SelectItem value="pending">Pendiente</SelectItem>
                            <SelectItem value="assigned">Asignado</SelectItem>
                            <SelectItem value="in_progress">En Progreso</SelectItem>
                            <SelectItem value="resolved">Resuelto</SelectItem>
                            <SelectItem value="closed">Cerrado</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                        <SelectTrigger className="w-48" data-testid="select-priority-filter"><SelectValue placeholder="Prioridad" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas las prioridades</SelectItem>
                            <SelectItem value="high">Alta</SelectItem>
                            <SelectItem value="medium">Media</SelectItem>
                            <SelectItem value="low">Baja</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Lista */}
                <div className="space-y-4" data-testid="reports-list">
                    {filteredReports?.map(report => (
                        <Card key={report.id} className="hover:shadow-md transition-shadow" data-testid={`report-${report.id}`}>
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">

                                        {/* Badges row */}
                                        <div className="flex flex-wrap items-center gap-2 mb-3">
                                            <div className="flex items-center gap-2">
                                                <i className={`fas fa-${getTypeIcon(report.type)} text-gray-500`} />
                                                <span className="font-semibold text-gray-900">{report.reportNumber}</span>
                                            </div>
                                            {editingReportId === report.id ? (
                                                <>
                                                    <Select value={editFormData?.type ?? ""} onValueChange={v => handleInputChange("type", v)}>
                                                        <SelectTrigger className="w-36"><SelectValue placeholder="Tipo" /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="emergency">Emergencia</SelectItem>
                                                            <SelectItem value="traffic">Tráfico</SelectItem>
                                                            <SelectItem value="domestic">Doméstico</SelectItem>
                                                            <SelectItem value="theft">Robo</SelectItem>
                                                            <SelectItem value="assault">Agresión</SelectItem>
                                                            <SelectItem value="non_emergency">No Emergencia</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <Select value={editFormData?.priority ?? ""} onValueChange={v => handleInputChange("priority", v)}>
                                                        <SelectTrigger className="w-28"><SelectValue placeholder="Prioridad" /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="high">Alta</SelectItem>
                                                            <SelectItem value="medium">Media</SelectItem>
                                                            <SelectItem value="low">Baja</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <Select value={editFormData?.status ?? ""} onValueChange={v => handleInputChange("status", v)}>
                                                        <SelectTrigger className="w-36"><SelectValue placeholder="Estado" /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="pending">Pendiente</SelectItem>
                                                            <SelectItem value="assigned">Asignado</SelectItem>
                                                            <SelectItem value="in_progress">En Progreso</SelectItem>
                                                            <SelectItem value="resolved">Resuelto</SelectItem>
                                                            <SelectItem value="closed">Cerrado</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </>
                                            ) : (
                                                <>
                                                    <Badge className={getTypeBadge(report.type).className}>{getTypeBadge(report.type).label}</Badge>
                                                    <Badge className={getPriorityBadge(report.priority).className}>{getPriorityBadge(report.priority).label}</Badge>
                                                    <Badge className={getStatusBadge(report.status).className}>{getStatusBadge(report.status).label}</Badge>
                                                </>
                                            )}
                                        </div>

                                        {/* Cuerpo */}
                                        {editingReportId === report.id ? (
                                            <div className="space-y-3 mb-3">
                                                <Input value={editFormData?.description ?? ""} onChange={e => handleInputChange("description", e.target.value)} placeholder="Descripción" />
                                                <Input value={editFormData?.location ?? ""} onChange={e => handleInputChange("location", e.target.value)} placeholder="Ubicación" />
                                                <Select value={editFormData?.assignedOfficerId ?? ""} onValueChange={v => handleInputChange("assignedOfficerId", v)}>
                                                    <SelectTrigger><SelectValue placeholder="Oficial asignado" /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="">Sin asignar</SelectItem>
                                                        {officers?.map(o => <SelectItem key={o.id} value={o.id}>{o.name} ({o.badge})</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                                <Select value={editFormData?.beatId ?? ""} onValueChange={v => handleInputChange("beatId", v)}>
                                                    <SelectTrigger><SelectValue placeholder="Cuadrante" /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="">Sin asignar</SelectItem>
                                                        {beats?.map(b => <SelectItem key={b.id} value={b.id}>{b.name} (Circ. {b.circunscripcion})</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                                <Textarea value={editFormData?.notes ?? ""} onChange={e => handleInputChange("notes", e.target.value)} placeholder="Notas adicionales" rows={2} />
                                            </div>
                                        ) : (
                                            <>
                                                <h3 className="text-base font-semibold text-gray-900 mb-2">{report.description}</h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                                                    <div className="space-y-1">
                                                        <p><strong>Ubicación:</strong> {report.location}</p>
                                                        <p><strong>Reportado:</strong> {formatDateTime(report.reportedAt)}</p>
                                                        <p><strong>Tiempo:</strong> {getTimeElapsed(report.reportedAt)}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        {report.callerName && <p><strong>Denunciante:</strong> {report.callerName}</p>}
                                                        {report.callerPhone && <p><strong>Teléfono:</strong> {report.callerPhone}</p>}
                                                        <p><strong>Oficial:</strong> {getOfficerName(report.assignedOfficerId)}</p>
                                                        <p><strong>Cuadrante:</strong> {getBeatName(report.beatId)}</p>
                                                    </div>
                                                </div>
                                                {report.notes && (
                                                    <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-700">
                                                        <strong>Notas:</strong> {report.notes}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    {/* Botones de acción */}
                                    <div className="flex flex-col gap-2 flex-shrink-0">
                                        {editingReportId === report.id ? (
                                            <>
                                                <Button onClick={() => updateReportMutation.mutate({ reportId: report.id, data: editFormData! })}
                                                    className="bg-green-600 hover:bg-green-700" disabled={updateReportMutation.isPending} size="sm">
                                                    <Save className="h-4 w-4 mr-1" />Guardar
                                                </Button>
                                                <Button variant="outline" size="sm"
                                                    onClick={() => { setEditingReportId(null); setEditFormData(null); }}
                                                    disabled={updateReportMutation.isPending}>
                                                    <X className="h-4 w-4 mr-1" />Cancelar
                                                </Button>
                                            </>
                                        ) : (
                                            <>
                                                <Button variant="outline" size="sm" onClick={() => handleEditClick(report)} data-testid={`button-edit-${report.id}`}>
                                                    <Edit className="h-4 w-4 mr-1" />Editar
                                                </Button>
                                                {report.status === "pending" && (
                                                    <Select onValueChange={officerId => officerId && assignOfficerMutation.mutate({ reportId: report.id, officerId })}>
                                                        <SelectTrigger className="w-32" data-testid={`select-assign-${report.id}`}><SelectValue placeholder="Asignar" /></SelectTrigger>
                                                        <SelectContent>
                                                            {officers?.filter(o => o.status === "on_duty").map(o => (
                                                                <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                                {report.status === "assigned" && (
                                                    <Button variant="outline" size="sm" data-testid={`button-start-${report.id}`}
                                                        onClick={() => updateStatusMutation.mutate({ reportId: report.id, status: "in_progress" })}>
                                                        Iniciar
                                                    </Button>
                                                )}
                                                {report.status === "in_progress" && (
                                                    <Button variant="outline" size="sm" data-testid={`button-resolve-${report.id}`}
                                                        onClick={() => updateStatusMutation.mutate({ reportId: report.id, status: "resolved" })}>
                                                        Resolver
                                                    </Button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {filteredReports?.length === 0 && (
                        <Card><CardContent className="p-8 text-center">
                            <p className="text-gray-500">
                                {searchQuery || statusFilter !== "all" || priorityFilter !== "all"
                                    ? "No se encontraron reportes que coincidan con los filtros."
                                    : "No hay reportes disponibles."}
                            </p>
                        </CardContent></Card>
                    )}
                </div>
            </div>

            <NewReportModal isOpen={isNewReportModalOpen} onClose={() => setIsNewReportModalOpen(false)} />
        </div>
    );
}