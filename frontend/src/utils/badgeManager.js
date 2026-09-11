// Badges and Achievements System for Doodle Recognizer

export const BADGES_CATALOG = [
  {
    id: 'first_solo',
    title: 'Solo Pioneer',
    icon: '🎯',
    description: 'Completed your first Single Player Arcade challenge.',
    category: 'Solo'
  },
  {
    id: 'first_multiplayer',
    title: 'Squad Player',
    icon: '👥',
    description: 'Participated in your first real-time Multiplayer match.',
    category: 'Multiplayer'
  },
  {
    id: 'first_imposter_win',
    title: 'Master Detective',
    icon: '🕵️',
    description: 'Voted out the Imposter in Finding Imposter mode.',
    category: 'Multiplayer'
  },
  {
    id: 'first_contexto_win',
    title: 'Contexto Sleuth',
    icon: '💡',
    description: 'Successfully uncovered a secret Contexto mystery word.',
    category: 'Deduction'
  },
  {
    id: 'first_extreme',
    title: 'Extreme Challenger',
    icon: '⚡',
    description: 'Completed your first Extreme Challenge round.',
    category: 'Arcade'
  },
  {
    id: 'extreme_lightning',
    title: 'Lightning Reflexes',
    icon: '⏱️',
    description: 'Scored over 250 points in Extreme Challenge in under 6 seconds.',
    category: 'Arcade'
  },
  {
    id: 'learning_starter',
    title: 'Curious Apprentice',
    icon: '🌱',
    description: 'Completed your first 3 Learning Mode lessons.',
    category: 'Learning'
  },
  {
    id: 'learning_scholar',
    title: 'Dedicated Scholar',
    icon: '📚',
    description: 'Completed 20 or more Learning Mode lessons.',
    category: 'Learning'
  },
  {
    id: 'learning_master',
    title: 'Doodle Grandmaster',
    icon: '👑',
    description: 'Mastered Learning Mode with 90%+ confidence across lessons.',
    category: 'Learning'
  },
  {
    id: 'perfectionist',
    title: '90+ Precision',
    icon: '⭐',
    description: 'Scored 90% or higher AI confidence on any sketch.',
    category: 'Skill'
  },
  {
    id: 'century_club',
    title: 'Centurion',
    icon: '🔥',
    description: 'Achieved a near-perfect 98%+ AI confidence on a single sketch.',
    category: 'Skill'
  },
  {
    id: 'veteran_artist',
    title: 'Master of the Canvas',
    icon: '🎨',
    description: 'Played 10 or more games across any mode.',
    category: 'Milestone'
  }
];

const STORAGE_KEY = 'doodle_user_badges';

export function getUnlockedBadges() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

export function unlockBadge(badgeId) {
  try {
    const unlocked = getUnlockedBadges();
    if (!unlocked[badgeId]) {
      unlocked[badgeId] = {
        unlockedAt: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(unlocked));
      const badge = BADGES_CATALOG.find((b) => b.id === badgeId);
      return badge || null;
    }
  } catch (e) {
    console.error('Error unlocking badge:', e);
  }
  return null;
}

export function getAllBadgesWithStatus() {
  const unlocked = getUnlockedBadges();
  return BADGES_CATALOG.map((b) => ({
    ...b,
    isUnlocked: !!unlocked[b.id],
    unlockedAt: unlocked[b.id]?.unlockedAt || null
  }));
}
