// Admin.tsx
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle, Loader, LogOut, Plus, Save, Trash2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ImageUploader } from "../components/ImageUploader";
import { useData } from "../context/DataContext";
import { Project, Service, SiteContent } from "../types";

// ---------- Helpers (evita undefined quebrando a UI) ----------
type LangObj = { "pt-BR": string; en: string };

const emptyLang = (): LangObj => ({ "pt-BR": "", en: "" });

const ensureLangObj = (v: any): LangObj => ({
  "pt-BR": typeof v?.["pt-BR"] === "string" ? v["pt-BR"] : "",
  en: typeof v?.en === "string" ? v.en : "",
});

const safeString = (v: any) => (typeof v === "string" ? v : "");

// ---------- Smart Delete Button Component ----------
const DeleteButton = ({ onDelete }: { onDelete: () => void }) => {
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (confirming) {
      const timer = setTimeout(() => setConfirming(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [confirming]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (confirming) {
      onDelete();
      setConfirming(false);
    } else {
      setConfirming(true);
    }
  };

  return (
    <button
      onClick={handleClick}
      type="button"
      className={`
        relative transition-all duration-300 rounded-full flex items-center overflow-hidden
        ${
          confirming
            ? "bg-red-600 border-red-600 text-white pl-3 pr-4 py-2 gap-2 shadow-[0_0_15px_rgba(220,38,38,0.5)]"
            : "border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white px-3 py-2 w-10 justify-center"
        }
      `}
    >
      <Trash2 className="w-4 h-4 shrink-0" />
      <AnimatePresence>
        {confirming && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            className="text-xs font-bold uppercase whitespace-nowrap overflow-hidden"
          >
            Confirm
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
};

export const Admin: React.FC = () => {
  const {
    isAuthenticated,
    initAuth,
    login,
    logout,
    projects,
    updateProject,
    addProject,
    deleteProject,
    services,
    updateService,
    addService,
    deleteService,
    content,
    updateContent,
  } = useData();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isAuthBootstrapping, setIsAuthBootstrapping] = useState(true);

  // Feedback Status
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error" | "offline">(
    "idle",
  );

  // State for Projects
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Project | null>(null);

  // State for Services
  const [editingServiceId, setEditingServiceId] = useState<number | null>(null);
  const [editServiceForm, setEditServiceForm] = useState<Service | null>(null);

  // State for Content
  const [editingSection, setEditingSection] = useState<keyof SiteContent | null>(null);
  const [editContentForm, setEditContentForm] = useState<any | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Admin | Mauro Rocha";

    const robotsMeta = document.createElement("meta");
    robotsMeta.name = "robots";
    robotsMeta.content = "noindex, nofollow, noarchive, nosnippet";
    robotsMeta.setAttribute("data-admin-meta", "robots");
    document.head.appendChild(robotsMeta);

    const googleBotMeta = document.createElement("meta");
    googleBotMeta.name = "googlebot";
    googleBotMeta.content = "noindex, nofollow, noarchive, nosnippet";
    googleBotMeta.setAttribute("data-admin-meta", "googlebot");
    document.head.appendChild(googleBotMeta);

    void initAuth().finally(() => setIsAuthBootstrapping(false));

    return () => {
      document.title = previousTitle;
      robotsMeta.remove();
      googleBotMeta.remove();
    };
  }, [initAuth]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError("");

    const success = await login(email, password);

    if (success) setError("");
    else setError("Invalid email or password");

    setIsLoggingIn(false);
  };

  const showFeedback = (status: "success" | "error" | "offline") => {
    setSaveStatus(status);
    setTimeout(() => setSaveStatus("idle"), 4000);
  };

  // ---------------- PROJECT HANDLERS ----------------
  const handleEdit = (project: Project) => {
    setEditingId(project.id);
    setEditForm({ ...project });
    setSaveStatus("idle");
  };

  const handleAddNewProject = () => {
    setEditingId(0); // 0 indicates new item
    setEditForm({
      id: 0,
      title: "New Project",
      year: new Date().getFullYear().toString(),
      category: { "pt-BR": "", en: "" },
      description: { "pt-BR": "", en: "" },
      fullDescription: { "pt-BR": "", en: "" },
      image: "https://picsum.photos/seed/new/800/600",
      link: "#",
      client: "New Client",
      stack: [],
    });
    setSaveStatus("idle");
  };

  const handleDeleteProject = async (id: number) => {
    setSaveStatus("saving");
    const success = await deleteProject(id);
    if (success) showFeedback("success");
    else showFeedback("offline");
  };

  const handleSave = async () => {
    if (!editForm) return;

    setSaveStatus("saving");
    let success = false;

    if (editingId === 0) {
      // ✅ addProject espera Omit<Project,'id'> no DataContext refatorado
      const { id: _ignore, ...payload } = editForm as Project;
      success = await addProject(payload);
    } else {
      success = await updateProject(editForm);
    }

    if (success) showFeedback("success");
    else showFeedback("offline");

    setEditingId(null);
    setEditForm(null);
  };

  const handleInputChange = (field: keyof Project, value: any) => {
    if (!editForm) return;
    setEditForm({ ...editForm, [field]: value });
  };

  const handleStackChange = (value: string) => {
    if (!editForm) return;
    const array = value
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s !== "");
    setEditForm({ ...editForm, stack: array });
  };

  const handleDeepInputChange = (
    field: "category" | "description" | "fullDescription",
    lang: "pt-BR" | "en",
    value: string,
  ) => {
    if (!editForm) return;
    setEditForm({
      ...editForm,
      [field]: {
        ...(editForm[field] ?? { "pt-BR": "", en: "" }),
        [lang]: value,
      },
    });
  };

  // ---------------- SERVICE HANDLERS ----------------
  const handleEditService = (service: Service) => {
    setEditingServiceId(service.id);
    setEditServiceForm({ ...service });
    setSaveStatus("idle");
  };

  const handleAddNewService = () => {
    setEditingServiceId(0);
    setEditServiceForm({
      id: 0,
      title: { "pt-BR": "Novo Serviço", en: "New Service" },
      description: { "pt-BR": "", en: "" },
    });
    setSaveStatus("idle");
  };

  const handleDeleteService = async (id: number) => {
    setSaveStatus("saving");
    const success = await deleteService(id);
    if (success) showFeedback("success");
    else showFeedback("offline");
  };

  const handleSaveService = async () => {
    if (!editServiceForm) return;

    setSaveStatus("saving");
    let success = false;

    if (editingServiceId === 0) {
      // ✅ addService espera Omit<Service,'id'>
      const { id: _ignore, ...payload } = editServiceForm as Service;
      success = await addService(payload);
    } else {
      success = await updateService(editServiceForm);
    }

    if (success) showFeedback("success");
    else showFeedback("offline");

    setEditingServiceId(null);
    setEditServiceForm(null);
  };

  const handleDeepServiceInputChange = (
    field: "title" | "description",
    lang: "pt-BR" | "en",
    value: string,
  ) => {
    if (!editServiceForm) return;
    setEditServiceForm({
      ...editServiceForm,
      [field]: {
        ...(editServiceForm[field] ?? { "pt-BR": "", en: "" }),
        [lang]: value,
      },
    });
  };

  // ---------------- CONTENT HANDLERS ----------------
  const handleEditContent = (section: keyof SiteContent) => {
    setEditingSection(section);

    // ✅ Não assume que content[section] existe
    const base = (content as any)?.[section] ?? {};
    setEditContentForm({ ...base });

    setSaveStatus("idle");
  };

  const handleSaveContent = async () => {
    if (!editingSection || !editContentForm) return;

    setSaveStatus("saving");
    const success = await updateContent(editingSection, editContentForm);

    if (success) showFeedback("success");
    else showFeedback("offline");

    setEditingSection(null);
    setEditContentForm(null);
  };

  const handleContentDeepChange = (field: string, lang: "pt-BR" | "en", value: string) => {
    if (!editContentForm) return;
    setEditContentForm({
      ...editContentForm,
      [field]: {
        ...(editContentForm[field] ?? { "pt-BR": "", en: "" }),
        [lang]: value,
      },
    });
  };

  const handleContentSimpleChange = (field: string, value: string) => {
    if (!editContentForm) return;
    setEditContentForm({
      ...editContentForm,
      [field]: value,
    });
  };

  const handleContentArrayChange = (field: string, value: string) => {
    if (!editContentForm) return;
    const array = value
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s !== "");
    setEditContentForm({
      ...editContentForm,
      [field]: array,
    });
  };

  // ---------------- RENDER ----------------
  if (isAuthBootstrapping) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader className="w-7 h-7 animate-spin text-white/70" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm p-8 bg-surface rounded-2xl border border-white/10"
        >
          <h2 className="text-2xl font-display font-bold mb-6 text-center">Admin Access</h2>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full bg-background border border-white/20 rounded-lg px-4 py-3 mb-4 focus:outline-none focus:border-accent text-white"
            disabled={isLoggingIn}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full bg-background border border-white/20 rounded-lg px-4 py-3 mb-4 focus:outline-none focus:border-accent text-white"
            disabled={isLoggingIn}
          />

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 flex justify-center items-center"
          >
            {isLoggingIn ? <Loader className="w-5 h-5 animate-spin" /> : "Enter"}
          </button>

          <div className="mt-4 text-center">
            <span className="text-xs text-gray-600">
              Use seu usuário do Firebase Auth (Email/Password)
            </span>
          </div>
        </form>
      </div>
    );
  }

  // ✅ “content” defensivo: garante que não quebra render mesmo se Firestore vier incompleto
  const hero = (content as any)?.hero ?? {};
  const about = (content as any)?.about ?? {};
  const contact = (content as any)?.contact ?? {};

  const heroTitle = ensureLangObj(hero.title);
  const heroSubtitle = ensureLangObj(hero.subtitle);

  const aboutTitle = ensureLangObj(about.title);
  const aboutP1 = ensureLangObj(about.p1);
  const aboutSkills = Array.isArray(about.skills) ? about.skills : [];

  const contactTitle = ensureLangObj(contact.title);
  const contactFooter = ensureLangObj(contact.footerText);
  const contactEmail = safeString(contact.email);

  return (
    <div className="min-h-screen bg-background pt-32 px-6 pb-20 relative">
      {/* Global Feedback Toast */}
      {saveStatus !== "idle" && (
        <div
          className={`fixed top-24 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full flex items-center gap-2 shadow-2xl backdrop-blur-md border ${
            saveStatus === "saving"
              ? "bg-blue-500/20 border-blue-500 text-blue-200"
              : saveStatus === "success"
                ? "bg-green-500/20 border-green-500 text-green-200"
                : "bg-orange-500/20 border-orange-500 text-orange-200"
          }`}
        >
          {saveStatus === "saving" && <Loader className="w-5 h-5 animate-spin" />}
          {saveStatus === "success" && <CheckCircle className="w-5 h-5" />}
          {(saveStatus === "error" || saveStatus === "offline") && (
            <AlertCircle className="w-5 h-5" />
          )}

          <span className="font-bold text-sm">
            {saveStatus === "saving"
              ? "Saving to Database..."
              : saveStatus === "success"
                ? "Changes Saved Successfully!"
                : "Save failed (permissions/offline)."}
          </span>
        </div>
      )}

      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-4xl font-display font-bold">Content Manager</h1>
          <div className="flex gap-4">
            <button
              onClick={() => navigate("/")}
              className="text-sm uppercase tracking-widest hover:text-gray-400"
            >
              View Site
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-2 text-red-500 hover:text-red-400"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>

        <div className="grid gap-16">
          {/* PROJECTS SECTION */}
          <div>
            <div className="flex justify-between items-end border-b border-white/10 pb-4 mb-8">
              <h2 className="text-2xl font-mono text-gray-500 uppercase tracking-widest">
                Projects
              </h2>
              {!editingId && (
                <button
                  onClick={handleAddNewProject}
                  className="flex items-center gap-2 bg-blue-600 px-4 py-2 rounded-full text-white hover:bg-blue-500 text-xs font-bold uppercase tracking-widest"
                >
                  <Plus className="w-4 h-4" /> Add Project
                </button>
              )}
            </div>

            <div className="grid gap-8">
              {/* New Project Form */}
              {editingId === 0 && editForm && (
                <div className="bg-surface p-6 rounded-xl border border-blue-500/50 shadow-[0_0_30px_rgba(37,99,235,0.1)]">
                  <h3 className="text-lg font-bold text-blue-400 mb-6">Creating New Project</h3>

                  <div className="space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block uppercase tracking-wider">
                          Title
                        </label>
                        <input
                          value={editForm.title}
                          onChange={(e) => handleInputChange("title", e.target.value)}
                          className="w-full bg-background border border-white/20 p-3 rounded text-white focus:border-blue-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block uppercase tracking-wider">
                          Year
                        </label>
                        <input
                          value={editForm.year}
                          onChange={(e) => handleInputChange("year", e.target.value)}
                          className="w-full bg-background border border-white/20 p-3 rounded text-white focus:border-blue-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block uppercase tracking-wider">
                          Client
                        </label>
                        <input
                          value={editForm.client || ""}
                          onChange={(e) => handleInputChange("client", e.target.value)}
                          className="w-full bg-background border border-white/20 p-3 rounded text-white focus:border-blue-500 transition-colors"
                        />
                      </div>
                    </div>

                    {/* URLs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <ImageUploader
                        label="Image (Main)"
                        value={editForm.image}
                        onChange={(url) => handleInputChange("image", url)}
                      />
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block uppercase tracking-wider">
                          Project Link (Href)
                        </label>
                        <input
                          value={editForm.link}
                          onChange={(e) => handleInputChange("link", e.target.value)}
                          className="w-full bg-background border border-white/20 p-3 rounded text-white text-xs font-mono focus:border-blue-500 transition-colors"
                        />
                      </div>
                    </div>

                    {/* Stack */}
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block uppercase tracking-wider">
                        Tech Stack (Comma separated)
                      </label>
                      <input
                        value={editForm.stack?.join(", ") || ""}
                        onChange={(e) => handleStackChange(e.target.value)}
                        className="w-full bg-background border border-white/20 p-3 rounded text-white font-mono text-sm focus:border-blue-500 transition-colors"
                        placeholder="React, TypeScript, Three.js..."
                      />
                    </div>

                    {/* Category */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-blue-300 mb-1 block uppercase tracking-wider">
                          Category (PT)
                        </label>
                        <input
                          value={editForm.category?.["pt-BR"] || ""}
                          onChange={(e) =>
                            handleDeepInputChange("category", "pt-BR", e.target.value)
                          }
                          className="w-full bg-background border border-white/20 p-3 rounded text-white focus:border-blue-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-green-300 mb-1 block uppercase tracking-wider">
                          Category (EN)
                        </label>
                        <input
                          value={editForm.category?.en || ""}
                          onChange={(e) => handleDeepInputChange("category", "en", e.target.value)}
                          className="w-full bg-background border border-white/20 p-3 rounded text-white focus:border-blue-500 transition-colors"
                        />
                      </div>
                    </div>

                    {/* Short Description */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-blue-300 mb-1 block uppercase tracking-wider">
                          Short Desc (PT)
                        </label>
                        <textarea
                          value={editForm.description?.["pt-BR"] || ""}
                          onChange={(e) =>
                            handleDeepInputChange("description", "pt-BR", e.target.value)
                          }
                          className="w-full bg-background border border-white/20 p-3 rounded text-white h-24 focus:border-blue-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-green-300 mb-1 block uppercase tracking-wider">
                          Short Desc (EN)
                        </label>
                        <textarea
                          value={editForm.description?.en || ""}
                          onChange={(e) =>
                            handleDeepInputChange("description", "en", e.target.value)
                          }
                          className="w-full bg-background border border-white/20 p-3 rounded text-white h-24 focus:border-blue-500 transition-colors"
                        />
                      </div>
                    </div>

                    {/* Full Description */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-blue-300 mb-1 block uppercase tracking-wider">
                          Full Desc (PT)
                        </label>
                        <textarea
                          value={editForm.fullDescription?.["pt-BR"] || ""}
                          onChange={(e) =>
                            handleDeepInputChange("fullDescription", "pt-BR", e.target.value)
                          }
                          className="w-full bg-background border border-white/20 p-3 rounded text-white h-40 focus:border-blue-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-green-300 mb-1 block uppercase tracking-wider">
                          Full Desc (EN)
                        </label>
                        <textarea
                          value={editForm.fullDescription?.en || ""}
                          onChange={(e) =>
                            handleDeepInputChange("fullDescription", "en", e.target.value)
                          }
                          className="w-full bg-background border border-white/20 p-3 rounded text-white h-40 focus:border-blue-500 transition-colors"
                        />
                      </div>
                    </div>

                    <div className="flex gap-4 mt-6 pt-6 border-t border-white/10">
                      <button
                        onClick={handleSave}
                        className="flex items-center gap-2 bg-green-600 px-6 py-3 rounded-full text-white hover:bg-green-500 font-bold tracking-widest uppercase text-sm shadow-lg hover:shadow-green-500/20 transition-all"
                      >
                        <Save className="w-4 h-4" /> Create Project
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setEditForm(null);
                          setSaveStatus("idle");
                        }}
                        className="px-6 py-3 text-gray-400 hover:text-white font-bold tracking-widest uppercase text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {projects.map((project) => (
                <div key={project.id} className="bg-surface p-6 rounded-xl border border-white/10">
                  {editingId === project.id && editForm ? (
                    <div className="space-y-6">
                      <h3 className="text-lg font-bold text-blue-400 mb-6">
                        Editing {project.title}
                      </h3>

                      {/* Basic Info */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block uppercase tracking-wider">
                            Title
                          </label>
                          <input
                            value={editForm.title}
                            onChange={(e) => handleInputChange("title", e.target.value)}
                            className="w-full bg-background border border-white/20 p-3 rounded text-white focus:border-blue-500 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block uppercase tracking-wider">
                            Year
                          </label>
                          <input
                            value={editForm.year}
                            onChange={(e) => handleInputChange("year", e.target.value)}
                            className="w-full bg-background border border-white/20 p-3 rounded text-white focus:border-blue-500 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block uppercase tracking-wider">
                            Client
                          </label>
                          <input
                            value={editForm.client || ""}
                            onChange={(e) => handleInputChange("client", e.target.value)}
                            className="w-full bg-background border border-white/20 p-3 rounded text-white focus:border-blue-500 transition-colors"
                          />
                        </div>
                      </div>

                      {/* URLs */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ImageUploader
                          label="Image (Main)"
                          value={editForm.image}
                          onChange={(url) => handleInputChange("image", url)}
                        />
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block uppercase tracking-wider">
                            Project Link (Href)
                          </label>
                          <input
                            value={editForm.link}
                            onChange={(e) => handleInputChange("link", e.target.value)}
                            className="w-full bg-background border border-white/20 p-3 rounded text-white text-xs font-mono focus:border-blue-500 transition-colors"
                          />
                        </div>
                      </div>

                      {/* Stack */}
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block uppercase tracking-wider">
                          Tech Stack (Comma separated)
                        </label>
                        <input
                          value={editForm.stack?.join(", ") || ""}
                          onChange={(e) => handleStackChange(e.target.value)}
                          className="w-full bg-background border border-white/20 p-3 rounded text-white font-mono text-sm focus:border-blue-500 transition-colors"
                          placeholder="React, TypeScript, Three.js..."
                        />
                      </div>

                      {/* Category */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-blue-300 mb-1 block uppercase tracking-wider">
                            Category (PT)
                          </label>
                          <input
                            value={editForm.category?.["pt-BR"] || ""}
                            onChange={(e) =>
                              handleDeepInputChange("category", "pt-BR", e.target.value)
                            }
                            className="w-full bg-background border border-white/20 p-3 rounded text-white focus:border-blue-500 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-green-300 mb-1 block uppercase tracking-wider">
                            Category (EN)
                          </label>
                          <input
                            value={editForm.category?.en || ""}
                            onChange={(e) =>
                              handleDeepInputChange("category", "en", e.target.value)
                            }
                            className="w-full bg-background border border-white/20 p-3 rounded text-white focus:border-blue-500 transition-colors"
                          />
                        </div>
                      </div>

                      {/* Short Description */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-blue-300 mb-1 block uppercase tracking-wider">
                            Short Desc (PT)
                          </label>
                          <textarea
                            value={editForm.description?.["pt-BR"] || ""}
                            onChange={(e) =>
                              handleDeepInputChange("description", "pt-BR", e.target.value)
                            }
                            className="w-full bg-background border border-white/20 p-3 rounded text-white h-24 focus:border-blue-500 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-green-300 mb-1 block uppercase tracking-wider">
                            Short Desc (EN)
                          </label>
                          <textarea
                            value={editForm.description?.en || ""}
                            onChange={(e) =>
                              handleDeepInputChange("description", "en", e.target.value)
                            }
                            className="w-full bg-background border border-white/20 p-3 rounded text-white h-24 focus:border-blue-500 transition-colors"
                          />
                        </div>
                      </div>

                      {/* Full Description */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-blue-300 mb-1 block uppercase tracking-wider">
                            Full Desc (PT)
                          </label>
                          <textarea
                            value={editForm.fullDescription?.["pt-BR"] || ""}
                            onChange={(e) =>
                              handleDeepInputChange("fullDescription", "pt-BR", e.target.value)
                            }
                            className="w-full bg-background border border-white/20 p-3 rounded text-white h-40 focus:border-blue-500 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-green-300 mb-1 block uppercase tracking-wider">
                            Full Desc (EN)
                          </label>
                          <textarea
                            value={editForm.fullDescription?.en || ""}
                            onChange={(e) =>
                              handleDeepInputChange("fullDescription", "en", e.target.value)
                            }
                            className="w-full bg-background border border-white/20 p-3 rounded text-white h-40 focus:border-blue-500 transition-colors"
                          />
                        </div>
                      </div>

                      <div className="flex gap-4 mt-6 pt-6 border-t border-white/10">
                        <button
                          onClick={handleSave}
                          className="flex items-center gap-2 bg-green-600 px-6 py-3 rounded-full text-white hover:bg-green-500 font-bold tracking-widest uppercase text-sm shadow-lg hover:shadow-green-500/20 transition-all"
                        >
                          <Save className="w-4 h-4" /> Save Project
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(null);
                            setEditForm(null);
                            setSaveStatus("idle");
                          }}
                          className="px-6 py-3 text-gray-400 hover:text-white font-bold tracking-widest uppercase text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex items-center gap-6">
                        <div className="w-20 h-12 bg-gray-800 rounded overflow-hidden">
                          <img
                            src={project.image}
                            className="w-full h-full object-cover opacity-60"
                          />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold">
                            {project.title}{" "}
                            <span className="text-sm font-normal text-gray-500 ml-2">
                              ({project.year})
                            </span>
                          </h3>
                          <p className="text-gray-400 text-xs mt-1">
                            {project.category?.en ?? ""} • {project.client ?? ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleEdit(project)}
                          className="border border-white/20 px-6 py-2 rounded-full hover:bg-white hover:text-black transition-colors text-sm uppercase font-bold tracking-wider"
                        >
                          Edit
                        </button>
                        <DeleteButton onDelete={() => handleDeleteProject(project.id)} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* SERVICES SECTION */}
          <div>
            <div className="flex justify-between items-end border-b border-white/10 pb-4 mb-8">
              <h2 className="text-2xl font-mono text-gray-500 uppercase tracking-widest">
                Services
              </h2>
              {!editingServiceId && (
                <button
                  onClick={handleAddNewService}
                  className="flex items-center gap-2 bg-blue-600 px-4 py-2 rounded-full text-white hover:bg-blue-500 text-xs font-bold uppercase tracking-widest"
                >
                  <Plus className="w-4 h-4" /> Add Service
                </button>
              )}
            </div>

            <div className="grid gap-8">
              {/* New Service Form */}
              {editingServiceId === 0 && editServiceForm && (
                <div className="bg-surface p-6 rounded-xl border border-blue-500/50 shadow-[0_0_30px_rgba(37,99,235,0.1)]">
                  <h3 className="text-lg font-bold text-blue-400 mb-6">Creating New Service</h3>

                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-blue-300 mb-1 block uppercase tracking-wider">
                          Title (PT)
                        </label>
                        <input
                          value={editServiceForm.title?.["pt-BR"] || ""}
                          onChange={(e) =>
                            handleDeepServiceInputChange("title", "pt-BR", e.target.value)
                          }
                          className="w-full bg-background border border-white/20 p-3 rounded text-white focus:border-blue-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-green-300 mb-1 block uppercase tracking-wider">
                          Title (EN)
                        </label>
                        <input
                          value={editServiceForm.title?.en || ""}
                          onChange={(e) =>
                            handleDeepServiceInputChange("title", "en", e.target.value)
                          }
                          className="w-full bg-background border border-white/20 p-3 rounded text-white focus:border-blue-500 transition-colors"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-blue-300 mb-1 block uppercase tracking-wider">
                          Description (PT)
                        </label>
                        <textarea
                          value={editServiceForm.description?.["pt-BR"] || ""}
                          onChange={(e) =>
                            handleDeepServiceInputChange("description", "pt-BR", e.target.value)
                          }
                          className="w-full bg-background border border-white/20 p-3 rounded text-white h-24 focus:border-blue-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-green-300 mb-1 block uppercase tracking-wider">
                          Description (EN)
                        </label>
                        <textarea
                          value={editServiceForm.description?.en || ""}
                          onChange={(e) =>
                            handleDeepServiceInputChange("description", "en", e.target.value)
                          }
                          className="w-full bg-background border border-white/20 p-3 rounded text-white h-24 focus:border-blue-500 transition-colors"
                        />
                      </div>
                    </div>

                    <div className="flex gap-4 mt-6 pt-6 border-t border-white/10">
                      <button
                        onClick={handleSaveService}
                        className="flex items-center gap-2 bg-green-600 px-6 py-3 rounded-full text-white hover:bg-green-500 font-bold tracking-widest uppercase text-sm shadow-lg hover:shadow-green-500/20 transition-all"
                      >
                        <Save className="w-4 h-4" /> Create Service
                      </button>
                      <button
                        onClick={() => {
                          setEditingServiceId(null);
                          setEditServiceForm(null);
                          setSaveStatus("idle");
                        }}
                        className="px-6 py-3 text-gray-400 hover:text-white font-bold tracking-widest uppercase text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {services.map((service) => (
                <div key={service.id} className="bg-surface p-6 rounded-xl border border-white/10">
                  {editingServiceId === service.id && editServiceForm ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-blue-300 mb-1 block uppercase tracking-wider">
                            Title (PT)
                          </label>
                          <input
                            value={editServiceForm.title?.["pt-BR"] || ""}
                            onChange={(e) =>
                              handleDeepServiceInputChange("title", "pt-BR", e.target.value)
                            }
                            className="w-full bg-background border border-white/20 p-3 rounded text-white focus:border-blue-500 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-green-300 mb-1 block uppercase tracking-wider">
                            Title (EN)
                          </label>
                          <input
                            value={editServiceForm.title?.en || ""}
                            onChange={(e) =>
                              handleDeepServiceInputChange("title", "en", e.target.value)
                            }
                            className="w-full bg-background border border-white/20 p-3 rounded text-white focus:border-blue-500 transition-colors"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-blue-300 mb-1 block uppercase tracking-wider">
                            Description (PT)
                          </label>
                          <textarea
                            value={editServiceForm.description?.["pt-BR"] || ""}
                            onChange={(e) =>
                              handleDeepServiceInputChange("description", "pt-BR", e.target.value)
                            }
                            className="w-full bg-background border border-white/20 p-3 rounded text-white h-24 focus:border-blue-500 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-green-300 mb-1 block uppercase tracking-wider">
                            Description (EN)
                          </label>
                          <textarea
                            value={editServiceForm.description?.en || ""}
                            onChange={(e) =>
                              handleDeepServiceInputChange("description", "en", e.target.value)
                            }
                            className="w-full bg-background border border-white/20 p-3 rounded text-white h-24 focus:border-blue-500 transition-colors"
                          />
                        </div>
                      </div>

                      <div className="flex gap-4 mt-6 pt-6 border-t border-white/10">
                        <button
                          onClick={handleSaveService}
                          className="flex items-center gap-2 bg-green-600 px-6 py-3 rounded-full text-white hover:bg-green-500 font-bold tracking-widest uppercase text-sm shadow-lg hover:shadow-green-500/20 transition-all"
                        >
                          <Save className="w-4 h-4" /> Save Service
                        </button>
                        <button
                          onClick={() => {
                            setEditingServiceId(null);
                            setEditServiceForm(null);
                            setSaveStatus("idle");
                          }}
                          className="px-6 py-3 text-gray-400 hover:text-white font-bold tracking-widest uppercase text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-xl font-bold">{service.title?.en ?? ""}</h3>
                        <p className="text-gray-400 text-sm truncate max-w-md">
                          {service.description?.en ?? ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleEditService(service)}
                          className="border border-white/20 px-6 py-2 rounded-full hover:bg-white hover:text-black transition-colors text-sm uppercase font-bold tracking-wider"
                        >
                          Edit
                        </button>
                        <DeleteButton onDelete={() => handleDeleteService(service.id)} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* SITE CONTENT SECTION */}
          <div>
            <h2 className="text-2xl font-mono text-gray-500 uppercase tracking-widest border-b border-white/10 pb-4 mb-8">
              Site Content
            </h2>

            <div className="grid gap-8">
              {/* HERO SECTION CARD */}
              <div className="bg-surface p-6 rounded-xl border border-white/10">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold">Hero Section</h3>
                  {!editingSection && (
                    <button
                      onClick={() => handleEditContent("hero")}
                      className="border border-white/20 px-6 py-2 rounded-full hover:bg-white hover:text-black transition-colors text-sm uppercase font-bold tracking-wider"
                    >
                      Edit
                    </button>
                  )}
                </div>

                {editingSection === "hero" && editContentForm ? (
                  <div className="space-y-6">
                    {["role", "title", "subtitle", "cta"].map((field) => (
                      <div key={field} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-blue-300 mb-1 block uppercase tracking-wider">
                            {field} (PT)
                          </label>
                          <input
                            value={editContentForm?.[field]?.["pt-BR"] ?? ""}
                            onChange={(e) =>
                              handleContentDeepChange(field, "pt-BR", e.target.value)
                            }
                            className="w-full bg-background border border-white/20 p-3 rounded text-white focus:border-blue-500 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-green-300 mb-1 block uppercase tracking-wider">
                            {field} (EN)
                          </label>
                          <input
                            value={editContentForm?.[field]?.en ?? ""}
                            onChange={(e) => handleContentDeepChange(field, "en", e.target.value)}
                            className="w-full bg-background border border-white/20 p-3 rounded text-white focus:border-blue-500 transition-colors"
                          />
                        </div>
                      </div>
                    ))}

                    <div className="flex gap-4 mt-6 pt-6 border-t border-white/10">
                      <button
                        onClick={handleSaveContent}
                        className="flex items-center gap-2 bg-green-600 px-6 py-3 rounded-full text-white hover:bg-green-500 font-bold tracking-widest uppercase text-sm shadow-lg hover:shadow-green-500/20 transition-all"
                      >
                        <Save className="w-4 h-4" /> Save Hero
                      </button>
                      <button
                        onClick={() => {
                          setEditingSection(null);
                          setEditContentForm(null);
                          setSaveStatus("idle");
                        }}
                        className="px-6 py-3 text-gray-400 hover:text-white font-bold tracking-widest uppercase text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-400 space-y-2">
                    <p>
                      <strong>Title:</strong> {heroTitle.en}
                    </p>
                    <p>
                      <strong>Subtitle:</strong> {heroSubtitle.en}
                    </p>
                  </div>
                )}
              </div>

              {/* ABOUT SECTION CARD */}
              <div className="bg-surface p-6 rounded-xl border border-white/10">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold">About Section</h3>
                  {!editingSection && (
                    <button
                      onClick={() => handleEditContent("about")}
                      className="border border-white/20 px-6 py-2 rounded-full hover:bg-white hover:text-black transition-colors text-sm uppercase font-bold tracking-wider"
                    >
                      Edit
                    </button>
                  )}
                </div>

                {editingSection === "about" && editContentForm ? (
                  <div className="space-y-6">
                    {["title", "skillsTitle"].map((field) => (
                      <div key={field} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-blue-300 mb-1 block uppercase tracking-wider">
                            {field} (PT)
                          </label>
                          <input
                            value={editContentForm?.[field]?.["pt-BR"] ?? ""}
                            onChange={(e) =>
                              handleContentDeepChange(field, "pt-BR", e.target.value)
                            }
                            className="w-full bg-background border border-white/20 p-3 rounded text-white focus:border-blue-500 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-green-300 mb-1 block uppercase tracking-wider">
                            {field} (EN)
                          </label>
                          <input
                            value={editContentForm?.[field]?.en ?? ""}
                            onChange={(e) => handleContentDeepChange(field, "en", e.target.value)}
                            className="w-full bg-background border border-white/20 p-3 rounded text-white focus:border-blue-500 transition-colors"
                          />
                        </div>
                      </div>
                    ))}

                    {["p1", "p2"].map((field) => (
                      <div key={field} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-blue-300 mb-1 block uppercase tracking-wider">
                            {field} (PT)
                          </label>
                          <textarea
                            value={editContentForm?.[field]?.["pt-BR"] ?? ""}
                            onChange={(e) =>
                              handleContentDeepChange(field, "pt-BR", e.target.value)
                            }
                            className="w-full bg-background border border-white/20 p-3 rounded text-white h-24 focus:border-blue-500 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-green-300 mb-1 block uppercase tracking-wider">
                            {field} (EN)
                          </label>
                          <textarea
                            value={editContentForm?.[field]?.en ?? ""}
                            onChange={(e) => handleContentDeepChange(field, "en", e.target.value)}
                            className="w-full bg-background border border-white/20 p-3 rounded text-white h-24 focus:border-blue-500 transition-colors"
                          />
                        </div>
                      </div>
                    ))}

                    <ImageUploader
                      label="Profile Image"
                      value={editContentForm?.profileImage ?? ""}
                      onChange={(url) => handleContentSimpleChange("profileImage", url)}
                    />

                    <div>
                      <label className="text-xs text-gray-500 mb-1 block uppercase tracking-wider">
                        Skills (Comma separated)
                      </label>
                      <input
                        value={(editContentForm?.skills ?? []).join(", ")}
                        onChange={(e) => handleContentArrayChange("skills", e.target.value)}
                        className="w-full bg-background border border-white/20 p-3 rounded text-white font-mono text-sm focus:border-blue-500 transition-colors"
                        placeholder="React, TypeScript, Three.js..."
                      />
                    </div>

                    <div className="flex gap-4 mt-6 pt-6 border-t border-white/10">
                      <button
                        onClick={handleSaveContent}
                        className="flex items-center gap-2 bg-green-600 px-6 py-3 rounded-full text-white hover:bg-green-500 font-bold tracking-widest uppercase text-sm shadow-lg hover:shadow-green-500/20 transition-all"
                      >
                        <Save className="w-4 h-4" /> Save About
                      </button>
                      <button
                        onClick={() => {
                          setEditingSection(null);
                          setEditContentForm(null);
                          setSaveStatus("idle");
                        }}
                        className="px-6 py-3 text-gray-400 hover:text-white font-bold tracking-widest uppercase text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-400 space-y-2">
                    <p>
                      <strong>Title:</strong> {aboutTitle.en}
                    </p>
                    <p>
                      <strong>Intro:</strong> {(aboutP1.en || "").substring(0, 50)}...
                    </p>
                    <p>
                      <strong>Skills:</strong> {aboutSkills.length}
                    </p>
                  </div>
                )}
              </div>

              {/* CONTACT SECTION CARD */}
              <div className="bg-surface p-6 rounded-xl border border-white/10">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold">Contact Section</h3>
                  {!editingSection && (
                    <button
                      onClick={() => handleEditContent("contact")}
                      className="border border-white/20 px-6 py-2 rounded-full hover:bg-white hover:text-black transition-colors text-sm uppercase font-bold tracking-wider"
                    >
                      Edit
                    </button>
                  )}
                </div>

                {editingSection === "contact" && editContentForm ? (
                  <div className="space-y-6">
                    {["title", "footerText"].map((field) => (
                      <div key={field} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-blue-300 mb-1 block uppercase tracking-wider">
                            {field} (PT)
                          </label>
                          <input
                            value={editContentForm?.[field]?.["pt-BR"] ?? ""}
                            onChange={(e) =>
                              handleContentDeepChange(field, "pt-BR", e.target.value)
                            }
                            className="w-full bg-background border border-white/20 p-3 rounded text-white focus:border-blue-500 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-green-300 mb-1 block uppercase tracking-wider">
                            {field} (EN)
                          </label>
                          <input
                            value={editContentForm?.[field]?.en ?? ""}
                            onChange={(e) => handleContentDeepChange(field, "en", e.target.value)}
                            className="w-full bg-background border border-white/20 p-3 rounded text-white focus:border-blue-500 transition-colors"
                          />
                        </div>
                      </div>
                    ))}

                    <div>
                      <label className="text-xs text-gray-500 mb-1 block uppercase tracking-wider">
                        Email
                      </label>
                      <input
                        value={editContentForm?.email ?? ""}
                        onChange={(e) => handleContentSimpleChange("email", e.target.value)}
                        className="w-full bg-background border border-white/20 p-3 rounded text-white focus:border-blue-500 transition-colors"
                      />
                    </div>

                    <div className="flex gap-4 mt-6 pt-6 border-t border-white/10">
                      <button
                        onClick={handleSaveContent}
                        className="flex items-center gap-2 bg-green-600 px-6 py-3 rounded-full text-white hover:bg-green-500 font-bold tracking-widest uppercase text-sm shadow-lg hover:shadow-green-500/20 transition-all"
                      >
                        <Save className="w-4 h-4" /> Save Contact
                      </button>
                      <button
                        onClick={() => {
                          setEditingSection(null);
                          setEditContentForm(null);
                          setSaveStatus("idle");
                        }}
                        className="px-6 py-3 text-gray-400 hover:text-white font-bold tracking-widest uppercase text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-400 space-y-2">
                    <p>
                      <strong>Title:</strong> {contactTitle.en}
                    </p>
                    <p>
                      <strong>Email:</strong> {contactEmail}
                    </p>
                    <p>
                      <strong>Footer:</strong> {contactFooter.en}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
