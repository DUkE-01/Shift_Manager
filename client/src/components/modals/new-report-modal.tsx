import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertEmergencyReportSchema, type Officer, type Beat } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";

const reportFormSchema = insertEmergencyReportSchema.extend({
  reportNumber: z.string().min(1, "El número de reporte es requerido"),
  type: z.enum(["emergency", "non_emergency", "traffic", "domestic", "theft", "assault"]),
  priority: z.enum(["high", "medium", "low"]),
  description: z.string().min(1, "La descripción es requerida"),
  location: z.string().min(1, "La ubicación es requerida"),
  callerName: z.string().optional(),
  callerPhone: z.string().optional(),
});

interface NewReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewReportModal({ isOpen, onClose }: NewReportModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof reportFormSchema>>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      reportNumber: `RPT-${Date.now().toString().slice(-6)}`,
      type: "non_emergency",
      priority: "medium",
      description: "",
      location: "",
      callerName: "",
      callerPhone: "",
      status: "pending",
    },
  });

  const { data: officers } = useQuery<Officer[]>({
    queryKey: ["/api/officers"],
  });

  const { data: beats } = useQuery<Beat[]>({
    queryKey: ["/api/beats"],
  });

  const createReportMutation = useMutation({
    mutationFn: async (data: z.infer<typeof reportFormSchema>) => {
      const response = await apiRequest("POST", "/api/emergency-reports", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Éxito",
        description: "Reporte de emergencia creado exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/emergency-reports"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      onClose();
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear el reporte de emergencia",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof reportFormSchema>) => {
    createReportMutation.mutate(data);
  };

  const reportTypes = [
    { value: "emergency", label: "Emergencia" },
    { value: "non_emergency", label: "No Emergencia" },
    { value: "traffic", label: "Tráfico" },
    { value: "domestic", label: "Doméstico" },
    { value: "theft", label: "Robo" },
    { value: "assault", label: "Asalto" },
  ];

  const priorityLevels = [
    { value: "high", label: "Alta", color: "text-red-600" },
    { value: "medium", label: "Media", color: "text-yellow-600" },
    { value: "low", label: "Baja", color: "text-green-600" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="modal-new-report">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Reporte de Emergencia</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="reportNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Reporte</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="RPT-123456"
                        data-testid="input-report-number"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Reporte</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-type">
                          <SelectValue placeholder="Seleccionar Tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {reportTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridad</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-priority">
                          <SelectValue placeholder="Seleccionar Prioridad" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {priorityLevels.map((priority) => (
                          <SelectItem key={priority.value} value={priority.value}>
                            <span className={priority.color}>{priority.label}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción del Incidente</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={4}
                      placeholder="Describa detalladamente el incidente reportado..."
                      data-testid="textarea-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ubicación</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Dirección exacta, referencias o coordenadas"
                      data-testid="input-location"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="callerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Denunciante (Opcional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ""}
                        placeholder="Nombre completo"
                        data-testid="input-caller-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="callerPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono del Denunciante (Opcional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ""}
                        placeholder="+507 6000-0000"
                        data-testid="input-caller-phone"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="assignedOfficerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Oficial Asignado (Opcional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger data-testid="select-officer">
                          <SelectValue placeholder="Seleccionar Oficial" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {officers?.filter(officer=> officer.status === "on_duty").map((officer) => (
                          <SelectItem key={officer.id} value={officer.id}>
                            {officer.name} - {officer.badge}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="beatId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cuadrante Asignado (Opcional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger data-testid="select-beat">
                          <SelectValue placeholder="Seleccionar Cuadrante" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {beats?.map((beat) => (
                          <SelectItem key={beat.id} value={beat.id}>
                            {beat.name} - Circunscripción: {beat.circunscripcion}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                data-testid="button-cancel"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createReportMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
                data-testid="button-create"
              >
                {createReportMutation.isPending ? "Creando..." : "Crear Reporte"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
