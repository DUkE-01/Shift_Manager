import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Shield, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  badge: z.string().min(1, "La placa es requerida"),
  password: z.string().min(1, "La contraseña es requerida"),
});


export function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      badge: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    
    // Simulate authentication
    try {
      await new Promise(resolve=> setTimeout(resolve, 1000));
      
      // For demo purposes, accept any badge and password
      toast({
        title: "Inicio de sesión exitoso",
        description: "Bienvenido al Sistema de Gestión de Turnos",
      });
      
      // In a real app, you would redirect to dashboard here
      window.location.href = "/";
      
    } catch (error) {
      toast({
        title: "Error de autenticación",
        description: "Placa o contraseña incorrecta",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-police-blue-50 to-police-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-4 text-center pb-8">
            <div className="mx-auto w-16 h-16 bg-police-blue-600 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Sistema de Gestión de Turnos
              </CardTitle>
              <CardDescription className="text-gray-600 mt-2">
                Ingrese sus credenciales para acceder al sistema
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="badge"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Placa</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Ej P001"
                          className="h-12"
                          data-testid="input-badge"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            placeholder="Ingrese su contraseña"
                            className="h-12 pr-12"
                            data-testid="input-password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-12 px-3 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                            data-testid="button-toggle-password"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-500" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-500" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-12 bg-police-blue-600 hover:bg-police-blue-700 text-white font-medium"
                  disabled={isLoading}
                  data-testid="button-login"
                >
                  {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                ¿Problemas para acceder?{" "}
                <button className="text-police-blue-600 hover:text-police-blue-700 font-medium">
                  Contactar soporte técnico
                </button>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Sistema de Gestión de Turnos Policiales v1.0
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Desarrollado para la Policía Municipal
          </p>
        </div>
      </div>
    </div>
  );
}