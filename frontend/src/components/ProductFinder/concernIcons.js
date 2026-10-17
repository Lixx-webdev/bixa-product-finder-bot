import {
  Sparkles, Brain, Dumbbell, ClipboardList, ShieldCheck, Activity, Scale,
  Droplet, HeartPulse, Wind, Moon, Bone, Eye, Leaf
} from 'lucide-react';

// Maps a concern name to a representative lucide icon. Approximated from the design mockup's
// hand-illustrated icons (no exact equivalents in lucide) — swap for custom icon assets if the
// brand ships them later.
const ICON_MAP = [
  [/hair/i, Sparkles],
  [/nerve|brain|mental/i, Brain],
  [/fitness/i, Dumbbell],
  [/nutrition/i, ClipboardList],
  [/immunity/i, ShieldCheck],
  [/digest/i, Activity],
  [/weight/i, Scale],
  [/blood|diabetic/i, Droplet],
  [/heart/i, HeartPulse],
  [/respiratory/i, Wind],
  [/sleep|seasonal/i, Moon],
  [/joint|bone/i, Bone],
  [/skin/i, Eye]
];

export const getConcernIcon = (concernName = '') => {
  const match = ICON_MAP.find(([pattern]) => pattern.test(concernName));
  return match ? match[1] : Leaf;
};

export default getConcernIcon;
