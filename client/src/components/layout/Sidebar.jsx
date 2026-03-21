import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  Users,
  FileText,
  Settings,
  LogOut,
  Gem,
  PieChart,
  Bell,
  Bot,
  ShieldAlert,
  ArrowDownCircle,
  ArrowUpCircle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const Sidebar = ({ onClose }) => {
  const location = useLocation();
  const { logout, user } = useAuth();

  const allNavigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["trader"],
    },
    { name: "Stocks", href: "/stocks", icon: Gem, roles: ["trader"] },
    { name: "Sales", href: "/sales", icon: ShoppingCart, roles: ["trader"] },
    { name: "Purchases", href: "/purchases", icon: Truck, roles: ["trader"] },
    { name: "Customers", href: "/customers", icon: Users, roles: ["trader"] },
    {
      name: "Suppliers",
      href: "/suppliers",
      icon: Package,
      roles: ["trader"],
    },
    {
      name: "Receivables",
      href: "/receivables",
      icon: ArrowDownCircle,
      roles: ["trader"],
    },
    {
      name: "Payables",
      href: "/payables",
      icon: ArrowUpCircle,
      roles: ["trader"],
    },

    { name: "Reports", href: "/reports", icon: PieChart, roles: ["trader"] },
    {
      name: "AI Insights",
      href: "/ai-insights",
      icon: Bot,
      roles: ["trader"],
    },
    {
      name: "Invoices",
      href: "/invoices",
      icon: FileText,
      roles: ["trader"],
    },

    {
      name: "Notifications",
      href: "/notifications",
      icon: Bell,
      roles: ["admin", "trader"],
    },
    { name: "Admin", href: "/admin", icon: ShieldAlert, roles: ["admin"] },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
      roles: ["admin", "trader"],
    },
  ];

  const navigation = allNavigation.filter((item) =>
    item.roles.includes(user?.role),
  );

  // Filter for admin only if needed
  // if (user?.role !== 'admin') ...

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white w-64">
      <div className="p-6 flex items-center space-x-2">
        <Gem className="w-8 h-8 text-blue-400" />
        <span className="text-xl font-bold">GemInventory</span>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white",
              )}
              onClick={onClose} // Close sidebar on mobile when link clicked
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-slate-700 bg-blue-500/20 flex items-center justify-center font-bold">
            {user?.profile_picture ? (
              <img
                src={user.profile_picture}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-blue-400">
                {user?.username?.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="ml-3 overflow-hidden">
            <p className="text-sm font-bold truncate text-white">
              {user?.full_name || user?.username || "User"}
            </p>
            <p className="text-[10px] text-slate-400 capitalize font-black tracking-widest">
              {user?.role || "Trader"}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center w-full px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
