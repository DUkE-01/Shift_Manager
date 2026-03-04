import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertOfficerSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";

const officerFormSchema = insertOfficerSchema.extend({
  name: z.string().min(1, "El nombre es requerido"),
  cedula: z.string().min(1, "La cédula es requerida"),
  email: z.string().email("Email inválido"),
  badge: z.string().min(1, "La placa es requerida"),
  rank: z.string().min(1, "El rango es requerido"),
  phone: z.string().optional(),
  circunscripcion: z.number().min(1).max(3),
  puestoAsignado: z.enum(["Palacio", "Patrullero", "Puesto Fijo"]),
});


interface NewOfficerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewOfficerModal({ isOpen, onClose }: NewOfficerModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof officerFormSchema>>({
    resolver: zodResolver(officerFormSchema),
    defaultValues: {
      name: "",
      cedula: "",
      email: "",
      badge: "",
      rank: "Oficial",
      phone: "",
      circunscripcion: 1,
      puestoAsignado: "Patrullero",
      status: "off_duty",
    },
  });

  const createOfficerMutation = useMutation({
    mutationFn: async (data: z.infer<typeof officerFormSchema>) => {
      const response = await apiRequest("POST", "/api/officers", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Éxito",
        description: "Oficial creado exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/officers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      onClose();
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear el oficial",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof officerFormSchema>) => {
    createOfficerMutation.mutate(data);
  };

  const circunscripcionOptions = [
    { value: 1, label: "Circunscripción: 1 (Cuadrantes: 1, 2, 7)" },
    { value: 2, label: "Circunscripción: 2 (Cuadrantes: 5, 6)" },
    { value: 3, label: "Circunscripción: 3 (Cuadrantes: 3, 4)" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl" data-testid="modal-new-officer">
        <DialogHeader>
          <DialogTitle>Agregar Nuevo Oficial</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre Completo</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Ej Carlos Mendoza"
                        data-testid="input-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cedula"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cédula</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Ej: 8-123-456"
                        data-testid="input-cedula"
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
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo Electrónico</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="oficial@policia.gob"
                        data-testid="input-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="badge"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Placa</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Ej P007"
                        data-testid="input-badge"
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
                name="rank"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rango</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-rank">
                          <SelectValue placeholder="Seleccionar Rango" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Oficial">Oficial</SelectItem>
                        <SelectItem value="Cabo">Cabo</SelectItem>
                        <SelectItem value="Sargento">Sargento</SelectItem>
                        <SelectItem value="Teniente">Teniente</SelectItem>
                        <SelectItem value="Capitán">Capitán</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ""}
                        placeholder="+507 6000-0000"
                        data-testid="input-phone"
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
                name="circunscripcion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Circunscripción</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))} 
                      value={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-circunscripcion">
                          <SelectValue placeholder="Seleccionar Circunscripción" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {circunscripcionOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value.toString()}>
                            {option.label}
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
                name="puestoAsignado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Puesto Asignado</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-puesto">
                          <SelectValue placeholder="Seleccionar Puesto" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Palacio">Palacio</SelectItem>
                        <SelectItem value="Patrullero">Patrullero</SelectItem>
                        <SelectItem value="Puesto Fijo">Puesto Fijo</SelectItem>
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
                disabled={createOfficerMutation.isPending}
                className="bg-police-blue-600 hover:bg-police-blue-700"
                data-testid="button-create"
              >
                {createOfficerMutation.isPending ? "Creando..." : "Agregar Oficial"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}