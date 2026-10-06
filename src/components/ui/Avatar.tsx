
export interface AvatarProps {
  name: string;
  emoji?: string;
  role?: 'person_1' | 'person_2' | 'neutral';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Avatar({
  name,
  emoji,
  role = 'neutral',
  size = 'md',
  className = '',
}: AvatarProps) {
  let sizeClasses = 'w-10 h-10 text-base';
  if (size === 'sm') sizeClasses = 'w-8 h-8 text-xs';
  if (size === 'lg') sizeClasses = 'w-14 h-14 text-2xl';
  if (size === 'xl') sizeClasses = 'w-20 h-20 text-4xl';

  let borderClasses = 'border-2 border-slate-200 dark:border-slate-700';
  if (role === 'person_1') {
    borderClasses = 'border-2 border-sky-400 dark:border-sky-500 shadow-sm shadow-sky-500/20';
  } else if (role === 'person_2') {
    borderClasses = 'border-2 border-rose-400 dark:border-rose-500 shadow-sm shadow-rose-500/20';
  }

  const initial = name.trim().charAt(0).toUpperCase() || 'P';

  return (
    <div
      className={`rounded-2xl flex items-center justify-center font-bold bg-white dark:bg-slate-800 text-slate-800 dark:text-white shrink-0 select-none ${sizeClasses} ${borderClasses} ${className}`}
    >
      {emoji ? <span>{emoji}</span> : <span>{initial}</span>}
    </div>
  );
}
