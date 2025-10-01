import StoryblokClient from 'storyblok-js-client';

const SPACE_ID = '287485174451692';
const PREVIEW_TOKEN = 'Zx6SCt1wQ0wSxyycOBmrMwtt';

export const storyblok = new StoryblokClient({
  accessToken: PREVIEW_TOKEN,
});

export interface StoryblokImage {
  filename: string;
  alt?: string;
  focus?: string;
  name?: string;
}

export interface StoryblokArticle {
  id: number;
  uuid: string;
  name: string;
  slug: string;
  full_slug: string;
  created_at: string;
  published_at: string;
  content: {
    _uid: string;
    component: 'KnowledgeArticle' | 'MentalHealthArticle';
    image?: StoryblokImage;
    tags?: string[];
    script?: Array<{
      _uid: string;
      title: string;
      content: string;
      image?: StoryblokImage;
      hotline?: string;
      component: string;
    }>;
    article?: Array<{
      _uid: string;
      title: string;
      content: string;
      image?: StoryblokImage;
      component: string;
    }>;
    related_articles?: any[];
    user_journey?: any;
    [key: string]: any;
  };
}

// Helper functions to extract data from nested structure
export const getArticleTitle = (article: StoryblokArticle): string => {
  if (article.content.component === 'MentalHealthArticle') {
    return article.content.script?.[0]?.title || article.name;
  }
  return article.content.article?.[0]?.title || article.name;
};

export const getArticleContent = (article: StoryblokArticle): string => {
  if (article.content.component === 'MentalHealthArticle') {
    return article.content.script?.[0]?.content || '';
  }
  return article.content.article?.[0]?.content || '';
};

export const getArticleTags = (article: StoryblokArticle): string[] => {
  return article.content.tags || [];
};

export const getArticleExcerpt = (article: StoryblokArticle): string => {
  const content = getArticleContent(article);
  return content.length > 150 ? content.substring(0, 150) + '...' : content;
};

export const getArticleImage = (article: StoryblokArticle): StoryblokImage | null => {
  // Check main content image first
  if (article.content.image) {
    return article.content.image;
  }
  
  // Check first block's image
  if (article.content.component === 'MentalHealthArticle') {
    return article.content.script?.[0]?.image || null;
  }
  return article.content.article?.[0]?.image || null;
};

export const getArticleBlocks = (article: StoryblokArticle) => {
  if (article.content.component === 'MentalHealthArticle') {
    return article.content.script || [];
  }
  return article.content.article || [];
};

export const fetchAllArticles = async (): Promise<StoryblokArticle[]> => {
  try {
    const response = await storyblok.get('cdn/stories', {
      version: 'published',
      filter_query: {
        component: {
          in: 'KnowledgeArticle,MentalHealthArticle'
        }
      },
      per_page: 100,
    });
    return response.data.stories;
  } catch (error) {
    console.error('Error fetching articles:', error);
    return [];
  }
};

export const fetchArticleBySlug = async (slug: string): Promise<StoryblokArticle | null> => {
  try {
    const response = await storyblok.get(`cdn/stories/${slug}`, {
      version: 'published',
    });
    return response.data.story;
  } catch (error) {
    console.error('Error fetching article:', error);
    return null;
  }
};

export interface StoryblokHotline {
  id: number;
  country: string;
  number: string;
  name?: string;
  uuid: string;
}

export const fetchHotlines = async (): Promise<StoryblokHotline[]> => {
  try {
    const response = await storyblok.get('cdn/stories', {
      version: 'published',
      filter_query: {
        component: {
          in: 'Hotline'
        }
      },
      per_page: 100,
    });
    
    return response.data.stories.map((story: any) => ({
      id: story.id,
      uuid: story.uuid,
      country: story.content.country || story.name,
      number: story.content.number || '',
      name: story.content.name || '',
    }));
  } catch (error) {
    console.error('Error fetching hotlines:', error);
    return [];
  }
};
