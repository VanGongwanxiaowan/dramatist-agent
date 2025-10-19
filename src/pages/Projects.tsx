import { useState, useEffect } from "react";
import { Edit2, Trash2, Plus, Loader2, FolderOpen, Calendar, User } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import { useUserSessions } from "@/hooks/useDataStorage";
import { createDatabaseAPI } from "@/lib/database";

interface Project {
  id: string;
  session_id: string;
  title: string;
  description: string;
  status: string;
  session_type: string;
  metadata: any;
  created_at: string;
  updated_at: string;
  last_activity_at: string;
}

const Projects = () => {
  const [editingProject, setEditingProject] = useState<Partial<Project> | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // 使用固定的用户ID，实际应用中应该从认证系统获取
  const userId = "demo_user_001";
  
  // 使用UserSessions Hook来获取项目数据（将会话作为项目）
  const { 
    data: sessions, 
    loading: sessionsLoading, 
    error: sessionsError,
    loadData,
    createData,
    updateData,
    deleteData,
    refresh
  } = useUserSessions(userId);

  // 将sessions转换为projects格式
  const projects: Project[] = sessions.map((session: any) => ({
    id: session.id,
    session_id: session.session_id,
    title: session.metadata?.title || `项目 ${session.session_id.slice(-8)}`,
    description: session.metadata?.description || "暂无描述",
    status: session.status,
    session_type: session.session_type,
    metadata: session.metadata,
    created_at: session.created_at,
    updated_at: session.updated_at,
    last_activity_at: session.last_activity_at,
  }));

  // 初始化数据加载
  useEffect(() => {
    loadData();
    setLoading(false);
  }, [loadData]);

  const handleDelete = async (sessionId: string) => {
    try {
      await deleteData(sessionId);
    } catch (error) {
      console.error('删除项目失败:', error);
    }
  };

  const handleSave = async () => {
    if (!editingProject) return;

    try {
      const projectData = {
        session_id: editingProject.session_id || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        metadata: {
          title: editingProject.title || '',
          description: editingProject.description || '',
          project_type: editingProject.metadata?.project_type || 'short_drama',
          ...editingProject.metadata,
        },
        session_type: editingProject.session_type || 'standard',
        preferences: {},
        usage_stats: {},
      };

      if (editingProject.id) {
        // 更新现有项目
        await updateData(editingProject.id, projectData);
      } else {
        // 创建新项目
        await createData(projectData);
      }

      setDialogOpen(false);
      setEditingProject(null);
    } catch (error) {
      console.error('保存项目失败:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return "bg-green-100 text-green-800 border-green-200";
      case 'inactive': return "bg-gray-100 text-gray-800 border-gray-200";
      case 'expired': return "bg-red-100 text-red-800 border-red-200";
      case 'suspended': return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default: return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'premium': return "bg-purple-100 text-purple-800 border-purple-200";
      case 'enterprise': return "bg-indigo-100 text-indigo-800 border-indigo-200";
      default: return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>加载项目数据中...</span>
          </div>
        </div>
      </div>
    );
  }

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
          
          <div className="flex gap-2">
            <Button 
              onClick={() => refresh()} 
              variant="outline"
              disabled={sessionsLoading}
            >
              {sessionsLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              刷新
            </Button>
            
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => setEditingProject({ 
                    title: "", 
                    description: "", 
                    session_type: "standard",
                    metadata: { project_type: "short_drama" }
                  })}
                  className="gradient-primary text-white shadow-glow"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  新建项目
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>{editingProject?.id ? "编辑项目" : "新建项目"}</DialogTitle>
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
                    <label className="text-sm font-medium">项目描述</label>
                    <Textarea
                      value={editingProject?.description || ""}
                      onChange={(e) =>
                        setEditingProject((prev) => prev ? { ...prev, description: e.target.value } : null)
                      }
                      placeholder="输入项目描述"
                      rows={6}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">项目类型</label>
                      <Input
                        value={editingProject?.metadata?.project_type || ""}
                        onChange={(e) =>
                          setEditingProject((prev) => prev ? { 
                            ...prev, 
                            metadata: { 
                              ...prev.metadata, 
                              project_type: e.target.value 
                            } 
                          } : null)
                        }
                        placeholder="如：short_drama, feature_film"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">会话类型</label>
                      <Input
                        value={editingProject?.session_type || ""}
                        onChange={(e) =>
                          setEditingProject((prev) => prev ? { ...prev, session_type: e.target.value } : null)
                        }
                        placeholder="standard, premium, enterprise"
                      />
                    </div>
                  </div>
                  <Button onClick={handleSave} className="w-full gradient-primary text-white">
                    保存
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* 错误显示 */}
        {sessionsError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            加载项目失败: {sessionsError}
          </div>
        )}

        {/* 项目列表 */}
        {sessionsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>加载项目中...</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.length === 0 ? (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                <FolderOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">暂无项目</p>
                <p className="text-sm">创建您的第一个影视创作项目</p>
              </div>
            ) : (
              projects.map((project) => (
                <Card
                  key={project.id}
                  className="group relative p-6 hover:shadow-card transition-all duration-300 hover:scale-105 animate-fade-in border-border/50 hover:border-primary/50"
                >
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 bg-background/80 backdrop-blur"
                      onClick={() => {
                        setEditingProject(project);
                        setDialogOpen(true);
                      }}
                    >
                      <Edit2 className="h-3 w-3 text-primary" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 bg-background/80 backdrop-blur"
                      onClick={() => handleDelete(project.session_id)}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>

                  <div className="mb-4">
                    <h3 className="text-lg font-semibold mb-2 pr-20 line-clamp-1">
                      {project.title}
                    </h3>
                    <div className="flex gap-2 mb-3">
                      <Badge className={`text-xs ${getStatusColor(project.status)}`}>
                        {project.status === 'active' ? '活跃' : 
                         project.status === 'inactive' ? '非活跃' :
                         project.status === 'expired' ? '已过期' : '已暂停'}
                      </Badge>
                      <Badge className={`text-xs ${getTypeColor(project.session_type)}`}>
                        {project.session_type === 'premium' ? '高级' :
                         project.session_type === 'enterprise' ? '企业' : '标准'}
                      </Badge>
                      {project.metadata?.project_type && (
                        <Badge variant="outline" className="text-xs">
                          {project.metadata.project_type}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                    {project.description}
                  </p>
                  
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      <span>创建于 {new Date(project.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3" />
                      <span>最后活动: {new Date(project.last_activity_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Projects;
