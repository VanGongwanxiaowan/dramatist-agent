import { Link, useLocation } from "react-router-dom";
import { Film, FileText, BookOpen, Database, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

const Header = () => {
  const location = useLocation();
  
  const navItems = [
    { path: "/", label: "首页", icon: Film },
    { path: "/projects", label: "我的项目", icon: FileText },
    { path: "/notes", label: "我的笔记", icon: BookOpen },
    { path: "/knowledge", label: "知识库管理", icon: Database },
    { path: "/settings", label: "个人设置", icon: Settings },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center space-x-2 group">
          <div className="relative">
            <Film className="h-6 w-6 text-primary transition-transform group-hover:scale-110" />
            <div className="absolute -inset-1 bg-primary/20 blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            AI影视创作工坊
          </span>
        </Link>

        <nav className="flex items-center space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={isActive(item.path) ? "default" : "ghost"}
                  size="sm"
                  className={`gap-2 transition-all ${
                    isActive(item.path)
                      ? "gradient-primary text-white shadow-glow"
                      : "hover:bg-accent/10"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden md:inline">{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

export default Header;
