// Global Search Component
// Advanced search across chat history, files, workflows, and all app data

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Filter, 
  Clock, 
  FileText, 
  MessageSquare, 
  Workflow, 
  Mail, 
  Calendar, 
  User, 
  Tag,
  ArrowRight,
  Sparkles,
  X,
  SortAsc,
  SortDesc,
  Grid,
  List,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProviderIcon } from '@/components/ui/provider-icons';
import { globalAIService } from '@/services/globalAIService';
import { firebaseSyncService } from '@/services/firebaseSyncService';
import { useAuth } from '@/context/AuthContext';

export interface SearchResult {
  id: string;
  type: 'chat' | 'file' | 'workflow' | 'email' | 'calendar' | 'contact' | 'task';
  title: string;
  content: string;
  snippet: string;
  timestamp: Date;
  relevanceScore: number;
  metadata: {
    source?: string;
    author?: string;
    tags?: string[];
    fileType?: string;
    size?: number;
    provider?: string;
    category?: string;
  };
  url?: string;
}

export interface SearchFilters {
  types: string[];
  dateRange: {
    start?: Date;
    end?: Date;
  };
  sources: string[];
  tags: string[];
  authors: string[];
  minRelevance: number;
}

interface GlobalSearchProps {
  onResultSelect?: (result: SearchResult) => void;
  className?: string;
  placeholder?: string;
  showFilters?: boolean;
  maxResults?: number;
}

