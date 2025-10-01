import { useEffect, useState } from "react";
import { algoliasearch } from "algoliasearch";

const ALGOLIA_APP_ID = "UL02APK4BP";
const ALGOLIA_API_KEY = "08245ab5544ccf2cd538e60da1349b73";
const INDEX_NAME = "knowledge_articles";
const STORYBLOK_TOKEN = "Zx6SCt1wQ0wSxyycOBmrMwtt";

const searchClient = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_API_KEY);

export interface RelatedArticle {
  objectID?: string;
  slug?: string;
  title: string;
  excerpt?: string;
  image_url?: string;
  tags?: string[];
  type?: 'KnowledgeArticle' | 'MentalHealthArticle';
  publishedAt?: string;
}

/**
 * Fetch related articles:
 * 1. Algolia semantic search
 * 2. Storyblok fallback
 * 3. Re-rank Storyblok results via Algolia (optional)
 */
async function fetchRelatedArticles(
  currentSlug: string,
  currentTitle: string,
  tags: string[] = []
): Promise<RelatedArticle[]> {
  try {
    // 1️⃣ Algolia similarQuery
    const res = await searchClient.searchSingleIndex({
      indexName: INDEX_NAME,
      searchParams: {
        query: "",
        similarQuery: currentTitle,
        hitsPerPage: 4,
        filters: `NOT slug:${currentSlug}`, // Exclude current article
      },
    });

    if (res.hits.length > 0) {
      return res.hits
        .slice(0, 3)
        .map((hit: any) => ({
          objectID: hit.objectID,
          slug: hit.slug,
          title: hit.title,
          excerpt: hit.excerpt,
          image_url: hit.image_url,
          tags: hit.tags,
          type: hit.type,
          publishedAt: hit.published_at,
        }));
    }

    // 2️⃣ Storyblok fallback by tag
    if (tags.length > 0) {
      const storyblokRes = await fetch(
        `https://api.storyblok.com/v2/cdn/stories?token=${STORYBLOK_TOKEN}&version=published&with_tag=${tags[0]}&per_page=4&excluding_slugs=${currentSlug}`
      );
      const data = await storyblokRes.json();

      if (data.stories && data.stories.length > 0) {
        // 3️⃣ Re-rank Storyblok results with Algolia (hybrid boost)
        const titles = data.stories.map((s: any) => s.name).join(" ");
        const reRank = await searchClient.searchSingleIndex({
          indexName: INDEX_NAME,
          searchParams: {
            query: titles,
            hitsPerPage: 4,
            filters: `NOT slug:${currentSlug}`,
          },
        });

        if (reRank.hits.length > 0) {
          return reRank.hits
            .slice(0, 3)
            .map((hit: any) => ({
              objectID: hit.objectID,
              slug: hit.slug,
              title: hit.title,
              excerpt: hit.excerpt,
              image_url: hit.image_url,
              tags: hit.tags,
              type: hit.type,
              publishedAt: hit.published_at,
            }));
        }

        // Return Storyblok results if re-ranking fails
        return data.stories.slice(0, 3).map((story: any) => ({
          slug: story.slug,
          title: story.name,
          excerpt: story.content?.excerpt || "",
          image_url: story.content?.image?.filename || "",
        }));
      }
    }

    return [];
  } catch (e) {
    console.error("Error fetching related articles:", e);
    return [];
  }
}

export function useRelatedArticles(
  currentSlug: string,
  currentTitle: string,
  tags: string[] = []
): { related: RelatedArticle[]; loading: boolean } {
  const [related, setRelated] = useState<RelatedArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentTitle || !currentSlug) return;
    
    setLoading(true);
    fetchRelatedArticles(currentSlug, currentTitle, tags)
      .then(setRelated)
      .finally(() => setLoading(false));
  }, [currentSlug, currentTitle, tags.join(",")]);

  return { related, loading };
}
