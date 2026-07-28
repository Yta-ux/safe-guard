import { Shield } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-surface/90 border-t border-outline-variant/60 w-full py-4 px-6 md:px-container-padding mt-auto transition-colors duration-300">
      <div className="w-full max-w-[1440px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-on-surface-variant font-medium">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 bg-primary/15 rounded flex items-center justify-center text-primary shrink-0">
            <Shield size={12} />
          </div>
          <span className="font-bold text-on-surface tracking-tight">SafeGuard</span>
          <span className="text-outline/60">•</span>
          <span className="text-outline">Sahara Risk Safety System</span>
        </div>

        {/* Links */}
        <nav className="flex flex-wrap items-center justify-center gap-5">
          <a
            href="#"
            className="hover:text-primary transition-colors duration-200 cursor-pointer"
          >
            Normas Regulamentadoras
          </a>
          <a
            href="#"
            className="hover:text-primary transition-colors duration-200 cursor-pointer"
          >
            Privacidade
          </a>
          <a
            href="#"
            className="hover:text-primary transition-colors duration-200 cursor-pointer"
          >
            Suporte Técnico
          </a>
        </nav>

        {/* Copyright */}
        <div className="text-outline/80">
          © {new Date().getFullYear()} SafeGuard. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
