export const calculateReadingTime = (body = '') => {
  const text = body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[#>*_[\]()!-]/g, ' ');
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(words / 200))} min read`;
};

export const formatArticleDate = (date: Date, short = false) => new Intl.DateTimeFormat('en-US', short
  ? { month: 'short', day: 'numeric', year: 'numeric' }
  : { month: 'long', day: 'numeric', year: 'numeric' }
).format(date);
