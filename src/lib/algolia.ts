import { algoliasearch } from 'algoliasearch';

const APP_ID = 'UL02APK4BP';
const SEARCH_API_KEY = '08245ab5544ccf2cd538e60da1349b73';

export const searchClient = algoliasearch(APP_ID, SEARCH_API_KEY);

export interface AlgoliaArticle {
  objectID: string;
  title: string;
  content: string;
  tags: string[];
  type: 'KnowledgeArticle' | 'MentalHealthArticle';
  slug: string;
  excerpt?: string;
  _highlightResult?: any;
}

export const searchArticles = async (query: string, filters?: string): Promise<AlgoliaArticle[]> => {
  try {
    const result = await searchClient.searchSingleIndex({
      indexName: 'knowledge_articles',
      searchParams: {
        query,
        hitsPerPage: 20,
        attributesToHighlight: ['title', 'content', 'tags'],
        ...(filters && { filters }),
      },
    });
    return result.hits as AlgoliaArticle[];
  } catch (error) {
    console.error('Error searching articles:', error);
    return [];
  }
};
