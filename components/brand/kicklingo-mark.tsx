import { KICKLINGO_MARK_SVG } from "@/lib/brand/mark";
import { cn } from "@/lib/utils";

type KickLingoMarkProps = {
  className?: string;
};

/** Decorative KickLingo symbol mark. Pair it with the visible "KickLingo" text. */
export function KickLingoMark({ className }: KickLingoMarkProps) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-block shrink-0", className)}
      dangerouslySetInnerHTML={{ __html: KICKLINGO_MARK_SVG }}
    />
  );
}
