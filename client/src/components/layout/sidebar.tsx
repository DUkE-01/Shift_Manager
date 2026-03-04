import { Link, useLocation } from "wouter";
import { Shield } from "lucide-react";
import logoAyuntamiento from "@assets/Logo Ayuntamiento.png";
import logoRD from "@assets/Logo_Republica_Dominicana.png";

const navigationItems = [
  {
    name: "Panel de Control",
    href: "/",
    icon: "tachometer-alt",
    testId: "nav-dashboard"
  },
  {
    name: "Horarios",
    href: "/schedule",
    icon: "calendar-alt",
    testId: "nav-schedule"
  },
  {
    name: "Oficiales",
    href: "/officers",
    icon: "users",
    testId: "nav-officers"
  },
  {
    name: "Reportes",
    href: "/reports",
    icon: "chart-bar",
    testId: "nav-reports"
  }
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <nav className="hidden lg:flex lg:flex-col lg:w-64 bg-police-blue-900 text-white">
      {/* Header with Official Logos - Nortic A6 Compliance */}
      <div className="px-4 py-3 border-b border-police-blue-800">
        <div className="flex items-center justify-between mb-3">
          <img 
            src={logoAyuntamiento} 
            alt="Logo Ayuntamiento" 
            className="h-12 w-auto object-contain"
          />
          <div className="h-12 w-12 bg-white rounded flex items-center justify-center">
            <img 
              src={logoRD} 
              alt="Escudo República Dominicana" 
              className="h-8 w-8 object-contain"
            />
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
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-police-blue-800 text-white'
                  : 'text-police-blue-300 hover:bg-police-blue-800 hover:text-white'
              }`}
              data-testid={item.testId}
            >
              <i className={`fas fa-${item.icon} w-5 mr-3`}></i>
              {item.name}
            </Link>
          );
        })}
      </div>
      
      <div className="px-4 py-4 border-t border-police-blue-800">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-police-blue-700 flex items-center justify-center mr-3">
            <i className="fas fa-user text-sm"></i>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Sgt. Johnson</p>
            <p className="text-xs text-police-blue-300">Supervisor</p>
          </div>
        </div>
      </div>
    </nav>
  );
}
