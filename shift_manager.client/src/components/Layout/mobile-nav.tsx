import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X } from "lucide-react";
import logoAyuntamiento from "../../assets/Logo_Ayuntamiento.png";
import logoRD from "../../assets/Logo_Republica_Dominicana.png";

const navigationItems = [
    { name: "Panel de Control", href: "/", icon: "tachometer-alt", testId: "mobile-nav-dashboard" },
    { name: "Horarios", href: "/schedule", icon: "calendar-alt", testId: "mobile-nav-schedule" },
    { name: "Oficiales", href: "/officers", icon: "users", testId: "mobile-nav-officers" },
    { name: "Reportes", href: "/reports", icon: "chart-bar", testId: "mobile-nav-reports" },
];

export function MobileNav() {
    const [isOpen, setIsOpen] = useState(false);
    const [location] = useLocation();

    return (
        <>
            <header className="bg-white shadow-sm border-b border-gray-200 lg:hidden">
                <div className="flex items-center justify-between px-4 py-2">
                    <button className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
                        onClick={() => setIsOpen(!isOpen)} data-testid="button-mobile-menu">
                        {isOpen ? <X className="text-xl" /> : <Menu className="text-xl" />}
                    </button>
                    <div className="flex items-center space-x-3">
                        <img src={logoAyuntamiento} alt="Logo Ayuntamiento" className="h-8 w-auto object-contain" />
                        <div className="h-8 w-8 bg-gray-100 rounded flex items-center justify-center">
                            <img src={logoRD} alt="Escudo República Dominicana" className="h-6 w-6 object-contain" />
                        </div>
                    </div>
                    <div className="w-8"></div>
                </div>
                <div className="text-center pb-2">
                    <h1 className="text-sm font-semibold text-police-blue-900">GESTIÓN DE TURNOS</h1>
                    <p className="text-xs text-gray-600">Policía Municipal</p>
                </div>
            </header>

            {isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={() => setIsOpen(false)} data-testid="mobile-nav-overlay">
                    <div className="fixed inset-y-0 left-0 w-64 bg-police-blue-900 text-white transform transition-transform"
                        onClick={(e) => e.stopPropagation()}>
                        <div className="px-4 py-3 border-b border-police-blue-800">
                            <div className="flex items-center justify-between mb-3">
                                <img src={logoAyuntamiento} alt="Logo Ayuntamiento" className="h-10 w-auto object-contain" />
                                <div className="h-10 w-10 bg-white rounded flex items-center justify-center">
                                    <img src={logoRD} alt="Escudo República Dominicana" className="h-6 w-6 object-contain" />
                                </div>
                            </div>
                            <div className="text-center">
                                <h1 className="text-sm font-semibold">GESTIÓN DE TURNOS</h1>
                                <p className="text-xs text-police-blue-300">Policía Municipal</p>
                            </div>
                        </div>
                        <div className="flex-1 px-4 py-6 space-y-2">
                            {navigationItems.map((item) => {
                                const isActive = location === item.href;
                                return (
                                    <Link key={item.href} href={item.href}
                                        className={`flex items-center px-3 py-2 rounded-lg transition-colors ${isActive ? "bg-police-blue-800 text-white" : "text-police-blue-300 hover:bg-police-blue-800 hover:text-white"
                                            }`}
                                        onClick={() => setIsOpen(false)} data-testid={item.testId}>
                                        <i className={`fas fa-${item.icon} w-5 mr-3`}></i>
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}