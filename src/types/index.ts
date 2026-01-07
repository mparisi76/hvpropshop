export interface Category {
  id: string | number;
  name: string;
  slug: string;
  parent: {
    id: string | number;
    slug: string;
  } | null;
}

export interface Prop {
  id: string | number;
  name: string;
  price: number;
  thumbnail: string;
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
	vendor?: {
    first_name: string;
    email: string;
  };
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