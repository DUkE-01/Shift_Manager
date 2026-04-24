import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X } from "lucide-react";
import logoAyuntamiento from "../../assets/Logo_Ayuntamiento.png";
import logoRD from "../../assets/Logo_Republica_Dominicana.png";
import { getCurrentUser } from "@/lib/api";
import { NotificationBell } from "@/components/ui/notification-bell";

const navigationItems = [
    { name: "Panel de Control", href: "/", icon: "tachometer-alt", testId: "mobile-nav-dashboard" },
    { name: "Horarios", href: "/schedule", icon: "calendar-alt", testId: "mobile-nav-schedule" },
    { name: "Oficiales", href: "/officers", icon: "users", testId: "mobile-nav-officers" },
    { name: "Reportes", href: "/reports", icon: "chart-bar", testId: "mobile-nav-reports" },
];

export function MobileNav() {
    const [isOpen, setIsOpen] = useState(false);
    const [location] = useLocation();

    const user = getCurrentUser() || {}; // 
    const isOficial = user.rol === "Oficial" || user.rol === "Agente";

    const handleLogout = () => {
        localStorage.removeItem("user"); 
        window.location.href = "/login";
    };

    return (
        <>
            <header className="bg-white shadow-sm border-b border-gray-200 lg:hidden">
                <div className="flex items-center justify-between px-4 py-2">
                    <button
                        className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        {isOpen ? <X /> : <Menu />}
                    </button>

                    <div className="flex items-center space-x-3">
                        <img src={logoAyuntamiento} className="h-8" />
                        <img src={logoRD} className="h-6" />
                    </div>

                    <NotificationBell />
                </div>

                <div className="text-center pb-2">
                    <h1 className="text-sm font-semibold">GESTIÓN DE TURNOS</h1>
                    <p className="text-xs text-gray-600">Policía Municipal</p>
                </div>
            </header>

            {isOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40"
                    onClick={() => setIsOpen(false)}
                >
                    <div
                        className="fixed inset-y-0 left-0 w-64 bg-police-blue-900 text-white"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* HEADER */}
                        <div className="p-4 border-b border-police-blue-800 text-center">
                            <h1 className="text-sm font-semibold">GESTIÓN DE TURNOS</h1>
                            <p className="text-xs text-police-blue-300">Policía Municipal</p>
                        </div>

                        {/* NAV */}
                        <div className="p-4 space-y-2">
                            {navigationItems
                                .filter(item => {
                                    if (isOficial) {
                                        return item.href === "/schedule" || item.href === "/reports";
                                    }
                                    return true;
                                })
                                .map((item) => {
                                    const isActive = location === item.href;

                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setIsOpen(false)}
                                            className={`block px-3 py-2 rounded ${
                                                isActive ? "bg-police-blue-800" : "hover:bg-police-blue-800"
                                            }`}
                                        >
                                            {item.name}
                                        </Link>
                                    );
                                })}
                        </div>

                        {/* FOOTER */}
                        <div className="p-4 border-t border-police-blue-800">
                            <p className="text-sm">{user.username || "Usuario"}</p>
                            <p className="text-xs text-police-blue-300">{user.rol || "-"}</p>

                            <button
                                onClick={handleLogout}
                                className="mt-3 w-full bg-red-600 py-2 rounded"
                            >
                                Cerrar sesión
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