export function GlobalSearch({
  onResultSelect,
  className,
  placeholder = "Search everything...",
  showFilters = true,
  maxResults = 50
}: GlobalSearchProps) {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'type'>('relevance');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedFilters, setSelectedFilters] = useState<SearchFilters>({
    types: [],
    dateRange: {},
    sources: [],
    tags: [],
    authors: [],
    minRelevance: 0.3
  });

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.trim().length > 2) {
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(query);
      }, 300);
    } else {
      setResults([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, selectedFilters]);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!user || !searchQuery.trim()) return;

    setIsSearching(true);

    try {
      // Perform parallel searches across different data sources
      const [chatResults, workflowResults] = await Promise.allSettled([
        searchChatHistory(searchQuery),
        searchWorkflows(searchQuery)
      ]);

      // Combine and process results
      const allResults: SearchResult[] = [];

      if (chatResults.status === 'fulfilled') {
        allResults.push(...chatResults.value);
      }
      if (workflowResults.status === 'fulfilled') {
        allResults.push(...workflowResults.value);
      }

      // Apply filters
      const filteredResults = applyFilters(allResults, selectedFilters);

      // Sort results
      const sortedResults = sortResults(filteredResults, sortBy, sortOrder);

      // Limit results
      const limitedResults = sortedResults.slice(0, maxResults);

      setResults(limitedResults);

    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [user, selectedFilters, sortBy, sortOrder, maxResults]);

  const searchChatHistory = async (query: string): Promise<SearchResult[]> => {
    try {
      const chatSessions = await firebaseSyncService.getChatSessions(100);
      const results: SearchResult[] = [];

      for (const session of chatSessions) {
        // Search in chat messages
        for (const message of session.messages) {
          if (message.content.toLowerCase().includes(query.toLowerCase())) {
            results.push({
              id: `chat-${session.id}-${message.id}`,
              type: 'chat',
              title: session.title || 'Chat Session',
              content: message.content,
              snippet: generateSnippet(message.content, query),
              timestamp: new Date(message.timestamp),
              relevanceScore: calculateRelevance(message.content, query),
              metadata: {
                source: 'chat',
                provider: message.metadata?.providerId,
                category: 'conversation'
              },
              url: `/chat/${session.id}#${message.id}`
            });
          }
        }
      }

      return results;
    } catch (error) {
      console.error('Chat search error:', error);
      return [];
    }
  };

  const searchWorkflows = async (query: string): Promise<SearchResult[]> => {
    try {
      const workflows = await firebaseSyncService.getWorkflows();
      const results: SearchResult[] = [];

      for (const workflow of workflows) {
        const searchText = `${workflow.name} ${workflow.description}`.toLowerCase();
        if (searchText.includes(query.toLowerCase())) {
          results.push({
            id: `workflow-${workflow.id}`,
            type: 'workflow',
            title: workflow.name,
            content: workflow.description,
            snippet: generateSnippet(workflow.description, query),
            timestamp: workflow.updatedAt,
            relevanceScore: calculateRelevance(searchText, query),
            metadata: {
              source: 'workflows',
              category: 'automation',
              tags: ['workflow', 'automation']
            },
            url: `/workflows/${workflow.id}`
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Workflow search error:', error);
      return [];
    }
  };

  const applyFilters = (results: SearchResult[], filters: SearchFilters): SearchResult[] => {
    return results.filter(result => {
      // Type filter
      if (filters.types.length > 0 && !filters.types.includes(result.type)) {
        return false;
      }

      // Date range filter
      if (filters.dateRange.start && result.timestamp < filters.dateRange.start) {
        return false;
      }
      if (filters.dateRange.end && result.timestamp > filters.dateRange.end) {
        return false;
      }

      // Source filter
      if (filters.sources.length > 0 && !filters.sources.includes(result.metadata.source || '')) {
        return false;
      }

      // Relevance filter
      if (result.relevanceScore < filters.minRelevance) {
        return false;
      }

      return true;
    });
  };

  const sortResults = (results: SearchResult[], sortBy: string, order: string): SearchResult[] => {
    return [...results].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'relevance':
          comparison = b.relevanceScore - a.relevanceScore;
          break;
        case 'date':
          comparison = b.timestamp.getTime() - a.timestamp.getTime();
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        default:
          comparison = b.relevanceScore - a.relevanceScore;
      }

      return order === 'asc' ? -comparison : comparison;
    });
  };

  const generateSnippet = (content: string, query: string, maxLength: number = 150): string => {
    const queryIndex = content.toLowerCase().indexOf(query.toLowerCase());
    if (queryIndex === -1) {
      return content.substring(0, maxLength) + (content.length > maxLength ? '...' : '');
    }

    const start = Math.max(0, queryIndex - 50);
    const end = Math.min(content.length, queryIndex + query.length + 50);
    const snippet = content.substring(start, end);
    
    return (start > 0 ? '...' : '') + snippet + (end < content.length ? '...' : '');
  };

  const calculateRelevance = (content: string, query: string): number => {
    const contentLower = content.toLowerCase();
    const queryLower = query.toLowerCase();
    
    // Simple relevance calculation
    const exactMatches = (contentLower.match(new RegExp(queryLower, 'g')) || []).length;
    const wordMatches = queryLower.split(' ').filter(word => 
      contentLower.includes(word)
    ).length;
    
    return Math.min(1, (exactMatches * 0.5 + wordMatches * 0.3) / query.split(' ').length);
  };

  const getResultIcon = (type: string) => {
    const icons = {
      chat: MessageSquare,
      file: FileText,
      workflow: Workflow,
      email: Mail,
      calendar: Calendar,
      contact: User,
      task: Clock
    };
    const Icon = icons[type as keyof typeof icons] || FileText;
    return <Icon className="h-4 w-4" />;
  };

  const handleResultClick = (result: SearchResult) => {
    if (onResultSelect) {
      onResultSelect(result);
    } else if (result.url) {
      window.open(result.url, '_blank');
    }
  };

  const clearFilters = () => {
    setSelectedFilters({
      types: [],
      dateRange: {},
      sources: [],
      tags: [],
      authors: [],
      minRelevance: 0.3
    });
  };

  return (
    <Card className={cn("w-full max-w-4xl", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Global Search
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
            >
              {viewMode === 'list' ? <Grid className="h-4 w-4" /> : <List className="h-4 w-4" />}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="pl-10 pr-10"
            />
            {query && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setQuery('')}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          
          {showFilters && (
            <Button
              variant="outline"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          )}
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <Card className="p-4 bg-gray-50 dark:bg-gray-800">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Content Types</label>
                <div className="flex flex-wrap gap-2">
                  {['chat', 'file', 'workflow', 'email', 'calendar'].map(type => (
                    <Badge
                      key={type}
                      variant={selectedFilters.types.includes(type) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        setSelectedFilters(prev => ({
                          ...prev,
                          types: prev.types.includes(type)
                            ? prev.types.filter(t => t !== type)
                            : [...prev.types, type]
                        }));
                      }}
                    >
                      {getResultIcon(type)}
                      <span className="ml-1 capitalize">{type}</span>
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full p-2 border rounded-md bg-white dark:bg-gray-700"
                >
                  <option value="relevance">Relevance</option>
                  <option value="date">Date</option>
                  <option value="type">Type</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Min Relevance</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={selectedFilters.minRelevance}
                  onChange={(e) => setSelectedFilters(prev => ({
                    ...prev,
                    minRelevance: parseFloat(e.target.value)
                  }))}
                  className="w-full"
                />
                <span className="text-xs text-gray-500">
                  {Math.round(selectedFilters.minRelevance * 100)}%
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4">
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
              <span className="text-sm text-gray-500">
                {results.length} results found
              </span>
            </div>
          </Card>
        )}

        {/* Search Results */}
        <div className="space-y-2">
          {isSearching && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Searching...</span>
            </div>
          )}

          {!isSearching && query && results.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No results found for "{query}"</p>
              <p className="text-sm">Try different keywords or adjust your filters</p>
            </div>
          )}

          {!isSearching && results.length > 0 && (
            <ScrollArea className="max-h-96">
              <div className={cn(
                viewMode === 'grid' 
                  ? "grid grid-cols-1 md:grid-cols-2 gap-4" 
                  : "space-y-2"
              )}>
                {results.map((result) => (
                  <Card
                    key={result.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleResultClick(result)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getResultIcon(result.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium truncate">{result.title}</h4>
                            <Badge variant="secondary" className="text-xs">
                              {result.type}
                            </Badge>
                            {result.metadata.provider && (
                              <ProviderIcon 
                                provider={result.metadata.provider} 
                                size="xs" 
                              />
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                            {result.snippet}
                          </p>
                          
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center gap-2">
                              <Clock className="h-3 w-3" />
                              <span>{result.timestamp.toLocaleDateString()}</span>
                              {result.metadata.source && (
                                <>
                                  <span>•</span>
                                  <span className="capitalize">{result.metadata.source}</span>
                                </>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <Sparkles className="h-3 w-3" />
                              <span>{Math.round(result.relevanceScore * 100)}%</span>
                            </div>
                          </div>
                        </div>
                        
                        <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* AI Search Suggestions */}
        {query && results.length > 0 && (
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 text-sm">
                <Sparkles className="h-4 w-4 text-blue-500" />
                <span className="font-medium">AI Suggestion:</span>
                <span>Try searching for related terms or use voice search for better results</span>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}