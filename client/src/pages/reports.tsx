import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Plus,
  Eye,
  UserCheck,
  Clock,
  AlertTriangle,
  Save,
  X,
  Edit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { NewReportModal } from "@/components/modals/new-report-modal";
import { EmergencyReport, Officer, Beat } from "@/lib/types";

// Relación entre circunscripciones y cuadrantes
const CUADRANTES_POR_CIRCUNSCRIPCION: Record<string, string[]> = {
  "1": ["1", "2", "7"],
  "2": ["5", "6"],
  "3": ["3", "4"],
};

export default function Reports() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selectedReport, setSelectedReport] = useState<EmergencyReport | null>(
    null,
  );
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [editFormData, setEditFormData] =
    useState<Partial<EmergencyReport> | null>(null);
  const [isNewReportModalOpen, setIsNewReportModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: reports, isLoading } = useQuery<EmergencyReport[]>({
    queryKey: ["/api/emergency-reports"],
  });

  const { data: officers } = useQuery<Officer[]>({
    queryKey: ["/api/officers"],
  });

  const { data: beats } = useQuery<Beat[]>({
    queryKey: ["/api/beats"],
  });

  const assignOfficerMutation = useMutation({
    mutationFn: async ({
      reportId,
      officerId,
      beatId,
    }: {
      reportId: string;
      officerId: string;
      beatId?: string;
    }) => {
      const response = await apiRequest(
        "PATCH",
        `/api/emergency-reports/${reportId}`,
        {
          assignedOfficerId: officerId,
          beatId: beatId || null,
          status: "assigned",
        },
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Éxito",
        description: "Oficial asignado correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/emergency-reports"] });
      setSelectedReport(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo asignar el oficial",
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      reportId,
      status,
    }: {
      reportId: string;
      status: string;
    }) => {
      const response = await apiRequest(
        "PATCH",
        `/api/emergency-reports/${reportId}`,
        { status },
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Éxito",
        description: "Estado actualizado correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/emergency-reports"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive",
      });
    },
  });

  const updateReportMutation = useMutation({
    mutationFn: async ({
      reportId,
      data,
    }: {
      reportId: string;
      data: Partial<EmergencyReport>;
    }) => {
      const response = await apiRequest(
        "PUT",
        `/api/emergency-reports/${reportId}`,
        data,
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Éxito",
        description: "Reporte actualizado correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/emergency-reports"] });
      setEditingReportId(null);
      setEditFormData(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el reporte",
        variant: "destructive",
      });
    },
  });

  const filteredReports = reports?.filter((report) => {
    const matchesSearch =
      report.reportNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (report.callerName &&
        report.callerName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" || report.status === statusFilter;
    const matchesPriority =
      priorityFilter === "all" || report.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getTypeIcon = (type: string) => {
    const iconMap = {
      emergency: "exclamation-triangle",
      traffic: "car",
      domestic: "home",
      theft: "shield-exclamation",
      assault: "shield-alert",
      non_emergency: "info-circle",
    };
    return iconMap[type as keyof typeof iconMap] || "file-text";
  };

  const getTypeBadge = (type: string) => {
    const typeMap = {
      emergency: { label: "Emergencia", className: "bg-red-100 text-red-800" },
      traffic: { label: "Tráfico", className: "bg-blue-100 text-blue-800" },
      domestic: {
        label: "Doméstico",
        className: "bg-purple-100 text-purple-800",
      },
      theft: { label: "Robo", className: "bg-orange-100 text-orange-800" },
      assault: { label: "Agresión", className: "bg-red-100 text-red-800" },
      non_emergency: {
        label: "No Emergencia",
        className: "bg-gray-100 text-gray-800",
      },
    };
    return (
      typeMap[type as keyof typeof typeMap] || {
        label: type,
        className: "bg-gray-100 text-gray-800",
      }
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityMap = {
      high: { label: "Alta", className: "bg-red-100 text-red-800" },
      medium: { label: "Media", className: "bg-yellow-100 text-yellow-800" },
      low: { label: "Baja", className: "bg-green-100 text-green-800" },
    };
    return (
      priorityMap[priority as keyof typeof priorityMap] || {
        label: priority,
        className: "bg-gray-100 text-gray-800",
      }
    );
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: {
        label: "Pendiente",
        className: "bg-yellow-100 text-yellow-800",
      },
      assigned: { label: "Asignado", className: "bg-blue-100 text-blue-800" },
      in_progress: {
        label: "En Progreso",
        className: "bg-purple-100 text-purple-800",
      },
      resolved: { label: "Resuelto", className: "bg-green-100 text-green-800" },
      closed: { label: "Cerrado", className: "bg-gray-100 text-gray-800" },
    };
    return (
      statusMap[status as keyof typeof statusMap] || {
        label: status,
        className: "bg-gray-100 text-gray-800",
      }
    );
  };

  const getOfficerName = (officerId: string | null) => {
    if (!officerId) return "Sin asignar";
    const officer = officers?.find((o) => o.id === officerId);
    return officer ? officer.name : "Oficial desconocido";
  };

  const getBeatName = (beatId: string | null) => {
    if (!beatId) return "Sin cuadrante asignado";
    const beat = beats?.find((b) => b.id === beatId);
    return beat ? beat.name : "Cuadrante desconocido";
  };

  const formatDateTime = (date: Date | string) => {
    return new Date(date).toLocaleString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTimeElapsed = (date: Date | string) => {
    const now = new Date();
    const reportTime = new Date(date);
    const diffMs = now.getTime() - reportTime.getTime();
    const diffMins = Math.floor(diffMs/ (1000 * 60));

    if (diffMins < 60) return `${diffMins} min`;
    const diffHours = Math.floor(diffMins/ 60);
    if (diffHours < 24) return `${diffHours}h ${diffMins % 60}min`;
    const diffDays = Math.floor(diffHours/ 24);
    return `${diffDays}d ${diffHours % 24}h`;
  };

  const handleEditClick = (report: EmergencyReport) => {
    setEditingReportId(report.id);
    setEditFormData({
      description: report.description,
      location: report.location,
      type: report.type,
      priority: report.priority,
      status: report.status,
      assignedOfficerId: report.assignedOfficerId,
      beatId: report.beatId,
      callerName: report.callerName,
      callerPhone: report.callerPhone,
      notes: report.notes,
    });
  };

  const handleCancelEdit = () => {
    setEditingReportId(null);
    setEditFormData(null);
  };

  const handleSaveEdit = () => {
    if (editingReportId && editFormData) {
      updateReportMutation.mutate({
        reportId: editingReportId,
        data: editFormData,
      });
    }
  };

  const handleInputChange = (field: keyof EmergencyReport, value: any) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Statistics
  const stats = {
    total: reports?.length || 0,
    pending: reports?.filter((r) => r.status === "pending").length || 0,
    inProgress: reports?.filter((r) => r.status === "in_progress").length || 0,
    highPriority:
      reports?.filter(
        (r) =>
          r.priority === "high" &&
          r.status !== "resolved" &&
          r.status !== "closed",
      ).length || 0,
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-500">Cargando reportes...</div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Reportes de Emergencia
            </h2>
            <p className="text-gray-600 mt-1">
              Gestión de llamadas y reportes de emergencia
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button
              onClick={() => setIsNewReportModalOpen(true)}
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-new-report"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Reporte
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100">
                  <i className="fas fa-file-text text-blue-600 text-xl"></i>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Total Reportes
                  </p>
                  <p
                    className="text-2xl font-bold text-gray-900"
                    data-testid="stats-total"
                  >
                    {stats.total}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-yellow-100">
                  <Clock className="text-yellow-600 text-xl" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Pendientes
                  </p>
                  <p
                    className="text-2xl font-bold text-gray-900"
                    data-testid="stats-pending"
                  >
                    {stats.pending}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100">
                  <UserCheck className="text-purple-600 text-xl" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    En Progreso
                  </p>
                  <p
                    className="text-2xl font-bold text-gray-900"
                    data-testid="stats-in-progress"
                  >
                    {stats.inProgress}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-red-100">
                  <AlertTriangle className="text-red-600 text-xl" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Alta Prioridad
                  </p>
                  <p
                    className="text-2xl font-bold text-gray-900"
                    data-testid="stats-high-priority"
                  >
                    {stats.highPriority}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Buscar por número, descripción, ubicación o nombre..."
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
              <SelectItem value="pending">Pendiente</SelectItem>
              <SelectItem value="assigned">Asignado</SelectItem>
              <SelectItem value="in_progress">En Progreso</SelectItem>
              <SelectItem value="resolved">Resuelto</SelectItem>
              <SelectItem value="closed">Cerrado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger
              className="w-48"
              data-testid="select-priority-filter"
            >
              <SelectValue placeholder="Prioridad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las prioridades</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="medium">Media</SelectItem>
              <SelectItem value="low">Baja</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reports List */}
        <div className="space-y-4" data-testid="reports-list">
          {filteredReports?.map((report) => (
            <Card
              key={report.id}
              className="hover:shadow-md transition-shadow"
              data-testid={`report-${report.id}`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <i
                          className={`fas fa-${getTypeIcon(report.type)} text-gray-600`}
                        ></i>
                        <span className="font-medium text-gray-900">
                          {report.reportNumber}
                        </span>
                      </div>
                      {editingReportId === report.id ? (
                        <Select
                          value={editFormData?.type || ""}
                          onValueChange={(value) =>
                            handleInputChange("type", value)
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="emergency">
                              Emergencia
                            </SelectItem>
                            <SelectItem value="traffic">Tráfico</SelectItem>
                            <SelectItem value="domestic">Doméstico</SelectItem>
                            <SelectItem value="theft">Robo</SelectItem>
                            <SelectItem value="assault">Agresión</SelectItem>
                            <SelectItem value="non_emergency">
                              No Emergencia
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge className={getTypeBadge(report.type).className}>
                          {getTypeBadge(report.type).label}
                        </Badge>
                      )}

                      {editingReportId === report.id ? (
                        <Select
                          value={editFormData?.priority || ""}
                          onValueChange={(value) =>
                            handleInputChange("priority", value)
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Prioridad" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high">Alta</SelectItem>
                            <SelectItem value="medium">Media</SelectItem>
                            <SelectItem value="low">Baja</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge
                          className={
                            getPriorityBadge(report.priority).className
                          }
                        >
                          {getPriorityBadge(report.priority).label}
                        </Badge>
                      )}

                      {editingReportId === report.id ? (
                        <Select
                          value={editFormData?.status || ""}
                          onValueChange={(value) =>
                            handleInputChange("status", value)
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Estado" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pendiente</SelectItem>
                            <SelectItem value="assigned">Asignado</SelectItem>
                            <SelectItem value="in_progress">
                              En Progreso
                            </SelectItem>
                            <SelectItem value="resolved">Resuelto</SelectItem>
                            <SelectItem value="closed">Cerrado</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge
                          className={getStatusBadge(report.status).className}
                        >
                          {getStatusBadge(report.status).label}
                        </Badge>
                      )}
                    </div>

                    {editingReportId === report.id ? (
                      <div className="space-y-4 mb-4">
                        <Input
                          value={editFormData?.description || ""}
                          onChange={(e) =>
                            handleInputChange("description", e.target.value)
                          }
                          placeholder="Descripción"
                        />
                        <Input
                          value={editFormData?.location || ""}
                          onChange={(e) =>
                            handleInputChange("location", e.target.value)
                          }
                          placeholder="Ubicación"
                        />
                      </div>
                    ) : (
                      <>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {report.description}
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <p>
                              <strong>Ubicación:</strong> {report.location}
                            </p>
                            <p>
                              <strong>Reportado:</strong>{" "}
                              {formatDateTime(report.reportedAt)}
                            </p>
                            <p>
                              <strong>Tiempo transcurrido:</strong>{" "}
                              {getTimeElapsed(report.reportedAt)}
                            </p>
                          </div>
                          <div>
                            {report.callerName && (
                              <p>
                                <strong>Reportante:</strong>
                                {editingReportId === report.id ? (
                                  <Input
                                    value={editFormData?.callerName || ""}
                                    onChange={(e) =>
                                      handleInputChange(
                                        "callerName",
                                        e.target.value,
                                      )
                                    }
                                    className="mt-1"
                                  />
                                ) : (
                                  ` ${report.callerName}`
                                )}
                              </p>
                            )}
                            {report.callerPhone && (
                              <p>
                                <strong>Teléfono:</strong>
                                {editingReportId === report.id ? (
                                  <Input
                                    value={editFormData?.callerPhone || ""}
                                    onChange={(e) =>
                                      handleInputChange(
                                        "callerPhone",
                                        e.target.value,
                                      )
                                    }
                                    className="mt-1"
                                  />
                                ) : (
                                  ` ${report.callerPhone}`
                                )}
                              </p>
                            )}
                            <p>
                              <strong>Oficial asignado:</strong>
                              {editingReportId === report.id ? (
                                <Select
                                  value={editFormData?.assignedOfficerId || ""}
                                  onValueChange={(value) =>
                                    handleInputChange(
                                      "assignedOfficerId",
                                      value,
                                    )
                                  }
                                  className="mt-1"
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccione oficial" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="">
                                      Sin asignar
                                    </SelectItem>
                                    {officers?.map((officer) => (
                                      <SelectItem
                                        key={officer.id}
                                        value={officer.id}
                                      >
                                        {officer.name} ({officer.badge})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                ` ${getOfficerName(report.assignedOfficerId)}`
                              )}
                            </p>
                            <p>
                              <strong>Cuadrante:</strong>
                              {editingReportId === report.id ? (
                                <Select
                                  value={editFormData?.beatId || ""}
                                  onValueChange={(value) =>
                                    handleInputChange("beatId", value)
                                  }
                                  className="mt-1"
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccione cuadrante" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="">
                                      Sin asignar
                                    </SelectItem>
                                    {beats?.map((beat) => (
                                      <SelectItem key={beat.id} value={beat.id}>
                                        {beat.name} (Circ.{" "}
                                        {beat.circunscripcion})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                ` ${getBeatName(report.beatId)}`
                              )}
                            </p>
                          </div>
                        </div>
                      </>
                    )}

                    {editingReportId === report.id ? (
                      <Textarea
                        value={editFormData?.notes || ""}
                        onChange={(e) =>
                          handleInputChange("notes", e.target.value)
                        }
                        placeholder="Notas adicionales"
                        className="mt-4"
                      />
                    ) : report.notes ? (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">
                          <strong>Notas:</strong> {report.notes}
                        </p>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    {editingReportId === report.id ? (
                      <>
                        <Button
                          onClick={handleSaveEdit}
                          className="bg-green-600 hover:bg-green-700"
                          disabled={updateReportMutation.isPending}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Guardar
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleCancelEdit}
                          disabled={updateReportMutation.isPending}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancelar
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditClick(report)}
                          data-testid={`button-edit-${report.id}`}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </Button>

                        {report.status === "pending" && (
                          <Select
                            onValueChange={(officerId) => {
                              if (officerId) {
                                assignOfficerMutation.mutate({
                                  reportId: report.id,
                                  officerId,
                                  beatId: beats?.[0]?.id,
                                });
                              }
                            }}
                          >
                            <SelectTrigger
                              className="w-32"
                              data-testid={`select-assign-${report.id}`}
                            >
                              <SelectValue placeholder="Asignar" />
                            </SelectTrigger>
                            <SelectContent>
                              {officers
                                ?.filter((o) => o.status === "on_duty")
                                .map((officer) => (
                                  <SelectItem
                                    key={officer.id}
                                    value={officer.id}
                                  >
                                    {officer.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        )}

                        {report.status === "assigned" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              updateStatusMutation.mutate({
                                reportId: report.id,
                                status: "in_progress",
                              })
                            }
                            data-testid={`button-start-${report.id}`}
                          >
                            Iniciar
                          </Button>
                        )}

                        {report.status === "in_progress" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              updateStatusMutation.mutate({
                                reportId: report.id,
                                status: "resolved",
                              })
                            }
                            data-testid={`button-resolve-${report.id}`}
                          >
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
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500">
                  {searchQuery ||
                  statusFilter !== "all" ||
                  priorityFilter !== "all"
                    ? "No se encontraron reportes que coincidan con los filtros."
                    : "No hay reportes disponibles."}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* New Report Modal */}
      <NewReportModal
        isOpen={isNewReportModalOpen}
        onClose={() => setIsNewReportModalOpen(false)}
      />
    </div>
  );
}
