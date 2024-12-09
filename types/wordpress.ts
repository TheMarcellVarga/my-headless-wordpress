export interface WordPressPost {
  ID: number;
  title: string;
  content: string;
  excerpt: string;
  date: string;
  modified: string;
  slug: string;
  URL: string;
  featured_image?: string;
  categories?: {
    [key: string]: boolean;
  };
}