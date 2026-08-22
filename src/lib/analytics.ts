export type AnalyticsParameter = string | number | boolean;
export type AnalyticsParameters = Record<string, AnalyticsParameter | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (command: string, ...args: unknown[]) => void;
  }
}

const measurementId = 'G-892TRHWKYJ';

const analyticsAvailable = () => {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return false;
  return Reflect.get(window, `ga-disable-${measurementId}`) !== true;
};

export const trackEvent = (eventName: string, parameters: AnalyticsParameters = {}) => {
  if (!analyticsAvailable()) return;
  const safeParameters = Object.fromEntries(
    Object.entries(parameters).filter((entry): entry is [string, AnalyticsParameter] => entry[1] !== undefined)
  );
  try {
    window.gtag?.('event', eventName, safeParameters);
  } catch {
    // Analytics must never interrupt the user experience.
  }
};

export const trackReviewClick = (buttonText: string) => trackEvent('request_review_click', {
  button_text: buttonText,
  page_location: typeof window === 'undefined' ? '' : window.location.href
});

export const trackContactStart = () => trackEvent('contact_start');

export const trackContactSubmit = (reference: string) => trackEvent('contact_submit', { reference });

export const trackInsightView = (articleTitle: string, category: string) => trackEvent('insight_view', {
  article_title: articleTitle,
  category
});

export const trackResourceView = (resourceTitle: string, category: string) => trackEvent('resource_view', {
  resource_title: resourceTitle,
  category
});
