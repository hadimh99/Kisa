import { createContext, useContext } from 'react';

// Shares the search domain (query/mode/source/handlers + the navigation setters
// the overlay's quick-links need) so consumers like SearchOverlay don't have to
// be prop-drilled. State still lives in AppContent; this just exposes it.
export const SearchContext = createContext(null);

export const useSearchContext = () => {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error('useSearchContext must be used within a SearchContext.Provider');
  return ctx;
};
