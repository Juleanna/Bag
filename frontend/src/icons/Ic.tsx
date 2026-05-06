/**
 * Lucide-style іконки SVG (stroke 1.6, currentColor).
 * Перенесено з proto/src/icons.jsx у TypeScript з повними типами.
 */
import type { ReactNode, SVGProps } from 'react'

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'children'> {
  sz?: number
}

const make = (children: ReactNode) => {
  const Icon = ({ sz = 16, ...rest }: IconProps) => (
    <svg
      width={sz}
      height={sz}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {children}
    </svg>
  )
  return Icon
}

export const Ic = {
  Search: make(
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  Bug: make(
    <>
      <path d="M9 4 7.5 2M15 4l1.5-2" />
      <rect x="6" y="6" width="12" height="13" rx="6" />
      <path d="M12 6v13M3 12h3M18 12h3M4 8l2.5 1M20 8l-2.5 1M4 16l2.5-1M20 16l-2.5-1" />
    </>
  ),
  Beaker: make(
    <>
      <path d="M9 3h6M10 3v6L4.5 18A2 2 0 0 0 6.3 21h11.4A2 2 0 0 0 19.5 18L14 9V3" />
      <path d="M7 14h10" />
    </>
  ),
  Play: make(<path d="M6 4 20 12 6 20Z" />),
  Layout: make(
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 10h18M10 3v18" />
    </>
  ),
  Chart: make(
    <>
      <path d="M3 21h18" />
      <path d="M6 17V8M11 17V5M16 17v-6M21 17v-3" />
    </>
  ),
  Folder: make(
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
  ),
  Settings: make(
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </>
  ),
  Plus: make(<path d="M12 5v14M5 12h14" />),
  Filter: make(<path d="M3 5h18l-7 9v6l-4-2v-4z" />),
  Chev: make(<path d="m9 6 6 6-6 6" />),
  ChevDown: make(<path d="m6 9 6 6 6-6" />),
  ChevUp: make(<path d="m6 15 6-6 6 6" />),
  Check: make(<path d="m5 12 5 5 9-11" />),
  X: make(<path d="M6 6l12 12M18 6 6 18" />),
  More: make(
    <>
      <circle cx="5" cy="12" r="1.4" fill="currentColor" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" />
      <circle cx="19" cy="12" r="1.4" fill="currentColor" />
    </>
  ),
  Paperclip: make(
    <path d="M21 11.5 12.5 20a5 5 0 0 1-7-7L14 4.5a3.5 3.5 0 0 1 5 5L10.5 18a2 2 0 0 1-3-3l8-8" />
  ),
  Comment: make(<path d="M21 12a8 8 0 0 1-11.5 7.2L3 21l1.8-6.5A8 8 0 1 1 21 12z" />),
  Clock: make(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  Calendar: make(
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 11h18" />
    </>
  ),
  Tag: make(
    <>
      <path d="M20 12 12 20l-9-9V3h8z" />
      <circle cx="7" cy="7" r="1.4" fill="currentColor" />
    </>
  ),
  User: make(
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  Users: make(
    <>
      <circle cx="9" cy="8" r="4" />
      <circle cx="17" cy="9" r="3" />
      <path d="M2 21a7 7 0 0 1 14 0M16 14a6 6 0 0 1 6 6" />
    </>
  ),
  Inbox: make(
    <>
      <path d="M3 12h5l2 3h4l2-3h5" />
      <path d="M5 6h14l2 6v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6z" />
    </>
  ),
  Branch: make(
    <>
      <circle cx="6" cy="5" r="2" />
      <circle cx="6" cy="19" r="2" />
      <circle cx="18" cy="9" r="2" />
      <path d="M6 7v10M6 14a6 6 0 0 1 6-6h4" />
    </>
  ),
  Github: make(
    <path d="M9 19c-4 1.5-4-2-6-2m12 4v-4a3.5 3.5 0 0 0-1-2.7C17 14 20 13 20 8a4.5 4.5 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1-.3-3.4 1.3a11.5 11.5 0 0 0-6.4 0C6.4 1.3 5.4 1.6 5.4 1.6a4.2 4.2 0 0 0-.1 3.2A4.5 4.5 0 0 0 4 8c0 5 3 6 5 7a3.5 3.5 0 0 0-1 2.7V21" />
  ),
  Slack: make(
    <>
      <rect x="13" y="2" width="3" height="8" rx="1.5" />
      <rect x="14" y="14" width="8" height="3" rx="1.5" />
      <rect x="2" y="14" width="3" height="8" rx="1.5" />
      <rect x="2" y="7" width="8" height="3" rx="1.5" />
      <path d="M10 13H7M17 11v3M14 7h3M11 17v-3" />
    </>
  ),
  Spark: make(
    <>
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.5 5.5l2 2M16.5 16.5l2 2M5.5 18.5l2-2M16.5 7.5l2-2" />
      <circle cx="12" cy="12" r="3.5" />
    </>
  ),
  AI: make(
    <>
      <path d="M12 3 13.5 8.5 19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5z" />
      <path d="M19 17l.7 2.3L22 20l-2.3.7L19 23l-.7-2.3L16 20l2.3-.7z" />
    </>
  ),
  Image: make(
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-5-5L5 21" />
    </>
  ),
  Refresh: make(
    <>
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5" />
    </>
  ),
  Pause: make(
    <>
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </>
  ),
  Stop: make(<rect x="5" y="5" width="14" height="14" rx="2" />),
  Skip: make(
    <>
      <path d="m5 4 12 8-12 8z" />
      <path d="M19 5v14" />
    </>
  ),
  Eye: make(
    <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  Edit: make(
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </>
  ),
  Star: make(
    <path d="m12 3 2.7 5.6 6.3.9-4.5 4.4 1 6.1L12 17l-5.5 3 1-6.1L3 9.5l6.3-.9z" />
  ),
  Trash: make(
    <>
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M6 6v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6M10 11v6M14 11v6" />
    </>
  ),
  Download: make(
    <>
      <path d="M12 3v13m0 0 5-5m-5 5-5-5" />
      <path d="M5 21h14" />
    </>
  ),
  Upload: make(
    <>
      <path d="M12 21V8m0 0 5 5m-5-5-5 5" />
      <path d="M5 3h14" />
    </>
  ),
  Sun: make(
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5" />
    </>
  ),
  Moon: make(<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />),
  Globe: make(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </>
  ),
  Link: make(
    <>
      <path d="M10 14a4 4 0 0 1 0-5.7l3-3a4 4 0 1 1 5.7 5.7l-1.5 1.5" />
      <path d="M14 10a4 4 0 0 1 0 5.7l-3 3a4 4 0 1 1-5.7-5.7l1.5-1.5" />
    </>
  ),
  Flag: make(<path d="M4 21V4m0 0h12l-2 4 2 4H4" />),
  Sort: make(<path d="M3 7h12M3 12h8M3 17h4M17 5v14m0 0 3-3m-3 3-3-3" />),
  Lightning: make(<path d="m13 3-9 12h7l-1 6 9-12h-7z" />),
  Activity: make(<path d="M3 12h4l3-9 4 18 3-9h4" />),
  Repo: make(
    <>
      <path d="M4 19V5a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 2zM4 19a2 2 0 0 0 2 2h13" />
      <path d="M9 3v12" />
    </>
  ),
  Mobile: make(
    <>
      <rect x="6" y="3" width="12" height="18" rx="2" />
      <path d="M11 18h2" />
    </>
  ),
  Check2: make(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 3 3 5-6" />
    </>
  ),
  Help: make(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.5-2.5 2-2.5 4M12 17v.01" />
    </>
  ),
  Bell: make(
    <>
      <path d="M6 8a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9z" />
      <path d="M10 21a2 2 0 0 0 4 0" />
    </>
  ),
  LogOut: make(
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5M21 12H9" />
    </>
  ),
  Lock: make(
    <>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </>
  ),
  Shield: make(<path d="M12 3 4 6v6c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V6z" />),
  Key: make(
    <>
      <circle cx="8" cy="15" r="3" />
      <path d="m11 13 8-8M16 8l3 3" />
    </>
  ),
}
