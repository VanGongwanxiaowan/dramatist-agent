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

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
}

const Notes = () => {
  const [notes, setNotes] = useState<Note[]>([
    {
      id: "1",
      title: "角色设定笔记",
      content: "主角性格分析：外表冷漠但内心细腻，对事业充满热情，在感情上却显得笨拙...",
      createdAt: new Date(),
    },
  ]);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleDelete = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const handleSave = () => {
    if (editingNote) {
      if (editingNote.id === "new") {
        setNotes([
          ...notes,
          { ...editingNote, id: Date.now().toString(), createdAt: new Date() },
        ]);
      } else {
        setNotes((prev) =>
          prev.map((n) => (n.id === editingNote.id ? editingNote : n))
        );
      }
      setDialogOpen(false);
      setEditingNote(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              我的笔记
            </h1>
            <p className="text-muted-foreground mt-2">记录创作灵感与想法</p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => setEditingNote({ id: "new", title: "", content: "", createdAt: new Date() })}
                className="gradient-accent text-white shadow-glow"
              >
                <Plus className="h-4 w-4 mr-2" />
                新建笔记
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>{editingNote?.id === "new" ? "新建笔记" : "编辑笔记"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">笔记标题</label>
                  <Input
                    value={editingNote?.title || ""}
                    onChange={(e) =>
                      setEditingNote((prev) => prev ? { ...prev, title: e.target.value } : null)
                    }
                    placeholder="输入笔记标题"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">笔记内容</label>
                  <Textarea
                    value={editingNote?.content || ""}
                    onChange={(e) =>
                      setEditingNote((prev) => prev ? { ...prev, content: e.target.value } : null)
                    }
                    placeholder="输入笔记内容"
                    rows={10}
                  />
                </div>
                <Button onClick={handleSave} className="w-full gradient-accent text-white">
                  保存
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notes.map((note) => (
            <Card
              key={note.id}
              className="group relative p-6 hover:shadow-card transition-all duration-300 hover:scale-105 animate-fade-in border-border/50 hover:border-accent/50"
            >
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 bg-background/80 backdrop-blur"
                  onClick={() => {
                    setEditingNote(note);
                    setDialogOpen(true);
                  }}
                >
                  <Edit2 className="h-4 w-4 text-accent" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 bg-background/80 backdrop-blur"
                  onClick={() => handleDelete(note.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>

              <h3 className="text-lg font-semibold mb-3 pr-20 line-clamp-1">
                {note.title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                {note.content.substring(0, 60)}...
              </p>
              <div className="text-xs text-muted-foreground">
                创建于 {note.createdAt.toLocaleDateString()}
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Notes;
