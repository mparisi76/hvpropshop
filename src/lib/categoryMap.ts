export const CATEGORY_MAP: Record<string, string> = {
  // "Value from Directus": "Label for Website"
  outdoors: "Greens & Outdoors",
  furniture: "Mid-Century Furniture",
  lighting: "Studio Lighting",
  textiles: "Fabrics & Textiles",
  // Add as many as you need here
};

export const getCategoryLabel = (key: string) => {
  return CATEGORY_MAP[key] || key; // Fallback to the key if not mapped
};