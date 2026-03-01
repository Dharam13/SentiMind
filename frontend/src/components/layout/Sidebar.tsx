import { Link, useLocation } from "react-router-dom";
import { cn } from "../../utils/helpers";

interface SidebarProps extends React.HTMLAttributes<HTMLElement> {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ className, isOpen, onToggle, ...props }: SidebarProps) {
  const location = useLocation();

  const navItems = [
    { label: "Projects", icon: "#", href: "/projects" },
    { label: "Settings", icon: "⚙", href: "/settings", disabled: true },
  ];

  return (
    <aside
      className={cn(
        "flex flex-col flex-shrink-0 border-r border-senti-border bg-senti-card/40 backdrop-blur z-40 relative transition-all duration-300 ease-out",
        isOpen ? "w-64" : "w-20",
        className
      )}
      style={{ transform: 'translateZ(0)' }}
      {...props}
    >
      <button
        onClick={onToggle}
        className="flex h-16 items-center border-b border-senti-border cursor-pointer hover:bg-senti-card/60 transition-colors group w-full"
        title={isOpen ? "Collapse Sidebar" : "Expand Sidebar"}
      >
        <div className={cn(
          "flex items-center flex-1",
          isOpen ? "px-6" : "px-0 justify-center"
        )}>
          <span className={cn(
            "bg-gradient-to-r from-senti-purple to-senti-blue bg-clip-text font-semibold text-transparent transition-all duration-300",
            isOpen ? "text-lg block" : "text-sm",
            !isOpen && "hidden"
          )}>
            Senti
          </span>
          <span className={cn(
            "bg-gradient-to-r from-senti-purple to-senti-blue bg-clip-text font-semibold text-transparent transition-all duration-300 text-lg",
            !isOpen ? "opacity-100" : "opacity-0 hidden"
          )}>
            S
          </span>
          <span className={cn(
            "bg-gradient-to-r from-senti-purple to-senti-blue bg-clip-text font-semibold text-transparent transition-all duration-300",
            isOpen ? "text-lg block" : "hidden"
          )}>
            mind
          </span>
        </div>
        <div className={cn(
          "flex items-center justify-center text-senti-muted group-hover:text-senti-text transition-all duration-300",
          isOpen ? "pr-4" : "hidden"
        )}>
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
            style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </div>
      </button>

      <nav className="flex-1 space-y-2 px-3 py-4 text-sm mt-2 overflow-hidden">
        <div className={cn(
          "px-2 text-xs font-semibold uppercase tracking-wide text-senti-muted transition-all duration-300 overflow-hidden",
          isOpen ? "opacity-100" : "opacity-0 h-0 w-0 mb-0 pointer-events-none"
        )}>
          Menu
        </div>

        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.href);
          return (
            <Link
              key={item.label}
              to={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl py-2 transition-all duration-200",
                isOpen ? "px-3" : "px-0 justify-center",
                isActive
                  ? "bg-senti-purple/15 text-senti-purple font-medium"
                  : "text-senti-muted hover:bg-senti-card/60 hover:text-senti-text",
                item.disabled && "opacity-50 pointer-events-none"
              )}
              title={item.label} // Tooltip when collapsed
            >
              <span
                className={cn(
                  "inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-colors",
                  isActive ? "bg-senti-purple/20" : "bg-senti-dark/50"
                )}
              >
                {item.icon}
              </span>
              <span className={cn(
                "transition-all duration-300 whitespace-nowrap overflow-hidden",
                isOpen ? "opacity-100 w-auto" : "opacity-0 w-0 hidden"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>


    </aside>
  );
}
