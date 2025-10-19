import { useState } from "react";
import { Edit2, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Header from "@/components/Header";

interface Project {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
}

const Projects = () => {
  const [projects, setProjects] = useState<Project[]>([
    {
      id: "1",
      title: "都市情感短剧策划",
      content: "这是一个关于都市情感的短剧策划方案，讲述了现代都市中年轻人的爱情故事...",
      createdAt: new Date(),
    },
  ]);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleDelete = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSave = () => {
    if (editingProject) {
      if (editingProject.id === "new") {
        setProjects([
          ...projects,
          { ...editingProject, id: Date.now().toString(), createdAt: new Date() },
        ]);
      } else {
        setProjects((prev) =>
          prev.map((p) => (p.id === editingProject.id ? editingProject : p))
        );
      }
      setDialogOpen(false);
      setEditingProject(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              我的项目
            </h1>
            <p className="text-muted-foreground mt-2">管理您的影视创作项目</p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => setEditingProject({ id: "new", title: "", content: "", createdAt: new Date() })}
                className="gradient-primary text-white shadow-glow"
              >
                <Plus className="h-4 w-4 mr-2" />
                新建项目
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>{editingProject?.id === "new" ? "新建项目" : "编辑项目"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">项目标题</label>
                  <Input
                    value={editingProject?.title || ""}
                    onChange={(e) =>
                      setEditingProject((prev) => prev ? { ...prev, title: e.target.value } : null)
                    }
                    placeholder="输入项目标题"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">项目内容</label>
                  <Textarea
                    value={editingProject?.content || ""}
                    onChange={(e) =>
                      setEditingProject((prev) => prev ? { ...prev, content: e.target.value } : null)
                    }
                    placeholder="输入项目内容"
                    rows={10}
                  />
                </div>
                <Button onClick={handleSave} className="w-full gradient-primary text-white">
                  保存
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="group relative p-6 hover:shadow-card transition-all duration-300 hover:scale-105 animate-fade-in border-border/50 hover:border-primary/50"
            >
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 bg-background/80 backdrop-blur"
                  onClick={() => {
                    setEditingProject(project);
                    setDialogOpen(true);
                  }}
                >
                  <Edit2 className="h-4 w-4 text-primary" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 bg-background/80 backdrop-blur"
                  onClick={() => handleDelete(project.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>

              <h3 className="text-lg font-semibold mb-3 pr-20 line-clamp-1">
                {project.title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                {project.content.substring(0, 60)}...
              </p>
              <div className="text-xs text-muted-foreground">
                创建于 {project.createdAt.toLocaleDateString()}
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Projects;
