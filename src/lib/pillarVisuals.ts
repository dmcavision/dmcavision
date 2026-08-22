export interface PillarVisual {
  alt: string;
  diagram?: {
    title: string;
    description: string;
    steps: string[];
  };
}

export const pillarVisuals: Record<string, PillarVisual> = {
  'changing-landscape-online-copyright-abuse': {
    alt: 'Digital copyright protection ecosystem connecting creator assets, detection, evidence, platform reporting, and resolution'
  },
  'future-digital-ip-enforcement': {
    alt: 'Future digital IP enforcement model connecting monitoring, intelligence, human governance, and continuous improvement'
  },
  'evidence-intelligence-digital-enforcement': {
    alt: 'Digital evidence intelligence workspace organizing URL captures, screenshots, timestamps, metadata, and case records',
    diagram: {
      title: 'Digital evidence lifecycle',
      description: 'A reliable record preserves source context from initial capture through review and enforcement outcome.',
      steps: ['Capture', 'Verify', 'Structure', 'Review', 'Submit', 'Record']
    }
  },
  'ai-powered-brand-monitoring': {
    alt: 'AI-powered brand monitoring workflow with confidence scoring and accountable human validation',
    diagram: {
      title: 'Human-in-the-loop monitoring',
      description: 'Automated signals support prioritization while a qualified reviewer remains responsible for the enforcement decision.',
      steps: ['Detect', 'Score', 'Prioritize', 'Review', 'Decide']
    }
  },
  'rise-online-counterfeit-networks': {
    alt: 'Counterfeit network map connecting seller accounts, marketplace listings, domains, and payment channels'
  },
  'marketplace-transparency-enforcement': {
    alt: 'Marketplace enforcement workflow from listing discovery and seller analysis to platform resolution',
    diagram: {
      title: 'Marketplace enforcement workflow',
      description: 'Platform action begins with a precise listing and ends with a verified outcome and recurrence review.',
      steps: ['Discover', 'Analyze', 'Validate', 'Preserve', 'Report', 'Verify']
    }
  },
  'deepfakes-impersonation-risk': {
    alt: 'Synthetic media incident response connecting detection, independent verification, containment, and platform action'
  },
  'domain-abuse-brand-risk': {
    alt: 'Domain abuse infrastructure map connecting a deceptive domain with DNS, registrar, hosting, and response channels',
    diagram: {
      title: 'Domain infrastructure response',
      description: 'Map the harmful use to the provider that controls each layer before selecting a proportionate intervention.',
      steps: ['Domain', 'DNS', 'Registrar', 'Hosting', 'Validate', 'Respond']
    }
  },
  'threat-intelligence-ip-operations': {
    alt: 'IP threat intelligence graph connecting accounts, domains, protected assets, relationships, and risk signals'
  },
  'detection-to-removal-workflow': {
    alt: 'Complete IP enforcement lifecycle from detection and review through evidence, submission, resolution, and reporting',
    diagram: {
      title: 'Detection-to-removal lifecycle',
      description: 'A connected operating process keeps evidence, decisions, actions, and outcomes traceable from end to end.',
      steps: ['Detect', 'Triage', 'Review', 'Evidence', 'Submit', 'Resolve', 'Report']
    }
  }
};
