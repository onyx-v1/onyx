interface Props {
  displayName: string;
  avatarUrl?:  string | null;
  size?:       'xs' | 'sm' | 'md' | 'lg';
  onClick?:    () => void;
}

const PALETTE = [
  '#8b7cf8', '#6366f1', '#7c3aed', '#2563eb',
  '#0891b2', '#059669', '#d97706', '#dc2626',
  '#db2777', '#9333ea',
];

function getColor(name: string) {
  const code = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return PALETTE[code % PALETTE.length];
}

function getInitials(name: string) {
  return name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase() || '?';
}

const SIZE_PX: Record<string, number> = { xs: 20, sm: 32, md: 40, lg: 56 };
const SIZES = {
  xs: 'w-5 h-5 text-[9px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
};

export function Avatar({ displayName, avatarUrl, size = 'md', onClick }: Props) {
  const px = SIZE_PX[size];
  const common: React.CSSProperties = {
    width: px, height: px, borderRadius: '50%',
    flexShrink: 0, cursor: onClick ? 'pointer' : undefined,
    overflow: 'hidden',
  };

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={displayName}
        title={displayName}
        onClick={onClick}
        style={{ ...common, objectFit: 'cover', display: 'block' }}
      />
    );
  }

  return (
    <div
      className={`${SIZES[size]} rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0 select-none`}
      style={{ backgroundColor: getColor(displayName), cursor: onClick ? 'pointer' : undefined }}
      title={displayName}
      onClick={onClick}
    >
      {getInitials(displayName)}
    </div>
  );
}
