import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, RefreshCw } from "lucide-react";
import { StatsCard } from "@/components/ui/stats-card";
import { NewShiftModal } from "@/components/modals/new-shift-modal";
import { DashboardStats, Officer, Beat, Shift } from "@/lib/types";

export default function Dashboard() {
  const [isNewShiftModalOpen, setIsNewShiftModalOpen] = useState(false);

  const { data: stats,  refetch: refetchStats } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: officers } = useQuery<Officer[]>({
    queryKey: ["/api/officers"],
  });

  const { data: beats } = useQuery<Beat[]>({
    queryKey: ["/api/beats"],
  });

  const { data: shifts } = useQuery<Shift[]>({
    queryKey: ["/api/shifts"],
  });

  const handleRefresh = () => {
    refetchStats();
  };

  // Get today's active shifts with officer and beat details
  const today = new Date().toISOString().split('T')[0];
  const todayShifts = shifts?.filter(shift=> shift.date === today) || [];
  
  const currentShifts = todayShifts.map(shift=> {
    const officer = officers?.find(o=> o.id === shift.officerId);
    const beat = beats?.find(b=> b.id === shift.beatId);
    return { shift, officer, beat };
  });

  const getStatusBadge = (status: string) => {
    const statusMap = {
      active: { variant: "default" as const, className: "bg-green-100 text-green-800" },
      scheduled: { variant: "secondary" as const, className: "bg-blue-100 text-blue-800" },
      completed: { variant: "outline" as const, className: "bg-gray-100 text-gray-800" },
      cancelled: { variant: "destructive" as const, className: "bg-red-100 text-red-800" },
    };
    
    return statusMap[status as keyof typeof statusMap] || statusMap.scheduled;
  };

  // Calculate distribution by Circunscripción
  const getCircunscripcionStats = () => {
    if (!officers) return [];
    
    const stats = [
      { id: 1, name: "Circunscripción: 1", cuadrantes: "1, 2, 7", count: 0, onDuty: 0 },
      { id: 2, name: "Circunscripción: 2", cuadrantes: "5, 6", count: 0, onDuty: 0 },
      { id: 3, name: "Circunscripción: 3", cuadrantes: "3, 4", count: 0, onDuty: 0 }
    ];
    
    officers.forEach(officer=> {
      const circIndex = stats.findIndex(s=> s.id === officer.circunscripcion);
      if (circIndex!== -1) {
        stats[circIndex].count++;
        if (officer.status === 'on_duty') {
          stats[circIndex].onDuty++;
        }
      }
    });
    
    return stats;
  };

  // Calculate distribution by Puesto Asignado
  const getPuestoStats = () => {
    if (!officers) return [];
    
    const puestos = ["Palacio", "Patrullero", "Puesto Fijo"];
    return puestos.map(puesto=> {
      const officersInPuesto = officers.filter(o=> o.puestoAsignado === puesto);
      const onDuty = officersInPuesto.filter(o=> o.status === 'on_duty').length;
      return {
        name: puesto,
        total: officersInPuesto.length,
        onDuty
      };
    });
  };

  const circunscripcionStats = getCircunscripcionStats();
  const puestoStats = getPuestoStats();

  // Mock recent activity data
  const recentActivity = [
    {
      id: "1",
      description: "Oficial Martínez asignado al Cuadrante: 1",
      time: "hace: 2 minutos",
      type: "info" as const
    },
    {
      id: "2",
      description: "Intercambio de turno aprobado López ↔ Hernández",
      time: "hace: 15 minutos",
      type: "success" as const
    },
    {
      id: "3",
      description: "Brecha de cobertura detectada en Circunscripción: 2",
      time: "hace: 1 hora",
      type: "warning" as const
    }
  ];

  return (
    <div className="h-full overflow-auto">
      <div className="p-6 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Panel de Control</h2>
            <p className="text-gray-600 mt-1">Estado actual de turnos y resumen de cobertura</p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <Button
              onClick={() => setIsNewShiftModalOpen(true)}
              className="bg-police-blue-600 hover:bg-police-blue-700"
              data-testid="button-new-shift"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Turno
            </Button>
            <Button
              onClick={handleRefresh}
              variant="outline"
              data-testid="button-refresh"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="En Servicio"
            value={stats?.onDuty || 0}
            icon="user-check"
            iconBg="bg-green-100"
            iconColor="text-green-600"
            testId="stats-on-duty"
          />
          <StatsCard
            title="Fuera de Servicio"
            value={stats?.offDuty || 0}
            icon="clock"
            iconBg="bg-yellow-100"
            iconColor="text-yellow-600"
            testId="stats-off-duty"
          />
          <StatsCard
            title="Brechas de Cobertura"
            value={stats?.gaps || 0}
            icon="exclamation-triangle"
            iconBg="bg-red-100"
            iconColor="text-red-600"
            testId="stats-gaps"
          />
          <StatsCard
            title="Turnos de Hoy"
            value={stats?.todayShifts || 0}
            icon="calendar-day"
            iconBg="bg-blue-100"
            iconColor="text-blue-600"
            testId="stats-today-shifts"
          />
        </div>

        {/* Current Shift Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Estado Actual de Turnos</h3>
          </div>
          <div className="p-6">
            {currentShifts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No hay turnos activos para hoy</p>
              </div>
            ) : (
              <div className="space-y-4" data-testid="current-shifts">
                {currentShifts.map(({ shift, officer, beat }) => (
                  <div 
                    key={shift.id}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      shift.status === 'active' 
                        ? 'bg-green-50 border-green-200' 
                        : shift.officerId 
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-red-50 border-red-200'
                    }`}
                    data-testid={`shift-${shift.id}`}
                  >
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-4 ${
                        shift.status === 'active' 
                          ? 'bg-green-500' 
                          : shift.officerId 
                            ? 'bg-blue-500'
                            : 'bg-red-500'
                      }`}></div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {beat?.name || 'Cuadrante Sin Asignar'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {officer ? `${officer.name} (${officer.puestoAsignado})` : 'Sin asignar'} • {shift.startTime} - {shift.endTime}
                        </p>
                        {beat && (
                          <p className="text-xs text-gray-500">
                            Circunscripción: {beat.circunscripcion} • Cuadrante: {beat.cuadrante}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge 
                      className={
                        shift.status === 'active' 
                          ? 'bg-green-100 text-green-800'
                          : shift.officerId 
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                      }
                    >
                      {shift.status === 'active' ? 'Activo' : shift.officerId ? 'Programado' : 'Brecha de Cobertura'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Circunscripciones Overview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Estado por Circunscripción</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {circunscripcionStats.map((circ) => (
                <div 
                  key={circ.id}
                  className="p-4 border border-gray-200 rounded-lg"
                  data-testid={`circunscripcion-${circ.id}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{circ.name}</h4>
                    <Badge className="bg-blue-100 text-blue-800">
                      {circ.onDuty}/{circ.count}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Cuadrantes: {circ.cuadrantes}
                  </p>
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">{circ.onDuty} en servicio</span>
                    <span className="text-gray-500">{circ.count - circ.onDuty} fuera de servicio</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Puestos Overview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Distribución por Puesto Asignado</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {puestoStats.map((puesto) => (
                <div 
                  key={puesto.name}
                  className="p-4 border border-gray-200 rounded-lg"
                  data-testid={`puesto-${puesto.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{puesto.name}</h4>
                    <Badge className="bg-purple-100 text-purple-800">
                      {puesto.onDuty}/{puesto.total}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">{puesto.onDuty} activos</span>
                    <span className="text-gray-500">{puesto.total - puesto.onDuty} disponibles</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Actividad Reciente</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4" data-testid="recent-activity">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start" data-testid={`activity-${activity.id}`}>
                    <div className={`w-2 h-2 rounded-full mt-2 mr-3 ${
                      activity.type === 'success' ? 'bg-green-500' :
                      activity.type === 'warning' ? 'bg-yellow-500' :
                      'bg-blue-500'
                    }`}></div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{activity.description}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Placeholder for Pending Requests */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Solicitudes Pendientes</h3>
            </div>
            <div className="p-6">
              <div className="text-center py-8">
                <p className="text-gray-500">No hay solicitudes pendientes</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <NewShiftModal
        isOpen={isNewShiftModalOpen}
        onClose={() => setIsNewShiftModalOpen(false)}
      />
    </div>
  );
}
