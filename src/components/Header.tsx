import { Logo } from "./Logo";
import { Button } from "./ui/button";

export const Header = () => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="container mx-auto px-6 py-4">
        <nav className="flex items-center justify-between">
          <Logo size="sm" />
          
          <div className="hidden md:flex items-center gap-8">
            <button 
              onClick={() => scrollToSection("sobre")}
              className="text-sm tracking-widest text-muted-foreground hover:text-foreground transition-colors"
            >
              SOBRE
            </button>
            <button 
              onClick={() => scrollToSection("atuacao")}
              className="text-sm tracking-widest text-muted-foreground hover:text-foreground transition-colors"
            >
              ATUAÇÃO
            </button>
            <button 
              onClick={() => scrollToSection("contato")}
              className="text-sm tracking-widest text-muted-foreground hover:text-foreground transition-colors"
            >
              CONTATO
            </button>
          </div>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => scrollToSection("contato")}
            className="hidden md:inline-flex"
          >
            Agende uma Consulta
          </Button>
        </nav>
      </div>
    </header>
  );
};
