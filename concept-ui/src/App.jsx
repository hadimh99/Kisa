import React, { useState, useEffect, useRef, useMemo } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, X, ChevronRight, Home as HomeIcon, List, Info, BookOpen, History, Database, Share2, Settings2, Menu, Clock, Trash2, LibraryBig, Youtube, ArrowDown, User, Bookmark, Coins, HeartPulse, ShieldAlert, MoreHorizontal, PenLine, FolderPlus, FolderMinus, Book } from 'lucide-react';
import quranData from './quran.json';
import verseMap from './verse_map.json';
import transcriptData from './transcripts.json';
import { supabase } from './supabaseClient';
import { quranBenefits, spiritualPrescriptions } from './quranBenefits';
import QuranReader from './components/QuranReader';
import DuaLibrary from './components/DuaLibrary';
import HadithCard from './components/HadithCard';
import KisaAcademy from './components/KisaAcademy'; // <-- CHANGED THIS IMPORT
import HadithLibrary from './components/HadithLibrary';
import Home from './components/Home';
import StudyVault from './components/StudyVault';
import Glossary from './components/Glossary';
import Footer from './components/Footer';
import KisaCommandCenter from './components/KisaCommandCenter';
import TranscriptLibrary from './components/TranscriptLibrary';
import CourseLibrary from './components/CourseLibrary';
import { Analytics } from '@vercel/analytics/react';
import { APP_UPDATES, SOURCES, ADMIN_ID } from './constants';
import { timeAgo } from './utils';
import { KisaLogo, AnimatedMenuIcon } from './components/Icons';
import { DeepLinkCatcher, ScrollToTop } from './components/RouteHelpers';
import UpdatesModal from './components/UpdatesModal';
import InfoModal from './components/InfoModal';
import AuthModal from './components/AuthModal';
import SignOutModal from './components/SignOutModal';
import MobileNav from './components/MobileNav';
import SearchOverlay from './components/SearchOverlay';
import SearchResults from './components/SearchResults';
import ClusterModal from './components/ClusterModal';
import AnchorModal from './components/AnchorModal';
import QuranPopup from './components/QuranPopup';
import { SearchContext } from './contexts/SearchContext';


// NOTE: CLUSTER_COLORS and TwoLineMenu below are pre-existing dead code
// (declared, never referenced). Left in place intentionally — flagged, not
// removed, since they predate this refactor.
const CLUSTER_COLORS = ['#10b981', '#8b5cf6', '#f59e0b', '#f43f5e', '#3b82f6'];

const TwoLineMenu = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="4" y1="9" x2="20" y2="9" />
    <line x1="4" y1="15" x2="20" y2="15" />
  </svg>
);

