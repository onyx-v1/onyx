interface Props {
  displayName: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
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
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';
}

const SIZES = {
  xs: 'w-5 h-5 text-[9px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
};

export function Avatar({ displayName, size = 'md' }: Props) {
  return (
    <div
      className={`${SIZES[size]} rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0 select-none`}
      style={{ backgroundColor: getColor(displayName) }}
      title={displayName}
    >
      {getInitials(displayName)}
    </div>
  );
}
