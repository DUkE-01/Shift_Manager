import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Edit, Calendar, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { NewOfficerModal } from "@/components/modals/new-officer-modal";
import { Officer } from "@/lib/types";

// Relación entre circunscripciones y cuadrantes
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
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: officers, isLoading } = useQuery<Officer[]>({
    queryKey: ["/api/officers"],
  });

  const updateOfficerStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest("PATCH", `/api/officers/${id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Éxito",
        description: "Estado del oficial actualizado correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/officers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del oficial",
        variant: "destructive",
      });
    },
  });

  const updateOfficerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Officer> }) => {
      const response = await apiRequest("PUT", `/api/officers/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Éxito",
        description: "Oficial actualizado correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/officers"] });
      setEditingOfficerId(null);
      setEditFormData(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el oficial",
        variant: "destructive",
      });
    },
  });

  const filteredOfficers = officers?.filter(officer=> {
    const matchesSearch = 
      officer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      officer.badge.toLowerCase().includes(searchQuery.toLowerCase()) ||
      officer.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || officer.status === statusFilter;
    const matchesCircunscripcion = circunscripcionFilter === "all" || officer.circunscripcion?.toString() === circunscripcionFilter;
    const matchesPuesto = puestoFilter === "all" || officer.puestoAsignado === puestoFilter;
    const matchesCuadrante = cuadranteFilter === "all" || 
      (officer.cuadrantes && officer.cuadrantes.includes(cuadranteFilter));

    return matchesSearch && matchesStatus && matchesCircunscripcion && matchesPuesto && matchesCuadrante;
  });

  const getStatusBadge = (status: string) => {
    const statusMap = {
      on_duty: { label: "En Servicio", className: "bg-green-100 text-green-800" },
      off_duty: { label: "Fuera de Servicio", className: "bg-yellow-100 text-yellow-800" },
      unavailable: { label: "No Disponible", className: "bg-red-100 text-red-800" },
    };

    return statusMap[status as keyof typeof statusMap] || statusMap.off_duty;
  };

  const toggleOfficerStatus = (officer: Officer) => {
    const newStatus = officer.status === 'on_duty' ? 'off_duty' : 'on_duty';
    updateOfficerStatusMutation.mutate({ id: officer.id, status: newStatus });
  };

  const handleEditClick = (officer: Officer) => {
    setEditingOfficerId(officer.id);
    setEditFormData({
      name: officer.name,
      cedula: officer.cedula,
      badge: officer.badge,
      rank: officer.rank,
      circunscripcion: officer.circunscripcion,
      puestoAsignado: officer.puestoAsignado,
      cuadrantes: officer.cuadrantes || [],
      email: officer.email,
      phone: officer.phone,
      status: officer.status,
    });
  };

  const handleCancelEdit = () => {
    setEditingOfficerId(null);
    setEditFormData(null);
  };

  const handleSaveEdit = () => {
    if (editingOfficerId && editFormData) {
      updateOfficerMutation.mutate({ id: editingOfficerId, data: editFormData });
    }
  };

  const handleInputChange = (field: keyof Officer, value: any) => {
    setEditFormData(prev=> ({
      ...prev,
      [field]: value
    }));

    // Si cambia la circunscripción, actualizar los cuadrantes disponibles
    if (field=== 'circunscripcion') {
      const newCuadrantes = CUADRANTES_POR_CIRCUNSCRIPCION[value] || [];
      setEditFormData(prev=> ({
        ...prev,
        cuadrantes: prev?.cuadrantes?.filter(c=> newCuadrantes.includes(c)) || []
      }));
    }
  };

  const toggleCuadrante = (cuadrante: string) => {
    setEditFormData(prev=> {
      if (!prev) return prev;

      const currentCuadrantes = prev.cuadrantes || [];
      const newCuadrantes = currentCuadrantes.includes(cuadrante)
        ? currentCuadrantes.filter(c=> c !== cuadrante)
        : [...currentCuadrantes, cuadrante];

      return {
        ...prev,
        cuadrantes: newCuadrantes
      };
    });
  };

  const getAvailableCuadrantes = (circunscripcion: string | undefined) => {
    if (!circunscripcion) return [];
    return CUADRANTES_POR_CIRCUNSCRIPCION[circunscripcion] || [];
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-500">Cargando oficiales...</div>
      </div>
    );
  }

  // Extraer todos los cuadrantes únicos para el filtro
  const allCuadrantes = Array.from(new Set(
    officers?.flatMap(officer=> officer.cuadrantes || []) || []
  )).sort();

  return (
    <div className="h-full overflow-auto">
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gestión de Oficiales</h2>
            <p className="text-gray-600 mt-1">Gestionar lista de oficiales y disponibilidad</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button
              onClick={() => setIsNewOfficerModalOpen(true)}
              className="bg-police-blue-600 hover:bg-police-blue-700"
              data-testid="button-add-officer"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Oficial
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Buscar oficiales por nombre, placa o email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48" data-testid="select-status-filter">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="on_duty">En Servicio</SelectItem>
              <SelectItem value="off_duty">Fuera de Servicio</SelectItem>
              <SelectItem value="unavailable">No Disponible</SelectItem>
            </SelectContent>
          </Select>
          <Select value={circunscripcionFilter} onValueChange={setCircunscripcionFilter}>
            <SelectTrigger className="w-48" data-testid="select-circunscripcion-filter">
              <SelectValue placeholder="Circunscripción" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las circunscripciones</SelectItem>
              <SelectItem value="1">Circunscripción: 1</SelectItem>
              <SelectItem value="2">Circunscripción: 2</SelectItem>
              <SelectItem value="3">Circunscripción: 3</SelectItem>
            </SelectContent>
          </Select>
          <Select value={puestoFilter} onValueChange={setPuestoFilter}>
            <SelectTrigger className="w-48" data-testid="select-puesto-filter">
              <SelectValue placeholder="Puesto Asignado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los puestos</SelectItem>
              <SelectItem value="Palacio">Palacio</SelectItem>
              <SelectItem value="Patrullero">Patrullero</SelectItem>
              <SelectItem value="Puesto Fijo">Puesto Fijo</SelectItem>
            </SelectContent>
          </Select>
          <Select value={cuadranteFilter} onValueChange={setCuadranteFilter}>
            <SelectTrigger className="w-48" data-testid="select-cuadrante-filter">
              <SelectValue placeholder="Cuadrante" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los cuadrantes</SelectItem>
              {allCuadrantes.map(cuadrante=> (
                <SelectItem key={cuadrante} value={cuadrante}>
                  Cuadrante: {cuadrante}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Officers Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Oficial
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cédula
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Placa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rango
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Circunscripción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Puesto Asignado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cuadrantes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200" data-testid="officers-table">
                {filteredOfficers?.map((officer) => (
                  <tr key={officer.id} data-testid={`officer-row-${officer.id}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingOfficerId === officer.id ? (
                        <Input
                          value={editFormData?.name || ""}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                        />
                      ) : (
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-police-blue-100 flex items-center justify-center mr-4">
                            <i className="fas fa-user text-police-blue-600"></i>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{officer.name}</div>
                            <div className="text-sm text-gray-500">{officer.email}</div>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingOfficerId === officer.id ? (
                        <Input
                          value={editFormData?.cedula || ""}
                          onChange={(e) => handleInputChange('cedula', e.target.value)}
                        />
                      ) : (
                        <span className="text-sm text-gray-900">{officer.cedula || 'N/A'}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingOfficerId === officer.id ? (
                        <Input
                          value={editFormData?.badge || ""}
                          onChange={(e) => handleInputChange('badge', e.target.value)}
                        />
                      ) : (
                        <span className="text-sm text-gray-900">{officer.badge}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingOfficerId === officer.id ? (
                        <Input
                          value={editFormData?.rank || ""}
                          onChange={(e) => handleInputChange('rank', e.target.value)}
                        />
                      ) : (
                        <span className="text-sm text-gray-900">{officer.rank}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingOfficerId === officer.id ? (
                        <Select
                          value={editFormData?.circunscripcion?.toString() || ""}
                          onValueChange={(value) => handleInputChange('circunscripcion', parseInt(value))}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Seleccione circunscripción" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Circunscripción: 1</SelectItem>
                            <SelectItem value="2">Circunscripción: 2</SelectItem>
                            <SelectItem value="3">Circunscripción: 3</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge className="bg-blue-100 text-blue-800">
                          Circunscripción: {officer.circunscripcion || 'N/A'}
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingOfficerId === officer.id ? (
                        <Select
                          value={editFormData?.puestoAsignado || ""}
                          onValueChange={(value) => handleInputChange('puestoAsignado', value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Seleccione puesto" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Palacio">Palacio</SelectItem>
                            <SelectItem value="Patrullero">Patrullero</SelectItem>
                            <SelectItem value="Puesto Fijo">Puesto Fijo</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge className="bg-purple-100 text-purple-800">
                          {officer.puestoAsignado || 'N/A'}
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingOfficerId === officer.id ? (
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-gray-700">Seleccione cuadrantes:</div>
                          <div className="flex flex-wrap gap-2">
                            {getAvailableCuadrantes(editFormData?.circunscripcion?.toString()).map(cuadrante=> (
                              <Button
                                key={cuadrante}
                                variant={editFormData?.cuadrantes?.includes(cuadrante) ? "default" : "outline"}
                                size="sm"
                                onClick={() => toggleCuadrante(cuadrante)}
                              >
                                {cuadrante}
                              </Button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1 max-w-[150px]">
                          {officer.cuadrantes?.length ? (
                            officer.cuadrantes.map(cuadrante=> (
                              <Badge 
                                key={cuadrante} 
                                variant="outline"
                                className="border-gray-300 text-gray-700"
                              >
                                {cuadrante}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-gray-500">N/A</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingOfficerId === officer.id ? (
                        <Select
                          value={editFormData?.status || ""}
                          onValueChange={(value) => handleInputChange('status', value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Seleccione estado" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="on_duty">En Servicio</SelectItem>
                            <SelectItem value="off_duty">Fuera de Servicio</SelectItem>
                            <SelectItem value="unavailable">No Disponible</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge 
                          className={`cursor-pointer ${getStatusBadge(officer.status).className}`}
                          onClick={() => toggleOfficerStatus(officer)}
                          data-testid={`status-${officer.id}`}
                        >
                          {getStatusBadge(officer.status).label}
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingOfficerId === officer.id ? (
                        <div className="space-y-2">
                          <Input
                            value={editFormData?.email || ""}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            placeholder="Email"
                          />
                          <Input
                            value={editFormData?.phone || ""}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            placeholder="Teléfono"
                          />
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="text-sm text-gray-900">{officer.email}</div>
                          <div className="text-sm text-gray-500">{officer.phone || 'N/A'}</div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {editingOfficerId === officer.id ? (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-green-600 hover:text-green-700"
                            onClick={handleSaveEdit}
                            disabled={updateOfficerMutation.isPending}
                          >
                            <Save className="h-4 w-4 mr-1" />
                            Guardar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={handleCancelEdit}
                            disabled={updateOfficerMutation.isPending}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Cancelar
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-police-blue-600 hover:text-police-blue-700"
                            onClick={() => handleEditClick(officer)}
                            data-testid={`button-edit-${officer.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-600 hover:text-gray-700"
                            data-testid={`button-schedule-${officer.id}`}
                          >
                            <Calendar className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredOfficers?.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {searchQuery || statusFilter !== "all" || circunscripcionFilter !== "all" || cuadranteFilter !== "all"
                  ? 'No se encontraron oficiales que coincidan con los filtros.' 
                  : 'No se encontraron oficiales.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* New Officer Modal */}
      <NewOfficerModal 
        isOpen={isNewOfficerModalOpen} 
        onClose={() => setIsNewOfficerModalOpen(false)} 
      />
    </div>
  );
}