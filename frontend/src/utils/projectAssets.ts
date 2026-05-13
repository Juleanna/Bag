/**
 * Спільні палітра кольорів та набір іконок для проєктів.
 * Використовується у NewProject і EditProject (і де ще треба показати/обрати).
 */
import { Ic } from '../icons/Ic'

export const PROJECT_COLORS: string[] = [
  // Базова палітра (8)
  '#5E6AD2', // фіолетово-синій (default)
  '#0EA5E9', // блакитний
  '#10B981', // зелений
  '#D97757', // теракотовий
  '#9665C9', // бузковий
  '#E04B43', // червоний
  '#D4951F', // золотий
  '#1F1E1A', // чорний
  // Розширення (+8)
  '#EC4899', // рожевий
  '#14B8A6', // бірюзовий
  '#F97316', // помаранчевий
  '#8B5CF6', // насичений фіолетовий
  '#06B6D4', // циан
  '#84CC16', // лайм
  '#6B7280', // сірий
  '#DC2626', // насичений червоний
]

export const PROJECT_ICONS: Array<keyof typeof Ic> = [
  // Базовий набір (8)
  'Layout',
  'Mobile',
  'Repo',
  'Globe',
  'Beaker',
  'Bug',
  'Spark',
  'Tag',
  // Розширення (+12)
  'Folder',
  'Chart',
  'Branch',
  'Github',
  'Slack',
  'Inbox',
  'Bell',
  'Shield',
  'Key',
  'Activity',
  'Lightning',
  'Star',
]
