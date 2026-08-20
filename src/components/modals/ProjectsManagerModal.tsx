import React, { useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import {
  X,
  Plus,
  FolderOpen,
  Copy,
  Trash2,
  Check,
  Calendar,
  Layers,
  Search,
  ExternalLink,
  Edit3,
} from 'lucide-react';

export const ProjectsManagerModal: React.FC = () => {
  const {
    projects,
    project: activeProject,
    showProjectsModal,
    setShowProjectsModal,
    setShowNewProjectModal,
    openProject,
    duplicateProject,
    deleteProject,
    renameProject,
    showToast,
  } = useStudio();

  const [searchQuery, setSearchQuery] = useState('');
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  if (!showProjectsModal) return null;

  const filteredProjects = projects.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartRename = (id: string, currentTitle: string) => {
    setEditingProjectId(id);
    setEditingTitle(currentTitle);
  };

  const handleSaveRename = (id: string) => {
    if (editingTitle.trim()) {
      renameProject(id, editingTitle.trim());
    }
    setEditingProjectId(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none text-[#e4e4e7]">
      <div className="bg-[#09090b] border border-[#27272a] rounded-xl max-w-3xl w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#27272a] shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-[#18181b] border border-[#27272a] flex items-center justify-center text-indigo-400">
              <FolderOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white uppercase tracking-widest font-mono">
                Project Library & Workspace
              </h2>
              <span className="text-[10px] text-zinc-500 font-mono">
                {projects.length} {projects.length === 1 ? 'project' : 'projects'} saved with isolated layer stacks
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setShowProjectsModal(false);
                setShowNewProjectModal(true);
              }}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Project</span>
            </button>
            <button
              onClick={() => setShowProjectsModal(false)}
              className="p-1.5 hover:bg-[#18181b] rounded text-zinc-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-2 bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 shrink-0 focus-within:border-indigo-500">
          <Search className="w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search projects by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-xs text-zinc-200 outline-none w-full placeholder:text-zinc-600"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-zinc-500 hover:text-zinc-300 text-xs">
              Clear
            </button>
          )}
        </div>

        {/* Projects Grid */}
        <div className="flex-1 overflow-y-auto pr-1">
          {filteredProjects.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 text-xs space-y-2">
              <p>No projects found matching your search.</p>
              <button
                onClick={() => {
                  setShowProjectsModal(false);
                  setShowNewProjectModal(true);
                }}
                className="text-indigo-400 hover:underline font-semibold"
              >
                Create a new project
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              {/* New Project Quick Card */}
              <div
                onClick={() => {
                  setShowProjectsModal(false);
                  setShowNewProjectModal(true);
                }}
                className="group p-4 bg-[#121214] hover:bg-[#18181b] border border-dashed border-[#27272a] hover:border-indigo-500/50 rounded-xl flex flex-col items-center justify-center min-h-[190px] cursor-pointer transition text-center space-y-2"
              >
                <div className="w-10 h-10 rounded-full bg-indigo-950/50 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition">
                  <Plus className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-zinc-300 group-hover:text-white">Start New Project</span>
                <span className="text-[10px] text-zinc-500 font-mono">Custom size or import photo</span>
              </div>

              {filteredProjects.map((p) => {
                const isActive = p.id === activeProject.id;
                const previewImg = p.previewUrl || p.layers.find((l) => l.type === 'image')?.imageUrl;

                return (
                  <div
                    key={p.id}
                    className={`group bg-[#121214] border rounded-xl overflow-hidden flex flex-col justify-between transition ${
                      isActive
                        ? 'border-indigo-500 shadow-md shadow-indigo-950/30 ring-1 ring-indigo-500/30'
                        : 'border-[#27272a] hover:border-zinc-600'
                    }`}
                  >
                    {/* Thumbnail Preview Banner */}
                    <div
                      onClick={() => {
                        openProject(p.id);
                        setShowProjectsModal(false);
                      }}
                      className="h-28 bg-[#0a0a0b] relative overflow-hidden flex items-center justify-center cursor-pointer"
                    >
                      {previewImg ? (
                        <img
                          src={previewImg}
                          alt={p.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-zinc-600 gap-1">
                          <Layers className="w-6 h-6" />
                          <span className="text-[10px] font-mono">Solid Canvas</span>
                        </div>
                      )}

                      {/* Active project badge */}
                      {isActive && (
                        <div className="absolute top-2 left-2 px-2 py-0.5 bg-indigo-600 text-white rounded text-[9px] font-bold uppercase font-mono tracking-wider flex items-center gap-1 shadow-sm">
                          <Check className="w-3 h-3" />
                          <span>Active</span>
                        </div>
                      )}

                      {/* Layer count pill */}
                      <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 backdrop-blur-sm text-zinc-300 rounded text-[9px] font-mono flex items-center gap-1 border border-[#27272a]">
                        <Layers className="w-2.5 h-2.5 text-indigo-400" />
                        <span>{p.layers?.length || 1} layers</span>
                      </div>
                    </div>

                    {/* Project Details & Actions */}
                    <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                      <div>
                        {editingProjectId === p.id ? (
                          <div className="flex items-center gap-1 mb-1">
                            <input
                              type="text"
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveRename(p.id);
                                if (e.key === 'Escape') setEditingProjectId(null);
                              }}
                              className="bg-[#18181b] border border-indigo-500 rounded px-1.5 py-0.5 text-xs text-white outline-none w-full font-semibold"
                            />
                            <button
                              onClick={() => handleSaveRename(p.id)}
                              className="p-1 bg-indigo-600 text-white rounded text-[10px]"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between gap-1 mb-1">
                            <h3
                              onClick={() => {
                                openProject(p.id);
                                setShowProjectsModal(false);
                              }}
                              className="text-xs font-bold text-white hover:text-indigo-400 transition cursor-pointer truncate flex-1"
                              title={p.title}
                            >
                              {p.title}
                            </h3>
                            <button
                              onClick={() => handleStartRename(p.id, p.title)}
                              className="p-1 text-zinc-500 hover:text-zinc-300 transition cursor-pointer opacity-0 group-hover:opacity-100"
                              title="Rename project"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                          <span>
                            {p.width} × {p.height} px
                          </span>
                          <span>
                            {new Date(p.updatedAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Card Action Buttons */}
                      <div className="flex items-center justify-between pt-2 border-t border-[#27272a] mt-2">
                        <button
                          onClick={() => {
                            openProject(p.id);
                            setShowProjectsModal(false);
                          }}
                          className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                            isActive
                              ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50'
                              : 'bg-[#18181b] hover:bg-[#27272a] text-zinc-300 hover:text-white border border-[#27272a]'
                          }`}
                        >
                          <FolderOpen className="w-3 h-3 text-indigo-400" />
                          <span>{isActive ? 'Current' : 'Open'}</span>
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => duplicateProject(p.id)}
                            className="p-1.5 hover:bg-[#18181b] text-zinc-400 hover:text-white rounded border border-transparent hover:border-[#27272a] transition cursor-pointer"
                            title="Duplicate Project"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          {projects.length > 1 && (
                            <button
                              onClick={() => deleteProject(p.id)}
                              className="p-1.5 hover:bg-rose-950/40 text-zinc-500 hover:text-rose-400 rounded border border-transparent hover:border-rose-900/50 transition cursor-pointer"
                              title="Delete Project"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
