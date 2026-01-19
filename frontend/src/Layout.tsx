import { type ReactNode } from "react";
import { useNavigate, useLocation } from "react-router";
import { 
  LayoutDashboard, 
  User, 
  CreditCard, 
  MessageSquare, 
  FileText,
  Users,
  Receipt,
  Wrench,
  TrendingUp,
  ClipboardList,
  Settings,
  LogOut,
  Building2
} from "lucide-react";

interface LayoutProps {
  children: ReactNode;
  role: "renter" | "manager" | "owner";
}

export function Layout({ children, role }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    navigate("/");
  };

  const renterNav = [
    { path: "/renter", label: "Dashboard", icon: LayoutDashboard },
    { path: "/renter/profile", label: "Profile", icon: User },
    { path: "/renter/payments", label: "Payments", icon: CreditCard },
    { path: "/renter/complaints", label: "Complaints", icon: FileText },
    { path: "/renter/messages", label: "Messages", icon: MessageSquare },
  ];

  const managerNav = [
    { path: "/manager", label: "Dashboard", icon: LayoutDashboard },
    { path: "/manager/renters", label: "Renters", icon: Users },
    { path: "/manager/bills", label: "Bills", icon: Receipt },
    { path: "/manager/maintenance", label: "Maintenance", icon: Wrench },
    { path: "/manager/payments", label: "Payments", icon: CreditCard },
    { path: "/manager/messages", label: "Messages", icon: MessageSquare },
  ];

  const ownerNav = [
    { path: "/owner", label: "Dashboard", icon: TrendingUp },
    { path: "/owner/payments", label: "Payments", icon: CreditCard },
    { path: "/owner/requests", label: "Requests", icon: ClipboardList },
    { path: "/owner/manager-status", label: "Manager Status", icon: Users },
    { path: "/owner/complaints", label: "Complaints", icon: FileText },
  ];

  const navigation = role === "renter" ? renterNav : role === "manager" ? managerNav : ownerNav;
  
  const roleColors = {
    renter: {
      bg: "#0ea5e9", // sky-500
      bgHover: "#0284c7", // sky-600
      light: "#e0f2fe" // sky-50
    },
    manager: {
      bg: "#8b5cf6", // violet-500
      bgHover: "#7c3aed", // violet-600
      light: "#f5f3ff" // violet-50
    },
    owner: {
      bg: "#6366f1", // indigo-500
      bgHover: "#4f46e5", // indigo-600
      light: "#eef2ff" // indigo-50
    }
  };

  const colors = roleColors[role];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 text-white flex flex-col shadow-xl"
        style={{ backgroundColor: colors.bg }}>
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-white">Smart Building</div>
              <div className="text-white/70 capitalize">{role} Portal</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <button
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      isActive
                        ? "bg-white/20 text-white shadow-sm"
                        : "text-white/80 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}