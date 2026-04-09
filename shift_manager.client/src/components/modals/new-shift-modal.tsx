import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Officer, Beat } from "@/lib/types";
import { createShiftPattern } from "@/lib/api";
import { invalidateShiftRelated } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    },
    {
        value: "vespertino_lj",
        label: "Vespertino L–J",
        hours: "18:00 – 07:00",
        desc: "Lunes a jueves",
        color: "bg-purple-100 text-purple-800",
        start: "18:00",
        end: "07:00",
    },
    {
        value: "vespertino_vd",
        label: "Vespertino V–D",
        hours: "18:00 – 07:00",
        desc: "Viernes a domingo",
        color: "bg-orange-100 text-orange-800",
        start: "18:00",
        end: "07:00",
    },
    {
        value: "nocturno",
        label: "Nocturno",
        hours: "22:00 – 06:00",
        desc: "Ciclo 1 día trabaja / 1 descansa",
        color: "bg-slate-100 text-slate-800",
        start: "22:00",
        end: "06:00",
    },
] as const;

type ShiftTypeValue = typeof SHIFT_TYPES[number]["value"];

const formSchema = z.object({
    officerId: z.string().min(1, "Selecciona un oficial"),
    beatId: z.string().min(1, "Selecciona un cuadrante"),
    shiftType: z.enum(["diurno", "vespertino_lj", "vespertino_vd", "nocturno"]),
    startDate: z.string().min(1, "Fecha de inicio requerida"),
    endDate: z.string().min(1, "Fecha de fin requerida"),
    notes: z.string().optional(),
});
type FormData = z.infer<typeof formSchema>;

interface Props { isOpen: boolean; onClose: () => void; }

export function NewShiftModal({ isOpen, onClose }: Props) {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            officerId: "", beatId: "",
            shiftType: "diurno",
            startDate: new Date().toISOString().split("T")[0],
            endDate: "",
            notes: "",
        },
    });

    const selectedType = form.watch("shiftType");
    const typeInfo = SHIFT_TYPES.find(t => t.value === selectedType)!;

    const { data: officers } = useQuery<Officer[]>({ queryKey: ["/api/officers"] });
    const { data: beats } = useQuery<Beat[]>({ queryKey: ["/api/beats"] });

    const mutation = useMutation({
        mutationFn: (data: FormData) => createShiftPattern(data),
        onSuccess: (count: number) => {
            toast({ title: "Éxito", description: `${count} turno(s) creado(s) correctamente` });
            queryClient.invalidateQueries({ queryKey: ["/api/shifts"] });
            queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
            onClose();
            form.reset();
        },
        onError: (err: Error) => {
            toast({ title: "Error", description: err.message || "No se pudo crear el patrón de turnos", variant: "destructive" });
        },
    });

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl" data-testid="modal-new-shift">
                <DialogHeader>
                    <DialogTitle>Crear Patrón de Turno</DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(d => mutation.mutate(d))} className="space-y-5">

                        {/* Tipo de turno — tarjetas visuales */}
                        <FormField control={form.control} name="shiftType" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tipo de Turno</FormLabel>
                                <div className="grid grid-cols-2 gap-3 mt-1">
                                    {SHIFT_TYPES.map(t => (
                                        <button key={t.value} type="button"
                                            onClick={() => field.onChange(t.value)}
                                            className={`p-3 rounded-lg border-2 text-left transition-all ${field.value === t.value
                                                ? "border-police-blue-600 bg-police-blue-50"
                                                : "border-gray-200 hover:border-gray-300"
                                                }`}>
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

                        {/* Oficial + Cuadrante */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="officerId" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Oficial</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger data-testid="select-officer">
                                                <SelectValue placeholder="Seleccionar Oficial" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {officers?.map(o => (
                                                <SelectItem key={o.id} value={o.id}>
                                                    {o.name} <span className="text-gray-400 text-xs">— {o.badge}</span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="beatId" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Cuadrante</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger data-testid="select-beat">
                                                <SelectValue placeholder="Seleccionar Cuadrante" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {beats?.map(b => (
                                                <SelectItem key={b.id} value={b.id}>
                                                    {b.name} <span className="text-gray-400 text-xs">Circ. {b.circunscripcion}</span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        {/* Período */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="startDate" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Fecha Inicio del Período</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} data-testid="input-start-date" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="endDate" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Fecha Fin del Período</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} data-testid="input-end-date" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        {/* Preview del patrón */}
                        <div className={`rounded-lg p-3 border text-sm ${typeInfo.color} border-opacity-30`}>
                            <p className="font-medium mb-1">📋 Patrón que se generará:</p>
                            {selectedType === "diurno" && <p>Un turno por cada día del período seleccionado (07:00 – 18:00).</p>}
                            {selectedType === "vespertino_lj" && <p>Un turno por cada <strong>lunes, martes, miércoles y jueves</strong> del período (18:00 – 07:00 del día siguiente).</p>}
                            {selectedType === "vespertino_vd" && <p>Un turno por cada <strong>viernes, sábado y domingo</strong> del período (18:00 – 07:00 del día siguiente).</p>}
                            {selectedType === "nocturno" && <p>Ciclo <strong>1 trabaja / 1 descansa</strong> a partir de la fecha de inicio (22:00 – 06:00 del día siguiente).</p>}
                        </div>

                        {/* Notas */}
                        <FormField control={form.control} name="notes" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Notas (Opcional)</FormLabel>
                                <FormControl>
                                    <Textarea rows={2} placeholder="Instrucciones especiales..." {...field}
                                        value={field.value || ""} data-testid="textarea-notes" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        {/* Botones */}
                        <div className="flex justify-end space-x-3 pt-3 border-t border-gray-200">
                            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                            <Button type="submit" disabled={mutation.isPending}
                                className="bg-police-blue-600 hover:bg-police-blue-700" data-testid="button-create-shift">
                                {mutation.isPending ? "Creando turnos..." : "Crear Patrón"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}