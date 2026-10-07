/**
 * Thumbnail figure that opens its image full-size in a centered lightbox.
 * Click thumbnail (or its zoom indicator) -> dialog with the original image
 * scaled to fit the viewport. Click outside / Esc / X to close.
 *
 * Used across the artisan/cosmetics pages where every screenshot deserves a
 * proper look without leaving the page.
 */
import { ZoomIn } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Props {
  src: string;
  alt: string;
  caption?: string;
  className?: string;
}

const ZoomableImage = ({ src, alt, caption, className = "" }: Props) => (
  <Dialog>
    <DialogTrigger asChild>
      <figure
        className={`bg-night border border-stone overflow-hidden cursor-zoom-in group focus:outline-none focus-visible:ring-2 focus-visible:ring-ember ${className}`}
      >
        <div className="relative">
          <img
            src={src}
            alt={alt}
            className="w-full h-auto block transition-opacity group-hover:opacity-80"
            loading="lazy"
            draggable={false}
          />
          <span
            aria-hidden
            className="absolute top-2 right-2 bg-background/70 border border-stone/60 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ZoomIn className="w-3.5 h-3.5 text-ember" strokeWidth={1.5} />
          </span>
        </div>
        {caption && (
          <figcaption className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground px-2 py-1 border-t border-stone/60 bg-background/40 text-center">
            {caption}
          </figcaption>
        )}
      </figure>
    </DialogTrigger>
    <DialogContent className="max-w-[min(95vw,1400px)] w-auto p-0 bg-transparent border-none shadow-none flex items-center justify-center">
      <DialogTitle className="sr-only">{alt}</DialogTitle>
      <img
        src={src}
        alt={alt}
        className="max-w-full max-h-[90vh] w-auto h-auto block border border-stone bg-night"
        draggable={false}
      />
    </DialogContent>
  </Dialog>
);

export default ZoomableImage;
