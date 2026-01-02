export function formatCategory(slug: string) {
  if (!slug) return '';
  return slug
    .split('_')              // Split at underscores
    .map(word =>             // Capitalize each word
      word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(' ');              // Put them back together with spaces
}