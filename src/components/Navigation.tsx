import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BarChart3, Ticket, Users } from "lucide-react";

interface NavigationProps {
  onLogout?: () => void;
}

export const Navigation = ({ onLogout }: NavigationProps) => {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          {/* Logo e Links */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <img
                src="/octopus.ico"
                alt="QC Logo"
                className="w-6 h-6"
              />
              <span className="font-bold text-lg">QC Admin</span>
            </div>

            <div className="flex gap-2">
              <Link to="/">
                <Button
                  variant={isActive("/") ? "default" : "ghost"}
                  size="sm"
                  className="gap-2"
                >
                  <BarChart3 className="h-4 w-4" />
                  Dashboard
                </Button>
              </Link>

              <Link to="/coupons">
                <Button
                  variant={isActive("/coupons") ? "default" : "ghost"}
                  size="sm"
                  className="gap-2"
                >
                  <Ticket className="h-4 w-4" />
                  Cupons
                </Button>
              </Link>

              <Link to="/subscribers">
                <Button
                  variant={isActive("/subscribers") ? "default" : "ghost"}
                  size="sm"
                  className="gap-2"
                >
                  <Users className="h-4 w-4" />
                  Assinantes
                </Button>
              </Link>
            </div>
          </div>

          {/* Logout */}
          {onLogout && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="text-xs"
            >
              Sair
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};