function AppContent() {



  const [alKafiData, setAlKafiData] = useState([]);
  const [isHadithLoading, setIsHadithLoading] = useState(true);
  const [hadithLoadError, setHadithLoadError] = useState(null);

  useEffect(() => {
    const fetchHybridData = async () => {
      try {
        setIsHadithLoading(true);
        setHadithLoadError(null);

        const response = await fetch('/thaqalayn_complete.json', { cache: 'force-cache' });
        if (!response.ok) throw new Error("Could not load the core library file.");

        const rawData = await response.json();
        let staticData = Array.isArray(rawData) ? rawData : (Object.values(rawData).find(Array.isArray) || []);

        if (staticData.length === 0) throw new Error("Library loaded, but no hadiths were found.");

        const { data: edits, error } = await supabase
          .from('kisa_hadiths')
          .select('id, englishText, manual_body, manual_chain')
          .not('manual_body', 'is', null);

        if (error) {
          console.warn("Could not load cloud edits, falling back to pure static.", error);
        }

        if (edits && edits.length > 0) {
          // Cloud override ids do NOT align with the static array (genuine ID
          // desync), so overrides are linked by English text. Match exactly
          // first (current behaviour — every override matches exactly today),
          // then fall back to a normalized key so minor text cleaning
          // (quotes / whitespace / case) can't silently drop an override.
          const normalizeKey = (s) => (s || '')
            .replace(/[‘’]/g, "'")
            .replace(/[“”]/g, '"')
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase();

          const exactMap = new Map();
          const normMap = new Map();
          edits.forEach(row => {
            if (row.englishText) {
              exactMap.set(row.englishText, row);
              normMap.set(normalizeKey(row.englishText), row);
            }
          });

          staticData = staticData.map(hadith => {
            const localText = hadith.englishText || hadith.en || hadith.english_text || "";
            const edit = exactMap.get(localText) || normMap.get(normalizeKey(localText));
            if (edit) {
              return {
                ...hadith,
                manual_body: edit.manual_body,
                manual_chain: edit.manual_chain,
                id: edit.id // Inherit the cloud row id so the inline editor saves back to the correct kisa_hadiths row
              };
            }
            return hadith;
          });
        }

        // Merge in Basa'ir al-Darajat (staged static library — appears as its own book)
        try {
          const bRes = await fetch('/basair_complete.json', { cache: 'no-cache' });
          if (bRes.ok) {
            const bRaw = await bRes.json();
            const bData = Array.isArray(bRaw) ? bRaw : (Object.values(bRaw).find(Array.isArray) || []);
            if (bData.length) staticData = staticData.concat(bData);
          }
        } catch (e) {
          console.warn("Basa'ir library skipped:", e);
        }

        setAlKafiData(staticData);
      } catch (error) {
        console.error("Error loading hybrid data:", error);
        setHadithLoadError(error.message);
      } finally {
        setIsHadithLoading(false);
      }
    };

    fetchHybridData();
  }, []);

  const [query, setQuery] = useState('');
  const [searchMode, setSearchMode] = useState('concept');
  const [sourceFilter, setSourceFilter] = useState(SOURCES[0]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  // SMART THEME ENGINE: Auto-detects Day/Night unless user has a saved preference
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('kisa_theme_preference');
      if (savedTheme) return savedTheme; // Respect manual overrides
    }
    // Auto-calculate based on local time if no preference exists
    const currentHour = new Date().getHours();
    const isNightTime = currentHour < 6 || currentHour >= 18; // 6 PM to 6 AM
    return isNightTime ? 'dark' : 'light';
  });

  // Save to local memory whenever the user manually clicks a theme button
  useEffect(() => {
    localStorage.setItem('kisa_theme_preference', theme);
  }, [theme]);

  const [showSearchOverlay, setShowSearchOverlay] = useState(false);
  const [overlayMode, setOverlayMode] = useState('global'); // 'global' or 'advanced'
  const [showUserHub, setShowUserHub] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const globalSearchRef = useRef(null);

  const [user, setUser] = useState(null);
  const isAdmin = user?.id === ADMIN_ID;
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState({ text: '', type: '' });

  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [showVault, setShowVault] = useState(false);
  const [vaultItems, setVaultItems] = useState([]);
  // --- MISSING VAULT STATES ADDED HERE ---
  const [localEmptyFolders, setLocalEmptyFolders] = useState([]);
  const [activeFolder, setActiveFolder] = useState('All');
  const [vaultSearch, setVaultSearch] = useState('');
  const [movingItemId, setMovingItemId] = useState(null);
  const [activeCardMenu, setActiveCardMenu] = useState(null);
  const [cardMenuMode, setCardMenuMode] = useState('main');
  const [selectedVaultItem, setSelectedVaultItem] = useState(null);


  const customFolders = useMemo(() => {
    const folders = new Set(localEmptyFolders);
    vaultItems.forEach(item => {
      if (item.folder_name) {
        item.folder_name.split(',').forEach(f => {
          if (f.trim()) folders.add(f.trim());
        });
      }
    });
    return Array.from(folders).sort();
  }, [vaultItems, localEmptyFolders]);

  const filteredVaultItems = useMemo(() => {
    let filtered = vaultItems;
    if (activeFolder === 'Uncategorized') filtered = filtered.filter(item => !item.folder_name);
    else if (activeFolder === 'Quran') filtered = filtered.filter(item => item.type === 'quran');
    else if (activeFolder === 'Hadiths') filtered = filtered.filter(item => item.type === 'hadith' || !item.type);
    else if (activeFolder === 'Transcripts') filtered = filtered.filter(item => item.type === 'transcript');
    else if (activeFolder !== 'All') {
      filtered = filtered.filter(item => {
        if (!item.folder_name) return false;
        const folders = item.folder_name.split(',').map(f => f.trim());
        return folders.includes(activeFolder);
      });
    }

    if (vaultSearch.trim()) {
      const q = vaultSearch.toLowerCase();
      filtered = filtered.filter(item =>
        (item.content && item.content.toLowerCase().includes(q)) ||
        (item.source && item.source.toLowerCase().includes(q)) ||
        (item.note && item.note.toLowerCase().includes(q))
      );
    }

    return filtered;
  }, [vaultItems, activeFolder, vaultSearch]);

  const assignToFolder = async (itemId, folderName, mode = 'move') => {
    const item = vaultItems.find(i => i.id === itemId);
    let newFolderName = folderName;

    if (mode === 'add' && folderName) {
      let current = item.folder_name ? item.folder_name.split(',').map(f => f.trim()).filter(Boolean) : [];
      if (!current.includes(folderName)) current.push(folderName);
      newFolderName = current.join(', ');
    } else if (mode === 'remove' && folderName) {
      let current = item.folder_name ? item.folder_name.split(',').map(f => f.trim()).filter(Boolean) : [];
      current = current.filter(f => f !== folderName);
      newFolderName = current.length > 0 ? current.join(', ') : null;
    }

    setVaultItems(prev => prev.map(i => i.id === itemId ? { ...i, folder_name: newFolderName } : i));
    setMovingItemId(null);
    setActiveCardMenu(null);
    setCardMenuMode('main');

    const { error } = await supabase.from('vault_items').update({ folder_name: newFolderName }).eq('id', itemId);
    if (error) {
      alert(`Supabase Error: ${error.message}`);
      fetchVaultItems();
    }
  };

  const deleteFolder = async (e, folderToDelete) => {
    e.stopPropagation();
    if (!window.confirm(`Delete the collection "${folderToDelete}"?\n\nYour saved bookmarks will NOT be deleted, only the folder tag will be removed.`)) return;

    setLocalEmptyFolders(prev => prev.filter(f => f !== folderToDelete));

    const affectedItems = vaultItems.filter(item =>
      item.folder_name && item.folder_name.split(',').map(f => f.trim()).includes(folderToDelete)
    );

    if (affectedItems.length > 0) {
      setVaultItems(prev => prev.map(item => {
        if (!item.folder_name) return item;
        const folders = item.folder_name.split(',').map(f => f.trim()).filter(Boolean);
        if (folders.includes(folderToDelete)) {
          const newFolders = folders.filter(f => f !== folderToDelete);
          return { ...item, folder_name: newFolders.length > 0 ? newFolders.join(', ') : null };
        }
        return item;
      }));

      await Promise.all(affectedItems.map(item => {
        const folders = item.folder_name.split(',').map(f => f.trim()).filter(Boolean);
        const newFolders = folders.filter(f => f !== folderToDelete);
        const newFolderName = newFolders.length > 0 ? newFolders.join(', ') : null;
        return supabase.from('vault_items').update({ folder_name: newFolderName }).eq('id', item.id);
      }));
    }

    if (activeFolder === folderToDelete) {
      setActiveFolder('All');
      setSelectedVaultItem(null);
    }
  };

  const fetchVaultItems = async () => {
    if (!user) return;
    const { data } = await supabase.from('vault_items').select('*').order('created_at', { ascending: false });
    if (data) setVaultItems(data);
  };

  useEffect(() => {
    if (user) fetchVaultItems();
    else setVaultItems([]);
    const handleVaultUpdate = () => fetchVaultItems();
    window.addEventListener('vault-updated', handleVaultUpdate);
    return () => window.removeEventListener('vault-updated', handleVaultUpdate);
  }, [user]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (!authEmail || !authPassword) {
      setAuthMessage({ text: 'Please enter both email and password.', type: 'error' });
      return;
    }
    if (authPassword.length < 6) {
      setAuthMessage({ text: 'Password must be at least 6 characters.', type: 'error' });
      return;
    }

    setAuthLoading(true);
    setAuthMessage({ text: '', type: '' });

    let error;
    if (isSignUp) {
      const { data, error: signUpError } = await supabase.auth.signUp({ email: authEmail, password: authPassword });
      error = signUpError;
      if (!error && data?.user?.identities?.length === 0) {
        error = { message: "An account with this email already exists. Please sign in." };
      } else if (!error) {
        setAuthMessage({ text: 'Account created! You are now signed in.', type: 'success' });
        setTimeout(() => { setShowAuthModal(false); setAuthPassword(''); }, 1500);
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
      error = signInError;
      if (!error) {
        setShowAuthModal(false);
        setAuthPassword('');
      }
    }

    if (error) setAuthMessage({ text: error.message, type: 'error' });
    setAuthLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setShowVault(false);
    if (sourceFilter === 'My Vault') setSourceFilter('All Twelver Sources');
  };

  const [viewMode, setViewMode] = useState(typeof window !== 'undefined' && window.innerWidth < 800 ? 'list' : 'map');
  const [activeCluster, setActiveCluster] = useState(null);
  const [hoveredCluster, setHoveredCluster] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [lengthFilter, setLengthFilter] = useState('All');
  const [copiedLink, setCopiedLink] = useState(false);

  // NATIVE MEMORY: Remembers your exact tab when switching apps
  
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  const activeTab = useMemo(() => {
    if (location.pathname.startsWith('/quran')) return 'quran';
    if (location.pathname.startsWith('/duas')) return 'duas';
    if (location.pathname.startsWith('/ziyarats')) return 'ziyarats';
    if (location.pathname.startsWith('/hadith')) return 'hadith';
    if (location.pathname.startsWith('/kisa-academy')) return 'library';
    if (location.pathname.startsWith('/admin')) return 'admin';
    if (location.pathname.startsWith('/glossary')) return 'glossary';
    if (location.pathname.startsWith('/search')) return 'search';
    if (location.pathname === '/') return 'home';
    return 'home';
  }, [location.pathname]);

  const setActiveTab = (tab) => {
    if (tab === 'home') navigate('/');
    else if (tab === 'library') navigate('/kisa-academy');
    else navigate(`/${tab}`);
  };
const [quranPopup, setQuranPopup] = useState(null);

  const [tafsirData, setTafsirData] = useState(null);
  const [tafsirLoading, setTafsirLoading] = useState(false);
  const [tafsirTarget, setTafsirTarget] = useState(null);

  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [appHistory, setAppHistory] = useState([]);
  const [quranTarget, setQuranTarget] = useState(null);
  const [quranVerseTarget, setQuranVerseTarget] = useState(null);
  const [transcriptTarget, setTranscriptTarget] = useState(null);
  const [hadithTarget, setHadithTarget] = useState(null);
  const [duaTarget, setDuaTarget] = useState(null);
  const [transcriptHighlight, setTranscriptHighlight] = useState(null);
  const [anchorHadith, setAnchorHadith] = useState(null);
  const [showAnchor, setShowAnchor] = useState(false);
  const [showAnchorModal, setShowAnchorModal] = useState(false);
  const [anchorCopied, setAnchorCopied] = useState(false);

  const [fontStyle, setFontStyle] = useState('scheherazade');
  const searchIdRef = useRef(0);


  const activeFontFamily =
    fontStyle === 'scheherazade' ? '"Scheherazade New", "Noto Naskh Arabic", sans-serif' :
      fontStyle === 'uthmani' ? '"Amiri Quran", "Amiri", serif' :
        '"XBZarFont", "Noto Naskh Arabic", sans-serif';

  const containerRef = useRef(null);

  const modalScrollRef = useRef(null);
  const tafsirScrollRef = useRef(null);
  const searchInputContainerRef = useRef(null);

  const [centerPos, setCenterPos] = useState({ x: 0, y: 0 });
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [loadingMessage, setLoadingMessage] = useState('Deep Search');
  const [showUpdates, setShowUpdates] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    const storedHistory = localStorage.getItem('kisa_history');
    if (storedHistory) {
      try { setAppHistory(JSON.parse(storedHistory)); } catch (e) { }
    }
  }, []);

  const saveToHistory = (newItem) => {
    setAppHistory(prev => {
      const filtered = prev.filter(item => {
        if (newItem.type === 'search' && item.type === 'search') return item.query !== newItem.query;
        if (newItem.type === 'quran' && item.type === 'quran') return item.surahId !== newItem.surahId;
        return true;
      });
      const updated = [newItem, ...filtered].slice(0, 30);
      localStorage.setItem('kisa_history', JSON.stringify(updated));
      return updated;
    });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchInputContainerRef.current && !searchInputContainerRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [searchInputContainerRef]);

  const handleModalScroll = (e) => {
    const el = e.currentTarget;
    el.style.setProperty('--thumb-bg', theme === 'dark' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(15, 23, 42, 0.4)');
    setTimeout(() => el.style.setProperty('--thumb-bg', 'transparent'), 800);
  };

  useEffect(() => {
    document.title = "Al-Kisa";
    theme === 'dark' ? document.documentElement.classList.add('dark') : document.documentElement.classList.remove('dark');

    // --- 3-TIER GLOBAL COLOR ENGINE (Eye-Strain Optimized) ---
    const getBgColor = () => {
      if (theme === 'dark') return '#0f1012';
      if (theme === 'sepia') return '#FDFBF7';
      return '#f5efe4';
    };

    const getTextColor = () => {
      if (theme === 'dark') return '#F5F5F7';
      if (theme === 'sepia') return '#2D241C';
      return '#1D1D1F';
    };

    document.body.style.backgroundColor = getBgColor();
    document.body.style.color = getTextColor();
  }, [theme, activeTab]);

  useEffect(() => {
    if (!loading) return; let timeouts = [];
    if (searchMode === 'concept') {
      setLoadingMessage('Embedding query...');
      timeouts.push(setTimeout(() => setLoadingMessage('Waking up Cloud AI & Translating (if Arabic)... ⏳'), 3000));
      timeouts.push(setTimeout(() => setLoadingMessage('Retrieving narrations...'), 16000));
      timeouts.push(setTimeout(() => setLoadingMessage('Generating conceptual themes...'), 23000));
      timeouts.push(setTimeout(() => setLoadingMessage('Finalizing UI...'), 29000));
    } else {
      setLoadingMessage('Scanning Records...');
      timeouts.push(setTimeout(() => setLoadingMessage('Retrieving exact matches...'), 2000));
      timeouts.push(setTimeout(() => setLoadingMessage('Formatting results...'), 5000));
    }
    return () => timeouts.forEach(clearTimeout);
  }, [loading, searchMode]);

  useEffect(() => { setCurrentPage(1); setLengthFilter('All'); if (modalScrollRef.current) modalScrollRef.current.scrollTop = 0; }, [activeCluster]);


  useEffect(() => {
    let lastWidth = window.innerWidth;
    const updateDimensions = () => {
      if (window.innerWidth !== lastWidth) {
        setWindowWidth(window.innerWidth);
        if (window.innerWidth < 800 && viewMode === 'map') setViewMode('list');
        lastWidth = window.innerWidth;
      }
      if (containerRef.current && activeTab === 'search') {
        setCenterPos({ x: containerRef.current.clientWidth / 2, y: containerRef.current.clientHeight / 2 });
      }
    };
    updateDimensions(); window.addEventListener('resize', updateDimensions); return () => window.removeEventListener('resize', updateDimensions);
  }, [data, viewMode, activeTab]);

  const executeSearch = async (searchQuery, currentMode, currentSource, queryVector = null, excludeId = null, apiQuery = null, anchorObj = null) => {
    if (!searchQuery.trim()) return;
    const currentSearchId = ++searchIdRef.current;
    const textToEmbed = apiQuery || searchQuery;

    saveToHistory({
      type: 'search', query: searchQuery, mode: currentMode, source: currentSource,
      timestamp: Date.now(), queryVector: queryVector, excludeId: excludeId, apiQuery: apiQuery, anchorHadith: anchorObj
    });

    setShowSearchDropdown(false);
    window.history.replaceState({}, '', window.location.pathname);

    setLoading(true);
    setData(null);
    setActiveCluster(null);

    if (currentSource === 'My Vault') {
      setTimeout(() => {
        if (searchIdRef.current !== currentSearchId) return;
        const q = searchQuery.toLowerCase();
        const matches = vaultItems.filter(item =>
          (item.content && item.content.toLowerCase().includes(q)) ||
          (item.note && item.note.toLowerCase().includes(q)) ||
          (item.source && item.source.toLowerCase().includes(q))
        );

        const formattedItems = matches.map(v => {
          let hNum = "";
          const numMatch = v.source?.match(/Hadith\s+(\d+)/i) || v.source?.match(/Verse\s+(\d+)/i);
          if (numMatch) hNum = numMatch[1];
          return {
            id: v.id, book: "My Vault", volume: v.type ? v.type.charAt(0).toUpperCase() + v.type.slice(1) : "Saved",
            sub_book: "Bookmark", chapter: v.source.replace(/ (Hadith|Verse) \d+$/, ''), hadith_number: hNum,
            english_text: v.note ? `**[Your Note: ${v.note}]**\n\n${v.content}` : v.content,
            arabic_text: v.arabic_text || "", chain: v.chain || "", vector: []
          };
        });

        setData({ clusters: [{ theme_label: `Vault Matches for "${searchQuery}"`, items: formattedItems }], total_results: formattedItems.length });
        setViewMode('list');
        setLoading(false);
      }, 400);
      return;
    }

    try {
      const payload = { query: textToEmbed, source: currentSource, searchMode: currentMode };
      if (queryVector && queryVector.length > 0) payload.queryVector = queryVector;
      if (excludeId) payload.excludeId = String(excludeId);

      const baseUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${baseUrl}/api/explore`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (searchIdRef.current !== currentSearchId) return;

      if (result.clusters && alKafiData.length > 0) {
        result.clusters.forEach(cluster => {
          if (cluster.items) {
            cluster.items = cluster.items.map(item => {
              const masterRecord = alKafiData.find(h => {
                if (String(h.id) === String(item.id)) return true;
                const hTextRaw = String(h.englishText || h.en || h.english_text || "");
                const iTextRaw = String(item.english_text || item.en || "");
                if (hTextRaw.length > 10 && iTextRaw.length > 10) {
                  const hDNA = hTextRaw.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                  const iDNA = iTextRaw.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                  if (hDNA === iDNA) return true;
                  if (hDNA.length > 250 && iDNA.length > 250 && hDNA.substring(0, 250) === iDNA.substring(0, 250)) {
                    return true;
                  }
                }
                return false;
              });

              if (masterRecord && masterRecord.manual_body !== undefined && masterRecord.manual_body !== null) {
                return { ...item, manual_body: masterRecord.manual_body, manual_chain: masterRecord.manual_chain };
              }
              return item;
            });
          }
        });
      }

      if (result.clusters && result.clusters.length > 0) {
        setData(result);
        if (currentMode === 'keyword') setViewMode('list');
        else if (window.innerWidth >= 800) setViewMode('map');
        else setViewMode('list'); // Force list view on mobile for concept searches
      } else {
        setData(null);
      }
    } catch (err) { console.error(err); }
    finally { if (searchIdRef.current === currentSearchId) setLoading(false); }
  };

  const handleFindSimilar = (item) => {
    let displayNum = item.hadith_number;
    if (displayNum === "Unknown" || !displayNum || displayNum === "") {
      const engMatch = String(item.english_text || "").match(/^[\s"'‘“\[\(]*(?:Unknown[\.\s]*)?(\d+)[\.\-:]?\s/i);
      if (engMatch) displayNum = engMatch[1];
    }
    if (displayNum === "Unknown" || !displayNum || displayNum === "") {
      const araMatch = String(item.arabic_text || "").match(/^[\s"'‘“\[\(]*(\d+)[ـ\.\-\s]/);
      if (araMatch) displayNum = araMatch[1];
    }

    const safeId = String(item.id || Math.random());
    const finalNum = displayNum && displayNum !== "Unknown" ? displayNum : safeId.substring(0, 6);
    const fullRef = `Book: ${item.book}, Vol: ${item.volume}, ${item.sub_book}, Chapter: ${item.chapter}${finalNum !== safeId.substring(0, 6) ? `, Hadith: ${finalNum}` : ''}`;
    const simQuery = `Similar to: ${fullRef}`;
    const anchorWithRef = { ...item, full_reference: fullRef, hadith_number: finalNum };

    setAnchorHadith(anchorWithRef);
    setShowAnchor(false);
    setShowAnchorModal(false);
    setQuery(simQuery);
    setActiveTab('search');
    setSearchMode('concept');

    if (item.vector && Array.isArray(item.vector) && item.vector.length > 0) {
      executeSearch(simQuery, 'concept', sourceFilter, item.vector, safeId, null, anchorWithRef);
    } else {
      const fallbackText = String(item.english_text || item.arabic_text || "Twelver theology").replace(/\n/g, ' ').substring(0, 300).trim();
      executeSearch(simQuery, 'concept', sourceFilter, null, safeId, fallbackText, anchorWithRef);
    }

    setActiveCluster(null);
    setTafsirData(null);
    setTafsirTarget(null);
  };

  const handleTafsirClick = async (surah, ayah) => {
    setTafsirTarget({ surah, ayah });
    setTafsirLoading(true);
    setTafsirData(null);
    try {
      const queryStr = `(${surah}:${ayah})`;
      const response = await fetch('https://concept-atlas-backend.onrender.com/api/explore', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ query: queryStr, source: "All Twelver Sources", searchMode: "keyword" })
      });
      const result = await response.json();

      if (result.clusters && alKafiData.length > 0) {
        result.clusters.forEach(cluster => {
          if (cluster.items) {
            cluster.items = cluster.items.map(item => {
              const masterRecord = alKafiData.find(h => {
                if (String(h.id) === String(item.id)) return true;
                const hTextRaw = String(h.englishText || h.en || h.english_text || "");
                const iTextRaw = String(item.english_text || item.en || "");
                if (hTextRaw.length > 10 && iTextRaw.length > 10) {
                  const hDNA = hTextRaw.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                  const iDNA = iTextRaw.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                  if (hDNA === iDNA) return true;
                  if (hDNA.length > 250 && iDNA.length > 250 && hDNA.substring(0, 250) === iDNA.substring(0, 250)) {
                    return true;
                  }
                }
                return false;
              });
              if (masterRecord && masterRecord.manual_body !== undefined && masterRecord.manual_body !== null) {
                return { ...item, manual_body: masterRecord.manual_body, manual_chain: masterRecord.manual_chain };
              }
              return item;
            });
          }
        });
      }

      if (result.clusters && result.clusters.length > 0) setTafsirData(result);
      else setTafsirData({ empty: true });
    } catch (err) {
      console.error(err);
      setTafsirData({ empty: true });
    } finally {
      setTafsirLoading(false);
    }
  };

  const handleGlobalRouting = (rawQuery) => {
    const q = rawQuery.toLowerCase().trim();

    // FORCE KEYBOARD DISMISSAL TO PREVENT IOS SCROLL JUMP
    if (document.activeElement) {
      document.activeElement.blur();
    }
    window.scrollTo(0, 0);

    // Wait for iOS keyboard animation to settle before unmounting the overlay
    setTimeout(() => {
      setShowSearchOverlay(false);

      // 1. DYNAMIC ACADEMY ROUTING (Matches ANY series name followed by ep/episode)
      const epMatch = q.match(/(.*?)\s*(?:ep|episode)\s*(\d+)/);

      if (epMatch && epMatch[1].trim().length > 0) {
        const rawSeriesName = epMatch[1].trim();
        const epNum = epMatch[2];
        const seriesPrefix = rawSeriesName.replace(/\s+/g, '-');

        setActiveTab('library');
        window.scrollTo(0, 0);
        setTranscriptTarget(`${seriesPrefix}-ep${epNum}`);
        return;
      }

      // 1b. Broad Academy Match (Just the series name, no episode)
      const knownSeries = ['know your imam', 'file of ali', 'file of ashura', 'the promised era', 'divine justice'];
      if (knownSeries.some(series => q.includes(series))) {
        setActiveTab('library');
        window.scrollTo(0, 0);
        setTranscriptTarget(null);
        return;
      }

      // 2. QURAN ROUTING
      if (q.match(/\d+:\d+/) || q.includes('surah') || q.includes('quran verse')) {
        setActiveTab('quran');
        window.scrollTo(0, 0);
        return;
      }

      // 3. DUAS & ZIYARATS ROUTING
      if (q.includes('dua ') || q.includes('ziyarat ')) {
        setActiveTab(q.includes('ziyarat') ? 'ziyarats' : 'duas');
        window.scrollTo(0, 0);
        return;
      }

      // 4. FALLBACK: EXECUTE GLOBAL KEYWORD SEARCH
      setActiveTab('search');
      window.scrollTo(0, 0);
      executeSearch(rawQuery, 'keyword', 'All Twelver Sources', null, null, null, null);
    }, 150);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    // 1. Force keyboard dismissal
    if (document.activeElement) {
      document.activeElement.blur();
    }

    // 2. Pre-scroll to top
    window.scrollTo(0, 0);

    // 3. Wait for iOS keyboard animation to settle before unmounting the overlay
    setTimeout(() => {
      setAnchorHadith(null);
      setShowAnchorModal(false);
      if (overlayMode === 'advanced') {
        setShowSearchOverlay(false);
        setActiveTab('search');
        window.scrollTo(0, 0); // Double-tap guarantee
        executeSearch(query, searchMode, sourceFilter, null, null, null, null);
      } else {
        handleGlobalRouting(query);
      }
    }, 150);
  };

  const handleHomeClick = () => {
    searchIdRef.current++;
    setData(null);
    setQuery('');
    setAnchorHadith(null);
    setShowAnchorModal(false);
    setActiveCluster(null);
    setHoveredCluster(null);
    setActiveTab('home');
    setLoading(false);
    window.history.replaceState({}, '', window.location.pathname);
    window.scrollTo(0, 0);
  };

  const handleHistoryClick = (item) => {
    setShowSearchDropdown(false);
    setShowHistoryDrawer(false);
    if (item.type === 'search') {
      setActiveTab('search');
      setQuery(item.query);
      setSearchMode(item.mode);
      setSourceFilter(item.source);
      setAnchorHadith(item.anchorHadith || null);
      setShowAnchorModal(false);
      executeSearch(item.query, item.mode, item.source, item.queryVector, item.excludeId, item.apiQuery, item.anchorHadith);
    } else if (item.type === 'quran') {
      setActiveTab('quran');
      setQuranTarget(item.surahId);
    }
  };

  const handleCopyHadith = (item) => {
    let formattedText = `Book ${item.book}, Volume ${item.volume}, ${item.sub_book}, Chapter: ${item.chapter}, Hadith ${item.hadith_number}\n\n${item.arabic_text}\n\n${item.english_text}`;
    const regex = /\((\d+):(\d+)\)/g; const matches = [...(item.english_text || "").matchAll(regex)]; const uniqueVerses = new Set();
    matches.forEach(m => uniqueVerses.add(`${m[1]}:${m[2]}`));
    if (uniqueVerses.size > 0) {
      formattedText += `\n\n--- Quranic References ---\n`;
      uniqueVerses.forEach(key => { if (quranData && quranData[key]) formattedText += `\n[Surah ${quranData[key].surahName} - ${key}]\n${quranData[key].ar}\n${quranData[key].en}\n`; });
    }
    formattedText = formattedText.trim() + `\n\n— Via Al-Kisa\n${window.location.href}`;
    navigator.clipboard.writeText(formattedText).then(() => console.log("Copied!")).catch(err => console.error(err));
  };

  const handleVerseClick = (surah, ayah) => { const key = `${surah}:${ayah}`; if (quranData && quranData[key]) setQuranPopup({ surah, ayah, data: quranData[key] }); };


  const [magneticPos, setMagneticPos] = useState({ x: 0, y: 0 });
  const btnRef = useRef(null);

  const getAppBgClass = () => {
    if (['quran', 'duas', 'ziyarats'].includes(activeTab)) return theme === 'dark' ? 'bg-[#0f1012] text-[#efe9dd]' : (theme === 'sepia' ? 'bg-[#f4ecd8] text-[#2D241C]' : 'bg-[#f5efe4] text-[#231d15]');
    if (activeTab === 'library') return theme === 'dark' ? 'bg-[#0f1012] text-[#efe9dd]' : (theme === 'sepia' ? 'bg-[#f4f4f5] text-[#2D241C]' : 'bg-[#f5efe4] text-[#231d15]');

    if (theme === 'dark') return 'bg-[#0f1012] text-[#efe9dd]';
    if (theme === 'sepia') return 'bg-[#FDFBF7] text-[#2D241C]';
    return 'bg-[#f5efe4] text-[#231d15]';
  };
  const appBgClass = getAppBgClass();
  const isMapView = activeTab === 'search' && data && viewMode === 'map' && !loading;
  const isSearchResults = activeTab === 'search' && data && !loading;
  const lockMainScreen = isMapView;
  const hideFooter = lockMainScreen || activeTab === 'search';

  const themeBg = theme === 'dark' ? 'bg-[#0f1012]' : theme === 'sepia' ? 'bg-[#FDFBF7]' : 'bg-[#f5efe4]';
  const themeBorder = theme === 'dark' ? 'border-[#c6a87c]/20' : 'border-[#5C4A3D]/10';

  const headerRef = useRef(null);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          if (!headerRef.current) return;

          if (showMobileNav || showSearchOverlay || showUserHub) {
            headerRef.current.style.transform = 'translateY(0)';
          }
          else if (currentScrollY > 60 && currentScrollY > lastScrollY) {
            headerRef.current.style.transform = 'translateY(-100%)';
          }
          else {
            headerRef.current.style.transform = 'translateY(0)';
          }

          lastScrollY = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showMobileNav, showSearchOverlay, showUserHub]);

  // Exposes the search domain to SearchOverlay (and future consumers) via
  // context instead of prop-drilling. State still lives here in AppContent.
  const searchContextValue = {
    showSearchOverlay, setShowSearchOverlay,
    overlayMode, setOverlayMode,
    handleSearchSubmit,
    globalSearchRef,
    query, setQuery,
    searchMode, setSearchMode,
    viewMode, setViewMode,
    showDropdown, setShowDropdown,
    sourceFilter, setSourceFilter,
    user,
    setActiveTab,
    executeSearch,
    setHadithTarget, setDuaTarget, setQuranTarget, setQuranVerseTarget, setTranscriptTarget,
    // results view
    data, loading, loadingMessage,
    activeCluster, setActiveCluster,
    hoveredCluster, setHoveredCluster,
    anchorHadith, showAnchor, setShowAnchor,
    anchorCopied, setAnchorCopied,
    showAnchorModal, setShowAnchorModal,
    handleCopyHadith,
    // cluster detail modal
    lengthFilter, setLengthFilter,
    currentPage, setCurrentPage,
    handleVerseClick, handleFindSimilar,
  };

  return (
    <SearchContext.Provider value={searchContextValue}>
    <div className={`min-h-screen w-full transition-colors duration-700 flex flex-col relative ${lockMainScreen ? 'overflow-hidden h-screen' : ''} ${appBgClass}`} style={{ WebkitOverflowScrolling: 'touch' }}>
      <style>{`
       @import url('https://fonts.googleapis.com/css2?family=Amiri+Quran&family=Amiri:wght@400;700&family=Scheherazade+New:wght@400;700&family=Noto+Naskh+Arabic:wght@400;700&family=Spectral:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&display=swap');
        
        .font-editorial {
          font-family: 'Spectral', ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
        }
        
        @font-face {
          font-family: 'XBZarFont';
          src: url('https://cdn.jsdelivr.net/gh/rastikerdar/xb-zar@v1.1.1/fonts/woff2/XBZar.woff2') format('woff2');
          font-weight: normal;
          font-style: normal;
          font-display: swap;
        }

        html { overflow-y: scroll !important; }
        .hide-scroll::-webkit-scrollbar { display: none; }
        .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; -webkit-overflow-scrolling: touch; overscroll-behavior-y: contain; }
        .smart-scrollbar { --thumb-bg: transparent; scrollbar-width: thin; scrollbar-color: var(--thumb-bg) transparent; -webkit-overflow-scrolling: touch; overscroll-behavior-y: contain; }
        
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background-color: rgba(198, 168, 124, 0.15); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background-color: rgba(198, 168, 124, 0.8) !important; }
        
        .gilded-noise {
          position: absolute; inset: 0; z-index: 0; opacity: 0.04; pointer-events: none; mix-blend-mode: overlay;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
        }
        
        .parchment-halo {
          position: absolute; inset: 0;
          background: radial-gradient(circle at 50% 40%, rgba(253, 251, 247, 0.4) 0%, rgba(234, 228, 211, 0) 70%);
          pointer-events: none; z-index: 0;
        }

        .hover-sheen {
          position: absolute !important;
          overflow: hidden;
        }
        .hover-sheen::after {
          content: "";
          position: absolute;
          top: 0;
          left: -150%;
          width: 50%;
          height: 100%;
          background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.85), transparent);
          transform: skewX(-25deg);
          transition: left 0.45s ease-in-out;
          pointer-events: none;
        }
        .hover-sheen:hover::after {
          left: 200%;
        }
      `}</style>

      <StudyVault
        showVault={showVault}
        setShowVault={setShowVault}
        vaultItems={vaultItems}
        setVaultItems={setVaultItems}
        fetchVaultItems={fetchVaultItems}
        theme={theme}
        activeFontFamily={activeFontFamily}
        setActiveTab={setActiveTab}
        setQuranTarget={setQuranTarget}
        setQuranVerseTarget={setQuranVerseTarget}
        setTranscriptTarget={setTranscriptTarget}
        setTranscriptHighlight={setTranscriptHighlight}
        handleTafsirClick={handleTafsirClick}
      />


      {/* --- PREMIUM AUTHENTICATION MODAL --- */}
      <AuthModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSubmit={handleEmailAuth}
        email={authEmail}
        setEmail={setAuthEmail}
        password={authPassword}
        setPassword={setAuthPassword}
        loading={authLoading}
        isSignUp={isSignUp}
        setIsSignUp={setIsSignUp}
        message={authMessage}
        setMessage={setAuthMessage}
      />

      {/* --- SIGN OUT CONFIRMATION MODAL --- */}
      <SignOutModal
        open={showSignOutConfirm}
        onCancel={() => setShowSignOutConfirm(false)}
        onConfirm={() => { handleSignOut(); setShowSignOutConfirm(false); }}
      />

      {activeTab === 'search' && (
        <>
          {theme === 'sepia' && <div className="parchment-halo block pointer-events-none" />}
          <div className="gilded-noise absolute inset-0 z-0 pointer-events-none" />
        </>
      )}

      {/* ======================================================================= */}
      {/* 1. THE NATIVE GLOBAL HEADER */}
      {/* ======================================================================= */}
      {!isAdminRoute && (
      <header
        ref={headerRef}
        className={`fixed top-0 left-0 right-0 z-[500] h-12 sm:h-14 transition-all duration-400 will-change-transform border-b flex items-center justify-center ${(showMobileNav || showSearchOverlay || showUserHub)
          ? `${theme === 'dark' ? 'bg-[#0f1012]' : theme === 'sepia' ? 'bg-[#FDFBF7]' : 'bg-[#f5efe4]'} border-transparent`
          : `${theme === 'dark' ? 'bg-[#0f1012]/90 backdrop-blur-xl' : theme === 'sepia' ? 'bg-[#FDFBF7]/90 backdrop-blur-xl' : 'bg-[#f5efe4]/90 backdrop-blur-xl'} border-[#5C4A3D]/10 dark:border-[#c6a87c]/10`
          }`}
      >
        <div className="w-full max-w-[1600px] px-[clamp(20px,4vw,80px)] flex items-center justify-between relative h-full">

          {/* Left Column: Logo + wordmark */}
          <div className="flex items-center flex-1 justify-start transition-all">
            <div
              onClick={() => { handleHomeClick(); setShowMobileNav(false); setShowSearchOverlay(false); setShowUserHub(false); }}
              className={`flex items-center gap-2 cursor-pointer group shrink-0 transition-opacity duration-300 ${(showMobileNav || showSearchOverlay || showUserHub) ? 'opacity-0 sm:opacity-100 pointer-events-none sm:pointer-events-auto' : 'opacity-100'}`}
            >
              <KisaLogo className="w-5 h-5 text-[#231d15] dark:text-[#cda767] group-hover:text-[#9c7327] dark:group-hover:text-[#cda767] group-hover:scale-105 transition-all duration-300" />
              <span style={{ fontFamily: '"Fraunces", Georgia, serif' }} className="text-[15px] sm:text-base font-medium tracking-tight text-[#231d15] dark:text-[#efe9dd]">Al-<span className="italic text-[#9c7327] dark:text-[#cda767]">Kisa</span></span>
            </div>
          </div>

          {/* Center Column: Mathematically Anchored Navigation */}
          <nav className="hidden md:flex items-center justify-center gap-7 lg:gap-10 absolute left-1/2 transform -translate-x-1/2 whitespace-nowrap z-10">
            <button onClick={() => { setActiveTab('quran'); setShowSearchOverlay(false); setShowUserHub(false); }} className={`text-[11px] font-semibold uppercase tracking-widest transition-colors ${activeTab === 'quran' ? 'text-[#c6a87c]' : 'text-[#5C4A3D]/70 dark:text-[#c6a87c]/60 hover:text-[#2D241C] dark:hover:text-[#FAFAFA]'}`}>Quran</button>
            <button onClick={() => { setActiveTab('duas'); setShowSearchOverlay(false); setShowUserHub(false); }} className={`text-[11px] font-semibold uppercase tracking-widest transition-colors ${activeTab === 'duas' ? 'text-[#c6a87c]' : 'text-[#5C4A3D]/70 dark:text-[#c6a87c]/60 hover:text-[#2D241C] dark:hover:text-[#FAFAFA]'}`}>Duas</button>
            <button onClick={() => { setActiveTab('ziyarats'); setShowSearchOverlay(false); setShowUserHub(false); }} className={`text-[11px] font-semibold uppercase tracking-widest transition-colors ${activeTab === 'ziyarats' ? 'text-[#c6a87c]' : 'text-[#5C4A3D]/70 dark:text-[#c6a87c]/60 hover:text-[#2D241C] dark:hover:text-[#FAFAFA]'}`}>Ziyarats</button>
            <button onClick={() => { setActiveTab('hadith'); setShowSearchOverlay(false); setShowUserHub(false); }} className={`text-[11px] font-semibold uppercase tracking-widest transition-colors ${activeTab === 'hadith' ? 'text-[#c6a87c]' : 'text-[#5C4A3D]/70 dark:text-[#c6a87c]/60 hover:text-[#2D241C] dark:hover:text-[#FAFAFA]'}`}>Hadith Library</button>
            <button onClick={() => { setActiveTab('library'); setShowSearchOverlay(false); setShowUserHub(false); }} className={`text-[11px] font-semibold uppercase tracking-widest transition-colors ${activeTab === 'library' ? 'text-[#c6a87c]' : 'text-[#5C4A3D]/70 dark:text-[#c6a87c]/60 hover:text-[#2D241C] dark:hover:text-[#FAFAFA]'}`}>Academy</button>
          </nav>


          {/* Right Column: Icons & User Hub */}
          <div className="flex items-center gap-7 sm:gap-8 justify-end flex-1 relative">
            <button
              aria-label="Open search"
              onClick={() => { setShowSearchOverlay(true); setShowUserHub(false); setShowMobileNav(false); setTimeout(() => globalSearchRef.current?.focus(), 100); }}
              className={`transition-all duration-300 cursor-pointer flex items-center gap-2 text-[#5C4A3D] dark:text-[#c6a87c]/80 sm:border sm:border-[#5C4A3D]/15 sm:dark:border-[#c6a87c]/20 sm:bg-[#fbf8f1]/70 sm:dark:bg-[#17181c]/70 sm:rounded-lg sm:px-3 sm:py-1.5 sm:hover:border-[#9c7327]/50 sm:dark:hover:border-[#cda767]/50 ${(showMobileNav || showSearchOverlay || showUserHub) ? 'opacity-0 pointer-events-none sm:opacity-100 sm:pointer-events-auto' : 'opacity-100'}`}
            >
              <Search className="w-5 h-5 sm:w-[15px] sm:h-[15px] stroke-[2] shrink-0" />
              <span className="hidden sm:inline text-[13px] font-sans text-[#8a7f6e] dark:text-[#9b9486]">Search Al-Kisa</span>
            </button>

            {!user ? (
              <button
                aria-label="Sign in"
                onClick={() => { setShowAuthModal(true); setShowSearchOverlay(false); setShowMobileNav(false); }}
                className={`transition-opacity duration-300 cursor-pointer text-[12.5px] font-semibold px-4 py-1.5 rounded-lg bg-[#c9a14e] text-[#201a10] hover:brightness-[1.06] whitespace-nowrap ${(showMobileNav || showSearchOverlay || showUserHub) ? 'opacity-0 pointer-events-none sm:opacity-100 sm:pointer-events-auto' : 'opacity-100'}`}
              >
                Sign in
              </button>
            ) : (
              <button
                aria-label="Open account menu"
                onClick={() => { setShowUserHub(true); setShowSearchOverlay(false); setShowMobileNav(false); }}
                className={`transition-opacity duration-300 cursor-pointer text-[#231d15] dark:text-[#efe9dd] hover:text-[#9c7327] dark:hover:text-[#cda767] ${(showMobileNav || showSearchOverlay || showUserHub) ? 'opacity-0 pointer-events-none sm:opacity-100 sm:pointer-events-auto' : 'opacity-100'}`}
              >
                <User className="w-5 h-5 sm:w-[18px] sm:h-[18px] stroke-[2]" />
              </button>
            )}

            <button
              aria-label="Toggle navigation menu"
              onClick={() => {
                if (showMobileNav || showSearchOverlay || showUserHub) {
                  setShowMobileNav(false); setShowSearchOverlay(false); setShowUserHub(false);
                } else {
                  setShowMobileNav(true);
                }
              }}
              className="transition-colors cursor-pointer text-[#2D241C] dark:text-[#FAFAFA] hover:text-[#c6a87c] w-6 h-6 flex items-center justify-center relative z-50"
            >
              <AnimatedMenuIcon isOpen={(showMobileNav || showSearchOverlay || showUserHub)} className="w-6 h-6" />
            </button>

            {/* ======================================================================= */}
            {/* CANVAS B: THE USER Hub */}
            {/* ======================================================================= */}
            <AnimatePresence>
              {showUserHub && (
                <motion.div
                  key="user-hub"
                  exit={{ opacity: 1, transition: { duration: 0.5 } }}
                  className="fixed inset-0 sm:absolute sm:inset-auto sm:top-12 sm:right-0 sm:w-[320px] h-[100dvh] sm:h-auto z-[490] pointer-events-none overflow-hidden sm:overflow-visible flex flex-col"
                >
                  <div className="absolute top-12 bottom-0 left-0 right-0 sm:static sm:top-auto sm:bottom-auto overflow-hidden sm:overflow-visible z-10 pointer-events-none">
                    <motion.div
                      initial={{ y: "-100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "-100%", opacity: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      className={`w-full h-full sm:h-auto overflow-y-auto sm:overflow-visible flex flex-col relative pointer-events-auto ${themeBg} sm:border sm:${themeBorder} sm:shadow-2xl sm:rounded-2xl`}
                    >
                      {!user ? (
                        <div className="p-6 sm:p-8 flex flex-col text-left">
                          <h3 className="text-3xl sm:text-2xl font-semibold text-[#2D241C] dark:text-[#FAFAFA] mb-2 tracking-tight">Your Vault is locked.</h3>
                          <p className="text-base sm:text-sm text-[#5C4A3D]/70 dark:text-[#c6a87c]/70 mb-8 leading-relaxed">
                            <button onClick={() => { setShowAuthModal(true); setShowUserHub(false); }} className="text-blue-600 dark:text-blue-400 hover:underline">Sign in</button> to see if you have any saved narrations.
                          </p>
                          <div className="flex flex-col">
                            <div className="pb-2 border-b border-[#5C4A3D]/10 dark:border-[#c6a87c]/20 mb-2"><span className="text-xs font-medium text-[#5C4A3D]/60 dark:text-[#c6a87c]/60">My Profile</span></div>
                            <button onClick={() => { setShowAuthModal(true); setShowUserHub(false); }} className="w-full text-left flex items-center gap-4 py-3.5 sm:py-3 text-lg sm:text-sm font-medium text-[#2D241C] dark:text-[#FAFAFA] hover:text-[#c6a87c] transition-colors group"><Bookmark className="w-5 h-5 sm:w-4 sm:h-4 text-[#5C4A3D]/50 dark:text-[#c6a87c]/50 group-hover:text-[#c6a87c]" /> Study Vault</button>
                            <button onClick={() => { setShowAuthModal(true); setShowUserHub(false); }} className="w-full text-left flex items-center gap-4 py-3.5 sm:py-3 text-lg sm:text-sm font-medium text-[#2D241C] dark:text-[#FAFAFA] hover:text-[#c6a87c] transition-colors group"><Clock className="w-5 h-5 sm:w-4 sm:h-4 text-[#5C4A3D]/50 dark:text-[#c6a87c]/50 group-hover:text-[#c6a87c]" /> Study History</button>
                            <button onClick={() => { setShowAuthModal(true); setShowUserHub(false); }} className="w-full text-left flex items-center gap-4 py-3.5 sm:py-3 text-lg sm:text-sm font-medium text-[#2D241C] dark:text-[#FAFAFA] hover:text-[#c6a87c] transition-colors group"><Settings2 className="w-5 h-5 sm:w-4 sm:h-4 text-[#5C4A3D]/50 dark:text-[#c6a87c]/50 group-hover:text-[#c6a87c]" /> Account Settings</button>
                            <button onClick={() => { setShowAuthModal(true); setShowUserHub(false); }} className="w-full text-left flex items-center gap-4 py-3.5 sm:py-3 text-lg sm:text-sm font-medium text-[#2D241C] dark:text-[#FAFAFA] hover:text-[#c6a87c] transition-colors group"><User className="w-5 h-5 sm:w-4 sm:h-4 text-[#5C4A3D]/50 dark:text-[#c6a87c]/50 group-hover:text-[#c6a87c]" /> Sign in</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col p-2 sm:p-0">
                          <div className="px-4 py-3 border-b border-[#5C4A3D]/5 dark:border-[#c6a87c]/10"><span className="text-[10px] font-bold uppercase tracking-widest text-[#5C4A3D]/50 dark:text-[#c6a87c]/50">My Profile</span></div>
                          <button onClick={() => { setShowVault(true); setShowUserHub(false); }} className="w-full text-left flex items-center gap-4 px-4 py-4 sm:py-3.5 text-lg sm:text-sm font-medium text-[#2D241C] dark:text-[#FAFAFA] hover:bg-[#EAE4D3]/40 dark:hover:bg-[#c6a87c]/10 transition-colors group"><Bookmark className="w-5 h-5 sm:w-4 h-4 text-[#c6a87c]" /> Study Vault</button>
                          <button onClick={() => { setShowHistoryDrawer(true); setShowUserHub(false); }} className="w-full text-left flex items-center gap-4 px-4 py-4 sm:py-3.5 text-lg sm:text-sm font-medium text-[#2D241C] dark:text-[#FAFAFA] hover:bg-[#EAE4D3]/40 dark:hover:bg-[#c6a87c]/10 transition-colors"><Clock className="w-5 h-5 sm:w-4 h-4 text-[#5C4A3D]/60 dark:text-[#c6a87c]/60" /> Study History</button>
                          <button onClick={() => { setShowSignOutConfirm(true); setShowUserHub(false); }} className="w-full text-left flex items-center gap-4 px-4 py-4 sm:py-3.5 text-lg sm:text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors mt-1 sm:rounded-b-xl border-t border-[#5C4A3D]/5 dark:border-[#c6a87c]/10"><User className="w-5 h-5 sm:w-4 h-4" /> Sign Out</button>
                        </div>
                      )}
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>
      )}

      {/* ======================================================================= */}
      {/* CANVAS A: THE SEARCH OVERLAY (APPLE CURTAIN PHYSICS) */}
      {/* ======================================================================= */}
      <SearchOverlay themeBg={themeBg} />

      {/* ======================================================================= */}
      {/* CANVAS C: THE MAIN MENU (MOBILE CURTAIN / DESKTOP DROPDOWN) */}
      {/* ======================================================================= */}
      <MobileNav
        open={showMobileNav}
        onClose={() => setShowMobileNav(false)}
        theme={theme}
        setTheme={setTheme}
        setActiveTab={setActiveTab}
        themeBg={themeBg}
        themeBorder={themeBorder}
        onShowUpdates={() => { setShowUpdates(true); setShowMobileNav(false); }}
        onShowInfo={() => { setShowInfo(true); setShowMobileNav(false); }}
      />

      <main ref={containerRef} className={`relative w-full flex-grow flex flex-col ${lockMainScreen ? 'items-center justify-center h-screen overflow-hidden' : 'min-h-screen'}`}>
        <Routes>
        <Route path="/glossary" element={
          <div className="w-full flex-grow flex flex-col relative pt-14">
            <Glossary theme={theme} />
          </div>
        } />
        <Route path="/quran" element={
          <div className="w-full flex-grow flex flex-col relative pt-20 sm:pt-24">
            <QuranReader
              activeFontFamily={activeFontFamily}
              fontStyle={fontStyle}
              setFontStyle={setFontStyle}
              handleSurahSelectHook={(id, name) => saveToHistory({ type: 'quran', surahId: id, surahName: name, timestamp: Date.now() })}
              externalSurahTarget={quranTarget}
              externalVerseTarget={quranVerseTarget}
              onTafsirClick={handleTafsirClick}
              vaultItems={vaultItems}
              handleCopyHadith={handleCopyHadith}
              handleFindSimilar={handleFindSimilar}
              HadithCard={HadithCard}
              KisaLogo={KisaLogo}
              isAdmin={isAdmin}
            />
          </div>
        } />

        <Route path="/duas" element={
          <div className="w-full flex-grow flex flex-col relative pt-20 sm:pt-24">
            <DuaLibrary
              vaultItems={vaultItems}
              theme={theme}
              externalTarget={duaTarget}
            />
          </div>
        } />

        <Route path="/ziyarats" element={
          <div className="flex flex-col items-center justify-center min-h-screen pt-20 px-6 text-center">
            <BookOpen className="w-12 h-12 text-[#c6a87c] opacity-50 mb-6" />
            <h2 className="font-serif text-3xl sm:text-4xl text-[#2D241C] dark:text-[#FAFAFA] mb-3 tracking-tight">The Book of Ziyarats</h2>
            <p className="text-[#5C4A3D]/70 dark:text-[#c6a87c]/70 max-w-md mx-auto leading-relaxed">
              The dedicated visitation library is currently being compiled and will be available in an upcoming update.
            </p>
          </div>
        } />

        {/* --- THIS BLOCK NOW RENDERS THE NEW HUB --- */}
        <Route path="/kisa-academy" element={
          <KisaAcademy
            transcripts={transcriptData}
            vaultItems={vaultItems}
            externalDocTarget={transcriptTarget}
            externalHighlightTarget={transcriptHighlight}
            theme={theme}
            setTheme={setTheme}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            handleHomeClick={handleHomeClick}
            showHistoryDrawer={showHistoryDrawer}
            setShowHistoryDrawer={setShowHistoryDrawer}
            appHistory={appHistory}
            setAppHistory={setAppHistory}
            handleHistoryClick={handleHistoryClick}
            showUpdates={showUpdates}
            setShowUpdates={setShowUpdates}
            showInfo={showInfo}
            setShowInfo={setShowInfo}
            user={user}
            setShowAuthModal={setShowAuthModal}
            setShowSignOutConfirm={setShowSignOutConfirm}
            setShowVault={setShowVault}
            setQuranTarget={setQuranTarget}
            setQuranVerseTarget={setQuranVerseTarget}
            APP_UPDATES={APP_UPDATES}
            timeAgo={timeAgo}
            KisaLogo={KisaLogo}
          />
        } />

        <Route path="/hadith/:book?/:volume?/:category?/:chapter?" element={
          isHadithLoading ? (
            <div className="flex flex-col items-center justify-center min-h-screen text-[#5C4A3D]/60 dark:text-[#c6a87c]/60 pt-20">
              <KisaLogo className="w-12 h-12 animate-pulse mb-4" />
              <p className="font-mono text-xs uppercase tracking-widest font-bold">Loading Hadith Library...</p>
            </div>
          ) : hadithLoadError ? (
            <div className="flex flex-col items-center justify-center min-h-screen text-red-500 pt-20 px-6 text-center">
              <ShieldAlert className="w-12 h-12 mb-4 text-red-500" />
              <p className="font-serif font-bold text-2xl mb-2 text-zinc-900 dark:text-white">Database Connection Failed</p>
              <p className="text-sm font-mono opacity-80 max-w-md bg-red-50 dark:bg-red-500/10 p-4 rounded-lg border border-red-200 dark:border-red-500/20">{hadithLoadError}</p>
            </div>
          ) : (
            <HadithLibrary
              hadithData={alKafiData}
              externalTarget={hadithTarget}
              isAdmin={isAdmin}
            />
          )
        } />

        <Route path="/" element={
          <Home
            setActiveTab={setActiveTab}
            setQuery={setQuery}
            setSearchMode={setSearchMode}
            setQuranTarget={setQuranTarget}
            setQuranVerseTarget={setQuranVerseTarget}
            setTranscriptTarget={setTranscriptTarget}
            setHadithTarget={setHadithTarget}
            user={user}
            vaultItems={vaultItems}
            KisaLogo={KisaLogo}
            setShowUpdates={setShowUpdates}
          />
        } />


        <Route path="/search" element={
          <SearchResults theme={theme} centerPos={centerPos} windowWidth={windowWidth} />
        } />
<Route path="/admin" element={<KisaCommandCenter />} />
          <Route path="/kisa-academy/library/:series?/:episode?" element={
            <TranscriptLibrary 
                transcripts={transcriptData}
                vaultItems={vaultItems}
                externalDocTarget={transcriptTarget}
                externalHighlightTarget={transcriptHighlight}
                theme={theme}
                setTheme={setTheme}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                handleHomeClick={handleHomeClick}
                showHistoryDrawer={showHistoryDrawer}
                setShowHistoryDrawer={setShowHistoryDrawer}
                appHistory={appHistory}
                setAppHistory={setAppHistory}
                handleHistoryClick={handleHistoryClick}
                showUpdates={showUpdates}
                setShowUpdates={setShowUpdates}
                showInfo={showInfo}
                setShowInfo={setShowInfo}
                user={user}
                setShowAuthModal={setShowAuthModal}
                setShowSignOutConfirm={setShowSignOutConfirm}
                setShowVault={setShowVault}
                setQuranTarget={setQuranTarget}
                setQuranVerseTarget={setQuranVerseTarget}
                APP_UPDATES={APP_UPDATES}
                timeAgo={timeAgo}
                KisaLogo={KisaLogo}
            />
          } />
          <Route path="/kisa-academy/courses" element={<CourseLibrary />} />
        
        </Routes>

        <ClusterModal modalScrollRef={modalScrollRef} handleModalScroll={handleModalScroll} vaultItems={vaultItems} />

        {/* --- MAP VIEW: THE ANCHOR POPUP MODAL --- */}
        <AnchorModal activeFontFamily={activeFontFamily} />

        {/* --- REVERSE QURAN TAFSIR POPUP --- */}
        <AnimatePresence>
          {(tafsirLoading || tafsirData) && tafsirTarget && (
            <div className="fixed inset-0 z-[7000] flex items-center justify-center pointer-events-auto p-4 sm:p-0">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setTafsirData(null); setTafsirLoading(false); setTafsirTarget(null); }} className="absolute inset-0 bg-[#2D241C]/60 dark:bg-[#020604]/80 backdrop-blur-md cursor-pointer" />
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-[#EAE4D3] dark:bg-[#030A06] border border-[#5C4A3D]/20 dark:border-[#c6a87c]/20 w-full sm:w-[90vw] max-w-[700px] h-[80vh] flex flex-col shadow-2xl rounded-2xl z-[7001] overflow-hidden">
                <div className="flex justify-between items-center bg-[#FDFBF7]/60 dark:bg-[#c6a87c]/5 backdrop-blur-xl pt-5 pb-4 px-6 z-10 border-b border-[#5C4A3D]/15 dark:border-[#c6a87c]/20 shrink-0">
                  <div>
                    <h3 className="font-mono text-sm tracking-widest uppercase text-amber-600 dark:text-amber-500 font-bold mb-0.5 flex items-center gap-2"><LibraryBig className="w-4 h-4" /> Related Narrations</h3>
                    <p className="text-xs text-[#5C4A3D]/60 dark:text-[#c6a87c]/60 font-mono m-0">Surah {tafsirTarget.surah}, Verse {tafsirTarget.ayah}</p>
                  </div>
                  <button onClick={() => { setTafsirData(null); setTafsirLoading(false); setTafsirTarget(null); }} className="p-2 hover:bg-[#FDFBF7] dark:hover:bg-[#c6a87c]/10 rounded-full transition-colors cursor-pointer shrink-0"><X className="w-5 h-5 text-[#5C4A3D] dark:text-[#c6a87c]" /></button>
                </div>
                <div ref={tafsirScrollRef} className="p-4 sm:p-6 overflow-y-auto flex-grow smart-scrollbar bg-[#EAE4D3]/50 dark:bg-black/20">
                  {tafsirLoading ? (
                    <div className="flex flex-col items-center justify-center h-full text-[#5C4A3D]/60 dark:text-[#c6a87c]/60"><KisaLogo className="w-10 h-10 animate-pulse text-amber-500 mb-4" /><p className="text-sm font-mono uppercase tracking-widest">Scanning Database...</p></div>
                  ) : tafsirData?.empty || !tafsirData?.clusters || tafsirData.clusters.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-[#5C4A3D]/50 dark:text-[#c6a87c]/40 italic"><LibraryBig className="w-12 h-12 mb-4 opacity-20" /><p>No hadiths found in the database referencing this specific verse.</p></div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {(tafsirData.clusters || []).flatMap(c => c.items || []).map((item, idx) => (<HadithCard key={idx} item={item} searchMode="keyword" handleCopyHadith={handleCopyHadith} onFindSimilar={handleFindSimilar} vaultItems={vaultItems} isAdmin={isAdmin} />))}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <QuranPopup popup={quranPopup} onClose={() => setQuranPopup(null)} activeFontFamily={activeFontFamily} />

        <AnimatePresence>
          {showHistoryDrawer && (
            <div className="fixed inset-0 z-[2000] flex items-center justify-center pointer-events-auto p-4 sm:p-0">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowHistoryDrawer(false)} className="absolute inset-0 bg-[#2D241C]/60 dark:bg-[#020604]/80 backdrop-blur-md cursor-pointer" />
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-[#EAE4D3] dark:bg-[#030A06] border border-[#5C4A3D]/20 dark:border-[#c6a87c]/20 w-full sm:w-[90vw] max-w-[600px] max-h-[85vh] flex flex-col shadow-2xl rounded-2xl z-[2001]">
                <div className="flex justify-between items-center bg-[#FDFBF7]/60 dark:bg-[#c6a87c]/5 backdrop-blur-xl pt-5 pb-4 px-5 sm:px-6 z-10 border-b border-[#5C4A3D]/15 dark:border-[#c6a87c]/20 rounded-t-2xl shrink-0">
                  <h2 className="text-lg sm:text-xl font-mono font-bold tracking-tight text-[#2D241C] dark:text-[#FAFAFA] flex items-center gap-2"><Clock className="w-5 h-5 text-[#5C4A3D] dark:text-[#c6a87c]" />Study History</h2>
                  <div className="flex items-center gap-2">
                    {appHistory.length > 0 && <button onClick={() => setAppHistory([])} className="p-2 hover:bg-red-50 text-red-500 hover:text-red-600 dark:hover:bg-red-500/10 rounded-full transition-colors cursor-pointer shrink-0" title="Clear History"><Trash2 className="w-4 h-4 sm:w-5 sm:h-5" /></button>}
                    <button onClick={() => setShowHistoryDrawer(false)} className="p-2 hover:bg-[#FDFBF7] dark:hover:bg-[#c6a87c]/10 rounded-full transition-colors cursor-pointer shrink-0"><X className="w-5 h-5 text-[#5C4A3D] dark:text-[#c6a87c]" /></button>
                  </div>
                </div>
                <div className="overflow-y-auto flex-grow smart-scrollbar p-2 sm:p-4">
                  {appHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-[#5C4A3D]/50 dark:text-[#c6a87c]/50 italic"><History className="w-10 h-10 mb-4 opacity-20" /><p>Your study history is empty.</p></div>
                  ) : (
                    <div className="flex flex-col gap-1 sm:gap-2">
                      {appHistory.map((item, i) => (
                        <div key={i} onClick={() => handleHistoryClick(item)} className={`px-4 sm:px-5 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 rounded-xl cursor-pointer transition-colors border group hover:bg-[#FDFBF7]/60 dark:hover:bg-[#c6a87c]/10 border-transparent hover:border-[#5C4A3D]/15 dark:hover:border-[#c6a87c]/30`}>
                          <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0 flex-1">
                            <div className={`p-2 sm:p-2.5 rounded-lg shrink-0 bg-[#FDFBF7]/80 dark:bg-black/20 text-[#5C4A3D] dark:text-slate-300 border border-transparent dark:border-[#c6a87c]/10`}>
                              {item.type === 'quran' ? <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" /> : (item.mode === 'keyword' ? <Database className="w-4 h-4 sm:w-5 sm:h-5" /> : <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#c6a87c]" />)}
                            </div>
                            <div className="flex flex-col min-w-0 flex-1 pr-2">
                              <span className="font-semibold text-sm sm:text-base truncate w-full text-[#2D241C] dark:text-[#c6a87c] group-hover:dark:text-[#FAFAFA]">{item.type === 'quran' ? `Surah ${item.surahName}` : item.query}</span>
                              <span className="text-[10px] sm:text-xs text-[#5C4A3D]/60 dark:text-[#c6a87c]/50 font-mono mt-0.5">{item.type === 'search' ? `${item.mode === 'concept' ? 'Semantic' : 'Exact Match'} • ${item.source}` : 'Quran Recitation'}</span>
                            </div>
                          </div>
                          <span className="text-[10px] sm:text-xs font-mono text-[#5C4A3D]/50 dark:text-[#c6a87c]/40 self-end sm:self-auto shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">{timeAgo(item.timestamp)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* --- PREMIUM UPDATES LOG MODAL --- */}
        <UpdatesModal open={showUpdates} onClose={() => setShowUpdates(false)} />

        <InfoModal open={showInfo} onClose={() => setShowInfo(false)} />
        {/* --- LEGAL PAGES --- */}
        {activeTab === 'disclaimer' && (
          <div className="flex flex-col items-center justify-center min-h-[70vh] pt-24 pb-16 px-6 max-w-3xl mx-auto text-left sm:text-center">
            <h2 className="font-serif text-3xl sm:text-4xl text-[#2D241C] dark:text-[#FAFAFA] mb-8 tracking-tight">Educational & Translation Disclaimer</h2>
            <div className="space-y-6 text-[#5C4A3D]/90 dark:text-slate-300 leading-relaxed text-sm sm:text-base font-serif text-left">
              <p>Al-Kisa is an independent educational platform designed to index and map the foundational texts of Twelver Shia Islam. We do not issue religious, theological, or jurisprudential (Fiqh) rulings. Users seeking binding religious guidance must consult qualified scholars.</p>
              <p><strong className="text-[#2D241C] dark:text-[#c6a87c] font-sans text-xs uppercase tracking-widest block mb-1 mt-4">On Translations and AI:</strong> The original Arabic texts of the Ahl al-Bayt (a.s.) are in the public domain. To make these resources universally accessible, Al-Kisa utilizes a combination of open-source community translations, manual editorial corrections for clarity and grammar, and state-of-the-art AI translation models. Specifically, the lecture transcripts inside <em>The Academy</em> and select <em>Hadith</em> volumes utilize AI-assisted translation. While we strive for absolute precision, algorithmic translations may contain nuances or historical contexts that require scholarly verification.</p>
            </div>
          </div>
        )}

        {activeTab === 'terms' && (
          <div className="flex flex-col items-center justify-center min-h-[70vh] pt-24 pb-16 px-6 max-w-3xl mx-auto text-left sm:text-center">
            <h2 className="font-serif text-3xl sm:text-4xl text-[#2D241C] dark:text-[#FAFAFA] mb-8 tracking-tight">Terms of Service</h2>
            <div className="space-y-6 text-[#5C4A3D]/90 dark:text-slate-300 leading-relaxed text-sm sm:text-base font-serif text-left">
              <p>By accessing Al-Kisa, you agree to use the platform for educational, non-commercial, and personal study purposes.</p>
              <p><strong className="text-[#2D241C] dark:text-[#c6a87c] font-sans text-xs uppercase tracking-widest block mb-1 mt-4">Intellectual Property & Database Rights:</strong> Al-Kisa claims no ownership or copyright over the original, centuries-old Arabic texts of the Holy Quran, Hadith, Duas, or Ziyarats. However, under UK intellectual property law, the specific structural aggregation, semantic vector mapping, proprietary algorithms, user interface, and original editorial formatting/corrections housed within Al-Kisa constitute a protected, proprietary database.</p>
              <p>Automated scraping, mass data extraction, or commercial repackaging of Al-Kisa’s semantic database, English formatting, or AI-generated transcripts is strictly prohibited without explicit written consent.</p>
            </div>
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="flex flex-col items-center justify-center min-h-[70vh] pt-24 pb-16 px-6 max-w-3xl mx-auto text-left sm:text-center">
            <h2 className="font-serif text-3xl sm:text-4xl text-[#2D241C] dark:text-[#FAFAFA] mb-8 tracking-tight">Privacy Policy</h2>
            <div className="space-y-6 text-[#5C4A3D]/90 dark:text-slate-300 leading-relaxed text-sm sm:text-base font-serif text-left">
              <p>Al-Kisa respects your privacy and is committed to protecting your personal data in accordance with the UK General Data Protection Regulation (UK GDPR).</p>
              <p><strong className="text-[#2D241C] dark:text-[#c6a87c] font-sans text-xs uppercase tracking-widest block mb-1 mt-4">Data We Collect:</strong> If you choose to create a "Study Vault" account, we collect your email address solely for authentication and to securely sync your saved bookmarks across devices. We do not sell, rent, or share your email with third-party marketers.</p>
              <p><strong className="text-[#2D241C] dark:text-[#c6a87c] font-sans text-xs uppercase tracking-widest block mb-1 mt-4">Local Storage:</strong> To enhance your reading experience, Al-Kisa uses local browser storage to remember your preferred UI theme (Light, Dark, Sepia) and your recent study history. This data remains on your physical device and is not transmitted to our servers.</p>
              <p><strong className="text-[#2D241C] dark:text-[#c6a87c] font-sans text-xs uppercase tracking-widest block mb-1 mt-4">Your Rights:</strong> You have the right to request access to the data stored in your Study Vault, and the right to request the complete deletion of your account and associated data at any time.</p>
            </div>
          </div>
        )}

        {/* --- DYNAMIC FOOTER --- */}
        {!hideFooter && !isAdminRoute && (
          <Footer theme={theme} setActiveTab={setActiveTab} KisaLogo={KisaLogo} setShowSearchOverlay={setShowSearchOverlay} />
        )}

      
          
      </main>

      {/* Vercel Analytics injected here */}
      <Analytics />

    </div>
    </SearchContext.Provider>
  );
}
export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <DeepLinkCatcher />
      <AppContent />
    </BrowserRouter>
  );
}
