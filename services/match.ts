import { User, EventType } from '../types';

// ─── Domain-based fallback scoring (used as base + Gemini enriches) ──────────

const SKILL_DOMAINS: Record<string, string[]> = {
  design: ['figma', 'ui', 'ux', 'design', 'sketch', 'adobe', 'canva', 'illustrator', 'photoshop', 'branding', 'wireframe', 'prototype', 'graphic', 'creative'],
  frontend: ['react', 'vue', 'angular', 'html', 'css', 'tailwind', 'nextjs', 'svelte', 'typescript', 'javascript', 'frontend', 'front-end', 'front end', 'web dev', 'webdev'],
  backend: ['node', 'python', 'java', 'go', 'rust', 'express', 'django', 'fastapi', 'spring', 'php', 'ruby', 'backend', 'back-end', 'back end', 'api', 'server', 'full stack', 'fullstack', 'full-stack', 'full stack developer', 'software engineer', 'software development'],
  ml: ['ml', 'ai', 'tensorflow', 'pytorch', 'sklearn', 'nlp', 'cv', 'machine learning', 'deep learning', 'data science', 'artificial intelligence', 'neural', 'llm', 'aiml', 'ai/ml'],
  devops: ['docker', 'kubernetes', 'aws', 'gcp', 'azure', 'ci/cd', 'linux', 'terraform', 'cloud', 'devops', 'dev ops', 'infrastructure'],
  mobile: ['flutter', 'react native', 'swift', 'kotlin', 'android', 'ios', 'mobile', 'app development', 'app dev'],
  data: ['sql', 'mongodb', 'postgresql', 'firebase', 'redis', 'analytics', 'tableau', 'powerbi', 'database', 'data analysis', 'data engineering', 'excel'],
  business: ['strategy', 'management', 'marketing', 'sales', 'product', 'finance', 'operations', 'leadership', 'business', 'entrepreneur', 'startup', 'consulting', 'project management', 'mba'],
  content: ['writing', 'copywriting', 'content', 'seo', 'social media', 'communication', 'storytelling', 'blogging', 'video', 'editing', 'media', 'journalism'],
};

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

const EVENT_SKILL_WEIGHTS: Record<string, Record<string, number>> = {
  [EventType.HACKATHON]: { frontend: 1.4, backend: 1.4, ml: 1.3, devops: 1.2, design: 1.1, data: 1.1, mobile: 1.2, business: 0.7, content: 0.6 },
  [EventType.CONFERENCE]: { business: 1.5, content: 1.4, design: 1.2, frontend: 0.9, backend: 0.8, ml: 1.0, data: 1.1, devops: 0.7, mobile: 0.8 },
  [EventType.WORKSHOP]: { frontend: 1.2, design: 1.2, content: 1.3, business: 1.1, backend: 1.1, ml: 1.1, data: 1.0, devops: 1.0, mobile: 1.0 },
  [EventType.MEETUP]: { business: 1.3, content: 1.3, design: 1.1, frontend: 1.0, backend: 1.0, ml: 1.0, data: 1.0, devops: 1.0, mobile: 1.0 },
};

const getDomain = (skill: string): string | null => {
  const lower = skill.toLowerCase().trim();
  for (const [domain, keywords] of Object.entries(SKILL_DOMAINS)) {
    for (const k of keywords) {
      if (lower === k || lower.includes(k) || (k.includes(lower) && lower.length > 3)) return domain;
    }
  }
  return null;
};

export const getUserDomains = (user: User): Set<string> => {
  const domains = new Set<string>();
  (user.skills || []).forEach(s => { const d = getDomain(s); if (d) domains.add(d); });
  return domains;
};

