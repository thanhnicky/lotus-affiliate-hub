/**
 * Brand mark for Lotus Paint.
 * Uses the official logo image from /public/logo-lotus.jpg.
 * The `square` prop renders a compact square-ish crop for tight spaces
 * (sidebar icon, mobile header); otherwise the full landscape logo is shown.
 */
export function LotusMark({ className, square = false }: { className?: string; square?: boolean }) {
  if (square) {
    return (
      <img
        src="/logo-lotus.jpg"
        alt="Lotus Paint"
        className={className}
        style={{ objectFit: "cover", objectPosition: "left center", borderRadius: "0.25rem" }}
      />
    );
  }
  return <img src="/logo-lotus.jpg" alt="Lotus Paint" className={className} />;
}
