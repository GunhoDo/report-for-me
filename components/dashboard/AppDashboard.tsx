"use client";

import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useConfig, type SourceInput } from "@/hooks/use-config";
import { useReports } from "@/hooks/use-reports";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  Plus,
  History,
  User,
  LogOut,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Link,
  Tag,
  Eye,
  Loader2,
  Check,
  Menu,
  X,
  Settings,
  Users,
  Bell,
  Link2,
  Globe,
  Monitor,
  UserPlus,
  Download,
} from "lucide-react";

interface ModuleConfig {
  url: string;
  keywords: string;
  viewpoint: string;
  summary: string | null;
  isConfigured: boolean;
}

type ModuleId = "source-a" | "source-b" | "source-c";

const defaultModule: ModuleConfig = {
  url: "",
  keywords: "",
  viewpoint: "",
  summary: null,
  isConfigured: false,
};

export function AppDashboard() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { toast } = useToast();
  const { sources, save, isSaving, isLoading: configLoading } = useConfig();
  const { data: reports = [], isLoading: reportsLoading } = useReports(50);

  // Map sources to modules (sources[0]=A, sources[1]=B, sources[2]=C)
  const modules = useMemo((): Record<ModuleId, ModuleConfig> => {
    const slotOrder: ModuleId[] = ["source-a", "source-b", "source-c"];
    const result = {
      "source-a": { ...defaultModule },
      "source-b": { ...defaultModule },
      "source-c": { ...defaultModule },
    };
    slotOrder.forEach((slot, i) => {
      const src = sources[i];
      if (src?.url) {
        result[slot] = {
          url: src.url,
          keywords: Array.isArray(src.keywords)
            ? src.keywords.join(", ")
            : "",
          viewpoint: src.viewpoint ?? "",
          summary: null,
          isConfigured: true,
        };
      }
    });
    return result;
  }, [sources]);

  const [activeModal, setActiveModal] = useState<ModuleId | null>(null);
  const [modalForm, setModalForm] = useState({
    url: "",
    keywords: "",
    viewpoint: "",
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingIntegrated, setIsGeneratingIntegrated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Settings state
  const [theme, setTheme] = useState("system");
  const [language, setLanguage] = useState("ko");
  const [textDirection, setTextDirection] = useState(false);
  const [weekStartMonday, setWeekStartMonday] = useState(false);
  const [autoTimezone, setAutoTimezone] = useState(true);
  const [timezone, setTimezone] = useState("(GMT+09:00) 서울");
  const [desktopLinks, setDesktopLinks] = useState(false);

  // Sample workspace members
  const workspaceMembers = [
    { name: "gunho", email: "eh5890@soongsil.ac.kr", isOwner: true },
    { name: "의진 황의 Notion", isGuest: true },
    { name: "석 이의 Notion", isGuest: true },
  ];

  const configuredCount = Object.values(modules).filter(
    (m) => m.isConfigured
  ).length;

  const openModal = (moduleId: ModuleId) => {
    const module = modules[moduleId];
    setModalForm({
      url: module.url,
      keywords: module.keywords,
      viewpoint: module.viewpoint,
    });
    setActiveModal(moduleId);
  };

  const handleSaveConfig = async () => {
    if (!activeModal) return;

    setIsGenerating(true);
    try {
      const slotOrder: ModuleId[] = ["source-a", "source-b", "source-c"];
      const slotIndex = slotOrder.indexOf(activeModal);
      const sourcesPayload: SourceInput[] = slotOrder.map((slot, i) => {
        const m = modules[slot];
        const isEditing = i === slotIndex;
        const url = isEditing ? modalForm.url.trim() : m.url;
        const keywords = isEditing
          ? modalForm.keywords
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : (m.keywords ? m.keywords.split(",").map((s) => s.trim()).filter(Boolean) : []);
        const viewpoint = isEditing ? modalForm.viewpoint : m.viewpoint;
        const src = sources[i];
        return {
          id: src?.id,
          url,
          keywords,
          viewpoint,
        };
      });

      await save({ sources: sourcesPayload });
      toast({ title: "설정 저장 완료", description: "설정이 저장되었습니다." });
      setActiveModal(null);
      setModalForm({ url: "", keywords: "", viewpoint: "" });
    } catch (err) {
      toast({
        title: "저장 실패",
        description: err instanceof Error ? err.message : "알 수 없는 오류",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateIntegrated = async () => {
    if (configuredCount !== 3) return;

    setIsGeneratingIntegrated(true);
    try {
      const res = await fetch("/api/reports/generate", { method: "POST" });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error?.message ?? "리포트 생성 실패");
      }

      toast({
        title: "리포트 생성 시작",
        description: "리포트가 생성 중입니다. 잠시만 기다려주세요.",
      });

      router.push(`/dashboard/reports/${json.data.report_id}`);
    } catch (err) {
      toast({
        title: "생성 실패",
        description: err instanceof Error ? err.message : "알 수 없는 오류",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingIntegrated(false);
    }
  };

  const moduleLabels: Record<
    ModuleId,
    { label: string; color: string }
  > = {
    "source-a": {
      label: "Source A",
      color: "bg-emerald-100 text-emerald-700",
    },
    "source-b": {
      label: "Source B",
      color: "bg-blue-100 text-blue-700",
    },
    "source-c": {
      label: "Source C",
      color: "bg-amber-100 text-amber-700",
    },
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar - Gemini Style */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-border bg-sidebar transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <FileText className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold text-sidebar-foreground">
                Report For Me
              </span>
            </div>
            <button
              className="text-sidebar-foreground lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* New Report Button */}
          <div className="p-4">
            <Button
              className="w-full justify-start gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => router.push("/dashboard")}
            >
              <Plus className="h-4 w-4" />
              New Report
            </Button>
          </div>

          {/* History Section */}
          <div className="flex-1 overflow-y-auto px-2">
            <div className="px-2 py-2">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                History
              </span>
            </div>
            <nav className="space-y-1">
              {reportsLoading ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  로딩 중...
                </div>
              ) : (
                reports.map((report) => (
                  <button
                    key={report.id}
                    onClick={() => router.push(`/dashboard/reports/${report.id}`)}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
                  >
                    <History className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">
                      리포트{" "}
                      {new Date(report.created_at).toLocaleDateString("ko-KR", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </button>
                ))
              )}
            </nav>
          </div>

          {/* User Profile */}
          <div className="border-t border-sidebar-border p-4">
            <DropdownMenu
              open={profileDropdownOpen}
              onOpenChange={setProfileDropdownOpen}
            >
              <DropdownMenuTrigger asChild>
                <button className="flex w-full items-center gap-3 rounded-lg p-2 transition-colors hover:bg-sidebar-accent">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 text-sm font-semibold">
                    건호
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-sidebar-foreground">
                      gunho
                    </p>
                    <p className="text-xs text-muted-foreground">
                      교육 플러스 요금제 · 1명의 멤버
                    </p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                side="top"
                className="w-72 p-0"
              >
                {/* Tabs for 설정 and 사람 */}
                <Tabs defaultValue="settings" className="w-full">
                  <div className="border-b border-border px-2 pt-2">
                    <TabsList className="h-8 w-full justify-start gap-1 bg-transparent p-0">
                      <TabsTrigger
                        value="settings"
                        className="h-7 rounded-md px-2 text-xs data-[state=active]:bg-muted data-[state=active]:shadow-none"
                      >
                        <Settings className="mr-1 h-3 w-3" />
                        설정
                      </TabsTrigger>
                      <TabsTrigger
                        value="members"
                        className="h-7 rounded-md px-2 text-xs data-[state=active]:bg-muted data-[state=active]:shadow-none"
                      >
                        <Users className="mr-1 h-3 w-3" />
                        사람
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="settings" className="m-0">
                    {/* User Email */}
                    <div className="border-b border-border px-3 py-2">
                      <p className="text-xs text-muted-foreground">
                        eh5890@soongsil.ac.kr
                      </p>
                    </div>

                    {/* Members List */}
                    <div className="max-h-[180px] overflow-y-auto py-1">
                      {workspaceMembers.map((member, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between px-3 py-1.5 hover:bg-muted/50"
                        >
                          <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded bg-emerald-100 text-emerald-700 text-xs font-medium">
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm text-foreground">
                              {member.name}
                            </span>
                            {member.isGuest && (
                              <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                                게스트
                              </span>
                            )}
                          </div>
                          {member.isOwner && (
                            <Check className="h-4 w-4 text-foreground" />
                          )}
                        </div>
                      ))}
                    </div>

                    {/* New Workspace */}
                    <div className="border-t border-border">
                      <button className="flex w-full items-center gap-2 px-3 py-2 text-sm text-primary hover:bg-muted/50">
                        <Plus className="h-4 w-4" />
                        새 워크스페이스
                      </button>
                    </div>
                  </TabsContent>

                  <TabsContent value="members" className="m-0">
                    <div className="max-h-[200px] overflow-y-auto py-1">
                      {workspaceMembers.map((member, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between px-3 py-2 hover:bg-muted/50"
                        >
                          <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded bg-emerald-100 text-emerald-700 text-xs font-medium">
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm text-foreground">
                                {member.name}
                              </p>
                              {member.email && (
                                <p className="text-xs text-muted-foreground">
                                  {member.email}
                                </p>
                              )}
                            </div>
                          </div>
                          {member.isGuest && (
                            <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                              게스트
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>

                <DropdownMenuSeparator />

                {/* Menu Items */}
                <div className="py-1">
                  <DropdownMenuItem
                    className="gap-2 px-3"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      setSettingsOpen(true);
                    }}
                  >
                    <Settings className="h-4 w-4" />
                    업무 제출 생성
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2 px-3">
                    <UserPlus className="h-4 w-4" />
                    다른 계정 추가
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={signOut}
                    className="gap-2 px-3"
                  >
                    <LogOut className="h-4 w-4" />
                    로그아웃
                  </DropdownMenuItem>
                </div>

                <DropdownMenuSeparator />

                <DropdownMenuItem className="gap-2 px-3 py-2">
                  <Download className="h-4 w-4" />
                  Windows 앱 받기
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1">
        {/* Mobile Header */}
        <header className="flex h-16 items-center justify-between border-b border-border px-4 lg:hidden">
          <button
            className="text-foreground"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <FileText className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">Report For Me</span>
          </div>
          <div className="w-6" />
        </header>

        {/* Content */}
        <div className="p-4 lg:p-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground lg:text-3xl">
              Research Dashboard
            </h1>
          </div>

          {/* 2x2 Grid Layout */}
          {configLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
              {/* Source Modules (1, 2, 3) */}
              {(["source-a", "source-b", "source-c"] as ModuleId[]).map(
                (moduleId) => {
                  const module = modules[moduleId];
                  const { label, color } = moduleLabels[moduleId];

                  return (
                    <div
                      key={moduleId}
                      onClick={() => !module.isConfigured && openModal(moduleId)}
                      className={`group relative min-h-[200px] rounded-xl border bg-card p-6 shadow-sm transition-all lg:min-h-[240px] ${
                        module.isConfigured
                          ? "border-border"
                          : "cursor-pointer border-dashed border-border hover:border-primary/50 hover:bg-card/80"
                      }`}
                    >
                      {/* Label Badge */}
                      <div
                        className={`mb-4 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}
                      >
                        {label}
                      </div>

                      {module.isConfigured ? (
                        /* Configured State */
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-1">
                              <p className="line-clamp-1 text-sm text-muted-foreground">
                                <span className="font-medium">URL:</span>{" "}
                                {module.url}
                              </p>
                              <p className="line-clamp-1 text-sm text-muted-foreground">
                                <span className="font-medium">Keywords:</span>{" "}
                                {module.keywords || "-"}
                              </p>
                              {module.viewpoint && (
                                <p className="line-clamp-1 text-sm text-muted-foreground">
                                  <span className="font-medium">Viewpoint:</span>{" "}
                                  {module.viewpoint}
                                </p>
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                openModal(moduleId);
                              }}
                            >
                              Edit
                            </Button>
                          </div>
                          <div className="rounded-lg border border-border bg-muted/50 p-4">
                            <div className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-primary" />
                              <span className="text-sm font-medium text-foreground">
                                설정 완료
                              </span>
                            </div>
                            <p className="mt-2 text-xs text-muted-foreground">
                              리포트 생성 시 분석됩니다.
                            </p>
                          </div>
                        </div>
                      ) : (
                        /* Empty State */
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/30 transition-colors group-hover:border-primary/50">
                            <Plus className="h-6 w-6 text-muted-foreground transition-colors group-hover:text-primary" />
                          </div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Add Configuration
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground/70">
                            Click to configure this source
                          </p>
                        </div>
                      )}
                    </div>
                  );
                }
              )}

              {/* Section 4: Integrated Synthesis Module */}
              <div
                className={`relative min-h-[200px] rounded-xl border bg-card p-6 shadow-sm lg:min-h-[240px] ${
                  configuredCount === 0 ? "opacity-60" : ""
                }`}
              >
                {/* Label Badge */}
                <div className="mb-4 inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                  <Sparkles className="mr-1 h-3 w-3" />
                  Integrated Synthesis
                </div>

                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    Integrated Perspective
                  </p>
                  <p className="mb-4 mt-1 text-xs text-muted-foreground">
                    {configuredCount < 3
                      ? "3개 소스를 모두 설정하면 통합 제언을 생성할 수 있습니다."
                      : "3개 소스가 설정되었습니다."}
                  </p>
                  <Button
                    disabled={
                      configuredCount !== 3 || isGeneratingIntegrated
                    }
                    onClick={handleGenerateIntegrated}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {isGeneratingIntegrated ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        생성 중...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Integrated Perspective
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Configuration Modal */}
      <Dialog
        open={activeModal !== null}
        onOpenChange={(open) => !open && setActiveModal(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Configure{" "}
              {activeModal && moduleLabels[activeModal].label}
            </DialogTitle>
            <DialogDescription>
              Set up your research parameters for this source.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Target URL */}
            <div className="space-y-2">
              <Label
                htmlFor="url"
                className="flex items-center gap-2 text-sm"
              >
                <Link className="h-4 w-4 text-muted-foreground" />
                Target URL
              </Label>
              <Input
                id="url"
                placeholder="https://example.com/article"
                value={modalForm.url}
                onChange={(e) =>
                  setModalForm((prev) => ({
                    ...prev,
                    url: e.target.value,
                  }))
                }
              />
            </div>

            {/* Keywords */}
            <div className="space-y-2">
              <Label
                htmlFor="keywords"
                className="flex items-center gap-2 text-sm"
              >
                <Tag className="h-4 w-4 text-muted-foreground" />
                Keywords
              </Label>
              <Input
                id="keywords"
                placeholder="AI, machine learning, trends"
                value={modalForm.keywords}
                onChange={(e) =>
                  setModalForm((prev) => ({
                    ...prev,
                    keywords: e.target.value,
                  }))
                }
              />
            </div>

            {/* Viewpoint */}
            <div className="space-y-2">
              <Label
                htmlFor="viewpoint"
                className="flex items-center gap-2 text-sm"
              >
                <Eye className="h-4 w-4 text-muted-foreground" />
                Viewpoint
              </Label>
              <Textarea
                id="viewpoint"
                placeholder="Analyze from a technical perspective, focusing on implementation challenges..."
                value={modalForm.viewpoint}
                onChange={(e) =>
                  setModalForm((prev) => ({
                    ...prev,
                    viewpoint: e.target.value,
                  }))
                }
                className="min-h-[80px] resize-none"
              />
            </div>

            {/* Preview Callout */}
            {modalForm.url && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      Ready to Analyze
                    </p>
                    <p className="text-sm text-muted-foreground">
                      I will read{" "}
                      <span className="font-medium text-foreground">
                        {modalForm.url}
                      </span>{" "}
                      and analyze it
                      {modalForm.keywords && (
                        <>
                          {" "}
                          focusing on{" "}
                          <span className="font-medium text-foreground">
                            {modalForm.keywords}
                          </span>
                        </>
                      )}
                      {modalForm.viewpoint && (
                        <> from your specified viewpoint</>
                      )}
                      .
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setActiveModal(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveConfig}
              disabled={!modalForm.url.trim() || isGenerating || isSaving}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isGenerating || isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  저장 중...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  저장
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Modal - Notion Style */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="h-[600px] max-w-3xl gap-0 overflow-hidden p-0">
          <div className="flex h-full">
            {/* Left Sidebar */}
            <div className="flex w-60 flex-col border-r border-border bg-muted/30">
              {/* Account Section */}
              <div className="border-b border-border p-3">
                <p className="mb-2 text-xs text-muted-foreground">계정</p>
                <div className="flex items-center gap-2 rounded-md p-2 hover:bg-muted/50">
                  <div className="flex h-6 w-6 items-center justify-center rounded bg-emerald-100 text-emerald-700 text-xs font-medium">
                    G
                  </div>
                  <span className="text-sm text-foreground">gunho</span>
                </div>
                <button className="flex w-full items-center gap-2 rounded-md bg-muted/70 p-2 text-sm text-foreground">
                  <Settings className="h-4 w-4" />
                  기본 설정
                </button>
                <button className="flex w-full items-center gap-2 rounded-md p-2 text-sm text-foreground hover:bg-muted/50">
                  <Bell className="h-4 w-4" />
                  알림
                </button>
                <button className="flex w-full items-center gap-2 rounded-md p-2 text-sm text-foreground hover:bg-muted/50">
                  <Link2 className="h-4 w-4" />
                  연결
                </button>
              </div>

              {/* Workspace Section */}
              <div className="flex-1 overflow-y-auto p-3">
                <p className="mb-2 text-xs text-muted-foreground">워크스페이스</p>
                <div className="space-y-0.5">
                  <button className="flex w-full items-center gap-2 rounded-md p-2 text-sm text-foreground hover:bg-muted/50">
                    <Settings className="h-4 w-4" />
                    일반
                  </button>
                  <button className="flex w-full items-center gap-2 rounded-md p-2 text-sm text-foreground hover:bg-muted/50">
                    <Users className="h-4 w-4" />
                    사람
                  </button>
                  <button className="flex w-full items-center gap-2 rounded-md p-2 text-sm text-foreground hover:bg-muted/50">
                    <Users className="h-4 w-4" />
                    팀스페이스
                  </button>
                  <button className="flex w-full items-center gap-2 rounded-md p-2 text-sm text-foreground hover:bg-muted/50">
                    <Sparkles className="h-4 w-4" />
                    Notion AI
                  </button>
                  <button className="flex w-full items-center gap-2 rounded-md p-2 text-sm text-foreground hover:bg-muted/50">
                    <Globe className="h-4 w-4" />
                    공개 페이지
                  </button>
                  <button className="flex w-full items-center gap-2 rounded-md p-2 text-sm text-foreground hover:bg-muted/50">
                    <Link2 className="h-4 w-4" />
                    연결
                  </button>
                </div>
              </div>
            </div>

            {/* Right Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Close Button */}
              <button
                onClick={() => setSettingsOpen(false)}
                className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="p-6 pt-8">
                <h2 className="mb-6 text-lg font-semibold text-foreground">
                  기본 설정
                </h2>

                {/* Theme Section */}
                <div className="mb-8">
                  <div className="mb-1 flex items-center justify-between">
                    <h3 className="text-sm font-medium text-foreground">
                      테마
                    </h3>
                    <Select value={theme} onValueChange={setTheme}>
                      <SelectTrigger className="h-8 w-40 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="system">시스템 설정 사용</SelectItem>
                        <SelectItem value="light">라이트</SelectItem>
                        <SelectItem value="dark">다크</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    내 기기에서 Notion의 모습을 마음껏 바꿔보세요.
                  </p>
                </div>

                {/* Language & Time Section */}
                <div className="mb-6">
                  <h3 className="mb-4 border-b border-border pb-2 text-sm font-medium text-foreground">
                    언어 및 시간
                  </h3>

                  {/* Language */}
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-foreground">언어</p>
                      <p className="text-xs text-muted-foreground">
                        Notion에서 사용하는 언어를 변경하세요.
                      </p>
                    </div>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger className="h-8 w-28 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ko">한국어</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="ja">日本語</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Text Direction */}
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-foreground">
                        텍스트 방향 제어 항상 표시
                      </p>
                      <p className="text-xs text-muted-foreground">
                        언어가 힌족에서 오른쪽으로 표시되는 경우에도 편집기
                        메뉴에 텍스트 방향(LTR/RTL)을 변경하는 옵션을
                        표시합니다.
                      </p>
                    </div>
                    <Switch
                      checked={textDirection}
                      onCheckedChange={setTextDirection}
                    />
                  </div>

                  {/* Week Start */}
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-foreground">
                        한 주의 시작을 월요일로 설정하기
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Notion의 모든 캘린더에 적용됩니다.
                      </p>
                    </div>
                    <Switch
                      checked={weekStartMonday}
                      onCheckedChange={setWeekStartMonday}
                    />
                  </div>

                  {/* Auto Timezone */}
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-foreground">
                        위치를 사용하여 자동으로 시간대 설정
                      </p>
                      <p className="text-xs text-muted-foreground">
                        설정한 시간대를 기준으로 리마인더, 알림, 이메일을
                        보내드려요.
                      </p>
                    </div>
                    <Switch
                      checked={autoTimezone}
                      onCheckedChange={setAutoTimezone}
                    />
                  </div>

                  {/* Timezone */}
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-foreground">시간대</p>
                      <p className="text-xs text-muted-foreground">
                        현재 설정된 시간대입니다.
                      </p>
                    </div>
                    <Select value={timezone} onValueChange={setTimezone}>
                      <SelectTrigger className="h-8 w-40 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="(GMT+09:00) 서울">
                          (GMT+09:00) 서울
                        </SelectItem>
                        <SelectItem value="(GMT+00:00) UTC">
                          (GMT+00:00) UTC
                        </SelectItem>
                        <SelectItem value="(GMT-08:00) LA">
                          (GMT-08:00) LA
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Desktop App Section */}
                <div>
                  <h3 className="mb-4 border-b border-border pb-2 text-sm font-medium text-foreground">
                    데스크톱 앱
                  </h3>

                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-foreground">
                        데스크톱 앱에서 링크 열기
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Windows 앱이 설치되어 있어야 합니다.
                      </p>
                    </div>
                    <Switch
                      checked={desktopLinks}
                      onCheckedChange={setDesktopLinks}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-foreground">시작 페이지</p>
                    </div>
                    <Select defaultValue="last">
                      <SelectTrigger className="h-8 w-40 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="last">
                          마지막으로 본 페이지
                        </SelectItem>
                        <SelectItem value="home">홈</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

