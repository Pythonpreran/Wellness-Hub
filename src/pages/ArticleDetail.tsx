import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Calendar, Tag, Sparkles, Volume2, VolumeX, Heart } from 'lucide-react';
import { fetchArticleBySlug, StoryblokArticle, getArticleTitle, getArticleContent, getArticleTags, getArticleImage, getArticleBlocks } from '@/lib/storyblok';
import { useRelatedArticles } from '@/hooks/use-related-articles';
import { useCalmMode } from '@/contexts/CalmModeContext';
import { Header } from '@/components/Header';
import { ArticleCard } from '@/components/ArticleCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function ArticleDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<StoryblokArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<string>('');
  const [summarizing, setSummarizing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [calmContent, setCalmContent] = useState<{title: string; content: string}[]>([]);
  const [loadingCalm, setLoadingCalm] = useState(false);
  const { isCalm } = useCalmMode();

  const title = article ? getArticleTitle(article) : '';
  const tags = article ? getArticleTags(article) : [];
  const { related, loading: relatedLoading } = useRelatedArticles(slug || '', title, tags);

  useEffect(() => {
    const loadArticle = async () => {
      if (!slug) return;
      setLoading(true);
      const data = await fetchArticleBySlug(slug);
      setArticle(data);
      setLoading(false);
      setSummary('');
      setCalmContent([]);
    };
    loadArticle();
  }, [slug]);

  useEffect(() => {
    const rewriteForCalmMode = async () => {
      if (!article || !isCalm || calmContent.length > 0) return;
      
      setLoadingCalm(true);
      try {
        const articleBlocks = getArticleBlocks(article);
        const rewrittenBlocks = await Promise.all(
          articleBlocks.map(async (block) => {
            const contentToRewrite = [block.title, block.content].filter(Boolean).join('\n\n');
            
            const response = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=AIzaSyDDpj4zoKVHaopDiFroi-zyxiwwD1R5Srg`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [{
                    parts: [{
                      text: `You are an empathetic content assistant. The user is in a vulnerable state. Rewrite the following article content in a calm, soothing, and positive tone. Keep it factual but soften harsh language. Keep length and structure similar, but aim for emotional comfort. Return output in plain text, 3-4 paragraphs maximum.\n\nARTICLE CONTENT:\n${contentToRewrite}`
                    }]
                  }]
                })
              }
            );

            const data = await response.json();
            const rewritten = data.candidates?.[0]?.content?.parts?.[0]?.text || contentToRewrite;
            
            return {
              ...block,
              content: rewritten
            };
          })
        );
        
        setCalmContent(rewrittenBlocks);
      } catch (error) {
        console.error('Error rewriting for calm mode:', error);
      } finally {
        setLoadingCalm(false);
      }
    };

    rewriteForCalmMode();
  }, [article, isCalm]);

  const handleSummarize = async () => {
    if (!article) return;
    
    setSummarizing(true);
    try {
      const articleBlocks = getArticleBlocks(article);
      const fullContent = articleBlocks.map(block => block.content).join('\n\n');
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=AIzaSyDDpj4zoKVHaopDiFroi-zyxiwwD1R5Srg`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `Provide a very short summary (2-3 sentences max) of the following article:\n\n${fullContent}`
              }]
            }]
          })
        }
      );

      const data = await response.json();
      const generatedSummary = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Unable to generate summary.';
      setSummary(generatedSummary);
    } catch (error) {
      console.error('Error generating summary:', error);
      setSummary('Failed to generate summary. Please try again.');
    } finally {
      setSummarizing(false);
    }
  };

  const handleReadAloud = () => {
    if (!('speechSynthesis' in window)) {
      alert('Sorry, your browser does not support Text-to-Speech.');
      return;
    }

    if (isSpeaking) {
      // Stop speaking
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      // Start speaking
      const articleBlocks = getArticleBlocks(article!);
      const fullContent = articleBlocks.map(block => {
        const parts = [];
        if (block.title) parts.push(block.title);
        if (block.content) parts.push(block.content);
        return parts.join('. ');
      }).join('\n\n');

      const utterance = new SpeechSynthesisUtterance(fullContent);
      utterance.lang = 'en-US';
      utterance.rate = 1;
      utterance.pitch = 1;
      
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Skeleton className="h-8 w-32 mb-4" />
            <Skeleton className="h-12 w-full mb-4" />
            <Skeleton className="h-6 w-48 mb-8" />
            <Skeleton className="h-96 w-full" />
          </div>
        </main>
      </>
    );
  }

  if (!article) {
    return (
      <>
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl font-bold mb-4">Article not found</h1>
            <Link to="/">
              <Button>Return to Home</Button>
            </Link>
          </div>
        </main>
      </>
    );
  }

  const { content } = article;
  const articleImage = getArticleImage(article);
  const articleBlocks = getArticleBlocks(article);
  const typeLabel = content.component === 'MentalHealthArticle' ? 'Mental Health' : 'Knowledge';
  const typeColor = content.component === 'MentalHealthArticle' ? 'default' : 'outline';

  const displayBlocks = isCalm && calmContent.length > 0 ? calmContent : articleBlocks;

  return (
    <>
      <Header />
      <main className={`container mx-auto px-4 py-8 ${isCalm ? 'bg-gradient-to-b from-blue-50 to-green-50 dark:from-blue-950 dark:to-green-950' : ''}`}>
        <div className="max-w-4xl mx-auto">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-smooth mb-6">
            <ArrowLeft className="h-4 w-4" />
            Back to all articles
          </Link>

          {isCalm && (
            <div className="mb-8 p-6 bg-gradient-to-r from-blue-100 to-green-100 dark:from-blue-900 dark:to-green-900 rounded-lg border-2 border-blue-300 dark:border-blue-700">
              <div className="flex items-center gap-3">
                <Heart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <p className="text-lg font-medium text-gray-800 dark:text-gray-100">
                  You are not alone. This content has been adjusted to support you.
                </p>
              </div>
            </div>
          )}

          <article className="mb-12">
            <div className="mb-6">
              <Badge variant={typeColor} className="mb-4">{typeLabel}</Badge>
              <h1 className={`font-bold mb-4 ${isCalm ? 'text-5xl' : 'text-4xl'}`}>{title}</h1>
              {article.published_at && (
                <div className="flex items-center gap-2 text-muted-foreground mb-4">
                  <Calendar className="h-4 w-4" />
                  <time dateTime={article.published_at}>
                    {new Date(article.published_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </time>
                </div>
              )}
              
              <div className="flex items-center gap-4 mb-4">
                <Button 
                  onClick={handleSummarize} 
                  disabled={summarizing}
                  variant="outline"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {summarizing ? 'Summarizing...' : 'Summarize'}
                </Button>

                <Button 
                  onClick={handleReadAloud}
                  variant="outline"
                >
                  {isSpeaking ? <VolumeX className="h-4 w-4 mr-2" /> : <Volume2 className="h-4 w-4 mr-2" />}
                  {isSpeaking ? 'Stop Reading' : 'Read Aloud'}
                </Button>
              </div>

              {summary && (
                <div className="p-4 bg-muted/50 rounded-lg border mb-4">
                  <p className="text-sm leading-relaxed">{summary}</p>
                </div>
              )}
            </div>

            {/* Main Article Image - only show if no images in blocks */}
            {articleImage && !articleBlocks.some(block => block.image) && (
              <div className="mb-8">
                <img
                  src={articleImage.filename}
                  alt={articleImage.alt || title}
                  className="w-full h-auto max-h-[500px] object-contain rounded-lg shadow-lg"
                />
              </div>
            )}

            {/* Article Blocks with Images */}
            {loadingCalm ? (
              <div className="space-y-6">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : (
              <div className={`prose max-w-none mb-8 space-y-8 ${isCalm ? 'prose-xl' : 'prose-lg'}`}>
                {displayBlocks.map((block, index) => {
                  const hasImage = 'image' in block && block.image && typeof block.image === 'object' && 'filename' in block.image;
                  return (
                    <div key={index} className="block-content">
                      {hasImage && (
                        <div className="not-prose mb-6">
                          <img
                            src={(block.image as any).filename}
                            alt={(block.image as any).alt || block.title}
                            className="w-full h-auto max-h-[400px] object-contain rounded-lg shadow-md"
                          />
                        </div>
                      )}
                      {block.title && <h2 className={`font-semibold mb-4 ${isCalm ? 'text-3xl' : 'text-2xl'}`}>{block.title}</h2>}
                      <div className={`whitespace-pre-wrap ${isCalm ? 'leading-loose text-lg' : 'leading-relaxed'}`}>{block.content}</div>
                      {'hotline' in block && block.hotline && (
                        <div className="not-prose mt-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
                          <p className="font-medium text-primary">Crisis Hotline: {String(block.hotline)}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {tags.length > 0 && (
              <div className="border-t pt-6">
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-semibold text-muted-foreground">Tags</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, idx) => (
                    <Badge key={idx} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </article>

          {content.user_journey && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Learning Path Navigation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between gap-4">
                  {content.user_journey.previous && (
                    <Link to={`/article/${content.user_journey.previous}`} className="flex-1">
                      <Button variant="outline" className="w-full justify-start">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Previous Article
                      </Button>
                    </Link>
                  )}
                  {content.user_journey.next && (
                    <Link to={`/article/${content.user_journey.next}`} className="flex-1">
                      <Button variant="outline" className="w-full justify-end">
                        Next Article
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {(relatedLoading || related.length > 0) && (
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-6">Similar Articles</h2>
              {relatedLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i}>
                      <Skeleton className="h-48 w-full mb-4" />
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {related.slice(0, 3).map((article, idx) => (
                    <ArticleCard
                      key={article.objectID || article.slug || idx}
                      slug={article.slug || ''}
                      title={article.title}
                      excerpt={article.excerpt}
                      tags={article.tags}
                      type={article.type || 'KnowledgeArticle'}
                      publishedAt={article.publishedAt}
                      image={article.image_url ? { filename: article.image_url, alt: article.title } : null}
                    />
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </main>
    </>
  );
}
