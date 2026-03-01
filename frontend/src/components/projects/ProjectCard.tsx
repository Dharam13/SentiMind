import { useState } from "react";
import { Project } from "../../api/projectApi";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

interface ProjectCardProps {
    project: Project;
    onToggleStatus: (project: Project) => void;
    onRunCollector: (project: Project) => void;
    isRunning?: boolean;
}

export function ProjectCard({
    project,
    onToggleStatus,
    onRunCollector,
    isRunning = false,
}: ProjectCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const navigate = useNavigate();

    const isActive = project.status === "ACTIVE";

    return (
        <div
            className={`rounded-2xl border transition-all duration-200 overflow-hidden ${isExpanded
                    ? "border-senti-purple bg-senti-card/80 shadow-[0_0_15px_rgba(168,85,247,0.15)] scale-[1.01] z-10"
                    : "border-senti-border bg-senti-card/50 hover:bg-senti-card hover:border-senti-purple/50"
                }`}
        >
            {/* Card Header (Always Visible) */}
            <div
                className="p-4 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                onClick={() => setIsExpanded((prev) => !prev)}
            >
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-semibold text-senti-text leading-tight">
                            {project.primaryKeyword || "Untitled Project"}
                        </h3>
                        <span
                            className={`flex-shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${isActive
                                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                    : "bg-gray-500/15 text-gray-400 border border-gray-500/30"
                                }`}
                        >
                            {project.status}
                        </span>
                    </div>

                    <p className="text-sm text-senti-muted line-clamp-1">
                        {project.domain || "No domain specified"}
                        {project.description && <span className="mx-2 opacity-50">•</span>}
                        {project.description && <span className="italic">{project.description}</span>}
                    </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <AnimatePresence>
                        {isExpanded && (
                            <motion.div
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: "auto" }}
                                exit={{ opacity: 0, width: 0 }}
                                className="flex items-center gap-2 overflow-hidden"
                            >
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onToggleStatus(project);
                                    }}
                                    className="inline-flex items-center rounded-lg border border-senti-border px-3 py-1.5 text-xs font-medium text-senti-text hover:border-senti-purple hover:text-senti-purple bg-senti-dark/50 hover:bg-senti-dark transition-colors whitespace-nowrap"
                                >
                                    Set {isActive ? "Inactive" : "Active"}
                                </button>
                                <button
                                    type="button"
                                    disabled={isRunning}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRunCollector(project);
                                    }}
                                    className="inline-flex items-center rounded-lg bg-gradient-to-r from-senti-purple to-senti-blue px-3 py-1.5 text-xs font-semibold text-white shadow hover:shadow-purple-500/25 disabled:opacity-60 transition-all whitespace-nowrap"
                                >
                                    {isRunning ? "Running…" : "Run"}
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/projects/${project.id}`);
                                    }}
                                    className="inline-flex items-center rounded-lg border border-senti-border px-3 py-1.5 text-xs font-medium text-senti-text hover:border-senti-blue hover:text-senti-blue bg-senti-dark/50 hover:bg-senti-dark transition-colors whitespace-nowrap"
                                >
                                    Dashboard →
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button
                        className="ml-2 p-1 text-senti-muted hover:text-senti-text transition-all duration-300"
                        aria-hidden="true"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="transition-transform duration-300"
                            style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                        >
                            <path d="m9 18 6-6-6-6" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Expanded Content Area */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                        className="overflow-hidden"
                    >
                        <div className="p-4 pt-0 border-t border-senti-border/50 bg-senti-dark/20 mt-2">
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 pt-4">
                                <div className="col-span-1 lg:col-span-2 space-y-1">
                                    <div className="text-xs font-semibold uppercase tracking-wide text-senti-muted">
                                        Brand Description
                                    </div>
                                    <div className="rounded-xl border border-senti-border/60 bg-senti-dark/50 p-3 text-sm text-senti-text min-h-[60px]">
                                        {project.description || (
                                            <span className="text-senti-muted italic">No description provided.</span>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <div className="text-xs font-semibold uppercase tracking-wide text-senti-muted mb-1">
                                            Primary Keyword
                                        </div>
                                        <div className="rounded-lg border border-senti-border/60 bg-senti-dark/50 py-2 px-3 text-sm font-medium text-senti-text">
                                            {project.primaryKeyword}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs font-semibold uppercase tracking-wide text-senti-muted mb-1">
                                            Domain / Sector
                                        </div>
                                        <div className="rounded-lg border border-senti-border/60 bg-senti-dark/50 py-2 px-3 text-sm font-medium text-senti-text">
                                            {project.domain || "N/A"}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
