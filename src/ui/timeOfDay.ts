/**
 * Time-of-day atmosphere for the home scene. The phase is derived from the
 * real device clock so the sky, ground and sun/moon shift through the day
 * even when the hero is awake. Colours sit beside the warm "cozy tavern"
 * palette; nature tones avoid pure black/white and lean pixel-art.
 */
export type DayPhase = 'morning' | 'day' | 'evening' | 'night';

/** morning 06–11, day 11–17, evening 17–22, night 22–06. */
export function getDayPhase(date: Date = new Date()): DayPhase {
  const h = date.getHours();
  if (h >= 6 && h < 11) {
    return 'morning';
  }
  if (h < 17) {
    return 'day';
  }
  if (h < 22) {
    return 'evening';
  }
  return 'night';
}

export interface PhaseVisual {
  /** Sky gradient, top → horizon (multi-stop for extra depth). */
  sky: readonly string[];
  hillBack: string;
  hillFront: string;
  grass: string;
  grassDark: string;
  grassBlade: string;
  soil: string;
  /** Sun/moon disc, its shaded side, and the ray colour. */
  orb: string;
  orbShade: string;
  ray: string;
  moon: boolean;
  cloud: string;
  cloudShade: string;
  stars: boolean;
  flower: string;
}

export const PHASE_VISUALS: Record<DayPhase, PhaseVisual> = {
  morning: {
    sky: ['#89b2d4', '#b9cfe0', '#e6dcc6', '#f7d2a4'],
    hillBack: '#6a8a4a',
    hillFront: '#587a3a',
    grass: '#5f8038',
    grassDark: '#4a6629',
    grassBlade: '#88b558',
    soil: '#5a4230',
    orb: '#ffe6ad',
    orbShade: '#f4c877',
    ray: '#ffe6ad',
    moon: false,
    cloud: '#faf6ec',
    cloudShade: '#ddd2be',
    stars: false,
    flower: '#f2c96b',
  },
  day: {
    sky: ['#4f9fd6', '#74b8e6', '#a9d6f0', '#dff0f7'],
    hillBack: '#6f9a48',
    hillFront: '#5f8a3c',
    grass: '#6b9142',
    grassDark: '#537130',
    grassBlade: '#93c85f',
    soil: '#5f4632',
    orb: '#ffe27a',
    orbShade: '#ffcf4d',
    ray: '#ffe793',
    moon: false,
    cloud: '#ffffff',
    cloudShade: '#dde6ed',
    stars: false,
    flower: '#ffd24d',
  },
  evening: {
    sky: ['#2f2f66', '#6f4a86', '#c96f7e', '#f0956a'],
    hillBack: '#4c5a34',
    hillFront: '#3f4d2c',
    grass: '#49602f',
    grassDark: '#374826',
    grassBlade: '#6d8a45',
    soil: '#463022',
    orb: '#ff9a5a',
    orbShade: '#f0713f',
    ray: '#ffb07a',
    moon: false,
    cloud: '#f0cabf',
    cloudShade: '#c99a96',
    stars: true,
    flower: '#e07a5a',
  },
  night: {
    sky: ['#0b0e2a', '#141a44', '#232a5e', '#33306a'],
    hillBack: '#1e2a14',
    hillFront: '#182310',
    grass: '#243016',
    grassDark: '#18220f',
    grassBlade: '#3a4a24',
    soil: '#241a12',
    orb: '#e6ecf5',
    orbShade: '#aebbe0',
    ray: '#cdd6ec',
    moon: true,
    cloud: '#c7d0e6',
    cloudShade: '#8a94b8',
    stars: true,
    flower: '#9fb0e0',
  },
};
