export type AvatarRole = 'p1' | 'p2';

interface AvatarProps {
  name: string;
  role: AvatarRole;
  size?: number;
  className?: string;
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0]?.[0] ?? '';
  const second = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : (parts[0]?.[1] ?? '');
  return (first + second).toUpperCase();
}

/** Initials in the role tint. Role follows primary/partner, never gender. */
export function Avatar({ name, role, size = 36, className = '' }: AvatarProps) {
  const tint = role === 'p1' ? 'bg-p1-tint text-p1-ink' : 'bg-p2-tint text-p2-ink';
  return (
    <span
      aria-hidden
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold tracking-wide ${tint} ${className}`}
    >
      {initialsOf(name)}
    </span>
  );
}
