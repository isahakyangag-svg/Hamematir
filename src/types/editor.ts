
export type SectionType = 
  | 'hero' 
  | 'search' 
  | 'stores' 
  | 'products' 
  | 'text' 
  | 'divider' 
  | 'categories' 
  | 'banners_grid'
  | 'reviews'
  | 'faq'
  | 'blog'
  | 'features'
  | 'gallery'
  | 'video'
  | 'team'
  | 'contacts'
  | 'marquee'
  | 'stories'
  | 'forms'
  | 'navigation'
  | 'product_feature'
  | 'recently_viewed'
  | 'native'
  | 'sliders';

export interface SectionConfig {
  id: string;
  type: SectionType;
  props: any;
  isVisible?: boolean;
}

export interface PageStructure {
  sections: SectionConfig[];
  updatedAt?: any;
}
