import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
    Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Shield, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { login } from "@/lib/api";

const loginSchema = z.object({
    username: z.string().min(1, "El usuario es requerido"),
    password: z.string().min(1, "La contraseña es requerida"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function Login() {
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const form = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: { username: "", password: "" },
    });

    const onSubmit = async (data: LoginFormData) => {
        setIsLoading(true);
        try {
            await login(data.username, data.password);
            toast({
                title: "Inicio de sesión exitoso",
                description: "Bienvenido al Sistema de Gestión de Turnos",
            });
            window.location.href = "/";
        } catch {
            toast({
                title: "Error de autenticación",
                description: "Usuario o contraseña incorrectos",
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
                                    name="username"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Usuario</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder="Ej. admin"
                                                    className="h-12"
                                                    data-testid="input-username"
                                                    autoComplete="username"
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
                                                        autoComplete="current-password"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="absolute right-0 top-0 h-12 px-3 hover:bg-transparent"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                    >
                                                        {showPassword
                                                            ? <EyeOff className="h-4 w-4 text-gray-500" />
                                                            : <Eye className="h-4 w-4 text-gray-500" />}
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