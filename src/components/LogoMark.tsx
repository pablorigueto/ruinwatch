import logo from "@/assets/ruinwatch-logo.webp";

interface LogoMarkProps {
  size?: number;
  className?: string;
  withGlow?: boolean;
}

const LogoMark = ({ size = 48, className = "", withGlow = true }: LogoMarkProps) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {withGlow && (
        <div
          aria-hidden="true"
          className="absolute inset-0 rounded-full animate-ember-flicker"
 
        />
      )}
      <img
        src={logo}
        alt="Ruinwatch tower with burning ember"
        className="relative z-10 select-none object-contain max-w-full max-h-full"
        draggable={false}
      />
    </div>
  );
};

export default LogoMark;
