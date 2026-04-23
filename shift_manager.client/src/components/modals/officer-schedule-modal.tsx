import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Officer } from "@/lib/types";

interface OfficerScheduleModalProps {
    officer: Officer;
    isOpen: boolean;
    onClose: () => void;
}

export function OfficerScheduleModal({ officer, isOpen, onClose }: OfficerScheduleModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px]" data-testid={`modal-schedule-${officer.id}`}>
                <DialogHeader>
                    <DialogTitle>Horario de Turnos: {officer.name}</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <p className="text-sm text-gray-500 mb-4">
                        Visualización de turnos y disponibilidad para el <strong>{officer.rank}</strong> asignado a <strong>{officer.puestoAsignado || "N/A"}</strong>.
                    </p>
                    <div className="bg-gray-50 rounded-md p-4 text-center border border-gray-100">
                        <i className="fas fa-calendar-alt text-gray-400 text-3xl mb-2"></i>
                        <h4 className="font-medium text-gray-700">Módulo de Calendario</h4>
                        <p className="text-xs text-gray-500 mt-1">Este componente está actualmente en desarrollo. Aquí se integrará la vista de calendario mensual/semanal de turnos.</p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
