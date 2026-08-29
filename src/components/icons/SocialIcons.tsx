// Mismos trazos que feellingPilatesApp/src/components/SocialLinksRow.tsx,
// portados de react-native-svg a SVG web para mantener el mismo ícono en
// ambas plataformas.
interface SocialIconProps {
  color?: string;
  size?: number;
}

export function InstagramIcon({ color = 'currentColor', size = 20 }: SocialIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x={2.5} y={2.5} width={19} height={19} rx={6} stroke={color} strokeWidth={1.8} />
      <circle cx={12} cy={12} r={5} stroke={color} strokeWidth={1.8} />
      <circle cx={17.4} cy={6.6} r={1.1} fill={color} />
    </svg>
  );
}

export function FacebookIcon({ color = 'currentColor', size = 20 }: SocialIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M15 3h-2.5A4.5 4.5 0 0 0 8 7.5V10H5.5v3.5H8V21h3.5v-7.5h2.7l.5-3.5h-3.2V7.8c0-1 .3-1.7 1.7-1.7H15V3Z"
        fill={color}
      />
    </svg>
  );
}

export function TikTokIcon({ color = 'currentColor', size = 20 }: SocialIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M14 3v10.6a2.6 2.6 0 1 1-2-2.53"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path d="M14 3c.3 2.3 2 4 4.3 4.2" stroke={color} strokeWidth={1.8} strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function WhatsappIcon({ color = 'currentColor', size = 20 }: SocialIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3Z" stroke={color} strokeWidth={1.8} fill="none" />
      <path
        d="M8.3 8.6c.2-.5.5-.5.7-.5h.5c.2 0 .4 0 .5.4.2.5.6 1.5.6 1.6.1.1.1.3 0 .4-.1.2-.1.3-.3.4-.1.2-.3.3-.4.5-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.5 1.6.3.1.5.1.6-.1.2-.2.7-.8.9-1 .2-.3.4-.2.6-.1l1.5.7c.2.1.4.2.4.3.1.2.1.9-.2 1.4-.3.6-1.4 1.1-2 1.2-.5.1-1.1.1-1.8-.1-.4-.1-.9-.3-1.6-.6-2.8-1.2-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.8 0-1.3.7-2 1-2.3Z"
        fill={color}
      />
    </svg>
  );
}
