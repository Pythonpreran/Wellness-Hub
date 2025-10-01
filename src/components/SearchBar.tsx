import { useState, useEffect, useRef } from 'react';
import { Search, X, Phone, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { searchArticles, AlgoliaArticle } from '@/lib/algolia';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { useCalmMode } from '@/contexts/CalmModeContext';

// Comprehensive crisis keywords and phrases
const CRISIS_KEYWORDS = [
  // Direct self-harm expressions
  'suicide', 'suicidal', 'kill myself', 'killing myself', 'end my life', 'end it all',
  'want to die', 'wanna die', 'wish i was dead', 'wish i were dead', 'i want to die',
  'better off dead', 'ready to die', 'going to kill', 'planning to kill',
  
  // Self-harm methods
  'hang myself', 'hanging myself', 'cut myself', 'cutting myself', 'hurt myself',
  'overdose', 'pills', 'jump off', 'jumping off', 'shoot myself',
  
  // Emotional crisis states
  'no reason to live', 'nothing to live for', 'life is meaningless', 'cant go on',
  "can't go on", 'cant take it', "can't take it", 'give up on life', 'giving up',
  'no hope', 'hopeless', 'worthless', 'nobody cares', 'no one cares',
  'alone forever', 'tired of living', 'sick of living', 'hate myself',
  
  // Mental health emergencies  
  'mental breakdown', 'breaking down', 'losing my mind', 'going crazy',
  'severe depression', 'deeply depressed', 'extreme anxiety', 'panic attack',
  'crisis', 'emergency', 'help me please', 'desperate',
  
  // Expressions of pain
  'unbearable pain', 'too much pain', 'suffering too much', 'cant handle',
  "can't handle", 'trapped', 'helpless', 'beyond help', 'no way out',
  
  // Additional variations
  'dont want to live', "don't want to live", 'not worth living', 
  'everyone would be better', 'burden to everyone', 'world without me'
];

const isCrisis = (query: string): boolean => {
  const lowerQuery = query.toLowerCase().trim();
  return CRISIS_KEYWORDS.some(keyword => lowerQuery.includes(keyword));
};

export const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AlgoliaArticle[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showCrisisAlert, setShowCrisisAlert] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { setIsCalm } = useCalmMode();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchWithDebounce = setTimeout(async () => {
      if (query.trim().length >= 2) {
        // Check for crisis keywords first
        if (isCrisis(query)) {
          setShowCrisisAlert(true);
          setIsCalm(true);
          setResults([]);
          setIsOpen(false);
          return;
        }
        
        setShowCrisisAlert(false);
        setIsSearching(true);
        const searchResults = await searchArticles(query);
        console.log('Full Algolia search results:', searchResults);
        console.log('Algolia search results mapped:', searchResults.map(r => ({ 
          objectID: r.objectID, 
          slug: r.slug, 
          title: r.title,
          allKeys: Object.keys(r)
        })));
        setResults(searchResults);
        setIsSearching(false);
        setIsOpen(true);
      } else {
        setResults([]);
        setIsOpen(false);
        setShowCrisisAlert(false);
      }
    }, 300);

    return () => clearTimeout(searchWithDebounce);
  }, [query]);

  const handleResultClick = (slug: string) => {
    console.log('Search result slug:', slug);
    if (!slug) {
      console.error('No slug provided');
      return;
    }
    // Remove any "articles/" prefix if it exists
    const cleanSlug = slug.startsWith('articles/') ? slug.replace('articles/', '') : slug;
    console.log('Clean slug:', cleanSlug);
    navigate(`/article/${cleanSlug}`);
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  const highlightText = (text: string, highlight?: any) => {
    if (!highlight?.value) return text;
    return <span dangerouslySetInnerHTML={{ __html: highlight.value }} />;
  };

  return (
    <div ref={searchRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search articles, tags, or topics..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-10"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-smooth"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full mt-2 w-full rounded-lg border bg-card shadow-hover max-h-96 overflow-y-auto">
          <div className="p-2">
            {results.map((result) => (
              <button
                key={result.objectID}
                onClick={() => handleResultClick(result.slug || result.objectID)}
                className="w-full text-left p-3 rounded-lg hover:bg-muted transition-smooth"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm mb-1">
                      {highlightText(result.title, result._highlightResult?.title)}
                    </h3>
                    {result.excerpt && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {highlightText(result.excerpt, result._highlightResult?.content)}
                      </p>
                    )}
                    {result.tags && result.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {result.tags.slice(0, 3).map((tag, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <Badge 
                    variant={result.type === 'MentalHealthArticle' ? 'default' : 'outline'}
                    className="shrink-0"
                  >
                    {result.type === 'MentalHealthArticle' ? 'Mental Health' : 'Knowledge'}
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {isOpen && query.trim().length >= 2 && results.length === 0 && !isSearching && !showCrisisAlert && (
        <div className="absolute top-full mt-2 w-full rounded-lg border bg-card shadow-hover p-4 text-center text-sm text-muted-foreground">
          No articles found for "{query}"
        </div>
      )}

      {showCrisisAlert && (
        <div className="absolute top-full mt-2 w-full rounded-lg border-2 border-red-500 bg-red-50 dark:bg-red-950 shadow-lg p-6 z-50">
          <div className="flex items-start gap-3 mb-4">
            <Heart className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-lg text-red-600 dark:text-red-400 mb-2">You're Not Alone</h3>
              <p className="text-sm text-gray-800 dark:text-gray-200 mb-4">
                It's okay to feel this way. Please be calm. Nothing bad will happen. Help is available, and people care about you.
              </p>
            </div>
          </div>
          
          <div className="space-y-3 bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-sm flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <Phone className="h-4 w-4" />
              Crisis Helplines (24/7)
            </h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="font-semibold min-w-[60px] text-gray-900 dark:text-gray-100">India:</span>
                <div>
                  <a href="tel:9152987821" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                    +91 91529 87821
                  </a>
                  <span className="text-gray-600 dark:text-gray-400"> (Vandrevala Foundation)</span>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold min-w-[60px] text-gray-900 dark:text-gray-100">US:</span>
                <div>
                  <a href="tel:988" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                    988
                  </a>
                  <span className="text-gray-600 dark:text-gray-400"> (Suicide & Crisis Lifeline)</span>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold min-w-[60px] text-gray-900 dark:text-gray-100">Global:</span>
                <a 
                  href="https://findahelpline.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  findahelpline.com
                </a>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
