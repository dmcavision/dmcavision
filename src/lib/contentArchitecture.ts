export interface CategoryDefinition {
  name: string;
  slug: string;
  description: string;
}

export const INSIGHT_CATEGORIES = [
  { name: 'AI & Automation', slug: 'ai-automation', description: 'Analysis of artificial intelligence, automation, human review, and responsible technology in digital rights protection.' },
  { name: 'Enforcement Strategy', slug: 'enforcement-strategy', description: 'Operating models, investment priorities, resilience, and measurable strategies for online intellectual property enforcement.' },
  { name: 'Evidence & Intelligence', slug: 'evidence-intelligence', description: 'Research on evidence quality, data operations, threat intelligence, and connected decision-making for digital enforcement.' },
  { name: 'Platform Policy', slug: 'platform-policy', description: 'Analysis of marketplace governance, platform accountability, trust and safety, transparency, and digital regulation.' },
  { name: 'Brand Risk', slug: 'brand-risk', description: 'Strategic analysis of impersonation, domain abuse, synthetic media, reputation exposure, and online brand harm.' },
  { name: 'Copyright & Creator Economy', slug: 'copyright-creator-economy', description: 'Industry perspectives on digital copyright, creator rights, licensing, distribution, and changing content ecosystems.' },
  { name: 'Counterfeit & Global Commerce', slug: 'counterfeit-global-commerce', description: 'Intelligence on counterfeit networks, cross-border ecommerce, seller behavior, and global marketplace exposure.' },
  { name: 'Rights Operations', slug: 'rights-operations', description: 'Systems, workflows, rights data, and technology supporting consistent global takedown and enforcement operations.' }
] as const satisfies readonly CategoryDefinition[];

export const RESOURCE_CATEGORIES = [
  { name: 'Copyright', slug: 'copyright', description: 'Practical guidance on copyright ownership, registration, licensing, infringement, and protection for digital works.' },
  { name: 'DMCA & Takedowns', slug: 'dmca-takedowns', description: 'Guides to DMCA notices, counter-notices, direct outreach, and structured online takedown workflows.' },
  { name: 'Trademark & Brand Protection', slug: 'trademark-brand-protection', description: 'Resources for trademark review, counterfeit response, brand monitoring, and social media protection.' },
  { name: 'Digital Evidence', slug: 'digital-evidence', description: 'Checklists and guidance for collecting, preserving, organizing, and reviewing online infringement evidence.' },
  { name: 'Platform & Marketplace Enforcement', slug: 'platform-marketplace-enforcement', description: 'Practical resources for marketplace reporting and selecting platform, hosting, and search enforcement routes.' },
  { name: 'Domain & Impersonation', slug: 'domain-impersonation', description: 'Guidance for deceptive domains, impersonation accounts, cloned websites, and related consumer risk.' },
  { name: 'Global Enforcement', slug: 'global-enforcement', description: 'Frameworks for coordinating intellectual property enforcement across territories, platforms, and business teams.' },
  { name: 'Program Management', slug: 'program-management', description: 'Operational resources for monitoring, repeat cases, enforcement metrics, governance, and program improvement.' }
] as const satisfies readonly CategoryDefinition[];

export const INSIGHT_CATEGORY_NAMES = INSIGHT_CATEGORIES.map(({ name }) => name) as [
  (typeof INSIGHT_CATEGORIES)[number]['name'],
  ...(typeof INSIGHT_CATEGORIES)[number]['name'][]
];
export const RESOURCE_CATEGORY_NAMES = RESOURCE_CATEGORIES.map(({ name }) => name) as [
  (typeof RESOURCE_CATEGORIES)[number]['name'],
  ...(typeof RESOURCE_CATEGORIES)[number]['name'][]
];

export const insightCategoryRelations: Record<string, readonly string[]> = {
  'AI & Automation': ['AI & Automation', 'Evidence & Intelligence', 'Copyright & Creator Economy'],
  'Enforcement Strategy': ['Enforcement Strategy', 'Rights Operations', 'Evidence & Intelligence'],
  'Evidence & Intelligence': ['Evidence & Intelligence', 'AI & Automation', 'Rights Operations'],
  'Platform Policy': ['Platform Policy', 'Brand Risk', 'Counterfeit & Global Commerce'],
  'Brand Risk': ['Brand Risk', 'Platform Policy', 'AI & Automation'],
  'Copyright & Creator Economy': ['Copyright & Creator Economy', 'AI & Automation', 'Brand Risk'],
  'Counterfeit & Global Commerce': ['Counterfeit & Global Commerce', 'Platform Policy', 'Brand Risk'],
  'Rights Operations': ['Rights Operations', 'Enforcement Strategy', 'Evidence & Intelligence']
};

