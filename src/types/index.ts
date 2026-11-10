export interface Category {
  id: string | number;
  name: string;
  slug: string;
  parent: {
    id: string | number;
    slug: string;
  } | null;
}

export interface Rental {
  id?: number | string;
  status: "confirmed" | "cancelled" | "draft"; // matches your Directus statuses
  start_date: string;
  end_date: string;
  quantity: number | string;
  item?: number | string;
  source_inquiry?: number | string;
}

export interface Prop {
  id: string | number;
  name: string;
  price: number;
  thumbnail: string;
  availability?: string;
  status?: string;
  description?: string;
  photo_gallery?: GalleryItem[];
  category: {
    id: string | number;
    name: string;
    slug: string;
    parent: {
      id: string | number;
      name: string;
      slug: string;
    } | null;
  } | null;
  user_created: Vendor;
  dimensions?: string;
  quantity_available: number;
  condition?: string;
  rentals: Rental[];
}

export interface TreeBranch {
  totalCount: number;
  children: Record<string, number>;
}

export interface CategoryTree {
  [key: string]: {
    name: string;
    slug: string;
    totalCount: number;
    children: {
      [key: string]: {
        name: string;
        slug: string;
        count: number;
      };
    };
  };
}

export interface GalleryItem {
  directus_files_id: string;
}

/** A vendor is a directus_users record. */
export interface Vendor {
  id?: string;
  email?: string;
  first_name?: string | null;
  last_name?: string | null;
  shop_name?: string | null;
  city?: string | null;
  state?: string | null;
  phone?: string | null;
  website?: string | null;
  featured_vendor?: boolean | null;
  /** Directus file id of the shop logo */
  shop_logo?: string | null;
  /** Free text: what the vendor rents (also on their application) */
  inventory?: string | null;
}
