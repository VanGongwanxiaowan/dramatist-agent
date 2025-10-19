import { useState } from "react";
import { User, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";

const Settings = () => {
  const { toast } = useToast();
  const [profile, setProfile] = useState({
    name: "用户名",
    email: "user@example.com",
    bio: "热爱影视创作的内容创作者",
  });

  const handleSave = () => {
    toast({
      title: "保存成功",
      description: "您的个人资料已更新",
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              个人设置
            </h1>
            <p className="text-muted-foreground mt-2">管理您的个人资料</p>
          </div>

          <Card className="p-6 border-border/50">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-20 w-20 rounded-full gradient-primary flex items-center justify-center text-white shadow-glow">
                <User className="h-10 w-10" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{profile.name}</h2>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">姓名</label>
                <Input
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  placeholder="输入您的姓名"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">邮箱</label>
                <Input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  placeholder="输入您的邮箱"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">个人简介</label>
                <Textarea
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  placeholder="介绍一下您自己"
                  rows={4}
                />
              </div>

              <Button onClick={handleSave} className="w-full gradient-primary text-white shadow-glow">
                <Save className="h-4 w-4 mr-2" />
                保存设置
              </Button>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Settings;
