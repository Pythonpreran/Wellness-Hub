import { Link } from 'react-router-dom';
import { Calendar, Tag } from 'lucide-react';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader } from './ui/card';
import { StoryblokImage } from '@/lib/storyblok';

interface ArticleCardProps {
  slug: string;
  title: string;
  excerpt?: string;
  tags?: string[];
  type: 'KnowledgeArticle' | 'MentalHealthArticle';
  publishedAt?: string;
  image?: StoryblokImage | null;
}

export const ArticleCard = ({ slug, title, excerpt, tags, type, publishedAt, image }: ArticleCardProps) => {
  const typeLabel = type === 'MentalHealthArticle' ? 'Mental Health' : 'Knowledge';
  const typeColor = type === 'MentalHealthArticle' ? 'default' : 'outline';

  return (
    <Link to={`/article/${slug}`}>
      <Card className="h-full shadow-card hover:shadow-hover transition-smooth hover:-translate-y-1 group overflow-hidden">
        {image && (
          <div className="aspect-[16/9] overflow-hidden">
            <img
              src={image.filename}
              alt={image.alt || title}
              className="w-full h-full object-cover group-hover:scale-105 transition-smooth"
            />
          </div>
        )}
        <CardHeader>
          <div className="flex items-start justify-between gap-2 mb-2">
            <Badge variant={typeColor}>{typeLabel}</Badge>
            {publishedAt && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>{new Date(publishedAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>
          <h3 className="text-xl font-semibold group-hover:text-primary transition-smooth">
            {title}
          </h3>
        </CardHeader>
        <CardContent>
          {excerpt && (
            <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
              {excerpt}
            </p>
          )}
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Tag className="h-3 w-3 text-muted-foreground" />
              {tags.slice(0, 4).map((tag, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {tags.length > 4 && (
                <Badge variant="secondary" className="text-xs">
                  +{tags.length - 4} more
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
};
