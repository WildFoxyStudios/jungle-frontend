export const REACTION_TYPES = {
  like: { emoji: '👍', label: 'Me gusta' },
  love: { emoji: '❤️', label: 'Me encanta' },
  haha: { emoji: '😂', label: 'Me divierte' },
  wow: { emoji: '😮', label: 'Me asombra' },
  sad: { emoji: '😢', label: 'Me entristece' },
  angry: { emoji: '😠', label: 'Me enoja' },
  care: { emoji: '🤗', label: 'Me importa' },
} as const;

export type ReactionType = keyof typeof REACTION_TYPES;

export const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Público', icon: '🌍' },
  { value: 'friends', label: 'Amigos', icon: '👥' },
  { value: 'only_me', label: 'Solo yo', icon: '🔒' },
  { value: 'custom', label: 'Personalizado', icon: '⚙️' },
] as const;

export const FEELINGS = [
  'feliz', 'bendecido', 'amado', 'emocionado', 'agradecido',
  'nostálgico', 'motivado', 'orgulloso', 'relajado', 'reflexivo',
  'triste', 'frustrado', 'enojado', 'confundido', 'ansioso',
  'cansado', 'enfermo', 'preocupado', 'solo', 'aburrido',
];

export const ACTIVITIES = [
  'celebrando', 'comiendo', 'bebiendo', 'cocinando', 'viajando a',
  'viendo', 'escuchando', 'leyendo', 'jugando', 'haciendo ejercicio',
  'trabajando en', 'estudiando', 'comprando', 'visitando', 'asistiendo a',
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
