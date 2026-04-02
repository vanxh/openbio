export const PLANS: {
  name: string;
  description: string;
  price: Record<'monthly' | 'annually', { amount: number; priceId?: string }>;
  features: {
    text: string;
    tooltip?: string;
    notAvailable?: boolean;
  }[];
  footer?: string;
}[] = [
  {
    name: 'Free',
    description: 'Free forever',
    price: {
      monthly: {
        amount: 0,
      },
      annually: {
        amount: 0,
      },
    },
    features: [
      { text: '1 link' },
      { text: 'Link, note & image cards' },
      { text: '3 basic themes' },
      { text: 'Analytics', tooltip: 'See how many people view your links' },
      { text: 'Dark mode', notAvailable: true },
      { text: 'Advanced bio styling', notAvailable: true },
      { text: 'All themes + custom accent', notAvailable: true },
      { text: 'Custom footer text', notAvailable: true },
      { text: 'Custom domain', notAvailable: true },
      { text: 'Verified badge', notAvailable: true },
    ],
    footer: 'All features might not be available yet',
  },
  {
    name: 'Pro',
    description: 'Pro plan',
    price: {
      monthly: {
        amount: 9,
      },
      annually: {
        amount: 90,
      },
    },
    features: [
      { text: 'Unlimited links' },
      { text: 'All card types' },
      { text: 'All 10 themes + custom accent' },
      { text: 'Dark mode' },
      { text: 'Advanced bio styling' },
      { text: 'Verified badge' },
      {
        text: 'Advanced analytics',
        tooltip: 'See how many people view your links',
      },
      { text: 'Custom footer text' },
      { text: 'Custom domain' },
      { text: 'Priority support' },
    ],
    footer: 'All features might not be available yet',
  },
];
