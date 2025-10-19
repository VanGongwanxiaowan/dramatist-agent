import { useState } from "react";
import { Edit2, Trash2, Plus, Database } from "lucide-react";
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

interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: Date;
}

const Knowledge = () => {
  const [items, setItems] = useState<KnowledgeItem[]>([
    {
      id: "1",
      title: "爆款短剧特征分析",
      content: "根据市场数据分析，成功的竖屏短剧通常具备以下特征：1. 黄金三秒抓眼球 2. 强情绪冲突...",
      category: "市场分析",
      createdAt: new Date(),
    },
  ]);
  const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleDelete = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleSave = () => {
    if (editingItem) {
      if (editingItem.id === "new") {
        setItems([
          ...items,
          { ...editingItem, id: Date.now().toString(), createdAt: new Date() },
        ]);
      } else {
        setItems((prev) =>
          prev.map((i) => (i.id === editingItem.id ? editingItem : i))
        );
      }
      setDialogOpen(false);
      setEditingItem(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              知识库管理
            </h1>
            <p className="text-muted-foreground mt-2">构建影视创作知识体系</p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => setEditingItem({ id: "new", title: "", content: "", category: "", createdAt: new Date() })}
                className="gradient-hero text-white shadow-glow"
              >
                <Plus className="h-4 w-4 mr-2" />
                添加知识
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>{editingItem?.id === "new" ? "添加知识" : "编辑知识"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">标题</label>
                  <Input
                    value={editingItem?.title || ""}
                    onChange={(e) =>
                      setEditingItem((prev) => prev ? { ...prev, title: e.target.value } : null)
                    }
                    placeholder="输入知识标题"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">分类</label>
                  <Input
                    value={editingItem?.category || ""}
                    onChange={(e) =>
                      setEditingItem((prev) => prev ? { ...prev, category: e.target.value } : null)
                    }
                    placeholder="输入分类"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">内容</label>
                  <Textarea
                    value={editingItem?.content || ""}
                    onChange={(e) =>
                      setEditingItem((prev) => prev ? { ...prev, content: e.target.value } : null)
                    }
                    placeholder="输入知识内容"
                    rows={10}
                  />
                </div>
                <Button onClick={handleSave} className="w-full gradient-hero text-white">
                  保存
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <Card
              key={item.id}
              className="group relative p-6 hover:shadow-card transition-all duration-300 hover:scale-105 animate-fade-in border-border/50 hover:border-primary/30"
            >
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 bg-background/80 backdrop-blur"
                  onClick={() => {
                    setEditingItem(item);
                    setDialogOpen(true);
                  }}
                >
                  <Edit2 className="h-4 w-4 text-primary" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 bg-background/80 backdrop-blur"
                  onClick={() => handleDelete(item.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <Database className="h-4 w-4 text-primary" />
                <span className="text-xs text-primary font-medium">{item.category}</span>
              </div>

              <h3 className="text-lg font-semibold mb-3 pr-20 line-clamp-1">
                {item.title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                {item.content.substring(0, 60)}...
              </p>
              <div className="text-xs text-muted-foreground">
                创建于 {item.createdAt.toLocaleDateString()}
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Knowledge;
