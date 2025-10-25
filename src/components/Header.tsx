import { Link, useLocation } from "react-router-dom";
import { Film, FileText, BookOpen, Database, Settings, MessageSquare, Brain, Bot, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const Header = () => {
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const navItems = [
    { path: "/", label: "首页", icon: Film, description: "AI短剧创作工坊主页" },
    { path: "/chat", label: "智能对话", icon: MessageSquare, description: "与AI智能体对话" },
    { path: "/story-analysis", label: "故事分析", icon: Brain, description: "深度故事结构分析" },
    { path: "/agents", label: "智能体管理", icon: Bot, description: "管理40+专业智能体" },
    { path: "/projects", label: "我的项目", icon: FileText, description: "查看和管理项目" },
    { path: "/notes", label: "我的笔记", icon: BookOpen, description: "个人创作笔记" },
    { path: "/knowledge", label: "知识库管理", icon: Database, description: "知识库内容管理" },
    { path: "/settings", label: "个人设置", icon: Settings, description: "个性化设置" },
  ];

  const isActive = (path: string) => location.pathname === path;

  // 监听滚动事件
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 关闭移动端菜单当路由变化时
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <>
      <header 
        className={cn(
          "sticky top-0 z-50 w-full border-b transition-all duration-300",
          "bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60",
          isScrolled 
            ? "border-border/60 shadow-lg shadow-primary/5" 
            : "border-border/40"
        )}
      >
        <div className="container flex h-16 items-center justify-between px-4">
          {/* Logo区域 */}
          <Link 
            to="/" 
            className="flex items-center space-x-3 group relative overflow-hidden"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <Film className="h-7 w-7 text-primary transition-all duration-300 group-hover:scale-110 group-hover:rotate-12" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-gradient group-hover:animate-shimmer">
                AI影视创作工坊
              </span>
              <span className="text-xs text-muted-foreground -mt-1 hidden sm:block">
                专业短剧创作平台
              </span>
            </div>
          </Link>

          {/* 桌面端导航 */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant={isActive(item.path) ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      "gap-2 transition-all duration-300 relative overflow-hidden group",
                      "hover:scale-105 active:scale-95",
                      isActive(item.path)
                        ? "gradient-button text-white shadow-glow animate-pulse-soft"
                        : "hover:bg-accent/10 hover:text-primary"
                    )}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <Icon className="h-4 w-4 transition-transform group-hover:rotate-12" />
                    <span>{item.label}</span>
                    {isActive(item.path) && (
                      <div className="absolute inset-0 bg-white/10 animate-pulse" />
                    )}
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* 移动端菜单按钮 */}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden relative"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <div className="relative w-6 h-6">
              <Menu 
                className={cn(
                  "absolute inset-0 h-5 w-5 transition-all duration-300",
                  isMobileMenuOpen ? "opacity-0 rotate-90" : "opacity-100 rotate-0"
                )}
              />
              <X 
                className={cn(
                  "absolute inset-0 h-5 w-5 transition-all duration-300",
                  isMobileMenuOpen ? "opacity-100 rotate-0" : "opacity-0 -rotate-90"
                )}
              />
            </div>
          </Button>
        </div>

        {/* 移动端菜单 */}
        <div 
          className={cn(
            "lg:hidden overflow-hidden transition-all duration-300 ease-in-out",
            isMobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className="border-t border-border/40 bg-background/95 backdrop-blur-xl">
            <nav className="container px-4 py-4 space-y-2">
              {navItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <Link key={item.path} to={item.path}>
                    <Button
                      variant={isActive(item.path) ? "default" : "ghost"}
                      size="sm"
                      className={cn(
                        "w-full justify-start gap-3 transition-all duration-300",
                        "hover:scale-[1.02] active:scale-98",
                        isActive(item.path)
                          ? "gradient-button text-white shadow-glow"
                          : "hover:bg-accent/10 hover:text-primary"
                      )}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <Icon className="h-4 w-4" />
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{item.label}</span>
                        <span className="text-xs opacity-70">{item.description}</span>
                      </div>
                    </Button>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* 跳过链接 - 无障碍访问 */}
      <a 
        href="#main-content" 
        className="skip-link"
      >
        跳转到主要内容
      </a>
    </>
  );
};

export default Header;
