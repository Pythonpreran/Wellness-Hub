import { useEffect, useState } from 'react';
import { fetchAllArticles, StoryblokArticle, getArticleTitle, getArticleTags, getArticleExcerpt, getArticleImage } from '@/lib/storyblok';
import { Header } from '@/components/Header';
import { ArticleCard } from '@/components/ArticleCard';
import { TagFilter } from '@/components/TagFilter';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles } from 'lucide-react';

const Index = () => {
  const [articles, setArticles] = useState<StoryblokArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);

  useEffect(() => {
    const loadArticles = async () => {
      setLoading(true);
      const data = await fetchAllArticles();
      setArticles(data);
      
      // Extract unique tags
      const tags = new Set<string>();
      data.forEach(article => {
        const articleTags = getArticleTags(article);
        articleTags.forEach(tag => tags.add(tag));
      });
      setAllTags(Array.from(tags).sort());
      
      setLoading(false);
    };
    loadArticles();
  }, []);

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const filteredArticles = selectedTags.length > 0
    ? articles.filter(article => {
        const articleTags = getArticleTags(article);
        return selectedTags.some(tag => articleTags.includes(tag));
      })
    : articles;

  const knowledgeArticles = filteredArticles.filter(a => a.content.component === 'KnowledgeArticle');
  const mentalHealthArticles = filteredArticles.filter(a => a.content.component === 'MentalHealthArticle');

  return (
    <>
      <Header />
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="gradient-primary text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">Your Path to Wellness</span>
            </div>
            <h1 className="text-5xl font-bold mb-6">
              Discover Knowledge & Mental Health Resources
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Explore curated articles to support your personal growth, mental wellness, and learning journey
            </p>
          </div>
        </section>

        {/* Content Section */}
        <section className="container mx-auto px-4 py-12">
          <TagFilter
            allTags={allTags}
            selectedTags={selectedTags}
            onTagToggle={handleTagToggle}
            onClearAll={() => setSelectedTags([])}
          />

          {loading ? (
            <div className="space-y-12">
              {[1, 2].map((section) => (
                <div key={section}>
                  <Skeleton className="h-10 w-64 mb-6" />
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-64" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Mental Health Articles */}
              {mentalHealthArticles.length > 0 && (
                <div className="mb-16">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-1 w-12 gradient-primary rounded-full"></div>
                    <h2 className="text-3xl font-bold">Mental Health</h2>
                    <div className="h-1 flex-1 bg-border rounded-full"></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {mentalHealthArticles.map((article) => {
                      console.log('Storyblok article slug:', article.slug, 'title:', getArticleTitle(article));
                      return (
                        <ArticleCard
                          key={article.id}
                          slug={article.slug}
                          title={getArticleTitle(article)}
                          excerpt={getArticleExcerpt(article)}
                          tags={getArticleTags(article)}
                          type={article.content.component}
                          publishedAt={article.published_at}
                          image={getArticleImage(article)}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Knowledge Articles */}
              {knowledgeArticles.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-1 w-12 gradient-wellness rounded-full"></div>
                    <h2 className="text-3xl font-bold">Knowledge Base</h2>
                    <div className="h-1 flex-1 bg-border rounded-full"></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {knowledgeArticles.map((article) => (
                      <ArticleCard
                        key={article.id}
                        slug={article.slug}
                        title={getArticleTitle(article)}
                        excerpt={getArticleExcerpt(article)}
                        tags={getArticleTags(article)}
                        type={article.content.component}
                        publishedAt={article.published_at}
                        image={getArticleImage(article)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {filteredArticles.length === 0 && (
                <div className="text-center py-20">
                  <p className="text-xl text-muted-foreground">
                    No articles found matching your filters.
                  </p>
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </>
  );
};

export default Index;
