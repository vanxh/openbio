export type PlanName = 'free' | 'pro' | 'business';

export const AI_CREDITS: Record<PlanName, number> = {
  free: 0,
  pro: 50,
  business: 500,
};

export const LINK_LIMITS: Record<PlanName, number> = {
  free: 1,
  pro: 5,
  business: Number.POSITIVE_INFINITY,
};

export const PLANS: {
  name: string;
  slug: PlanName;
  description: string;
  price: Record<'monthly' | 'annually', { amount: number }>;
  features: {
    text: string;
    tooltip?: string;
    notAvailable?: boolean;
  }[];
  footer?: string;
}[] = [
  {
    name: 'Free',
    slug: 'free',
    description: 'Get started for free',
    price: {
      monthly: { amount: 0 },
      annually: { amount: 0 },
    },
    features: [
      { text: '1 profile link' },
      { text: 'Link, note & image cards' },
      { text: '3 basic themes' },
      { text: 'Basic analytics' },
      { text: 'AI features', notAvailable: true },
      { text: 'All card types', notAvailable: true },
      { text: 'Custom domain', notAvailable: true },
      { text: 'Verified badge', notAvailable: true },
    ],
  },
  {
    name: 'Pro',
    slug: 'pro',
    description: 'For creators',
    price: {
      monthly: { amount: 9 },
      annually: { amount: 90 },
    },
    features: [
      { text: '5 profile links' },
      { text: 'All card types & themes' },
      { text: 'Dark mode & custom accent' },
      { text: 'Advanced analytics' },
      { text: '50 AI credits/month', tooltip: 'Bio writer, profile builder' },
      { text: 'Verified badge' },
      { text: 'Custom domain' },
      { text: 'Custom footer text' },
      { text: 'Remove branding', notAvailable: true },
      { text: 'Export analytics', notAvailable: true },
    ],
  },
  {
    name: 'Business',
    slug: 'business',
    description: 'For brands & agencies',
    price: {
      monthly: { amount: 29 },
      annually: { amount: 290 },
    },
    features: [
      { text: 'Unlimited profile links' },
      { text: 'Everything in Pro' },
      { text: '500 AI credits/month' },
      { text: 'Remove OpenBio branding' },
      { text: 'Export analytics (CSV)' },
      { text: 'Priority support' },
    ],
  },
];
