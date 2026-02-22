import { User, EventType } from '../types';

// Skills grouped by role/domain — complementary roles score higher
const SKILL_DOMAINS: Record<string, string[]> = {
  design: ['figma', 'ui', 'ux', 'design', 'sketch', 'adobe', 'canva', 'illustrator', 'photoshop', 'branding'],
  frontend: ['react', 'vue', 'angular', 'html', 'css', 'tailwind', 'nextjs', 'svelte', 'typescript', 'javascript'],
  backend: ['node', 'python', 'java', 'go', 'rust', 'express', 'django', 'fastapi', 'spring', 'php', 'ruby'],
  ml: ['ml', 'ai', 'tensorflow', 'pytorch', 'sklearn', 'nlp', 'cv', 'machine learning', 'deep learning', 'data science'],
  devops: ['docker', 'kubernetes', 'aws', 'gcp', 'azure', 'ci/cd', 'linux', 'terraform', 'cloud', 'devops'],
  mobile: ['flutter', 'react native', 'swift', 'kotlin', 'android', 'ios', 'mobile'],
  data: ['sql', 'mongodb', 'postgresql', 'firebase', 'redis', 'analytics', 'tableau', 'powerbi'],
  business: ['strategy', 'management', 'marketing', 'sales', 'product', 'finance', 'operations', 'leadership'],
  content: ['writing', 'copywriting', 'content', 'seo', 'social media', 'communication', 'storytelling'],
};

// Which domain combos make ideal teammates (complementary)
const COMPLEMENTARY_DOMAINS: Record<string, string[]> = {
  design: ['frontend', 'backend', 'business', 'content'],
  frontend: ['design', 'backend', 'devops', 'ml'],
  backend: ['frontend', 'design', 'devops', 'data', 'ml'],
  ml: ['backend', 'data', 'frontend', 'devops'],
  devops: ['backend', 'frontend', 'ml'],
  mobile: ['design', 'backend', 'devops'],
  data: ['ml', 'backend', 'business'],
  business: ['design', 'frontend', 'data', 'content'],
  content: ['design', 'business', 'frontend'],
};

// What skills matter most per event type
const EVENT_SKILL_WEIGHTS: Record<string, Record<string, number>> = {
  [EventType.HACKATHON]: {
    frontend: 1.4, backend: 1.4, ml: 1.3, devops: 1.2, design: 1.1, data: 1.1, mobile: 1.2, business: 0.7, content: 0.6
  },
  [EventType.CONFERENCE]: {
    business: 1.5, content: 1.4, design: 1.2, frontend: 0.9, backend: 0.8, ml: 1.0, data: 1.1, devops: 0.7, mobile: 0.8
  },
  [EventType.WORKSHOP]: {
    frontend: 1.2, design: 1.2, content: 1.3, business: 1.1, backend: 1.1, ml: 1.1, data: 1.0, devops: 1.0, mobile: 1.0
  },
  [EventType.MEETUP]: {
    business: 1.3, content: 1.3, design: 1.1, frontend: 1.0, backend: 1.0, ml: 1.0, data: 1.0, devops: 1.0, mobile: 1.0
  },
};

const getDomain = (skill: string): string | null => {
  const lower = skill.toLowerCase();
  for (const [domain, keywords] of Object.entries(SKILL_DOMAINS)) {
    if (keywords.some(k => lower.includes(k) || k.includes(lower))) return domain;
  }
  return null;
};

const getUserDomains = (user: User): Set<string> => {
  const domains = new Set<string>();
  user.skills.forEach(s => {
    const d = getDomain(s);
    if (d) domains.add(d);
  });
  return domains;
};

