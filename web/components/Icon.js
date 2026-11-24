import {
  Building2, Calculator, CodeXml, Handshake, Megaphone, Trophy, Users, Wrench,
} from 'lucide-react';

const ICONS = { Building2, Calculator, CodeXml, Handshake, Megaphone, Trophy, Users, Wrench };

export default function Icon({ name, size = 28 }) {
  const Glyph = ICONS[name];
  return Glyph ? <Glyph size={size} strokeWidth={1.8} aria-hidden="true" /> : null;
}

const SOCIAL_PATHS = {
  facebook: 'M14 8.5V6.8c0-.8.5-1 1-1h2V2.2L14.2 2C11.3 2 10 3.8 10 6.3v2.2H7.5V12H10v10h4V12h2.7l.4-3.5H14Z',
  instagram: 'M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9a5.5 5.5 0 0 1-5.5 5.5h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2Zm0 2A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5v-9A3.5 3.5 0 0 0 16.5 4h-9ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm5.3-3.4a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2Z',
  youtube: 'M22.5 7.2a2.9 2.9 0 0 0-2-2C18.700 4.700 12 4.700 12 4.700s-6.700 0-8.500.5a2.900 2.900 0 0 0-2 2A30 30 0 0 0 1 12a30 30 0 0 0 .5 4.800 2.900 2.900 0 0 0 2 2c1.800.5 8.500.5 8.500.5s6.700 0 8.500-.5a2.900 2.900 0 0 0 2-2A30 30 0 0 0 23 12a30 30 0 0 0-.5-4.800ZM9.800 15.300V8.700l5.700 3.300-5.700 3.300Z',
  x: 'M17.800 2.500h3.300l-7.200 8.200 8.500 10.800h-6.700l-5.200-6.600-6 6.600H1.200l7.700-8.800L.8 2.500h6.800l4.700 6.100 5.500-6.100Zm-1.200 17.100h1.800L6.700 4.300H4.700l11.900 15.300Z',
};

export function SocialIcon({ name, size = 15 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={SOCIAL_PATHS[name]} /></svg>;
}
