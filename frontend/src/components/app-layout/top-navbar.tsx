import { useState } from 'react';
import { NavLink, useLocation } from 'react-router';
import { motion } from 'framer-motion';
import { Shield, Sun, Moon, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/providers/theme-provider';

const navLinks = [
  { to: '/', label: 'Relatar' },
  { to: '/result', label: 'Classificação' },
  { to: '/dashboard', label: 'Dashboard' },
];

export function TopNavbar() {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);

  return (
    <header className="bg-surface/95 backdrop-blur-md border-b border-outline-variant w-full sticky top-0 z-50 transition-colors duration-300">
      <div className="flex justify-between items-center h-16 px-6 md:px-container-padding w-full max-w-[1440px] mx-auto">
        {/* Brand */}
        <NavLink to="/" className="flex items-center gap-2.5 group cursor-pointer">
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center shadow-xs group-hover:bg-surface-tint transition-colors">
            <Shield className="text-on-primary" size={18} />
          </div>
          <span className="text-body-md font-bold text-on-surface tracking-tight hidden sm:inline">
            SafeGuard
          </span>
        </NavLink>

        {/* Desktop Navigation with Animated Active Line & Hover Pill */}
        <nav
          className="hidden md:flex items-center gap-2"
          onMouseLeave={() => setHoveredPath(null)}
        >
          {navLinks.map((link) => {
            const isActive =
              link.to === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(link.to);

            const isHovered = hoveredPath === link.to;

            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                onMouseEnter={() => setHoveredPath(link.to)}
                className="relative px-4 py-2 text-label-md font-semibold cursor-pointer transition-colors duration-200"
              >
                {/* Hover Backdrop Pill */}
                {isHovered && !isActive && (
                  <motion.div
                    layoutId="nav-hover-pill"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="absolute inset-0 bg-primary/10 rounded-lg -z-10"
                  />
                )}

                {/* Link Label */}
                <span
                  className={cn(
                    'transition-colors duration-200',
                    isActive ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-primary',
                  )}
                >
                  {link.label}
                </span>

                {/* Animated Gliding Active Underline */}
                {isActive && (
                  <motion.div
                    layoutId="nav-active-line"
                    className="absolute bottom-0 left-3 right-3 h-[2.5px] bg-primary rounded-full"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </NavLink>
            );
          })}

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="ml-4 text-on-surface-variant hover:text-primary transition-colors p-2 rounded-lg hover:bg-surface-container cursor-pointer"
            aria-label="Alternar tema"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </nav>

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={toggleTheme}
            className="text-on-surface-variant hover:text-primary transition-colors p-1.5 cursor-pointer"
            aria-label="Alternar tema"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            className="text-on-surface-variant hover:text-primary transition-colors p-1.5 cursor-pointer"
            aria-label="Menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <nav className="md:hidden border-t border-outline-variant bg-surface animate-fade-in">
          <div className="flex flex-col px-6 py-4 gap-2">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'text-label-md py-2 px-3 rounded-md transition-colors cursor-pointer',
                    isActive
                      ? 'text-primary bg-primary-fixed font-semibold'
                      : 'text-on-surface-variant hover:text-primary hover:bg-surface-container',
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