export const computeMatchScore = (
  currentUser: User,
  candidate: User,
  eventType?: EventType
): number => {
  if (!currentUser.skills?.length && !currentUser.interests?.length) return 0;

  const myDomains = getUserDomains(currentUser);
  const theirDomains = getUserDomains(candidate);

  // 1. COMPLEMENTARY DOMAIN SCORE (40pts)
  // How many of their domains complement mine (domains I DON'T have)
  let complementaryScore = 0;
  const eventWeights = eventType ? EVENT_SKILL_WEIGHTS[eventType] : null;

  theirDomains.forEach(theirDomain => {
    if (!myDomains.has(theirDomain)) {
      // They have a domain I don't — great!
      let points = 8;

      // Bonus if it's a known complementary pairing
      myDomains.forEach(myDomain => {
        if (COMPLEMENTARY_DOMAINS[myDomain]?.includes(theirDomain)) {
          points += 6;
        }
      });

      // Bonus if this domain is important for the event type
      if (eventWeights && eventWeights[theirDomain]) {
        points *= eventWeights[theirDomain];
      }

      complementaryScore += points;
    }
  });
  // Normalize to 40pts max
  const normalizedComplement = Math.min((complementaryScore / 40) * 40, 40);

  // 2. SHARED INTEREST SCORE (30pts)
  // Shared interests = good collaboration culture fit
  const myInterests = new Set(currentUser.interests?.map(i => i.toLowerCase()) || []);
  const sharedInterests = (candidate.interests || []).filter(i =>
    myInterests.has(i.toLowerCase())
  ).length;
  const totalInterests = Math.max(
    (currentUser.interests?.length || 0) + (candidate.interests?.length || 0), 1
  );
  const interestScore = Math.min((sharedInterests / totalInterests) * 60, 30);

  // 3. SKILL DIVERSITY BONUS (20pts)
  // Candidate brings skills that are totally new (not even close to mine)
  const mySkillsLower = new Set(currentUser.skills?.map(s => s.toLowerCase()) || []);
  const uniqueNewSkills = (candidate.skills || []).filter(s => {
    const lower = s.toLowerCase();
    return !mySkillsLower.has(lower) && getDomain(s) !== null;
  }).length;
  const diversityScore = Math.min(uniqueNewSkills * 4, 20);

  // 4. OVERLAP PENALTY (-10pts max)
  // Too much overlap means redundant teammates
  const skillOverlap = (candidate.skills || []).filter(s =>
    mySkillsLower.has(s.toLowerCase())
  ).length;
  const totalSkills = Math.max(
    (currentUser.skills?.length || 0) + (candidate.skills?.length || 0), 1
  );
  const overlapRatio = skillOverlap / totalSkills;
  const overlapPenalty = Math.min(overlapRatio * 20, 10);

  // 5. PROFILE COMPLETENESS BONUS (10pts)
  // Reward users who filled their profile (more data = better matching)
  const hasSkills = (candidate.skills?.length || 0) > 0 ? 5 : 0;
  const hasInterests = (candidate.interests?.length || 0) > 0 ? 3 : 0;
  const hasBio = candidate.bio ? 2 : 0;
  const completenessBonus = hasSkills + hasInterests + hasBio;

  const total = normalizedComplement + interestScore + diversityScore - overlapPenalty + completenessBonus;
  return Math.min(Math.max(Math.round(total), 0), 100);
};

export const getWhyMatch = (currentUser: User, candidate: User, eventType?: EventType): string => {
  const myDomains = getUserDomains(currentUser);
  const theirDomains = getUserDomains(candidate);

  // Find their complementary domains (what they have that I don't)
  const complementaryDomains = [...theirDomains].filter(d => !myDomains.has(d));

  // Find shared interests
  const myInterests = new Set(currentUser.interests?.map(i => i.toLowerCase()) || []);
  const sharedInterests = (candidate.interests || []).filter(i => myInterests.has(i.toLowerCase()));

  // Find their unique skills (not in my skillset)
  const mySkillsLower = new Set(currentUser.skills?.map(s => s.toLowerCase()) || []);
  const uniqueSkills = (candidate.skills || []).filter(s => !mySkillsLower.has(s.toLowerCase()));

  // Event-specific messaging
  const eventContext = eventType === EventType.HACKATHON ? 'for the hackathon' :
    eventType === EventType.CONFERENCE ? 'for the conference' :
    eventType === EventType.WORKSHOP ? 'for this workshop' : '';

  if (complementaryDomains.length > 0 && sharedInterests.length > 0) {
    const domainLabel = complementaryDomains[0].charAt(0).toUpperCase() + complementaryDomains[0].slice(1);
    return `Brings ${domainLabel} expertise you need ${eventContext} and shares your passion for ${sharedInterests[0]}.`;
  }

  if (complementaryDomains.length >= 2) {
    const labels = complementaryDomains.slice(0, 2).map(d => d.charAt(0).toUpperCase() + d.slice(1));
    return `Covers ${labels.join(' & ')} — domains your team is missing ${eventContext}.`;
  }

  if (complementaryDomains.length === 1) {
    const label = complementaryDomains[0].charAt(0).toUpperCase() + complementaryDomains[0].slice(1);
    return `Strong ${label} skills that complement your profile perfectly ${eventContext}.`;
  }

  if (sharedInterests.length > 1) {
    return `Deep alignment on ${sharedInterests.slice(0, 2).join(' & ')} — great collaboration culture fit.`;
  }

  if (uniqueSkills.length > 0) {
    return `Brings ${uniqueSkills.slice(0, 2).join(', ')} to the table — skills that expand your team's reach.`;
  }

  if (sharedInterests.length === 1) {
    return `Shared passion for ${sharedInterests[0]} — good foundation for collaboration.`;
  }

  return 'Broad skill set that adds versatility to your team.';
};