interface LogoProps {
  size?: number;
  className?: string;
}

// Logo resmi Athlete Guardian. Taruh file gambarnya di public/logo.png
// (sudah disiapkan) supaya path ini langsung jalan.
export default function Logo({ size = 28, className = "" }: LogoProps) {
  return (
    <img
      src="/logo.png"
      alt="Athlete Guardian"
      width={size}
      height={size}
      className={`shrink-0 rounded-full object-contain ${className}`}
    />
  );
}