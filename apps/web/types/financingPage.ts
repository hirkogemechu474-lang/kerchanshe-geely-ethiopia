export interface FinancingPageStep {
  title: string;
  description: string;
}

export interface FinancingPageBenefit {
  title: string;
  description: string;
}

export interface FinancingPageContent {
  hero: {
    badge: string;
    kicker: string;
    titleLine1: string;
    titleLine2: string;
    subtitle: string;
    primaryCtaLabel: string;
    secondaryCtaLabel: string;
  };
  banksSection: {
    kicker: string;
    title: string;
    subtitle: string;
    emptyStateTitle: string;
    emptyStateBody: string;
    helpPanelTitle: string;
    helpPanelBody: string;
    helpPanelCtaLabel: string;
  };
  vehiclesSection: {
    kicker: string;
    title: string;
    subtitle: string;
    ctaLabel: string;
    emptyState: string;
    priceOnRequest: string;
  };
  stepsSection: {
    kicker: string;
    title: string;
    subtitle: string;
    steps: FinancingPageStep[];
  };
  benefitsSection: {
    title: string;
    benefits: FinancingPageBenefit[];
  };
  contactStrip: {
    title: string;
    body: string;
    callLabel: string;
    ctaLabel: string;
    enabled: boolean;
  };
}

export const DEFAULT_FINANCING_PAGE_CONTENT: FinancingPageContent = {
  hero: {
    badge: "Financing & Purchase Partners",
    kicker: "BUY YOUR GEELY",
    titleLine1: "Finance Your Geely",
    titleLine2: "with a Trusted Bank",
    subtitle:
      "Choose your vehicle, select one of our partner banks, and complete your purchase with secure online bank payment — finance terms, rates and eligibility are handled directly with your bank.",
    primaryCtaLabel: "Select a Bank",
    secondaryCtaLabel: "Browse Vehicles",
  },
  banksSection: {
    kicker: "01 · Choose Your Finance Partner",
    title: "Select a Financing Bank",
    subtitle:
      "Choose from our supported partner banks. Once you have selected a bank and requested a quote, our sales team will guide you through approval and secure online payment.",
    emptyStateTitle: "No partner banks are currently published.",
    emptyStateBody: "Please check back soon.",
    helpPanelTitle: "Not sure which bank is right for you?",
    helpPanelBody:
      "Our team can help you compare rates, eligibility and repayment terms to find the best fit for your purchase.",
    helpPanelCtaLabel: "Request a Quote",
  },
  vehiclesSection: {
    kicker: "02 · Choose Your Vehicle",
    title: "Select Your Geely",
    subtitle:
      "Pick the model you want to purchase, then continue to the payment step with your chosen bank.",
    ctaLabel: "Finance This Vehicle",
    emptyState: "No vehicles are currently available.",
    priceOnRequest: "Price on request",
  },
  stepsSection: {
    kicker: "03 · The Journey",
    title: "A Simple Purchase Journey",
    subtitle:
      "From selecting your Geely to receiving your delivery confirmation, every step is clear and secure.",
    steps: [
      {
        title: "Choose Your Bank & Vehicle",
        description:
          "Select the Geely model you want and the bank financing it.",
      },
      {
        title: "Request a Quote & Get Approved",
        description:
          "Our team prices your quote, you agree and sign, then the bank approves.",
      },
      {
        title: "Pay & Confirm",
        description:
          "Authenticate through your bank and receive your purchase reference.",
      },
    ],
  },
  benefitsSection: {
    title: "Buy with Confidence",
    benefits: [
      {
        title: "Secure Bank Payment",
        description:
          "Payment is authenticated through your selected bank.",
      },
      {
        title: "Purchase Confirmation",
        description:
          "Receive a transaction ID and purchase reference.",
      },
      {
        title: "Delivery Support",
        description:
          "Our sales team coordinates the next delivery steps.",
      },
    ],
  },
  contactStrip: {
    title: "Need help with financing?",
    body: "Call our sales team to discuss rates, eligibility and application steps.",
    callLabel: "Contact Us",
    ctaLabel: "Request a Quote",
    enabled: true,
  },
};

export const mergeFinancingPageContent = (partial?: Partial<FinancingPageContent> | null): FinancingPageContent => {
  if (!partial) return DEFAULT_FINANCING_PAGE_CONTENT;
  return {
    hero: { ...DEFAULT_FINANCING_PAGE_CONTENT.hero, ...(partial.hero || {}) },
    banksSection: { ...DEFAULT_FINANCING_PAGE_CONTENT.banksSection, ...(partial.banksSection || {}) },
    vehiclesSection: { ...DEFAULT_FINANCING_PAGE_CONTENT.vehiclesSection, ...(partial.vehiclesSection || {}) },
    stepsSection: {
      ...DEFAULT_FINANCING_PAGE_CONTENT.stepsSection,
      ...(partial.stepsSection || {}),
      steps: partial.stepsSection?.steps?.length
        ? partial.stepsSection.steps
        : DEFAULT_FINANCING_PAGE_CONTENT.stepsSection.steps,
    },
    benefitsSection: {
      ...DEFAULT_FINANCING_PAGE_CONTENT.benefitsSection,
      ...(partial.benefitsSection || {}),
      benefits: partial.benefitsSection?.benefits?.length
        ? partial.benefitsSection.benefits
        : DEFAULT_FINANCING_PAGE_CONTENT.benefitsSection.benefits,
    },
    contactStrip: { ...DEFAULT_FINANCING_PAGE_CONTENT.contactStrip, ...(partial.contactStrip || {}) },
  };
};
