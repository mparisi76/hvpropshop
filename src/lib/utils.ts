// import { Prop } from '@/types';

import { Category, CategoryTree, Prop } from "@/types";

// lib/utils.ts

export interface Rental {
  status: string;
  start_date: string;
  end_date: string;
  quantity: string | number;
}

/**
 * Calculates current available stock by subtracting confirmed 
 * rentals that overlap with today's date.
 */
export function getLiveAvailability(totalQuantity: number | null, rentals: Rental[] = []) {
  if (!totalQuantity) return 0;
  
  // Get today's date in YYYY-MM-DD format (matches Directus date format)
  const today = new Date().toISOString().split('T')[0];

  const bookedUnits = rentals.reduce((acc, rental) => {
    const isConfirmed = rental.status === 'confirmed';
    
    // Check if today falls within the rental window
    const isActiveToday = today >= rental.start_date && today <= rental.end_date;

    if (isConfirmed && isActiveToday) {
      return acc + (Number(rental.quantity) || 0);
    }
    return acc;
  }, 0);

  const available = totalQuantity - bookedUnits;
  
  // Safety check to never show negative inventory
  return Math.max(0, available);
}

// Keep your existing formatCategory util here as well...
// export function formatCategory(name: string) {
//   return name.replace(/-/g, ' ');
// }

export function formatCategory(slug: string) {
  if (!slug) return "";
  return slug
    .split("_") // Split at underscores
    .map(
      (
        word // Capitalize each word
      ) => word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" "); // Put them back together with spaces
}

export function getCategoryTree(
  categories: Category[],
  items: Prop[]
): CategoryTree {
  const tree: CategoryTree = {};

  // 1. Setup Parents
  categories
    .filter((c) => !c.parent)
    .forEach((p) => {
      tree[String(p.id)] = {
        // Force ID to string for the key
        name: p.name,
        slug: p.slug,
        totalCount: 0,
        children: {},
      };
    });

  // 2. Setup Children
  categories
    .filter((c) => c.parent)
    .forEach((c) => {
      const parentId = String(c.parent?.id);
      if (tree[parentId]) {
        tree[parentId].children[String(c.id)] = {
          name: c.name,
          slug: c.slug,
          count: 0,
        };
      }
    });

  // 3. Populate Counts
  items.forEach((item) => {
    // Safety check: skip if no category assigned
    if (!item.category) return;

    const catId = String(item.category.id);
    const parentId = item.category.parent
      ? String(item.category.parent.id)
      : null;

    // Logic: If it has a parent, it's a child. Increment child + parent total.
    if (parentId && tree[parentId]) {
      // It's a child item
      if (tree[parentId].children[catId]) {
        tree[parentId].children[catId].count++;
        tree[parentId].totalCount++;
      }
    }
    // If no parentId, it's assigned directly to a Top-Level category
    else if (tree[catId]) {
      tree[catId].totalCount++;
    }
  });

  return tree;
}