export const resourceCategoryRelations: Record<string, readonly string[]> = {
  'Copyright': ['Copyright', 'Digital Evidence', 'DMCA & Takedowns'],
  'DMCA & Takedowns': ['DMCA & Takedowns', 'Copyright', 'Platform & Marketplace Enforcement'],
  'Trademark & Brand Protection': ['Trademark & Brand Protection', 'Platform & Marketplace Enforcement', 'Domain & Impersonation'],
  'Digital Evidence': ['Digital Evidence', 'Copyright', 'Program Management'],
  'Platform & Marketplace Enforcement': ['Platform & Marketplace Enforcement', 'Trademark & Brand Protection', 'DMCA & Takedowns'],
  'Domain & Impersonation': ['Domain & Impersonation', 'Trademark & Brand Protection', 'Platform & Marketplace Enforcement'],
  'Global Enforcement': ['Global Enforcement', 'Program Management', 'Platform & Marketplace Enforcement'],
  'Program Management': ['Program Management', 'Digital Evidence', 'Global Enforcement']
};

export const insightToResourceRelations: Record<string, readonly string[]> = {
  'AI & Automation': ['Program Management', 'Digital Evidence', 'Copyright'],
  'Enforcement Strategy': ['DMCA & Takedowns', 'Program Management', 'Global Enforcement'],
  'Evidence & Intelligence': ['Digital Evidence', 'Program Management', 'Copyright'],
  'Platform Policy': ['Platform & Marketplace Enforcement', 'Domain & Impersonation', 'Trademark & Brand Protection'],
  'Brand Risk': ['Trademark & Brand Protection', 'Domain & Impersonation', 'Program Management'],
  'Copyright & Creator Economy': ['Copyright', 'DMCA & Takedowns', 'Digital Evidence'],
  'Counterfeit & Global Commerce': ['Trademark & Brand Protection', 'Platform & Marketplace Enforcement', 'Global Enforcement'],
  'Rights Operations': ['Global Enforcement', 'Program Management', 'Copyright']
};

export const resourceToInsightRelations: Record<string, readonly string[]> = {
  'Copyright': ['Copyright & Creator Economy', 'AI & Automation', 'Enforcement Strategy'],
  'DMCA & Takedowns': ['Enforcement Strategy', 'Platform Policy', 'Rights Operations'],
  'Trademark & Brand Protection': ['Brand Risk', 'Counterfeit & Global Commerce', 'Platform Policy'],
  'Digital Evidence': ['Evidence & Intelligence', 'Rights Operations', 'AI & Automation'],
  'Platform & Marketplace Enforcement': ['Platform Policy', 'Counterfeit & Global Commerce', 'Enforcement Strategy'],
  'Domain & Impersonation': ['Brand Risk', 'Evidence & Intelligence', 'Platform Policy'],
  'Global Enforcement': ['Counterfeit & Global Commerce', 'Rights Operations', 'Enforcement Strategy'],
  'Program Management': ['Enforcement Strategy', 'Evidence & Intelligence', 'AI & Automation']
};

export const getCategoryDefinition = (collection: 'insights' | 'resources', name: string) =>
  (collection === 'insights' ? INSIGHT_CATEGORIES : RESOURCE_CATEGORIES).find((category) => category.name === name);

export const rankByCategory = <T extends { data: { category: string; date: Date } }>(items: T[], categories: readonly string[]) =>
  [...items].sort((a, b) => {
    const aRank = categories.indexOf(a.data.category);
    const bRank = categories.indexOf(b.data.category);
    const categoryRank = (aRank < 0 ? categories.length : aRank) - (bRank < 0 ? categories.length : bRank);
    return categoryRank || b.data.date.valueOf() - a.data.date.valueOf();
  });
