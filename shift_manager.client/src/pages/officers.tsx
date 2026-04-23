import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Edit, Calendar, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { updateOfficer } from "@/lib/api";
import { invalidateOfficerRelated } from "@/lib/queryClient";
import { NewOfficerModal } from "@/components/modals/new-officer-modal";
import { OfficerScheduleModal } from "@/components/modals/officer-schedule-modal";
import { Officer } from "@/lib/types";

const CUADRANTES_POR_CIRCUNSCRIPCION: Record<string, string[]> = {
    "1": ["1", "2", "7"],
    "2": ["5", "6"],
    "3": ["3", "4"],
};

export default function Officers() {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [circunscripcionFilter, setCircunscripcionFilter] = useState("all");
    const [puestoFilter, setPuestoFilter] = useState("all");
    const [cuadranteFilter, setCuadranteFilter] = useState("all");
    const [isNewOfficerModalOpen, setIsNewOfficerModalOpen] = useState(false);
    const [editingOfficerId, setEditingOfficerId] = useState<string | null>(null);
    const [editFormData, setEditFormData] = useState<Partial<Officer> | null>(null);
    
    // ESTADO PARA EL MODAL DE HORARIOS
    const [scheduleOfficer, setScheduleOfficer] = useState<Officer | null>(null);

    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: officers, isLoading } = useQuery<Officer[]>({ queryKey: ["/api/officers"] });

    const updateOfficerStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) =>
            updateOfficer(id, { status: status as Officer["status"] }),
        onSuccess: async () => {
            toast({ title: "Éxito", description: "Estado del oficial actualizado correctamente" });
            await invalidateOfficerRelated();
        },
        onError: (err: Error) => {
            toast({ title: "Error", description: err.message || "No se pudo actualizar el estado", variant: "destructive" });
        },
    });

    const updateOfficerMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Officer> }) =>
            updateOfficer(id, data),
        onSuccess: async () => {
            toast({ title: "Éxito", description: "Oficial actualizado correctamente" });
            await invalidateOfficerRelated();
            setEditingOfficerId(null);
            setEditFormData(null);
        },
        onError: (err: Error) => {
            toast({ title: "Error", description: err.message || "No se pudo actualizar el oficial", variant: "destructive" });
        },
    });

    const filteredOfficers = officers?.filter(officer => {
        // Corrección de Runtime: Fallback seguro si la prop está indefinida
        const matchesSearch =
            (officer.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (officer.badge || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (officer.email || "").toLowerCase().includes(searchQuery.toLowerCase());
            
        const matchesStatus = statusFilter === "all" || officer.status === statusFilter;
        const matchesCircunscripcion = circunscripcionFilter === "all" || officer.circunscripcion?.toString() === circunscripcionFilter;
        const matchesPuesto = puestoFilter === "all" || officer.puestoAsignado === puestoFilter;
        const matchesCuadrante = cuadranteFilter === "all" || (officer.cuadrantes && officer.cuadrantes.includes(cuadranteFilter));
        
        return matchesSearch && matchesStatus && matchesCircunscripcion && matchesPuesto && matchesCuadrante;
    });

    const getStatusBadge = (status: string) => ({
        on_duty: { label: "En Servicio", className: "bg-green-100 text-green-800" },
        off_duty: { label: "Fuera de Servicio", className: "bg-yellow-100 text-yellow-800" },
        unavailable: { label: "No Disponible", className: "bg-red-100 text-red-800" },
    }[status] ?? { label: status, className: "bg-gray-100 text-gray-800" });

    const toggleOfficerStatus = (officer: Officer) => {
        const newStatus = officer.status === "on_duty" ? "off_duty" : "on_duty";
        updateOfficerStatusMutation.mutate({ id: officer.id, status: newStatus });
    };

    const handleEditClick = (officer: Officer) => {
        setEditingOfficerId(officer.id);
        setEditFormData({
            name: officer.name, cedula: officer.cedula, badge: officer.badge, rank: officer.rank,
            circunscripcion: officer.circunscripcion, puestoAsignado: officer.puestoAsignado,
            cuadrantes: officer.cuadrantes || [], email: officer.email, phone: officer.phone, status: officer.status
        });
    };
    
    const handleCancelEdit = () => { 
        setEditingOfficerId(null); 
        setEditFormData(null); 
    };
    
    const handleSaveEdit = () => {
        if (editingOfficerId && editFormData)
            updateOfficerMutation.mutate({ id: editingOfficerId, data: editFormData });
    };
    
    const handleInputChange = (field: keyof Officer, value: any) => {
        setEditFormData(prev => {
            if (!prev) return prev; // Retornamos temprano si es null por accidente
            
            const updated = { ...prev, [field]: value };
            
            if (field === "circunscripcion") {
                const circKey = String(value); 
                const newCuadrantes = CUADRANTES_POR_CIRCUNSCRIPCION[circKey] || [];
                updated.cuadrantes = prev?.cuadrantes?.filter(c => newCuadrantes.includes(c)) || [];
            }
            return updated;
        });
    };
    
    const toggleCuadrante = (cuadrante: string) => {
        setEditFormData(prev => {
            if (!prev) return prev;
            const cur = prev.cuadrantes || [];
            return { ...prev, cuadrantes: cur.includes(cuadrante) ? cur.filter(c => c !== cuadrante) : [...cur, cuadrante] };
        });
    };
    
    const getAvailableCuadrantes = (circ: string | undefined) =>
        circ ? (CUADRANTES_POR_CIRCUNSCRIPCION[circ] || []) : [];

    if (isLoading) return (
        <div className="h-full flex items-center justify-center">
            <div className="text-gray-500">Cargando oficiales...</div>
        </div>
    );

    const allCuadrantes = Array.from(new Set(officers?.flatMap(o => o.cuadrantes || []) || [])).sort();

    return (
        <div className="h-full overflow-auto">
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Gestión de Oficiales</h2>
                        <p className="text-gray-600 mt-1">Gestionar lista de oficiales y disponibilidad</p>
                    </div>
                    <div className="mt-4 sm:mt-0">
                        <Button onClick={() => setIsNewOfficerModalOpen(true)}
                            className="bg-police-blue-600 hover:bg-police-blue-700" data-testid="button-add-officer">
                            <Plus className="w-4 h-4 mr-2" />Agregar Oficial
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
                    <div className="relative flex-1 min-w-48">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input placeholder="Buscar por nombre, código o email..." value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)} className="pl-10" data-testid="input-search" />
                    </div>
                    {[
                        {
                            value: statusFilter, onChange: setStatusFilter, placeholder: "Estado", testId: "select-status-filter",
                            options: [["all", "Todos los estados"], ["on_duty", "En Servicio"], ["off_duty", "Fuera de Servicio"], ["unavailable", "No Disponible"]]
                        },
                        {
                            value: circunscripcionFilter, onChange: setCircunscripcionFilter, placeholder: "Circunscripción", testId: "select-circunscripcion-filter",
                            options: [["all", "Todas"], ["1", "Circunscripción 1"], ["2", "Circunscripción 2"], ["3", "Circunscripción 3"]]
                        },
                        {
                            value: puestoFilter, onChange: setPuestoFilter, placeholder: "Puesto", testId: "select-puesto-filter",
                            options: [["all", "Todos los puestos"], ["Palacio", "Palacio"], ["Patrullero", "Patrullero"], ["Puesto Fijo", "Puesto Fijo"]]
                        },
                    ].map(f => (
                        <Select key={f.testId} value={f.value} onValueChange={f.onChange}>
                            <SelectTrigger className="w-44" data-testid={f.testId}><SelectValue placeholder={f.placeholder} /></SelectTrigger>
                            <SelectContent>{f.options.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
                        </Select>
                    ))}
                    <Select value={cuadranteFilter} onValueChange={setCuadranteFilter}>
                        <SelectTrigger className="w-44" data-testid="select-cuadrante-filter"><SelectValue placeholder="Cuadrante" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los cuadrantes</SelectItem>
                            {allCuadrantes.map(c => <SelectItem key={c} value={c}>Cuadrante {c}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    {/* CLASES RESPONSIVAS AGREGADAS */}
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Oficial</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Cédula</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Código</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Rango</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Circunscripción</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Puesto</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden xl:table-cell">Cuadrantes</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Contacto</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200" data-testid="officers-table">
                                {filteredOfficers?.map(officer => (
                                    <tr key={officer.id} data-testid={`officer-row-${officer.id}`}>
                                        
                                        {/* Oficial (Siempre visible) */}
                                        <td className="px-4 py-4">
                                            {editingOfficerId === officer.id
                                                ? <Input value={editFormData?.name || ""} onChange={e => handleInputChange("name", e.target.value)} />
                                                : <div className="flex items-center">
                                                    <div className="w-8 h-8 rounded-full bg-police-blue-100 flex items-center justify-center mr-3 flex-shrink-0">
                                                        <i className="fas fa-user text-police-blue-600 text-xs" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="text-sm font-medium text-gray-900 truncate">{officer.name}</div>
                                                        <div className="text-xs text-gray-500 truncate">{officer.email}</div>
                                                    </div>
                                                </div>}
                                        </td>
                                        
                                        {/* Cédula */}
                                        <td className="px-4 py-4 whitespace-nowrap hidden md:table-cell">
                                            {editingOfficerId === officer.id
                                                ? <Input value={editFormData?.cedula || ""} onChange={e => handleInputChange("cedula", e.target.value)} />
                                                : <span className="text-sm text-gray-900">{officer.cedula || "N/A"}</span>}
                                        </td>
                                        
                                        {/* Código */}
                                        <td className="px-4 py-4 whitespace-nowrap hidden sm:table-cell">
                                            {editingOfficerId === officer.id
                                                ? <Input value={editFormData?.badge || ""} onChange={e => handleInputChange("badge", e.target.value)} />
                                                : <span className="text-sm font-mono text-gray-900">{officer.badge}</span>}
                                        </td>
                                        
                                        {/* Rango */}
                                        <td className="px-4 py-4 whitespace-nowrap hidden sm:table-cell">
                                            {editingOfficerId === officer.id
                                                ? <Input value={editFormData?.rank || ""} onChange={e => handleInputChange("rank", e.target.value)} />
                                                : <span className="text-sm text-gray-900">{officer.rank}</span>}
                                        </td>
                                        
                                        {/* Circunscripción */}
                                        <td className="px-4 py-4 whitespace-nowrap hidden lg:table-cell">
                                            {editingOfficerId === officer.id
                                                ? <Select value={editFormData?.circunscripcion?.toString() || ""}
                                                    onValueChange={v => handleInputChange("circunscripcion", parseInt(v))}>
                                                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="1">Circunscripción 1</SelectItem>
                                                        <SelectItem value="2">Circunscripción 2</SelectItem>
                                                        <SelectItem value="3">Circunscripción 3</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                : <Badge className="bg-blue-100 text-blue-800">Circ. {officer.circunscripcion || "N/A"}</Badge>}
                                        </td>
                                        
                                        {/* Puesto */}
                                        <td className="px-4 py-4 whitespace-nowrap hidden lg:table-cell">
                                            {editingOfficerId === officer.id
                                                ? <Select value={editFormData?.puestoAsignado || ""}
                                                    onValueChange={v => handleInputChange("puestoAsignado", v)}>
                                                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Palacio">Palacio</SelectItem>
                                                        <SelectItem value="Patrullero">Patrullero</SelectItem>
                                                        <SelectItem value="Puesto Fijo">Puesto Fijo</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                : <Badge className="bg-purple-100 text-purple-800">{officer.puestoAsignado || "N/A"}</Badge>}
                                        </td>
                                        
                                        {/* Cuadrantes */}
                                        <td className="px-4 py-4 hidden xl:table-cell">
                                            {editingOfficerId === officer.id
                                                ? <div className="flex flex-wrap gap-1">
                                                    {getAvailableCuadrantes(editFormData?.circunscripcion?.toString()).map(c => (
                                                        <Button key={c} variant={editFormData?.cuadrantes?.includes(c) ? "default" : "outline"}
                                                            size="sm" onClick={() => toggleCuadrante(c)}>{c}</Button>
                                                    ))}
                                                </div>
                                                : <div className="flex flex-wrap gap-1">
                                                    {officer.cuadrantes?.length
                                                        ? officer.cuadrantes.map(c => <Badge key={c} variant="outline" className="border-gray-300 text-gray-700">{c}</Badge>)
                                                        : <span className="text-sm text-gray-500">N/A</span>}
                                                </div>}
                                        </td>
                                        
                                        {/* Estado (Siempre visible) */}
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            {editingOfficerId === officer.id
                                                ? <Select value={editFormData?.status || ""}
                                                    onValueChange={v => handleInputChange("status", v)}>
                                                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="on_duty">En Servicio</SelectItem>
                                                        <SelectItem value="off_duty">Fuera de Servicio</SelectItem>
                                                        <SelectItem value="unavailable">No Disponible</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                : <Badge className={`cursor-pointer ${getStatusBadge(officer.status).className}`}
                                                    onClick={() => toggleOfficerStatus(officer)} data-testid={`status-${officer.id}`}>
                                                    {getStatusBadge(officer.status).label}
                                                </Badge>}
                                        </td>
                                        
                                        {/* Contacto */}
                                        <td className="px-4 py-4 whitespace-nowrap hidden md:table-cell">
                                            {editingOfficerId === officer.id
                                                ? <div className="space-y-1">
                                                    <Input value={editFormData?.phone || ""} onChange={e => handleInputChange("phone", e.target.value)} placeholder="Teléfono" />
                                                </div>
                                                : <span className="text-sm text-gray-900">{officer.phone || "N/A"}</span>}
                                        </td>
                                        
                                        {/* Acciones (Siempre visible) */}
                                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                                            {editingOfficerId === officer.id
                                                ? <div className="flex gap-1">
                                                    <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700"
                                                        onClick={handleSaveEdit} disabled={updateOfficerMutation.isPending}>
                                                        <Save className="h-4 w-4 mr-1" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700"
                                                        onClick={handleCancelEdit} disabled={updateOfficerMutation.isPending}>
                                                        <X className="h-4 w-4 mr-1" />
                                                    </Button>
                                                </div>
                                                : <div className="flex gap-1">
                                                    <Button variant="ghost" size="sm" className="text-police-blue-600 hover:text-police-blue-700"
                                                        onClick={() => handleEditClick(officer)} data-testid={`button-edit-${officer.id}`}>
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-700"
                                                        onClick={() => setScheduleOfficer(officer)}
                                                        data-testid={`button-schedule-${officer.id}`}>
                                                        <Calendar className="h-4 w-4" />
                                                    </Button>
                                                </div>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {filteredOfficers?.length === 0 && (
                        <div className="text-center py-8">
                            <p className="text-gray-500">
                                {searchQuery || statusFilter !== "all" || circunscripcionFilter !== "all"
                                    ? "No se encontraron oficiales que coincidan con los filtros."
                                    : "No se encontraron oficiales."}
                            </p>
                        </div>
                    )}
                </div>
            </div>
            
            <NewOfficerModal isOpen={isNewOfficerModalOpen} onClose={() => setIsNewOfficerModalOpen(false)} />
            
            {/* Modal de Horarios Invocado con el estado */}
            {scheduleOfficer && (
                <OfficerScheduleModal
                    officer={scheduleOfficer}
                    isOpen={!!scheduleOfficer}
                    onClose={() => setScheduleOfficer(null)}
                />
            )}
        </div>
    );
}
```
