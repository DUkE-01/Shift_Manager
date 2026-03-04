import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertShiftSchema, type Officer, type Beat } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";

const shiftFormSchema = insertShiftSchema.extend({
  date: z.string().min(1, "La fecha es requerida"),
  shiftType: z.enum(["diurno", "nocturno"]),
});

interface NewShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewShiftModal({ isOpen, onClose }: NewShiftModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof shiftFormSchema>>({
    resolver: zodResolver(shiftFormSchema),
    defaultValues: {
      officerId: "",
      beatId: "",
      date: new Date().toISOString().split('T')[0],
      shiftType: "diurno",
      startTime: "07:00",
      endTime: "18:00",
      status: "scheduled",
      notes: "",
    },
  });

  const { data: officers } = useQuery<Officer[]>({
    queryKey: ["/api/officers"],
  });

  const { data: beats } = useQuery<Beat[]>({
    queryKey: ["/api/beats"],
  });

  const createShiftMutation = useMutation({
    mutationFn: async (data: z.infer<typeof shiftFormSchema>) => {
      const response = await apiRequest("POST", "/api/shifts", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Éxito",
        description: "Turno creado exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/shifts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      onClose();
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear el turno",
        variant: "destructive",
      });
    },
  });

  const handleShiftTypeChange = (shiftType: string) => {
    const timeMap = {
      diurno: { startTime: "07:00", endTime: "18:00" },
      nocturno: { startTime: "18:00", endTime: "07:00" },
    };
    
    const times = timeMap[shiftType as keyof typeof timeMap];
    if (times) {
      form.setValue("startTime", times.startTime);
      form.setValue("endTime", times.endTime);
    }
  };

  const onSubmit = (data: z.infer<typeof shiftFormSchema>) => {
    createShiftMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl" data-testid="modal-new-shift">
        <DialogHeader>
          <DialogTitle>Crear Nueva Asignación de Turno</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="officerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Oficial</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger data-testid="select-officer">
                          <SelectValue placeholder="Seleccionar Oficial" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {officers?.map((officer) => (
                          <SelectItem key={officer.id} value={officer.id}>
                            {officer.name}
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
                    <FormLabel>Cuadrante Asignado</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger data-testid="select-beat">
                          <SelectValue placeholder="Seleccionar Cuadrante" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {beats?.map((beat) => (
                          <SelectItem key={beat.id} value={beat.id}>
                            {beat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="shiftType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Turno</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        handleShiftTypeChange(value);
                      }} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-shift-type">
                          <SelectValue placeholder="Seleccionar Tipo de Turno" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="diurno">Turno Diurno (07:00 - 18:00)</SelectItem>
                        <SelectItem value="nocturno">Turno Nocturno (18:00 - 07:00)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas</FormLabel>
                  <FormControl>
                    <Textarea 
                      rows={3} 
                      placeholder="Notas adicionales o instrucciones especiales..." 
                      {...field}
                      value={field.value || ""}
                      data-testid="textarea-notes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                className="bg-police-blue-600 hover:bg-police-blue-700"
                disabled={createShiftMutation.isPending}
                data-testid="button-create-shift"
              >
                {createShiftMutation.isPending ? "Creando..." : "Crear Turno"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
