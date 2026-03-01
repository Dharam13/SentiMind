import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { DashboardHeader } from "./DashboardHeader";

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    return (
        <div className="h-screen w-screen overflow-hidden bg-senti-dark text-senti-text flex">
            <Sidebar
                isOpen={isSidebarOpen}
                onToggle={() => setIsSidebarOpen((prev) => !prev)}
            />

            <div className="flex flex-1 flex-col h-screen overflow-hidden transition-all duration-300 ease-out">
                <DashboardHeader />

                <main className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6 relative scroll-smooth">
                    <div className="max-w-7xl mx-auto w-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
