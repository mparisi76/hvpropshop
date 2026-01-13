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
  user_created: {
    email: string;
    first_name?: string;
    last_name?: string;
    shop_name?: string;
    city?: string;
    state?: string;
    phone?: string;
  };
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
