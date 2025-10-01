import { Link } from 'react-router-dom';
import { Brain } from 'lucide-react';
import { SearchBar } from './SearchBar';
import { AddArticleForm } from './AddArticleForm';
import { GlobalHotlines } from './GlobalHotlines';

export const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 transition-smooth hover:opacity-80">
            <div className="rounded-lg bg-gradient-to-br from-primary to-secondary p-2">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Wellness Hub</h1>
              <p className="text-xs text-muted-foreground">Knowledge & Mental Health</p>
            </div>
          </Link>
          
          <div className="flex-1 max-w-md">
            <SearchBar />
          </div>

          <div className="flex items-center gap-2">
            <AddArticleForm />
            <GlobalHotlines />
          </div>
        </div>
      </div>
    </header>
  );
};
