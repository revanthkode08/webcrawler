import { useState, useEffect, useRef } from "react"
import axios from "axios"
import { useLocation, Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Loader2, Link2, ExternalLink, Activity, Clock, Plus, Command, Hash, Building2, FileText, TrendingUp, Filter, ArrowUpDown } from "lucide-react"
import AiSearchSummary from "../components/user/AiSearchSummary"
import { BASE_URL } from "../api/client"

const TYPE_ICONS = {
  keyword:  <Search className="h-3.5 w-3.5 text-muted-foreground" />,
  semantic: <Hash className="h-3.5 w-3.5 text-blue-400" />,
  entity:   <Building2 className="h-3.5 w-3.5 text-purple-400" />,
  title:    <FileText className="h-3.5 w-3.5 text-emerald-400" />
}

const TYPE_LABELS = {
  keyword:  null,           // no label — default search term
  semantic: 'topic',
  entity:   'company / tech',
  title:    'page'
}

export default function Home() {
  const [Query, setQuery] = useState("")
  const [Suggestions, setSuggestions] = useState([])
  const [SearchHistory, setSearchHistory] = useState([])
  const [ShowSuggestions, setShowSuggestions] = useState(false)
  const [Results, setResults] = useState([])
  const [HasSearched, setHasSearched] = useState(false)
  const [IsLoading, setIsLoading] = useState(false)
  const [ShowAuthPrompt, setShowAuthPrompt] = useState(false)
  
  // Pagination & Filters
  const [Page, setPage] = useState(1)
  const [TotalPages, setTotalPages] = useState(1)
  const [DomainFilter, setDomainFilter] = useState("")
  const [SearchStats, setSearchStats] = useState(null)
  const [isFocused, setIsFocused] = useState(false)

  // NEW STATES
  const [SuggestionsLoading, setSuggestionsLoading] = useState(false)
  const [Trending, setTrending] = useState([])
  const [RelatedSearches, setRelatedSearches] = useState([])
  const [ActiveSuggestionIndex, setActiveSuggestionIndex] = useState(-1)
  const [CategoryFilter, setCategoryFilter] = useState('')
  const [SortBy, setSortBy] = useState('relevance')
  const [AvailableCategories, setAvailableCategories] = useState([])

  const searchContainerRef = useRef(null)
  const location = useLocation()
  const debounceRef = useRef(null)

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const qParam = params.get("q")
    if (qParam) {
      setQuery(qParam)
      executeSearch(qParam, 1)
    }
  }, [location.search])

  useEffect(() => {
    const localHistory = JSON.parse(localStorage.getItem('search_history') || '[]');
    setSearchHistory(localHistory.slice(0, 5));
  }, [])

  useEffect(() => {
    axios.get(`${BASE_URL}/api/search/trending`)
      .then(res => setTrending(res.data))
      .catch(console.error)
  }, [])

  const saveHistory = (q) => {
    const arr = JSON.parse(localStorage.getItem('search_history') || '[]');
    arr.unshift(q);
    const unique = [...new Set(arr)].slice(0, 5);
    localStorage.setItem('search_history', JSON.stringify(unique));
    setSearchHistory(unique);
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSuggestions(false)
        setIsFocused(false)
        setActiveSuggestionIndex(-1)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const fetchSuggestions = async (q) => {
    if (q.length < 2) { setSuggestions([]); return }
    setSuggestionsLoading(true)
    try {
      const res = await axios.get(
        `${BASE_URL}/api/search/suggestions?q=${q}`
      )
      setSuggestions(res.data)
    } catch(e) {
      console.error('Suggestions error', e)
    } finally {
      setSuggestionsLoading(false)
    }
  }

  const handleQueryChange = (e) => {
    const val = e.target.value
    setQuery(val)
    setShowSuggestions(true)
    setActiveSuggestionIndex(-1)
    
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (val.trim()) fetchSuggestions(val.trim())
      else setSuggestions([])
    }, 250)
  }

  const executeSearch = async (q, pageToFetch = 1) => {
    if (!q.trim()) return

    setIsLoading(true)
    setShowSuggestions(false)
    setIsFocused(false)
    setActiveSuggestionIndex(-1)

    try {
      const startTime = performance.now()
      const Res = await axios.get(
        `${BASE_URL}/api/search?q=${q}&page=${pageToFetch}&limit=10&domain=${DomainFilter}&category=${CategoryFilter}&sort=${SortBy}`
      )
      const endTime = performance.now()
      
      if (pageToFetch === 1) {
        saveHistory(q);
      }

      setResults(Res.data.results || [])
      setPage(Res.data.currentPage || 1)
      setTotalPages(Res.data.totalPages || 1)
      setAvailableCategories(Res.data.availableCategories || [])
      setSearchStats({
        time: ((endTime - startTime) / 1000).toFixed(2),
        count: Res.data.totalResults || 0
      })
      setHasSearched(true)
      
      const related = await axios.get(
        `${BASE_URL}/api/search/related?q=${q}&limit=5`
      )
      setRelatedSearches(related.data)

    } catch(err) {
      console.error(err)
      setResults([])
      setHasSearched(true)
    } finally {
      setIsLoading(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleKeyDown = (e) => {
    if (!ShowSuggestions || Suggestions.length === 0) {
      if (e.key === 'Enter') executeSearch(Query, 1)
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveSuggestionIndex(prev => 
        prev < Suggestions.length - 1 ? prev + 1 : 0)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveSuggestionIndex(prev => 
        prev > 0 ? prev - 1 : Suggestions.length - 1)
    } else if (e.key === 'Enter') {
      if (ActiveSuggestionIndex >= 0) {
        e.preventDefault()
        suggestionClick(Suggestions[ActiveSuggestionIndex].text)
        setActiveSuggestionIndex(-1)
      } else {
        executeSearch(Query, 1)
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
      setActiveSuggestionIndex(-1)
    }
  }

  const suggestionClick = (s) => {
    setQuery(s)
    executeSearch(s, 1)
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col relative overflow-hidden" style={{marginTop: '2rem'}}>
      
      {/* Background subtle glow */}
      {!HasSearched && (
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
      )}

      <main className={`flex w-full flex-col items-center px-4 transition-all duration-700 ease-out z-10 ${HasSearched ? 'pt-8' : 'pt-[10vh] flex-grow'}`}>
        
        {/* LOGO */}
        <motion.div 
          layout
          className={`flex items-center gap-3 ${HasSearched ? 'mb-8 self-start md:ml-32 lg:ml-48' : 'mb-10'}`}
        >
          {!HasSearched && (
             <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-foreground">
               What do you want to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-primary">find?</span>
             </h1>
          )}
        </motion.div>

        {/* SEARCH BAR CONTAINER */}
        <motion.div 
          layout
          className={`w-full relative ${HasSearched ? 'max-w-3xl self-start md:ml-32 lg:ml-48' : 'max-w-2xl'}`}
          ref={searchContainerRef}
        >
          <motion.div 
            animate={{ 
              scale: isFocused && !HasSearched ? 1.02 : 1,
              boxShadow: isFocused ? '0 0 0 1px rgba(139, 92, 246, 0.5), 0 8px 32px -8px rgba(0,0,0,0.5)' : '0 1px 2px rgba(0,0,0,0.1)'
            }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="relative flex items-center bg-card/80 backdrop-blur-xl border border-border rounded-2xl px-4 py-3.5"
          >
            <Search className="h-5 w-5 text-muted-foreground mr-3 flex-shrink-0" />
            <input
              className="flex-grow bg-transparent text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none"
              placeholder="Ask anything..."
              value={Query}
              onChange={handleQueryChange}
              onKeyDown={handleKeyDown}
              onFocus={() => { setShowSuggestions(true); setIsFocused(true); }}
            />
            {Query && (
              <button 
                onClick={() => { setQuery(''); setShowSuggestions(false); setResults([]); setHasSearched(false); }} 
                className="rounded-full p-1 hover:bg-muted text-muted-foreground transition-colors mr-2"
              >
                <Plus className="h-4 w-4 rotate-45" />
              </button>
            )}
            <button 
              onClick={() => executeSearch(Query, 1)}
              className="hidden sm:flex items-center gap-1.5 rounded-lg bg-primary/10 px-2 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
            >
              <Command className="h-3 w-3" /> Return
            </button>
          </motion.div>

          {/* SUGGESTIONS DROPDOWN */}
          <AnimatePresence>
            {ShowSuggestions && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 4, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="absolute left-0 right-0 top-full mt-1 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-50"
                style={{ backdropFilter: 'blur(20px)' }}
              >

                {/* RECENT SEARCHES */}
                {!Query.trim() && SearchHistory.length > 0 && (
                  <div className="py-2">
                    <div className="px-4 py-2 flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      <Clock className="h-3 w-3" />
                      Recent Searches
                    </div>
                    {SearchHistory.slice(0, 5).map((s, i) => (
                      <div
                        key={i}
                        onClick={() => suggestionClick(s)}
                        className="px-4 py-2.5 hover:bg-muted cursor-pointer flex items-center justify-between group transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm text-foreground">{s}</span>
                        </div>
                        <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    ))}
                  </div>
                )}

                {/* TRENDING */}
                {!Query.trim() && SearchHistory.length === 0 && Trending.length > 0 && (
                  <div className="py-2">
                    <div className="px-4 py-2 flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      <TrendingUp className="h-3 w-3" />
                      Trending
                    </div>
                    <div className="px-4 pb-3 flex flex-wrap gap-2">
                      {Trending.map((t, i) => (
                        <button
                          key={i}
                          onClick={() => suggestionClick(t.keyword)}
                          className="px-2.5 py-1 text-xs bg-muted hover:bg-primary/10 hover:text-primary border border-border hover:border-primary/30 rounded-full transition-colors"
                        >
                          {t.keyword}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* LIVE SUGGESTIONS */}
                {Query.trim() && (
                  <div className="py-2">
                    {SuggestionsLoading && (
                      <div className="px-4 py-3 flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Finding suggestions...
                      </div>
                    )}

                    {!SuggestionsLoading && Suggestions.length > 0 && (
                      <>
                        {['keyword', 'semantic', 'entity', 'title'].map(type => {
                          const group = Suggestions.filter(s => s.type === type)
                          if (group.length === 0) return null
                          return (
                            <div key={type}>
                              {group.map((s, i) => {
                                const origIdx = Suggestions.indexOf(s)
                                return (
                                <div
                                  key={origIdx}
                                  onClick={() => suggestionClick(s.text)}
                                  className={`px-4 py-2.5 hover:bg-muted cursor-pointer flex items-center justify-between group transition-colors ${origIdx === ActiveSuggestionIndex ? 'bg-muted' : ''}`}
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    {TYPE_ICONS[s.type]}
                                    <span className="text-sm text-foreground truncate">
                                      {(() => {
                                        const idx = s.text.toLowerCase().indexOf(Query.toLowerCase())
                                        if (idx === -1) return s.text
                                        return (
                                          <>
                                            <span className="text-muted-foreground">
                                              {s.text.slice(0, idx)}
                                            </span>
                                            <span className="text-foreground font-semibold">
                                              {s.text.slice(idx, idx + Query.length)}
                                            </span>
                                            <span className="text-muted-foreground">
                                              {s.text.slice(idx + Query.length)}
                                            </span>
                                          </>
                                        )
                                      })()}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    {s.domain && (
                                      <span className="text-[10px] text-muted-foreground/60 hidden group-hover:block">
                                        {s.domain}
                                      </span>
                                    )}
                                    {TYPE_LABELS[s.type] && (
                                      <span className="text-[10px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground">
                                        {TYPE_LABELS[s.type]}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )})}
                            </div>
                          )
                        })}
                      </>
                    )}

                    {!SuggestionsLoading && Suggestions.length === 0 && Query.length >= 2 && (
                      <div className="px-4 py-3 text-sm text-muted-foreground">
                        No suggestions. Press Enter to search.
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* RESULTS AREA */}
        {HasSearched && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="w-full flex flex-col md:flex-row mt-8 max-w-6xl mx-auto md:ml-32 lg:ml-48 pb-20"
          >
            {/* MAIN RESULTS COLUMN */}
            <div className="w-full md:w-[700px] pr-0 md:pr-8">
              
              {!IsLoading && HasSearched && Results.length > 0 && (
                <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b border-border/50">
                  
                  {/* Sort buttons */}
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-muted-foreground mr-1">Sort:</span>
                    {['relevance', 'date'].map(s => (
                      <button key={s}
                        onClick={() => { setSortBy(s); executeSearch(Query, 1) }}
                        className={`px-2.5 py-1 rounded-full border transition-colors ${
                          SortBy === s
                            ? 'bg-primary/10 text-primary border-primary/30'
                            : 'border-border text-muted-foreground hover:bg-muted'
                        }`}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </button>
                    ))}
                  </div>

                  {/* Category filter chips */}
                  {AvailableCategories.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-xs text-muted-foreground">Type:</span>
                      <button
                        onClick={() => { setCategoryFilter(''); executeSearch(Query, 1) }}
                        className={`px-2.5 py-1 rounded-full border text-xs transition-colors ${
                          !CategoryFilter
                            ? 'bg-primary/10 text-primary border-primary/30'
                            : 'border-border text-muted-foreground hover:bg-muted'
                        }`}>
                        All
                      </button>
                      {AvailableCategories.slice(0, 5).map(cat => (
                        <button key={cat}
                          onClick={() => { setCategoryFilter(cat); executeSearch(Query, 1) }}
                          className={`px-2.5 py-1 rounded-full border text-xs transition-colors ${
                            CategoryFilter === cat
                              ? 'bg-primary/10 text-primary border-primary/30'
                              : 'border-border text-muted-foreground hover:bg-muted'
                          }`}>
                          {cat}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {!IsLoading && SearchStats && (
                <div className="flex items-center gap-2 mb-6 text-xs text-muted-foreground font-mono">
                  <Activity className="h-3.5 w-3.5" />
                  <span>Found {SearchStats.count} results in {SearchStats.time}s</span>
                </div>
              )}

              {HasSearched && Query && !IsLoading && <AiSearchSummary query={Query} />}

              {IsLoading ? (
                <div className="space-y-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex flex-col gap-3 p-5 rounded-2xl bg-card border border-border/50">
                      <div className="flex items-center gap-3">
                        <div className="h-6 w-6 rounded-full bg-muted animate-pulse" />
                        <div className="h-3 w-24 bg-muted rounded animate-pulse" />
                      </div>
                      <div className="h-4 w-5/6 bg-muted rounded animate-pulse" />
                      <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : Results.length === 0 ? (
                <div className="py-12 border border-dashed border-border rounded-2xl text-center px-6">
                  <Search className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-40" />
                  <p className="text-foreground font-medium mb-1">
                    No results found for "{Query}"
                  </p>
                  <p className="text-sm text-muted-foreground mb-6">
                    Try adjusting your keywords or use broader terms.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {Results.map((PageData, i) => (
                    <motion.div 
                      key={i} 
                      className="group flex flex-col bg-card hover:bg-muted/30 rounded-2xl p-5 border border-transparent hover:border-border transition-all"
                    >
                      <div className="flex items-center gap-2.5 mb-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-background border border-border overflow-hidden">
                          {PageData.Domain ? (
                            <img src={`https://www.google.com/s2/favicons?domain=${PageData.Domain}&sz=64`} alt="" className="w-3.5 h-3.5 object-contain" />
                          ) : <Link2 className="h-3 w-3 text-muted-foreground" />}
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-medium text-foreground">{PageData.Domain || 'Unknown Source'}</span>
                          <span className="text-muted-foreground/50">•</span>
                          <span className="text-muted-foreground truncate max-w-[200px]">{PageData.Url}</span>
                        </div>
                      </div>

                      <a href={PageData.Url} target="_blank" rel="noopener noreferrer" className="text-lg font-semibold text-blue-500 hover:underline mb-2 line-clamp-2">
                        {PageData.Title}
                      </a>
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                        {PageData.Description || (PageData.Content?.substring(0, 200) + "...") || PageData.title}
                      </p>

                      {PageData.Keywords && PageData.Keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {PageData.Keywords.slice(0, 6).map((kw, idx) => (
                            <button key={idx} onClick={() => { setQuery(kw); executeSearch(kw, 1) }} className="px-2 py-0.5 text-[10px] text-muted-foreground bg-transparent border border-border/50 rounded hover:border-primary/40 hover:text-primary transition-colors">
                              {kw}
                            </button>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ))}

                  {/* Related Searches */}
                  {RelatedSearches.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-border/50">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                        Related Searches
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {RelatedSearches.map((r, i) => (
                          <button key={i} onClick={() => { setQuery(r); executeSearch(r, 1) }} className="px-3 py-1.5 text-sm bg-card border border-border rounded-full hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-colors flex items-center gap-1.5">
                            <Search className="h-3 w-3" /> {r}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pagination */}
                  {TotalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8">
                      <button disabled={Page === 1} onClick={() => executeSearch(Query, Page - 1)} className="px-3 py-1.5 rounded-md border border-border text-xs">Prev</button>
                      <span className="text-xs font-medium px-4">Page {Page} of {TotalPages}</span>
                      <button disabled={Page === TotalPages} onClick={() => executeSearch(Query, Page + 1)} className="px-3 py-1.5 rounded-md border border-border text-xs">Next</button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* FILTERS SIDEBAR */}
            {!IsLoading && Results.length > 0 && (
              <div className="w-full md:w-64 mt-8 md:mt-0 pt-2 border-t md:border-t-0 md:border-l border-border md:pl-8">
                <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-4">Refine Results</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5">Domain Match</label>
                    <input 
                      type="text" 
                      placeholder="e.g. github.com"
                      value={DomainFilter}
                      onChange={(e)=>setDomainFilter(e.target.value)}
                      className="w-full bg-card border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <button onClick={() => executeSearch(Query, 1)} className="w-full bg-primary/10 text-primary hover:bg-primary/20 font-medium py-2 rounded-md text-xs">
                    Apply Filter
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </main>
    </div>
  )
}
