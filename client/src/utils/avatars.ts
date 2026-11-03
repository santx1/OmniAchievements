// Neutral minimalist avatars with plain colored background and a darker person icon in the same color

export interface NeutralAvatar {
  id: string;
  name: string;
  bg: string;
  icon: string;
  dataUri: string;
}

function createAvatarSvg(bg: string, icon: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <rect width="100" height="100" rx="30" fill="${bg}"/>
    <circle cx="50" cy="36" r="15" fill="${icon}"/>
    <path d="M22 84 C22 66 34 58 50 58 C66 58 78 66 78 84 C78 88 74 90 70 90 L30 90 C26 90 22 88 22 84 Z" fill="${icon}"/>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const NEUTRAL_AVATARS: NeutralAvatar[] = [
  {
    id: 'neutral-slate',
    name: 'Slate Steel',
    bg: '#cbd5e1', // Slate 300
    icon: '#475569', // Slate 600 (same hue, darker)
    dataUri: createAvatarSvg('#cbd5e1', '#475569')
  },
  {
    id: 'neutral-blue',
    name: 'Ocean Blue',
    bg: '#bfdbfe', // Blue 200
    icon: '#1d4ed8', // Blue 700
    dataUri: createAvatarSvg('#bfdbfe', '#1d4ed8')
  },
  {
    id: 'neutral-sage',
    name: 'Sage Forest',
    bg: '#bbf7d0', // Green 200
    icon: '#15803d', // Green 700
    dataUri: createAvatarSvg('#bbf7d0', '#15803d')
  },
  {
    id: 'neutral-amber',
    name: 'Warm Amber',
    bg: '#fde68a', // Amber 200
    icon: '#b45309', // Amber 700
    dataUri: createAvatarSvg('#fde68a', '#b45309')
  },
  {
    id: 'neutral-gray',
    name: 'Neutral Taupe',
    bg: '#e5e7eb', // Gray 200
    icon: '#374151', // Gray 700
    dataUri: createAvatarSvg('#e5e7eb', '#374151')
  },
  {
    id: 'neutral-rose',
    name: 'Dusty Rose',
    bg: '#fecdd3', // Rose 200
    icon: '#be123c', // Rose 700
    dataUri: createAvatarSvg('#fecdd3', '#be123c')
  },
  {
    id: 'neutral-teal',
    name: 'Soft Teal',
    bg: '#99f6e4', // Teal 200
    icon: '#0f766e', // Teal 700
    dataUri: createAvatarSvg('#99f6e4', '#0f766e')
  },
  {
    id: 'neutral-violet',
    name: 'Muted Violet',
    bg: '#ddd6fe', // Violet 200
    icon: '#6d28d9', // Violet 700
    dataUri: createAvatarSvg('#ddd6fe', '#6d28d9')
  }
];

export const DEFAULT_AVATAR = NEUTRAL_AVATARS[0].dataUri;

export function getAvatarUrl(avatar: string | undefined): string {
  if (!avatar || avatar.includes('unsplash.com')) {
    return DEFAULT_AVATAR;
  }
  const match = NEUTRAL_AVATARS.find((a) => a.id === avatar);
  if (match) return match.dataUri;
  return avatar;
}
