import type { ReactNode, SVGProps } from 'react';

export type IconName =
  | 'home' | 'calendar' | 'users' | 'chart' | 'clipboard' | 'settings'
  | 'clock' | 'alert' | 'car' | 'bell' | 'heart' | 'edit' | 'arrow' | 'shield';

const paths: Record<IconName, ReactNode> = {
  home: <><path d="M3 10.8 12 3l9 7.8" /><path d="M5.5 9.8V21h13V9.8M9.5 21v-6h5v6" /></>,
  calendar: <><rect x="3" y="4.5" width="18" height="16" rx="3" /><path d="M7 2.8v3.5M17 2.8v3.5M3 9h18" /><path d="M8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01" /></>,
  users: <><circle cx="9" cy="8" r="3" /><path d="M3.5 19c.4-3 2.2-5 5.5-5s5.1 2 5.5 5" /><circle cx="17" cy="9" r="2.2" /><path d="M15.5 14.7c2.2.1 3.8 1.5 4.2 3.8" /></>,
  chart: <><path d="M4 20V11M10 20V5M16 20v-8M22 20H2" /></>,
  clipboard: <><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4V3h6v1M8.5 9h7M8.5 13h7M8.5 17h4" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1-1.8 3.1-.2-.1a2 2 0 0 0-2.2.1l-.3.2a2 2 0 0 0-.9 1.8v.2h-3.6v-.2a2 2 0 0 0-.9-1.8l-.3-.2a2 2 0 0 0-2.2-.1l-.2.1-1.8-3.1.1-.1a2 2 0 0 0 .9-1.8v-.4a2 2 0 0 0-.9-1.8l-.1-.1 1.8-3.1.2.1a2 2 0 0 0 2.2-.1l.3-.2a2 2 0 0 0 .9-1.8v-.2h3.6v.2a2 2 0 0 0 .9 1.8l.3.2a2 2 0 0 0 2.2.1l.2-.1 1.8 3.1-.1.1a2 2 0 0 0-.9 1.8v.4a2 2 0 0 0 .9 1.8Z" /></>,
  clock: <><circle cx="12" cy="12" r="8.8" /><path d="M12 7v5l3.5 2" /></>,
  alert: <><path d="m12 3 9 16H3L12 3Z" /><path d="M12 9v4M12 16h.01" /></>,
  car: <><path d="m5 16 1.5-6h11L19 16" /><path d="M4 16h16v3H4zM7 19v2M17 19v2" /><circle cx="7" cy="16" r="1" /><circle cx="17" cy="16" r="1" /></>,
  bell: <><path d="M6 17h12l-1.2-2v-4a4.8 4.8 0 0 0-9.6 0v4L6 17Z" /><path d="M10 20h4" /></>,
  heart: <path d="M12 20S4 15.2 4 9.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8 2.5C20 15.2 12 20 12 20Z" />,
  edit: <><path d="m4 17.5-.8 3.3 3.3-.8L18.8 7.7a2.2 2.2 0 0 0-3.1-3.1L4 17.5Z" /><path d="m14.5 6.5 3 3" /></>,
  arrow: <><path d="M5 12h13M13 6l6 6-6 6" /></>,
  shield: <><path d="M12 3 19 6v5c0 4.5-2.8 7.7-7 10-4.2-2.3-7-5.5-7-10V6l7-3Z" /><path d="M12 7v6M9.5 10.5 12 13l2.5-2.5" /></>,
};

export default function Icon({ name, size = 24, strokeWidth = 1.8, ...props }: { name: IconName; size?: number; strokeWidth?: number } & SVGProps<SVGSVGElement>) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name]}</svg>;
}