// ─── Pure algorithmic score (fast, no API) ──────────────────────────────────
export const computeMatchScore = (currentUser: User, candidate: User, eventType?: EventType): number => {
  const mySkills = currentUser.skills || [];
  const myInterests = currentUser.interests || [];
  const myDomains = getUserDomains(currentUser);
  const theirDomains = getUserDomains(candidate);
  const eventWeights = eventType ? EVENT_SKILL_WEIGHTS[eventType] : null;

  // 1. Complementary domain score (40pts)
  let complementaryScore = 0;
  theirDomains.forEach(theirDomain => {
    if (!myDomains.has(theirDomain)) {
      let points = 8;
      myDomains.forEach(myDomain => {
        if (COMPLEMENTARY_DOMAINS[myDomain]?.includes(theirDomain)) points += 6;
      });
      if (eventWeights?.[theirDomain]) points *= eventWeights[theirDomain];
      complementaryScore += points;
    }
  });
  const normalizedComplement = Math.min((complementaryScore / 40) * 40, 40);

  // 2. Shared interest score (30pts)
  const myInterestsSet = new Set(myInterests.map(i => i.toLowerCase()));
  const sharedInterests = (candidate.interests || []).filter(i => myInterestsSet.has(i.toLowerCase())).length;
  const totalInterests = Math.max(myInterests.length + (candidate.interests?.length || 0), 1);
  const interestScore = Math.min((sharedInterests / totalInterests) * 60, 30);

  // 3. Skill diversity bonus (20pts)
  const mySkillsLower = new Set(mySkills.map(s => s.toLowerCase()));
  const uniqueNewSkills = (candidate.skills || []).filter(s => !mySkillsLower.has(s.toLowerCase()) && getDomain(s) !== null).length;
  const diversityScore = Math.min(uniqueNewSkills * 4, 20);

  // 4. Overlap penalty (-10pts)
  const skillOverlap = (candidate.skills || []).filter(s => mySkillsLower.has(s.toLowerCase())).length;
  const totalSkills = Math.max(mySkills.length + (candidate.skills?.length || 0), 1);
  const overlapPenalty = Math.min((skillOverlap / totalSkills) * 20, 10);

  // 5. Profile completeness bonus (10pts)
  const completenessBonus =
    ((candidate.skills?.length || 0) > 0 ? 5 : 0) +
    ((candidate.interests?.length || 0) > 0 ? 3 : 0) +
    (candidate.bio ? 2 : 0);

  // Base score if no profile data
  const baseScore = (!mySkills.length && !myInterests.length) ? 20 : 0;

  const total = baseScore + normalizedComplement + interestScore + diversityScore - overlapPenalty + completenessBonus;
  return Math.min(Math.max(Math.round(total), 0), 100);
};

// ─── Gemini-powered match explanation ───────────────────────────────────────
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export const getWhyMatchAI = async (
  currentUser: User,
  candidate: User,
  eventType?: EventType,
  eventName?: string
): Promise<string> => {
  // If no API key, fall back to rule-based
  if (!GEMINI_API_KEY) return getWhyMatch(currentUser, candidate, eventType);

  const prompt = `You are a team-matching assistant for a platform called LotUs.

Current user profile:
- Name: ${currentUser.name}
- Skills: ${(currentUser.skills || []).join(', ') || 'none listed'}
- Interests: ${(currentUser.interests || []).join(', ') || 'none listed'}
- Bio: ${currentUser.bio || 'none'}

Candidate profile:
- Name: ${candidate.name}
- Skills: ${(candidate.skills || []).join(', ') || 'none listed'}
- Interests: ${(candidate.interests || []).join(', ') || 'none listed'}
- Bio: ${candidate.bio || 'none'}

Event: ${eventName || eventType || 'General'}
Event type: ${eventType || 'General'}

Write ONE short sentence (max 15 words) explaining why ${candidate.name} is a great teammate for ${currentUser.name} at this event. Focus on complementary skills or shared interests. Be specific. No fluff. Do not start with "They" — use the candidate's first name or a skill directly.`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 60, temperature: 0.7 }
        })
      }
    );
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    return text || getWhyMatch(currentUser, candidate, eventType);
  } catch {
    return getWhyMatch(currentUser, candidate, eventType);
  }
};

// ─── Rule-based fallback explanation ────────────────────────────────────────
export const getWhyMatch = (currentUser: User, candidate: User, eventType?: EventType): string => {
  const myDomains = getUserDomains(currentUser);
  const theirDomains = getUserDomains(candidate);
  const complementaryDomains = [...theirDomains].filter(d => !myDomains.has(d));
  const myInterestsSet = new Set((currentUser.interests || []).map(i => i.toLowerCase()));
  const sharedInterests = (candidate.interests || []).filter(i => myInterestsSet.has(i.toLowerCase()));
  const mySkillsLower = new Set((currentUser.skills || []).map(s => s.toLowerCase()));
  const uniqueSkills = (candidate.skills || []).filter(s => !mySkillsLower.has(s.toLowerCase()));
  const eventContext = eventType === EventType.HACKATHON ? 'for the hackathon' :
    eventType === EventType.CONFERENCE ? 'for the conference' :
    eventType === EventType.WORKSHOP ? 'for this workshop' : '';

  if (complementaryDomains.length > 0 && sharedInterests.length > 0) {
    const label = complementaryDomains[0].charAt(0).toUpperCase() + complementaryDomains[0].slice(1);
    return `Brings ${label} expertise ${eventContext} and shares your interest in ${sharedInterests[0]}.`;
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
    return `Deep alignment on ${sharedInterests.slice(0, 2).join(' & ')} — great culture fit.`;
  }
  if (uniqueSkills.length > 0) {
    return `Brings ${uniqueSkills.slice(0, 2).join(', ')} — skills that expand your team's reach.`;
  }
  return 'Broad skill set that adds versatility to your team.';
};