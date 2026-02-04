import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BarChart3, Ticket, Users, Menu, Download } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

interface NavigationProps {
  onLogout?: () => void;
}

export const Navigation = ({ onLogout }: NavigationProps) => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const isActive = (path: string) => location.pathname === path;

  const menuItems = [
    { path: "/", icon: BarChart3, label: "Dashboard" },
    { path: "/coupons", icon: Ticket, label: "Cupons" },
    { path: "/subscribers", icon: Users, label: "Assinantes" },
    { path: "/export", icon: Download, label: "Export" },
  ];

  const handleLinkClick = () => {
    setMobileMenuOpen(false);
  };

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

            {/* Desktop Menu */}
            {!isMobile && (
              <div className="flex gap-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.path} to={item.path}>
                      <Button
                        variant={isActive(item.path) ? "default" : "ghost"}
                        size="sm"
                        className="gap-2"
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Button>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Mobile Menu Button */}
            {isMobile && (
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Abrir menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 pb-4 border-b">
                      <img
                        src="/octopus.ico"
                        alt="QC Logo"
                        className="w-6 h-6"
                      />
                      <span className="font-bold text-lg">Menu</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {menuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            onClick={handleLinkClick}
                          >
                            <Button
                              variant={isActive(item.path) ? "default" : "ghost"}
                              size="sm"
                              className="w-full justify-start gap-2"
                            >
                              <Icon className="h-4 w-4" />
                              {item.label}
                            </Button>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            )}
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


