import { Logo } from "./Logo";

export const Footer = () => {
  return (
    <footer className="py-12 bg-sage">
      <div className="container mx-auto px-6">
        <div className="flex flex-col items-center gap-6">
          <Logo size="sm" variant="light" />
          
          <div className="w-12 h-px bg-sage-foreground/20" />
          
          <p className="text-sage-foreground/60 text-xs tracking-widest text-center">
            OAB/SP 000.000
          </p>
          
          <p className="text-sage-foreground/40 text-xs text-center">
            © {new Date().getFullYear()} Ana Paula Righeto Advocacia. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};
