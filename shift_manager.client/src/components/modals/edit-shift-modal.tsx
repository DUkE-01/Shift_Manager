import { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Shift } from "@/lib/types";
import { updateShift } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";

const SHIFT_TYPES = [
    {
        value: "diurno",
        label: "Diurno",
        hours: "07:00 – 18:00",
        desc: "Todos los días",
        color: "bg-blue-100 text-blue-800",
        start: "07:00",
        end: "18:00",
        crossesMidnight: false,
    },
    {
        value: "vespertino_lj",
        label: "Vespertino L–J",
        hours: "18:00 – 07:00",
        desc: "Lunes a jueves",
        color: "bg-purple-100 text-purple-800",
        start: "18:00",
        end: "07:00",
        crossesMidnight: true,
    },
    {
        value: "vespertino_vd",
        label: "Vespertino V–D",
        hours: "18:00 – 07:00",
        desc: "Viernes a domingo",
        color: "bg-orange-100 text-orange-800",
        start: "18:00",
        end: "07:00",
        crossesMidnight: true,
    },
    {
        value: "nocturno",
        label: "Nocturno",
        hours: "22:00 – 06:00",
        desc: "Ciclo 1 día trabaja / 1 descansa",
        color: "bg-slate-100 text-slate-800",
        start: "22:00",
        end: "06:00",
        crossesMidnight: true,
    },
] as const;

type ShiftTypeValue = typeof SHIFT_TYPES[number]["value"];

const formSchema = z.object({
    shiftType: z.enum(["diurno", "vespertino_lj", "vespertino_vd", "nocturno"]),
    startDate: z.string().min(1, "Fecha de inicio requerida"),
    endDate:   z.string().min(1, "Fecha de fin requerida"),
    notes:     z.string().optional(),
});
type FormData = z.infer<typeof formSchema>;

interface Props {
    isOpen:    boolean;
    onClose:   () => void;
    shift:     Shift;           // El turno existente a editar
}

export function EditShiftModal({ isOpen, onClose, shift }: Props) {
    const { toast }      = useToast();
    const queryClient    = useQueryClient();

    // Inferir shiftType del turno existente (ya mapeado por mapTurno en api.ts)
    const initialType: ShiftTypeValue =
        (["diurno", "vespertino_lj", "vespertino_vd", "nocturno"] as ShiftTypeValue[])
            .includes(shift.shiftType as ShiftTypeValue)
            ? (shift.shiftType as ShiftTypeValue)
            : "diurno";

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            shiftType: initialType,
            startDate: shift.date ?? new Date().toISOString().split("T")[0],
            endDate:   shift.date ?? "",
            notes:     shift.notes ?? "",
        },
    });

    // Reinicializar si cambia el turno seleccionado
    useEffect(() => {
        form.reset({
            shiftType: initialType,
            startDate: shift.date ?? "",
            endDate:   shift.date ?? "",
            notes:     shift.notes ?? "",
        });
    }, [shift.id]);

    const selectedType = form.watch("shiftType");
    const typeInfo     = SHIFT_TYPES.find(t => t.value === selectedType)!;

    // Al elegir un tipo, auto-rellenar las horas ocultas que se enviarán al backend
    const onTypeChange = (val: ShiftTypeValue, fieldOnChange: (v: ShiftTypeValue) => void) => {
        fieldOnChange(val);
    };

    const mutation = useMutation({
        mutationFn: async (data: FormData) => {
            const cfg = SHIFT_TYPES.find(t => t.value === data.shiftType)!;

            // Calcular fecha fin correcta (si cruza medianoche el fin es startDate + 1)
            let endDateStr = data.endDate || data.startDate;
            if (cfg.crossesMidnight && endDateStr === data.startDate) {
                // Solo si el usuario no puso fecha fin distinta, calculamos +1
                const d = new Date(data.startDate + "T00:00:00");
                d.setDate(d.getDate() + 1);
                endDateStr = d.toISOString().split("T")[0];
            }

            await updateShift(shift.id, {
                shiftType:  data.shiftType,
                date:       data.startDate,
                startTime:  cfg.start,
                endTime:    cfg.end,
                notes:      data.notes ?? undefined,
                // officerId y beatId no cambian en la edición simplificada
                officerId:  shift.officerId,
                beatId:     shift.beatId,
            });
        },
        onSuccess: () => {
            toast({ title: "Turno actualizado", description: "Los cambios se guardaron correctamente." });
            queryClient.invalidateQueries({ queryKey: ["/api/shifts"] });
            queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
            onClose();
        },
        onError: (err: Error) => {
            toast({
                title:       "Error",
                description: err.message || "No se pudo actualizar el turno",
                variant:     "destructive",
            });
        },
    });

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-lg" data-testid="modal-edit-shift">
                <DialogHeader>
                    <DialogTitle>Editar Turno</DialogTitle>
                    <p className="text-sm text-gray-500">
                        Modificar tipo y período — el oficial y cuadrante no cambian.
                    </p>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(d => mutation.mutate(d))} className="space-y-5">

                        {/* ── Tipo de turno ── */}
                        <FormField control={form.control} name="shiftType" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tipo de Turno</FormLabel>
                                <div className="grid grid-cols-2 gap-3 mt-1">
                                    {SHIFT_TYPES.map(t => (
                                        <button
                                            key={t.value}
                                            type="button"
                                            onClick={() => onTypeChange(t.value, field.onChange)}
                                            className={`p-3 rounded-lg border-2 text-left transition-all ${
                                                field.value === t.value
                                                    ? "border-police-blue-600 bg-police-blue-50"
                                                    : "border-gray-200 hover:border-gray-300"
                                            }`}
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-semibold text-sm text-gray-900">{t.label}</span>
                                                <Badge className={`text-[10px] ${t.color}`}>{t.hours}</Badge>
                                            </div>
                                            <p className="text-xs text-gray-500">{t.desc}</p>
                                        </button>
                                    ))}
                                </div>
                                <FormMessage />
                            </FormItem>
                        )} />

                        {/* ── Período ── */}
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="startDate" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Fecha Inicio</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="endDate" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Fecha Fin</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        {/* ── Preview del tipo seleccionado ── */}
                        <div className={`rounded-lg p-3 border text-sm ${typeInfo.color} border-opacity-30`}>
                            <p className="font-medium mb-1">📋 Horario que se aplicará:</p>
                            <p>
                                {typeInfo.label} — <strong>{typeInfo.hours}</strong>. {typeInfo.desc}.
                            </p>
                        </div>

                        {/* ── Notas ── */}
                        <FormField control={form.control} name="notes" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Notas (Opcional)</FormLabel>
                                <FormControl>
                                    <Textarea
                                        rows={2}
                                        placeholder="Instrucciones especiales..."
                                        {...field}
                                        value={field.value ?? ""}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        {/* ── Botones ── */}
                        <div className="flex justify-end space-x-3 pt-3 border-t border-gray-200">
                            <Button type="button" variant="outline" onClick={onClose}>
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={mutation.isPending}
                                className="bg-police-blue-600 hover:bg-police-blue-700"
                                data-testid="button-save-shift"
                            >
                                {mutation.isPending ? "Guardando..." : "Guardar Cambios"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}