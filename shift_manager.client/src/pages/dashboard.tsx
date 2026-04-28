import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, RefreshCw, Trash2 } from "lucide-react";
import { StatsCard } from "@/components/ui/stats-card";
import { NewShiftModal } from "@/components/modals/new-shift-modal";
import { DashboardStats, Officer, Beat, Shift } from "@/lib/types";
import { createShift, updateShift, deleteShift } from "@/lib/api";
import ConfirmationModal from "@/components/ConfirmationModal";
import { useNotifications } from "@/components/NotificationProvider";

export default function Dashboard() {
  const [isNewShiftModalOpen, setIsNewShiftModalOpen] = useState(false);
  const [isRefreshing,        setIsRefreshing]        = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Partial<Shift> | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<() => Promise<void> | null>(null);

  const { notify } = useNotifications();

  const queryClient = useQueryClient();

  const { data: stats     } = useQuery<DashboardStats>({ queryKey: ["/api/dashboard/stats"]    });
  const { data: officers  } = useQuery<Officer[]>({      queryKey: ["/api/officers"]            });
  const { data: beats     } = useQuery<Beat[]>({         queryKey: ["/api/beats"]               });
  const { data: shifts    } = useQuery<Shift[]>({        queryKey: ["/api/shifts"]              });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"]   }),
      queryClient.invalidateQueries({ queryKey: ["/api/officers"]          }),
      queryClient.invalidateQueries({ queryKey: ["/api/beats"]             }),
      queryClient.invalidateQueries({ queryKey: ["/api/shifts"]            }),
    ]);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const today = new Date().toLocaleDateString("en-CA"); // Retorna yyyy-mm-dd de forma segura en local
  const todayShifts = shifts?.filter(s => s.date === today) || [];
  const currentShifts = todayShifts.map(shift => ({
    shift,
    officer: officers?.find(o => o.id === shift.officerId),
    beat:    beats?.find(b => b.id === shift.beatId),
  }));

  const circunscripcionStats = (() => {
    if (!officers) return [];
    const rows = [
      { id: 1, name: "Circunscripción 1", cuadrantes: "1, 2, 7", count: 0, onDuty: 0 },
      { id: 2, name: "Circunscripción 2", cuadrantes: "5, 6",    count: 0, onDuty: 0 },
      { id: 3, name: "Circunscripción 3", cuadrantes: "3, 4",    count: 0, onDuty: 0 },
    ];
    officers.forEach(o => {
      const idx = rows.findIndex(r => r.id === o.circunscripcion);
      if (idx !== -1) { rows[idx].count++; if (o.status === "on_duty") rows[idx].onDuty++; }
    });
    return rows;
  })();

  const puestoStats = ["Palacio", "Patrullero", "Puesto Fijo"].map(puesto => {
    const list   = officers?.filter(o => o.puestoAsignado === puesto) ?? [];
    const onDuty = list.filter(o => o.status === "on_duty").length;
    return { name: puesto, total: list.length, onDuty };
  });

  const openEditModal = (shift?: Shift) => {
    if (shift) {
      setEditingShift({ ...shift });
    } else {
      setEditingShift({
        date: new Date().toISOString().split("T")[0],
        startTime: "07:00",
        endTime: "18:00",
      });
    }
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditingShift(null);
  };

  const openConfirm = (title: string, message: string, action: () => Promise<void>) => {
    setConfirmTitle(title);
    setConfirmMessage(message);
    setConfirmAction(() => action);
    setConfirmOpen(true);
  };

  const closeConfirm = () => {
    if (confirmLoading) return;
    setConfirmOpen(false);
    setConfirmAction(null);
    setConfirmTitle("");
    setConfirmMessage("");
  };

  const onConfirmExecute = async () => {
    if (!confirmAction) return;
    try {
      setConfirmLoading(true);
      await confirmAction();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/shifts"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] }),
      ]);
      notify.success("Operación realizada correctamente");
      closeConfirm();
    } catch (err) {
      console.error(err);
      notify.error((err as Error).message || "Error en la operación");
    } finally {
      setConfirmLoading(false);
    }
  };

  const requestSaveShift = (payload: Partial<Shift>) => {
    const isNew = !payload.id;
    const title = isNew ? "Confirmar creación" : "Confirmar actualización";
    const message = isNew
      ? `Crear turno para agente ${payload.officerId} el ${payload.date}?`
      : `Actualizar turno ${payload.id} para agente ${payload.officerId}?`;

    openConfirm(title, message, async () => {
      if (isNew) {
        await createShift({
          officerId: payload.officerId,
          beatId: payload.beatId,
          date: payload.date,
          startTime: payload.startTime,
          endTime: payload.endTime,
          notes: payload.notes,
        });
      } else {
        await updateShift(payload.id!, {
          officerId: payload.officerId,
          beatId: payload.beatId,
          date: payload.date,
          startTime: payload.startTime,
          endTime: payload.endTime,
          notes: payload.notes,
        });
      }
      closeEditModal();
    });
  };

  const requestDeleteShift = (id: string) => {
    openConfirm("Confirmar eliminación", `¿Eliminar turno ${id}? Esta acción no puede deshacerse.`, async () => {
      await deleteShift(id);
    });
  };

  const handleSaveShift = (payload: Partial<Shift>) => {
    if (!payload) return;
    if (!payload.date || !payload.startTime || !payload.endTime) {
      notify.error("Fecha, hora inicio y hora fin son obligatorios.");
      return;
    }
    if (!payload.officerId) {
      notify.error("Seleccione un oficial.");
      return;
    }
    if (!payload.beatId) {
      notify.error("Seleccione un cuadrante.");
      return;
    }
    requestSaveShift(payload);
  };

  return (
    <div className="h-full overflow-auto">
      <div className="p-6 space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Panel de Control</h2>
            <p className="text-gray-600 mt-1">Estado actual de turnos y resumen de cobertura</p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <Button
              onClick={() => { setIsNewShiftModalOpen(true); }}
              className="bg-police-blue-600 hover:bg-police-blue-700"
              data-testid="button-new-shift"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Turno
            </Button>
            <Button
              onClick={handleRefresh}
              variant="outline"
              disabled={isRefreshing}
              data-testid="button-refresh"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "Actualizando..." : "Actualizar"}
            </Button>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard title="En Servicio"        value={stats?.onDuty       || 0} icon="user-check"          iconBg="bg-green-100"  iconColor="text-green-600"  testId="stats-on-duty"      />
          <StatsCard title="Fuera de Servicio"  value={stats?.offDuty      || 0} icon="clock"               iconBg="bg-yellow-100" iconColor="text-yellow-600" testId="stats-off-duty"     />
          <StatsCard title="Brechas de Cobertura" value={stats?.gaps       || 0} icon="exclamation-triangle" iconBg="bg-red-100"    iconColor="text-red-600"    testId="stats-gaps"         />
          <StatsCard title="Turnos de Hoy"      value={stats?.todayShifts  || 0} icon="calendar-day"        iconBg="bg-blue-100"   iconColor="text-blue-600"   testId="stats-today-shifts" />
        </div>

        {/* Turnos de hoy */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Estado Actual de Turnos</h3>
            <span className="text-xs text-gray-400">{new Date().toLocaleDateString("es-ES", { weekday:"long", day:"numeric", month:"long" })}</span>
          </div>
          <div className="p-6">
            {currentShifts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No hay turnos programados para hoy</p>
              </div>
            ) : (
              <div className="space-y-3" data-testid="current-shifts">
                {currentShifts.map(({ shift, officer, beat }) => (
                  <div key={shift.id}
                    className={`flex items-center justify-between p-4 rounded-lg border ${shift.status === "active" ? "bg-green-50 border-green-200" : shift.officerId ? "bg-blue-50  border-blue-200" : "bg-red-50   border-red-200"}`}
                    data-testid={`shift-${shift.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${shift.status === "active" ? "bg-green-500" : shift.officerId ? "bg-blue-500" : "bg-red-500"}`} />
                      <div>
                        <p className="font-medium text-gray-900">{beat?.name || "Cuadrante sin asignar"}</p>
                        <p className="text-sm text-gray-600">
                          {officer ? `${officer.name} (${officer.puestoAsignado})` : "Sin asignar"}
                          {" · "}{shift.startTime} – {shift.endTime}
                        </p>
                        {beat && (
                          <p className="text-xs text-gray-400">
                            Circunscripción {beat.circunscripcion} · Cuadrante {beat.cuadrante}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge className={shift.status === "active" ? "bg-green-100 text-green-800" : shift.officerId ? "bg-blue-100  text-blue-800" : "bg-red-100   text-red-800"}>
                        {shift.status === "active" ? "Activo" : shift.officerId ? "Programado" : "Sin cobertura"}
                      </Badge>

                      <Button variant="ghost" onClick={() => openEditModal(shift)}>
                        Editar
                      </Button>

                      <Button variant="ghost" onClick={() => requestDeleteShift(shift.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Circunscripciones */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Estado por Circunscripción</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {circunscripcionStats.map(circ => (
                <div key={circ.id} className="p-4 border border-gray-200 rounded-lg" data-testid={`circunscripcion-${circ.id}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{circ.name}</h4>
                    <Badge className="bg-blue-100 text-blue-800">{circ.onDuty}/{circ.count}</Badge>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">Cuadrantes: {circ.cuadrantes}</p>
                  {/* Barra de progreso */}
                  <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2">
                    <div
                      className="bg-green-500 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: circ.count > 0 ? `${(circ.onDuty / circ.count) * 100}%` : "0%" }}
                    />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-green-600">{circ.onDuty} en servicio</span>
                    <span className="text-gray-400">{circ.count - circ.onDuty} fuera</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Puestos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Distribución por Puesto Asignado</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {puestoStats.map(puesto => (
                <div key={puesto.name} className="p-4 border border-gray-200 rounded-lg"
                  data-testid={`puesto-${puesto.name.toLowerCase().replace(/\s+/g, "-")}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{puesto.name}</h4>
                    <Badge className="bg-purple-100 text-purple-800">{puesto.onDuty}/{puesto.total}</Badge>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2">
                    <div
                      className="bg-purple-500 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: puesto.total > 0 ? `${(puesto.onDuty / puesto.total) * 100}%` : "0%" }}
                    />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-purple-600">{puesto.onDuty} activos</span>
                    <span className="text-gray-400">{puesto.total - puesto.onDuty} disponibles</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      <NewShiftModal
        isOpen={isNewShiftModalOpen}
        onClose={() => setIsNewShiftModalOpen(false)}
      />

      {/* Edit/Create modal inline */}
      {editModalOpen && editingShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-40" onClick={closeEditModal} />
          <div className="relative bg-white rounded-lg shadow-lg w-[720px] max-w-full p-6 z-10">
            <h3 className="text-lg font-semibold mb-4">{editingShift.id ? `Editar turno ${editingShift.id}` : "Crear turno"}</h3>

            <div className="grid grid-cols-2 gap-4">
              <label>
                Agente
                <select className="w-full mt-1" value={editingShift.officerId ?? ""} onChange={e => setEditingShift({ ...editingShift, officerId: e.target.value })}>
                  <option value="">-- seleccione --</option>
                  {officers?.map(o => <option key={o.id} value={o.id}>{o.name} ({o.badge})</option>)}
                </select>
              </label>

              <label>
                Cuadrante
                <select className="w-full mt-1" value={editingShift.beatId ?? ""} onChange={e => setEditingShift({ ...editingShift, beatId: e.target.value })}>
                  <option value="">-- seleccione --</option>
                  {beats?.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </label>

              <label>
                Fecha
                <input type="date" className="w-full mt-1" value={editingShift.date ?? ""} onChange={e => setEditingShift({ ...editingShift, date: e.target.value })} />
              </label>

              <div />

              <label>
                Inicio
                <input type="time" className="w-full mt-1" value={editingShift.startTime ?? ""} onChange={e => setEditingShift({ ...editingShift, startTime: e.target.value })} />
              </label>

              <label>
                Fin
                <input type="time" className="w-full mt-1" value={editingShift.endTime ?? ""} onChange={e => setEditingShift({ ...editingShift, endTime: e.target.value })} />
              </label>

              <label className="col-span-2">
                Observaciones
                <input type="text" className="w-full mt-1" value={editingShift.notes ?? ""} onChange={e => setEditingShift({ ...editingShift, notes: e.target.value })} />
              </label>
            </div>

            <div className="mt-4 flex justify-end gap-3">
              <Button variant="ghost" onClick={closeEditModal}>Cancelar</Button>
              <Button onClick={() => handleSaveShift(editingShift)}>Guardar</Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={confirmOpen}
        title={confirmTitle}
        message={confirmMessage}
        onConfirm={onConfirmExecute}
        onCancel={closeConfirm}
        loading={confirmLoading}
        confirmText="Sí, confirmar"
        cancelText="Cancelar"
      />
    </div>
  );
}