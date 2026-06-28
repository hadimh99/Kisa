import React, { useState, useEffect, useRef, useMemo } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Moon, Sun, Sparkles, X, ChevronRight, ChevronLeft, Home as HomeIcon, Copy, ChevronDown, ChevronUp, List, Layout, Info, BookOpen, History, HelpCircle, Database, Filter, Share2, Check, Settings2, Menu, Clock, Trash2, LibraryBig, Youtube, Library as LibraryIcon, ArrowDown, ArrowRight, User, Bookmark, Coins, HeartPulse, ShieldAlert, MoreHorizontal, PenLine, FolderPlus, FolderMinus, Book, CalendarDays } from 'lucide-react';
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


const APP_UPDATES = [
  {
    version: "v5.2.0",
    date: "April 26, 2026",
    changes: [
      "Theological Glossary: We've added a comprehensive A-Z dictionary of Twelver Shia terminology. You can browse all core concepts, filter them by category, share with your friends, copy to your notes, and save important terms directly to your Study Vault. You can easily access it anytime by opening the Search menu.",
      "Smart Day/Night Themes: Al-Kisa now automatically adapts to your environment! It will gently switch to a bright theme during the day and a dark theme at night to protect your eyes. If you prefer a specific look, just choose your favorite theme from the menu—your device will remember your choice for every future visit."
    ]
  },
  {
    version: "v5.1.0",
    date: "April 20, 2026",
    changes: [
      "Scholarly Commentary: You can now explore beautifully translated lectures by Sheikh al-Ghizzi directly inside the Scholarly Library. Read through rich, segmented teachings on the Ahl al-Bayt with full sourcing and context at your fingertips.",
      "Deeper Connections: Every lecture is now woven into Al-Kisa's living knowledge base. As you read, foundational terms are automatically highlighted with elegant tooltips — connecting modern scholarly insights to the narrations, Quranic verses, and Duas they reference.",
      "Full Transparency: All translated commentary is clearly marked with provenance tags so you always know the source. Look for the 'AI-Translated Transcript' and 'Original Arabic Audio Available' indicators on every lecture.",
      "Library Polish: The entire Scholarly Library reading experience has been refined for smoother navigation and a more immersive reading flow on both desktop and mobile."
    ]
  },
  {
    version: "v5.0.1",
    date: "April 13, 2026",
    changes: [
      "Onboarding Experience: Introduced 'The Living Library' section to the Home screen, visually demonstrating Al-Kisa's semantic search and Reverse Tafsir capabilities without technical jargon.",
      "Responsive Polish: Upgraded the Core Collections grid with dynamic column-spanning, guaranteeing a perfectly symmetrical Apple-standard bento layout across all mobile and tablet breakpoints.",
      "Platform Security: Upgraded the administrative editor with strict UID-gated access, ensuring the integrity of the live master database."
    ]
  },

  {
    version: "v5.0.0",
    date: "April 11, 2026",
    changes: [
      "Platform Evolution: Al-Kisa has officially transitioned into a full-scale learning platform. Expect new, highly structured educational and scholarly content to be released every single week.",
      "Expanded Liturgy (Duas & Ziyarats): Launched a dedicated core texts section for navigating Duas and Ziyarats, with a massive library of new content arriving soon.",
      "Architectural Overhaul: Introduced a premium, iOS-tier native physics engine. UI interactions now feature critical spring-squish mechanics, GPU-accelerated crossfading, and micro-haptic feedback.",
      "Infinite Hadith Discovery: The Daily Hadith card now features a lightning-fast 'Shuffle' engine with seamless layout morphing and zero-stutter cinematic blur transitions.",
      "UI Polish: Completely reimagined the Home Screen with an Apple-standard Bento Grid layout and an optimized, zero-stutter 'Ghost Writer' entrance choreography."
    ]
  },
  {
    version: "v4.0.0",
    date: "March 8, 2026",
    changes: [
      "Introduced the Digital Archive (Transcript Library): A premium reading environment for translated scholarly series, starting with 'The File of Fatima'.",
      "UI Polish: Added custom text parser for bold highlights, unified mobile drawer, and high-performance native scrolling for transcripts."
    ]
  },
  {
    version: "v3.5.3",
    date: "March 5, 2026",
    changes: [
      "Documentation: Completely overhauled the 'Help & Guide' section to detail the comprehensive suite of tools now available in Al-Kisa, including Vector Hopping, Dynamic Map Views, and Reverse Quran Tafsir."
    ]
  },
  {
    version: "v3.5.2",
    date: "March 5, 2026",
    changes: [
      "Feature Polish: Added a 'Copy Text' button to all 'Anchored Source' views (both List View accordion and Map View modal) allowing you to copy the full reference, Arabic, and translation instantly.",
      "Map UX Overhaul: Nodes are uniformly sized and mathematically bounded to never overlap the center box or go off-screen."
    ]
  }
];
const CLUSTER_COLORS = ['#10b981', '#8b5cf6', '#f59e0b', '#f43f5e', '#3b82f6'];
const SOURCES = ["All Twelver Sources", "al-Kafi", "Bihar al-Anwar", "Basa'ir al-Darajat"];

const timeAgo = (ts) => {
  const diff = Math.floor((Date.now() - ts) / 60000);
  if (diff < 1) return 'Just now';
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / 1440)}d ago`;
};

const KisaLogo = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M18 4V18.5C18 19.3284 17.3284 20 16.5 20H6.5C5.67157 20 5 19.3284 5 18.5V14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M13.5 8.5L9.5 11L12.5 13.5L8.5 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// THE UPGRADED NATIVE ICON PHYSICS
// Automatically morphs to X on mount, and morphs back to Hamburger on exit.
const AnimatedMenuIcon = ({ isOpen, className }) => (
  <motion.svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <motion.line x1="4" y1="9" x2="20" y2="9" initial={false} animate={isOpen ? { y1: 12, y2: 12, rotate: 45 } : { y1: 9, y2: 9, rotate: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} style={{ transformOrigin: "center" }} />
    <motion.line x1="4" y1="15" x2="20" y2="15" initial={false} animate={isOpen ? { y1: 12, y2: 12, rotate: -45 } : { y1: 15, y2: 15, rotate: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} style={{ transformOrigin: "center" }} />
  </motion.svg>
);

const TwoLineMenu = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="4" y1="9" x2="20" y2="9" />
    <line x1="4" y1="15" x2="20" y2="15" />
  </svg>
);

const ADMIN_ID = '54ac00e5-b3d3-4ce8-bd8b-a8e2d502e9bb';



const DeepLinkCatcher = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab) {
       if (tab === 'quran') navigate('/quran', {replace: true});
       else if (tab === 'duas') navigate('/duas', {replace: true});
       else if (tab === 'transcripts') {
          const id = params.get('id');
          navigate(`/kisa-academy/library${id ? `/${id}` : ''}`, {replace: true});
       }
       else if (tab === 'library') navigate('/kisa-academy', {replace: true});
       else if (tab === 'hadith') navigate('/hadith', {replace: true});
       else if (tab === 'ziyarats') navigate('/ziyarats', {replace: true});
       else navigate('/', {replace: true});
    }
  }, [location, navigate]);
  return null;
};


const ScrollToTop = () => {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  return null;
};

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
  const ITEMS_PER_PAGE = 10;
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
      if (theme === 'dark') return '#000000';
      if (theme === 'sepia') return '#FDFBF7';
      return '#F5F5F7';
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

  const getRadialPosition = (index, total, rx, ry) => {
    const angle = (index * (360 / total) - 90) * (Math.PI / 180);
    return { x: Math.cos(angle) * rx, y: Math.sin(angle) * ry };
  };

  const uniqueBooks = data && data.clusters ? Array.from(new Set(data.clusters.flatMap(c => c.items ? c.items.map(item => item.book) : []))) : [];
  const isKeyword = searchMode === 'keyword';


  const [magneticPos, setMagneticPos] = useState({ x: 0, y: 0 });
  const btnRef = useRef(null);

  const getAppBgClass = () => {
    if (['quran', 'duas', 'ziyarats'].includes(activeTab)) return theme === 'dark' ? 'bg-black text-[#F5F5F7]' : (theme === 'sepia' ? 'bg-[#f4ecd8] text-[#2D241C]' : 'bg-[#F5F5F7] text-[#1D1D1F]');
    if (activeTab === 'library') return theme === 'dark' ? 'bg-black text-[#F5F5F7]' : (theme === 'sepia' ? 'bg-[#f4f4f5] text-[#2D241C]' : 'bg-[#F5F5F7] text-[#1D1D1F]');

    if (theme === 'dark') return 'bg-black text-[#F5F5F7]';
    if (theme === 'sepia') return 'bg-[#FDFBF7] text-[#2D241C]';
    return 'bg-[#F5F5F7] text-[#1D1D1F]';
  };
  const appBgClass = getAppBgClass();
  const isMapView = activeTab === 'search' && data && viewMode === 'map' && !loading;
  const isSearchResults = activeTab === 'search' && data && !loading;
  const lockMainScreen = isMapView;
  const hideFooter = lockMainScreen || activeTab === 'search';

  const themeBg = theme === 'dark' ? 'bg-black' : theme === 'sepia' ? 'bg-[#FDFBF7]' : 'bg-[#F5F5F7]';
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

  return (
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
      <AnimatePresence>
        {showAuthModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#FDFBF7]/40 dark:bg-[#020805]/60 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="relative w-full max-w-md p-8 bg-[#FDFBF7] dark:bg-[#0A120E] border border-[#5C4A3D]/10 dark:border-[#c6a87c]/20 rounded-[2rem] shadow-2xl">
              <button onClick={() => setShowAuthModal(false)} className="absolute top-5 right-5 p-2 text-[#5C4A3D]/60 dark:text-[#FAFAFA]/60 hover:text-[#2D241C] dark:hover:text-[#c6a87c] transition-colors rounded-full hover:bg-[#5C4A3D]/5 dark:hover:bg-[#c6a87c]/10"><X className="w-5 h-5" /></button>
              <div className="text-center mb-8">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#c6a87c]/10 flex items-center justify-center border border-[#c6a87c]/20"><Bookmark className="w-5 h-5 text-[#c6a87c]" /></div>
                <h2 className="text-2xl font-serif text-[#2D241C] dark:text-[#FAFAFA] mb-2">Study Vault</h2>
                <p className="text-sm text-[#5C4A3D]/80 dark:text-[#FAFAFA]/60">Secure your research globally. No magic links required.</p>
              </div>
              <form onSubmit={handleEmailAuth} className="space-y-4">
                <div><input type="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} placeholder="name@example.com" required className="w-full bg-transparent appearance-none outline-none rounded-xl py-3 px-4 text-base font-sans text-[#2D241C] dark:text-[#FAFAFA] placeholder:text-[#5C4A3D]/40 dark:placeholder:text-[#c6a87c]/40 border border-[#5C4A3D]/20 dark:border-[#c6a87c]/30 focus:border-[#c6a87c] focus:ring-1 focus:ring-[#c6a87c] transition-all" /></div>
                <div><input type="password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} placeholder="Password (min 6 chars)" required className="w-full bg-transparent appearance-none outline-none rounded-xl py-3 px-4 text-base font-sans text-[#2D241C] dark:text-[#FAFAFA] placeholder:text-[#5C4A3D]/40 dark:placeholder:text-[#c6a87c]/40 border border-[#5C4A3D]/20 dark:border-[#c6a87c]/30 focus:border-[#c6a87c] focus:ring-1 focus:ring-[#c6a87c] transition-all" /></div>
                <button type="submit" disabled={authLoading} className="w-full flex items-center justify-center py-3.5 rounded-xl font-medium text-[#FDFBF7] dark:text-[#0A120E] bg-[#2D241C] dark:bg-[#c6a87c] hover:bg-[#1A1510] dark:hover:bg-[#d4ba96] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {authLoading ? 'Authenticating...' : (isSignUp ? 'Create Account' : 'Sign In')}
                </button>
              </form>
              <div className="mt-5 text-center">
                <button onClick={() => { setIsSignUp(!isSignUp); setAuthMessage({ text: '', type: '' }); }} className="text-sm font-medium text-[#5C4A3D]/80 dark:text-[#c6a87c]/80 hover:text-[#2D241C] dark:hover:text-[#FAFAFA] transition-colors cursor-pointer">
                  {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Create one"}
                </button>
              </div>
              {authMessage.text && (
                <div className={`mt-5 p-3.5 rounded-xl text-sm text-center font-medium ${authMessage.type === 'error' ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20' : 'bg-[#c6a87c]/10 text-[#5C4A3D] dark:text-[#c6a87c] border border-[#c6a87c]/20'}`}>
                  {authMessage.text}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- SIGN OUT CONFIRMATION MODAL --- */}
      <AnimatePresence>
        {showSignOutConfirm && (
          <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4 bg-[#FDFBF7]/40 dark:bg-[#020805]/60 backdrop-blur-md pointer-events-auto">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-sm p-6 sm:p-8 bg-[#FDFBF7] dark:bg-[#0A120E] border border-[#5C4A3D]/10 dark:border-[#c6a87c]/20 rounded-[2rem] shadow-2xl text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                <User className="w-5 h-5 text-red-500" />
              </div>
              <h2 className="text-xl sm:text-2xl font-serif text-[#2D241C] dark:text-[#FAFAFA] mb-2">Sign Out?</h2>
              <p className="text-sm text-[#5C4A3D]/80 dark:text-[#FAFAFA]/60 mb-6">Are you sure you want to sign out of your account?</p>
              <div className="flex gap-3">
                <button onClick={() => setShowSignOutConfirm(false)} className="flex-1 py-3 rounded-xl font-medium text-[#5C4A3D] dark:text-[#FAFAFA] bg-[#F8F5EE] dark:bg-[#1A1510] hover:bg-[#EAE4D3] dark:hover:bg-[#251E17] transition-colors border border-[#5C4A3D]/10 dark:border-[#c6a87c]/20 cursor-pointer">Cancel</button>
                <button onClick={() => { handleSignOut(); setShowSignOutConfirm(false); }} className="flex-1 py-3 rounded-xl font-medium text-white bg-red-500 hover:bg-red-600 transition-colors shadow-sm cursor-pointer">Sign Out</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
          ? `${theme === 'dark' ? 'bg-black' : theme === 'sepia' ? 'bg-[#FDFBF7]' : 'bg-[#F5F5F7]'} border-transparent`
          : `${theme === 'dark' ? 'bg-black/90 backdrop-blur-xl' : theme === 'sepia' ? 'bg-[#FDFBF7]/90 backdrop-blur-xl' : 'bg-[#F5F5F7]/90 backdrop-blur-xl'} border-[#5C4A3D]/10 dark:border-[#c6a87c]/10`
          }`}
      >
        <div className="w-full max-w-[1050px] px-4 sm:px-6 flex items-center justify-between relative h-full">

          {/* Left Column: Logo (Artificially pushed inward to balance visual weight) */}
          <div className="flex items-center flex-1 justify-start md:pl-16 lg:pl-24 transition-all">
            <div
              onClick={() => { handleHomeClick(); setShowMobileNav(false); setShowSearchOverlay(false); setShowUserHub(false); }}
              className={`flex items-center gap-2 cursor-pointer group shrink-0 transition-opacity duration-300 ${(showMobileNav || showSearchOverlay || showUserHub) ? 'opacity-0 sm:opacity-100 pointer-events-none sm:pointer-events-auto' : 'opacity-100'}`}
            >
              <KisaLogo className="w-5 h-5 text-[#2D241C] dark:text-[#c6a87c] group-hover:text-[#c6a87c] group-hover:scale-105 transition-all duration-300" />
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
              onClick={() => { setShowSearchOverlay(true); setShowUserHub(false); setShowMobileNav(false); setTimeout(() => globalSearchRef.current?.focus(), 100); }}
              className={`transition-opacity duration-300 cursor-pointer text-[#2D241C] dark:text-[#FAFAFA] hover:text-[#c6a87c] ${(showMobileNav || showSearchOverlay || showUserHub) ? 'opacity-0 pointer-events-none sm:opacity-100 sm:pointer-events-auto' : 'opacity-100'}`}
            >
              <Search className="w-5 h-5 sm:w-[18px] sm:h-[18px] stroke-[2]" />
            </button>

            <button
              onClick={() => { setShowUserHub(true); setShowSearchOverlay(false); setShowMobileNav(false); }}
              className={`transition-opacity duration-300 cursor-pointer text-[#2D241C] dark:text-[#FAFAFA] hover:text-[#c6a87c] ${(showMobileNav || showSearchOverlay || showUserHub) ? 'opacity-0 pointer-events-none sm:opacity-100 sm:pointer-events-auto' : 'opacity-100'}`}
            >
              <User className="w-5 h-5 sm:w-[18px] sm:h-[18px] stroke-[2]" />
            </button>

            <button
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
      <AnimatePresence>
        {showSearchOverlay && (
          <motion.div
            key="search-overlay"
            exit={{ opacity: 1, transition: { duration: 0.5 } }} // Forces wrapper to stay alive on exit
            className="fixed sm:inset-0 left-0 right-0 bottom-0 top-12 sm:top-0 z-[490] pointer-events-none overflow-hidden sm:overflow-auto flex flex-col"
          >
            {/* Desktop Only Close Button (Mobile naturally uses the global header master X) */}
            <div className="hidden sm:flex justify-end items-center h-14 px-6 lg:px-8 shrink-0 z-20 relative bg-inherit pointer-events-auto border-b border-transparent">
              <button onClick={() => setShowSearchOverlay(false)} className="w-7 h-7 flex items-center justify-center text-[#2D241C] dark:text-[#FAFAFA] hover:text-[#c6a87c] cursor-pointer">
                <AnimatedMenuIcon isOpen={true} className="w-7 h-7" />
              </button>
            </div>

            <motion.div
              initial={{ y: "-100%" }} animate={{ y: 0 }} exit={{ y: "-100%" }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className={`w-full h-full overflow-y-auto flex flex-col relative pointer-events-auto ${themeBg}`}
            >
              <div className="w-full max-w-3xl mx-auto px-6 pt-4 pb-6 sm:pt-2">

                {/* Dual-Mode Toggle */}
                <div className="flex justify-center mb-6">
                  <div className="flex p-1 rounded-xl border bg-[#F8F5EE]/60 dark:bg-[#050505] border-[#5C4A3D]/15 dark:border-[#c6a87c]/20 shadow-sm w-full max-w-sm">
                    <button
                      onClick={() => setOverlayMode('global')}
                      className={`flex-1 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${overlayMode === 'global' ? 'bg-[#FDFBF7] dark:bg-zinc-800 text-[#2D241C] dark:text-white shadow-sm' : 'text-[#5C4A3D]/60 dark:text-zinc-500 hover:text-[#5C4A3D] dark:hover:text-zinc-300'}`}
                    >
                      🌐 Platform Search
                    </button>
                    <button
                      onClick={() => setOverlayMode('advanced')}
                      className={`flex-1 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${overlayMode === 'advanced' ? 'bg-[#FDFBF7] dark:bg-[#c6a87c]/10 text-[#2D241C] dark:text-[#c6a87c] shadow-sm border border-transparent dark:border-[#c6a87c]/20' : 'text-[#5C4A3D]/60 dark:text-zinc-500 hover:text-[#5C4A3D] dark:hover:text-zinc-300'}`}
                    >
                      🧠 Knowledge Graph
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                  <Search className="absolute left-0 w-6 h-6 sm:w-8 sm:h-8 text-[#5C4A3D]/80 dark:text-[#c6a87c]/80" strokeWidth={3} />
                  <input
                    ref={globalSearchRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={overlayMode === 'global' ? "Search Quran, Duas, Series, or References..." : "Deep search the Hadith corpus..."}
                    className="w-full bg-transparent outline-none pl-12 sm:pl-14 pr-28 sm:pr-32 text-3xl sm:text-5xl font-sans font-bold tracking-tight text-[#2D241C] dark:text-[#FAFAFA] placeholder:text-[#5C4A3D]/80 dark:placeholder:text-[#c6a87c]/80 caret-[#c6a87c]"
                  />
                  <div className="absolute right-0 top-0 bottom-0 flex items-center pr-2 gap-1 sm:gap-2">
                    {query && (
                      <button
                        type="button"
                        onClick={() => setQuery('')}
                        className="p-2 sm:p-3 text-[#5C4A3D]/40 dark:text-[#c6a87c]/40 hover:text-[#2D241C] dark:hover:text-[#FAFAFA] transition-colors flex items-center justify-center cursor-pointer"
                      >
                        <X className="w-5 h-5 sm:w-6 sm:h-6" />
                      </button>
                    )}
                    <button
                      type="submit"
                      className={`p-2 sm:p-3 rounded-xl transition-all flex items-center justify-center ${query.trim() ? 'bg-[#c6a87c] text-[#1a1205] shadow-md hover:bg-[#d4b990] hover:scale-105 cursor-pointer' : 'bg-[#5C4A3D]/10 dark:bg-zinc-800/50 text-[#5C4A3D]/30 dark:text-zinc-600 cursor-not-allowed'}`}
                      disabled={!query.trim()}
                    >
                      <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                  </div>
                </form>

                {/* Spotlight Filters — Advanced Mode Only */}
                <AnimatePresence>
                  {overlayMode === 'advanced' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 px-2">
                        <div className="flex items-center rounded-lg p-1 border bg-[#F8F5EE]/60 dark:bg-[#020805]/60 border-[#5C4A3D]/15 dark:border-[#c6a87c]/10 shadow-inner w-full sm:w-auto">
                          <button type="button" onClick={() => { setSearchMode('concept'); setViewMode(window.innerWidth < 800 ? 'list' : 'map'); }} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all duration-300 flex-1 sm:flex-none justify-center cursor-pointer ${!isKeyword ? 'bg-[#FDFBF7] dark:bg-[#c6a87c]/15 text-[#2D241C] dark:text-[#c6a87c] shadow-sm border border-[#5C4A3D]/15 dark:border-[#c6a87c]/30' : 'text-[#5C4A3D]/80 hover:text-[#2D241C] dark:text-[#c6a87c]/50 dark:hover:text-[#c6a87c] border border-transparent'}`}><Sparkles className="w-3.5 h-3.5 opacity-70" /> Concept</button>
                          <button type="button" onClick={() => { setSearchMode('keyword'); setViewMode('list'); }} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all duration-300 flex-1 sm:flex-none justify-center cursor-pointer ${isKeyword ? 'bg-[#FDFBF7] dark:bg-[#c6a87c]/15 text-[#2D241C] dark:text-[#c6a87c] shadow-sm border border-[#5C4A3D]/15 dark:border-[#c6a87c]/30' : 'text-[#5C4A3D]/80 hover:text-[#2D241C] dark:text-[#c6a87c]/50 dark:hover:text-[#c6a87c] border border-transparent'}`}><Database className="w-3.5 h-3.5 opacity-70" /> Keyword</button>
                        </div>
                        <div className="relative flex items-center w-full sm:w-auto">
                          <div className="flex items-center gap-2 text-[#5C4A3D]/80 dark:text-[#c6a87c]/70 mr-3 hidden sm:flex"><BookOpen className="w-4 h-4 opacity-70" /><span className="text-xs uppercase tracking-wider font-semibold">Source:</span></div>
                          <button type="button" onClick={() => setShowDropdown(!showDropdown)} className="flex items-center justify-between w-full sm:w-[220px] px-3 py-1.5 sm:py-2 rounded-lg transition-colors text-xs sm:text-sm font-medium border border-transparent cursor-pointer bg-[#F8F5EE]/60 dark:bg-[#020805]/60 text-[#2D241C] dark:text-[#c6a87c]/80 hover:bg-[#FDFBF7] dark:hover:bg-[#c6a87c]/10 dark:hover:text-[#c6a87c] dark:hover:border-[#c6a87c]/20"><span className="truncate">{sourceFilter}</span><ChevronDown className="w-4 h-4 opacity-50 shrink-0 ml-2" /></button>
                          <AnimatePresence>
                            {showDropdown && (
                              <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="absolute top-full mt-2 right-0 w-full sm:w-[220px] rounded-xl border shadow-xl overflow-hidden z-50 backdrop-blur-2xl bg-[#FDFBF7]/95 dark:bg-[#040F0B]/95 border-[#5C4A3D]/15 dark:border-[#c6a87c]/20">
                                {(user ? ["All Twelver Sources", "My Vault", "al-Kafi", "Bihar al-Anwar", "Basa'ir al-Darajat"] : SOURCES).map((source) => (
                                  <div key={source} onClick={() => { setSourceFilter(source); setShowDropdown(false); }} className={`px-4 py-3 text-sm cursor-pointer transition-colors flex items-center gap-2 ${sourceFilter === source ? 'bg-[#EAE4D3]/60 dark:bg-[#c6a87c]/15 text-[#2D241C] dark:text-[#FAFAFA] font-bold' : 'text-[#5C4A3D] dark:text-[#c6a87c]/80 hover:bg-[#F8F5EE] dark:hover:bg-[#c6a87c]/10 dark:hover:text-[#c6a87c]'}`}>
                                    {source === "My Vault" && <Bookmark className="w-3.5 h-3.5" />}
                                    {source}
                                  </div>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="w-full max-w-3xl mx-auto px-6 py-8 flex-grow">
                <h3 className="text-sm sm:text-base font-sans text-[#5C4A3D]/70 dark:text-[#c6a87c]/70 mb-4">Quick Links</h3>
                <ul className="flex flex-col gap-1">
                  {[
                    { label: "Search Hadiths for the concept of Bada", action: () => { setQuery('Bada'); setSearchMode('concept'); setActiveTab('search'); executeSearch('Bada', 'concept', sourceFilter, null, null, null, null); setShowSearchOverlay(false); } },

                    {
                      label: "Al-Kafi Volume 1 The Book of Intelligence and Ignorance", action: () => {
                        if (setHadithTarget) setHadithTarget({ book: "al-Kafi", volume: "1", category: "intell", chapter: "intell" });
                        setActiveTab('hadith');
                        setShowSearchOverlay(false);
                      }
                    },

                    {
                      label: "Dua Kumayl", action: () => {
                        if (setDuaTarget) setDuaTarget('Dua Kumayl');
                        setActiveTab('duas');
                        setShowSearchOverlay(false);
                      }
                    },

                    { label: "Quran verse 5:55", action: () => { setQuranTarget(5); setQuranVerseTarget(55); setActiveTab('quran'); setShowSearchOverlay(false); } },
                    { label: "Know Your Imam", action: () => { setTranscriptTarget('know-your-imam-ep1'); setActiveTab('library'); setShowSearchOverlay(false); } }
                  ].map((link, idx) => (
                    <li key={idx}>
                      <button onClick={link.action} className="flex items-start gap-4 text-left w-full py-2.5 sm:py-3 transition-colors cursor-pointer group">
                        <span className="font-sans text-lg sm:text-xl text-[#2D241C]/70 dark:text-[#FAFAFA]/70 mt-[2px] sm:mt-[1px] group-hover:text-[#c6a87c] group-hover:translate-x-1 transition-all">→</span>
                        <span className="font-sans font-semibold text-base sm:text-[17px] tracking-tight text-[#2D241C] dark:text-[#FAFAFA] group-hover:text-[#c6a87c] leading-snug">{link.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>

                {/* ADD THIS NEW GLOSSARY BLOCK HERE */}
                <div className="mt-8 border-t border-[#5C4A3D]/10 dark:border-[#c6a87c]/10 pt-6">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#5C4A3D]/70 dark:text-[#c6a87c]/70 mb-4">Dictionary</h3>
                  <button
                    onClick={() => {
                      setActiveTab('glossary');
                      setShowSearchOverlay(false);
                    }}
                    className="w-full bg-[#F8F5EE]/60 dark:bg-[#c6a87c]/5 hover:bg-[#FDFBF7] dark:hover:bg-[#c6a87c]/10 border border-[#5C4A3D]/15 dark:border-[#c6a87c]/20 p-5 rounded-2xl flex items-center justify-between group transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-[#c6a87c]/20 p-3 rounded-xl text-[#c6a87c]">
                        <LibraryIcon className="w-6 h-6" />
                      </div>
                      <div className="text-left">
                        <h4 className="text-[#2D241C] dark:text-[#FAFAFA] font-bold text-base tracking-tight group-hover:text-[#c6a87c] transition-colors">Browse the Theological Glossary</h4>
                        <p className="text-[#5C4A3D]/70 dark:text-slate-400 text-xs mt-1 font-serif">Not sure what to search? Explore A-Z concepts.</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[#5C4A3D]/50 dark:text-[#c6a87c]/60 group-hover:text-[#c6a87c] transition-colors" />
                  </button>
                </div>
                {/* END OF GLOSSARY BLOCK */}

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ======================================================================= */}
      {/* CANVAS C: THE MAIN MENU (MOBILE CURTAIN / DESKTOP DROPDOWN) */}
      {/* ======================================================================= */}
      <AnimatePresence>
        {showMobileNav && (
          <motion.div
            key="mobile-nav"
            exit={{ opacity: 1, transition: { duration: 0.5 } }} // Forces wrapper to stay alive on exit
            className="fixed left-0 right-0 bottom-0 top-12 sm:top-12 sm:bottom-auto sm:left-auto sm:right-0 sm:w-[320px] z-[490] pointer-events-none overflow-hidden sm:overflow-visible flex flex-col"
          >
            <motion.div
              initial={{ y: "-100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "-100%", opacity: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className={`w-full h-full sm:h-auto overflow-y-auto px-6 py-8 flex flex-col gap-8 relative pointer-events-auto ${themeBg} sm:border sm:${themeBorder} sm:shadow-2xl sm:rounded-2xl`}
            >
              {/* Primary Navigation */}
              <div className="flex flex-col gap-6 md:hidden">
                {[
                  { label: "Quran", tab: "quran" },
                  { label: "Duas", tab: "duas" },
                  { label: "Ziyarats", tab: "ziyarats" },
                  { label: "Hadith Library", tab: "hadith" },
                  { label: "Academy", tab: "library" }
                ].map((nav, idx) => (
                  <button key={idx} onClick={() => { setActiveTab(nav.tab); setShowMobileNav(false); }} className="text-left text-3xl font-serif font-semibold tracking-tight text-[#2D241C] dark:text-[#FAFAFA] active:text-[#c6a87c] transition-colors">
                    {nav.label}
                  </button>
                ))}
              </div>


              {/* Divider */}
              <div className="h-px w-full border-b border-[#5C4A3D]/10 dark:border-[#c6a87c]/20 my-2 md:hidden" />

              {/* Utility Navigation */}
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <span className="text-[#5C4A3D] dark:text-[#c6a87c] font-medium text-lg flex items-center gap-4">
                    {theme === 'dark' ? <Moon className="w-6 h-6 shrink-0" /> : <Sun className="w-6 h-6 shrink-0" />} Theme
                  </span>
                  <div className="flex items-center gap-4">
                    <button onClick={() => { setTheme('light'); setShowMobileNav(false); }} className={`w-8 h-8 rounded-full bg-[#F5F5F7] border shadow-sm transition-all cursor-pointer ${theme === 'light' ? 'border-[#1D1D1F] scale-110' : 'border-slate-300'}`} title="Light Mode" />
                    <button onClick={() => { setTheme('sepia'); setShowMobileNav(false); }} className={`w-8 h-8 rounded-full bg-[#FDFBF7] border shadow-sm transition-all cursor-pointer ${theme === 'sepia' ? 'border-[#c6a87c] scale-110' : 'border-[#EAE4D3]'}`} title="Sepia Mode" />
                    <button onClick={() => { setTheme('dark'); setShowMobileNav(false); }} className={`w-8 h-8 rounded-full bg-black border shadow-sm transition-all cursor-pointer ${theme === 'dark' ? 'border-[#F5F5F7] scale-110' : 'border-zinc-800'}`} title="Dark Mode" />
                  </div>
                </div>

                <button onClick={() => { setShowUpdates(true); setShowMobileNav(false); }} className="flex items-center gap-4 text-left text-[#5C4A3D] dark:text-[#c6a87c] text-lg font-medium active:text-[#2D241C] dark:active:text-[#FAFAFA] transition-colors">
                  <Sparkles className="w-6 h-6 shrink-0" /> Updates Log
                </button>
                <button onClick={() => { setShowInfo(true); setShowMobileNav(false); }} className="flex items-center gap-4 text-left text-[#5C4A3D] dark:text-[#c6a87c] text-lg font-medium active:text-[#2D241C] dark:active:text-[#FAFAFA] transition-colors">
                  <HelpCircle className="w-6 h-6 shrink-0" /> Help & Guide
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
          <div className="relative w-full max-w-[1400px] mx-auto px-4 sm:px-6 pt-24 pb-32 min-h-[100dvh]">

            {/* STATE 1: LOADING */}
            {loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, filter: "blur(10px)" }} className="flex flex-col items-center justify-center min-h-[60vh] z-20">
                <div className="relative flex items-center justify-center">
                  {!isKeyword ? (
                    <>
                      <motion.div className="w-32 h-32 rounded-full absolute bg-[#FDFBF7]/80 dark:bg-[#c6a87c]/10 blur-2xl" animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} />
                      <motion.div className="w-24 h-24 rounded-full absolute bg-[#c6a87c]/20 dark:bg-[#062116]/40 blur-xl" animate={{ scale: [1.2, 0.8, 1.2], rotate: 180 }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} />
                      <div className="w-16 h-16 rounded-full bg-[#FDFBF7]/90 dark:bg-[#020604]/60 backdrop-blur-md flex items-center justify-center border border-[#5C4A3D]/15 dark:border-[#c6a87c]/20 shadow-[0_0_40px_rgba(253,251,247,0.8)] dark:shadow-[0_0_40px_rgba(255,255,255,0.1)]">
                        <KisaLogo className="w-8 h-8 animate-pulse text-[#c6a87c]" />
                      </div>
                    </>
                  ) : (
                    <>
                      <motion.div className="w-32 h-32 rounded-full absolute bg-[#FDFBF7]/80 dark:bg-[#c6a87c]/10 blur-xl" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }} />
                      <div className="w-16 h-16 rounded-full bg-[#FDFBF7] dark:bg-[#030A06] border border-[#5C4A3D]/15 dark:border-[#c6a87c]/20 flex items-center justify-center shadow-lg">
                        <KisaLogo className="w-8 h-8 animate-pulse text-[#c6a87c]" />
                      </div>
                    </>
                  )}
                </div>
                <motion.p className="mt-8 font-sans tracking-widest uppercase text-xs sm:text-sm font-semibold opacity-70 whitespace-nowrap text-center text-[#5C4A3D] dark:text-[#c6a87c]/80">
                  {loadingMessage}
                </motion.p>
              </motion.div>
            )}

            {/* STATE 2: EMPTY OR NO RESULTS */}
            {!loading && (!data || (data.clusters?.length === 0 && data.total_results === 0)) && (
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <h2 className="text-2xl font-serif text-[#2D241C] dark:text-[#FAFAFA] mb-2">No hadiths found</h2>
                <p className="text-[#5C4A3D]/70 dark:text-zinc-400 text-sm">Please try broadening your search or check your spelling.</p>
              </div>
            )}

            {/* STATE 3: RENDER RESULTS */}
            {!loading && data && (data.clusters?.length > 0 || data.total_results > 0) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="flex flex-col gap-8 w-full"
              >
                {viewMode === 'map' && !isKeyword && (
                  <div className="absolute inset-0 w-full h-full overflow-hidden">
                    <div className="absolute top-1/2 left-1/2 w-0 h-0 flex items-center justify-center z-30 pointer-events-none">
                      <motion.div layoutId="search-node" className="flex flex-col items-center justify-center pointer-events-auto cursor-pointer" onClick={() => setActiveCluster(null)}>
                        <div className="bg-[#FDFBF7]/80 dark:bg-[#020805]/60 px-6 sm:px-8 py-3 sm:py-4 flex flex-col items-center gap-2 backdrop-blur-xl border border-[#5C4A3D]/15 dark:border-[#c6a87c]/20 rounded-2xl shadow-[0_0_50px_rgba(45,36,28,0.06)] dark:shadow-[0_0_50px_rgba(198,168,124,0.1)] group hover:scale-105 transition-transform mt-8">
                          {anchorHadith ? (
                            <div className="flex flex-col items-center text-[#2D241C] dark:text-[#FAFAFA]">
                              <div className="flex items-center gap-3">
                                <span className="font-serif text-xl sm:text-2xl font-medium whitespace-nowrap">Similar to</span>
                                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#5C4A3D]/10 dark:bg-[#c6a87c]/20 flex items-center justify-center"><span className="text-[10px] sm:text-xs font-bold text-[#c6a87c]">{data.total_results}</span></div>
                              </div>
                              <ChevronDown className="w-4 h-4 opacity-50 mt-1 mb-1 animate-bounce text-[#5C4A3D] dark:text-[#c6a87c]" />
                              <button onClick={(e) => { e.stopPropagation(); setShowAnchorModal(true); }} className="flex items-center gap-1.5 text-[10px] sm:text-xs uppercase tracking-wider font-bold text-[#5C4A3D] dark:text-[#c6a87c] hover:text-[#2D241C] dark:hover:text-[#FAFAFA] bg-[#FDFBF7] dark:bg-[#c6a87c]/10 px-4 py-1.5 rounded-full transition-colors shadow-sm border border-[#5C4A3D]/15 dark:border-[#c6a87c]/30 hover:border-[#c6a87c]/40 dark:hover:border-[#c6a87c]/60">
                                <Sparkles className="w-3 h-3" /> View Source
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3 text-[#2D241C] dark:text-[#FAFAFA]">
                              <span className="font-serif text-xl sm:text-2xl font-medium truncate max-w-[200px] sm:max-w-[280px]" title={query}>{query}</span>
                              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#5C4A3D]/10 dark:bg-[#c6a87c]/20 flex items-center justify-center"><span className="text-[10px] sm:text-xs font-bold text-[#c6a87c]">{data.total_results}</span></div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    </div>
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                      {(data.clusters || []).map((cluster, i) => {
                        const clusterCount = data.clusters ? Math.max(1, data.clusters.length) : 1;
                        const rx = Math.max(280, Math.min(centerPos.x - 150, 450));
                        const ry = Math.max(220, Math.min(centerPos.y - 140, 320));
                        const pos = getRadialPosition(i, clusterCount, rx, ry);
                        const color = theme === 'dark' ? '#c6a87c' : '#5C4A3D';
                        const isActive = activeCluster === i;
                        const isHovered = hoveredCluster === i;
                        return (<motion.line key={`line-${i}`} x1={centerPos.x} y1={centerPos.y} x2={centerPos.x + pos.x} y2={centerPos.y + pos.y} stroke={color} strokeWidth={isActive ? 2 : isHovered ? 1.5 : 1} strokeOpacity={isActive ? 0.5 : isHovered ? 0.3 : 0.1} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, delay: i * 0.2 }} className="transition-all duration-300" />);
                      })}
                    </svg>
                    {(data.clusters || []).map((cluster, i) => {
                      const clusterCount = data.clusters ? Math.max(1, data.clusters.length) : 1;
                      const itemsLength = cluster.items ? cluster.items.length : 0;
                      const rx = Math.max(280, Math.min(centerPos.x - 150, 450));
                      const ry = Math.max(220, Math.min(centerPos.y - 140, 320));
                      const pos = getRadialPosition(i, clusterCount, rx, ry);
                      const color = theme === 'dark' ? '#c6a87c' : '#5C4A3D';
                      const isActive = activeCluster === i;
                      const isHovered = hoveredCluster === i;
                      const isFaded = activeCluster !== null && !isActive;
                      const isTopMatches = cluster.theme_label && cluster.theme_label.includes("Top Matches");
                      const screenScale = Math.min(1, windowWidth / 1200);
                      const baseScale = (isTopMatches ? 1.15 : 0.95) * screenScale;

                      return (
                        <div key={`cluster-wrap-${i}`} className="absolute top-1/2 left-1/2 w-0 h-0 flex items-center justify-center z-20 pointer-events-none">
                          <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: isFaded ? 0.2 : 1, x: pos.x, y: pos.y, scale: isActive ? baseScale * 1.05 : baseScale }} transition={{ type: "spring", stiffness: 60, delay: i * 0.1 }} className={`pointer-events-auto transition-all duration-300 mt-8 ${isFaded ? 'pointer-events-none grayscale blur-[2px]' : ''}`} onMouseEnter={() => setHoveredCluster(i)} onMouseLeave={() => setHoveredCluster(null)}>
                            <div onClick={() => setActiveCluster(isActive ? null : i)} className="flex flex-col justify-center cursor-pointer transition-all duration-400 relative group w-[220px] sm:w-[260px] bg-[#FDFBF7]/90 dark:bg-[#030A06]/90 backdrop-blur-2xl rounded-2xl px-5 py-4" style={{ border: `1px solid ${isActive || isHovered ? color : (theme === 'dark' ? 'rgba(198, 168, 124, 0.2)' : 'rgba(92, 74, 61, 0.15)')}`, boxShadow: isActive || isHovered ? `0 4px 20px ${theme === 'dark' ? 'rgba(198, 168, 124, 0.15)' : 'rgba(92, 74, 61, 0.15)'}` : '0 8px 32px rgba(0,0,0,0.08)' }}>
                              <div className="absolute left-0 top-4 bottom-4 w-[3px] rounded-r-md transition-all duration-300" style={{ backgroundColor: isActive || isHovered ? color : 'transparent' }} />
                              <div className="pl-2 relative z-10 flex flex-col text-left">
                                <h3 className="font-sans font-semibold text-sm sm:text-base leading-snug whitespace-normal break-words text-[#2D241C] dark:text-[#FAFAFA] group-hover:opacity-80 transition-opacity">{cluster.theme_label}</h3>
                                <div className="mt-2.5 flex items-center gap-1.5 opacity-70 group-hover:opacity-100 transition-opacity">
                                  <BookOpen className="w-3.5 h-3.5 text-[#5C4A3D] dark:text-[#c6a87c]" />
                                  <span className="font-mono text-[10px] tracking-widest uppercase font-bold text-[#5C4A3D] dark:text-[#c6a87c]">{itemsLength} Narrations</span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {viewMode === 'list' && (
                  <div className="z-30 w-full max-w-4xl mx-auto px-4 sm:px-6 pb-12 pointer-events-auto">
                    <div className={`p-5 sm:p-6 rounded-xl mb-6 sm:mb-8 border shadow-sm ${anchorHadith ? 'mt-10' : ''} ${isKeyword ? 'bg-[#FDFBF7]/80 dark:bg-[#030A06]/80 border-[#5C4A3D]/15 dark:border-[#c6a87c]/20 backdrop-blur-xl' : 'bg-[#FDFBF7]/60 dark:bg-[#030A06]/80 border-[#5C4A3D]/15 dark:border-[#c6a87c]/20 backdrop-blur-xl'}`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h2 className={`font-serif text-xl sm:text-2xl md:text-3xl font-normal tracking-tight break-words whitespace-normal leading-snug text-[#2D241C] dark:text-[#FAFAFA]`}>
                            {isKeyword ? 'Index Results:' : 'Search:'} <span className="italic text-[#c6a87c]">"{query}"</span>
                          </h2>
                          <div className="flex flex-wrap gap-2 mt-3">{uniqueBooks.map((bookName, idx) => (<span key={idx} className={`text-[10px] sm:text-xs uppercase tracking-wider font-bold px-2.5 py-1 rounded-md border ${isKeyword ? 'bg-[#FDFBF7] dark:bg-[#c6a87c]/10 text-[#5C4A3D] dark:text-[#c6a87c] border-[#5C4A3D]/15 dark:border-[#c6a87c]/30' : 'text-[#5C4A3D] dark:text-[#c6a87c] bg-[#F8F5EE]/60 dark:bg-[#c6a87c]/10 border-[#5C4A3D]/15 dark:border-[#c6a87c]/30'}`}>{bookName}</span>))}</div>
                        </div>
                        <div className={`flex gap-6 sm:border-l sm:pl-6 shrink-0 ${isKeyword ? 'border-[#5C4A3D]/15 dark:border-[#c6a87c]/20' : 'border-[#5C4A3D]/15 dark:border-[#c6a87c]/20'}`}>{!isKeyword && (<div><p className="text-[10px] uppercase tracking-widest text-[#5C4A3D]/70 dark:text-[#c6a87c]/60 font-semibold mb-1">Themes</p><p className="font-mono text-xl text-[#2D241C] dark:text-[#FAFAFA]">{data.clusters ? data.clusters.length : 0}</p></div>)}<div><p className="text-[10px] uppercase tracking-widest text-[#5C4A3D]/70 dark:text-[#c6a87c]/60 font-semibold mb-1">{isKeyword ? 'Matches' : 'Hadiths'}</p><p className="font-mono text-xl text-[#2D241C] dark:text-[#FAFAFA]">{data.total_results}</p></div></div>
                      </div>

                      {anchorHadith && (
                        <div className={`mt-5 pt-4 border-t ${isKeyword ? 'border-[#5C4A3D]/15 dark:border-[#c6a87c]/20' : 'border-[#5C4A3D]/15 dark:border-[#c6a87c]/20'}`}>
                          <div className="flex items-center justify-between cursor-pointer group" onClick={() => setShowAnchor(!showAnchor)}>
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-4 h-4 shrink-0 text-[#5C4A3D]/70 dark:text-[#c6a87c]/80" />
                              <span className="text-xs sm:text-sm font-bold tracking-widest uppercase transition-colors break-words text-[#5C4A3D] dark:text-[#c6a87c] group-hover:text-[#2D241C] dark:group-hover:text-[#FAFAFA]">
                                View Anchored Source
                              </span>
                            </div>
                            <div className="p-1.5 shrink-0 rounded-full transition-colors bg-[#FDFBF7] dark:bg-[#c6a87c]/10 text-[#c6a87c] group-hover:bg-[#EAE4D3] dark:group-hover:bg-[#c6a87c]/20">
                              {showAnchor ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </div>
                          </div>
                          <AnimatePresence>
                            {showAnchor && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                <div className="pt-4 pb-2 text-sm sm:text-base font-serif leading-relaxed text-[#2D241C] dark:text-[#c6a87c]">
                                  {anchorHadith.english_text}
                                </div>
                                <div className="mt-3 flex justify-end">
                                  <button onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyHadith(anchorHadith);
                                    setAnchorCopied(true);
                                    setTimeout(() => setAnchorCopied(false), 2000);
                                  }} className={`flex items-center gap-2 text-xs font-mono transition-colors px-3 py-1.5 rounded-md cursor-pointer ${anchorCopied ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10' : 'text-[#5C4A3D] hover:text-[#2D241C] dark:text-[#c6a87c]/80 hover:bg-[#FDFBF7] dark:hover:bg-[#c6a87c]/10'}`}>
                                    {anchorCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}<span>{anchorCopied ? 'Copied!' : 'Copy Text'}</span>
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>

                    <div className={`flex flex-col border-t ${isKeyword ? 'border-[#5C4A3D]/15 dark:border-[#c6a87c]/20' : 'border-[#5C4A3D]/15 dark:border-[#c6a87c]/20'}`}>
                      {(data.clusters || []).map((cluster, i) => {
                        const itemsLength = cluster.items ? cluster.items.length : 0;
                        return (
                          <motion.div key={`list-item-${i}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} onClick={() => setActiveCluster(i)} className={`group relative flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 cursor-pointer border-b transition-all duration-300 ${isKeyword ? 'border-[#5C4A3D]/15 dark:border-[#c6a87c]/10 hover:bg-[#FDFBF7]/50 dark:hover:bg-[#c6a87c]/5' : 'border-[#5C4A3D]/15 dark:border-[#c6a87c]/10 hover:bg-[#FDFBF7]/50 dark:hover:bg-[#c6a87c]/5'}`}>
                            <div className="flex items-start sm:items-center gap-4 sm:gap-6 flex-grow pr-8 sm:pr-0"><span className="font-mono text-sm sm:text-base font-medium pt-0.5 sm:pt-0 text-[#5C4A3D]/50 group-hover:text-[#2D241C] dark:text-[#c6a87c]/50 dark:group-hover:text-[#FAFAFA]">0{i + 1}</span><div><h3 className="font-mono text-base sm:text-lg lg:text-xl font-medium tracking-tight transition-colors text-[#2D241C] dark:text-[#c6a87c] group-hover:text-black dark:group-hover:text-[#FAFAFA]">{cluster.theme_label}</h3><div className="flex items-center gap-3 sm:gap-4 mt-1.5 sm:mt-2"><span className="font-mono text-[10px] sm:text-xs lg:text-sm text-[#5C4A3D]/70 dark:text-[#c6a87c]/60">[{itemsLength} {isKeyword ? 'entries' : 'narrations'}]</span></div></div></div>
                            <div className="absolute right-4 sm:relative sm:right-0 sm:opacity-0 group-hover:opacity-100 transform sm:translate-x-[-10px] group-hover:translate-x-0 transition-all duration-300 self-center"><ChevronRight className="w-5 h-5 text-[#5C4A3D] group-hover:text-[#2D241C] dark:text-[#c6a87c]/60 dark:group-hover:text-[#FAFAFA]" /></div>
                          </motion.div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>
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

        <AnimatePresence>
          {activeCluster !== null && data?.clusters && data.clusters[activeCluster] && (() => {
            const clusterItems = data.clusters[activeCluster].items || [];
            const filteredItems = clusterItems.filter(item => { if (lengthFilter === 'All') return true; const len = String(item.english_text || '').length; if (lengthFilter === 'Short') return len < 300; if (lengthFilter === 'Medium') return len >= 300 && len <= 1000; if (lengthFilter === 'Long') return len > 1000; return true; });
            const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE) || 1, safeCurrentPage = Math.min(currentPage, totalPages), startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE, paginatedItems = filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);
            return (
              <div className="fixed inset-0 z-[1000] flex items-center justify-center pointer-events-auto p-4 sm:p-0">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveCluster(null)} className="absolute inset-0 bg-[#2D241C]/60 dark:bg-[#020604]/80 backdrop-blur-md cursor-pointer" />
                <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className={`relative w-full sm:w-[90vw] max-w-[700px] h-[85vh] flex flex-col shadow-2xl rounded-2xl z-[1001] border bg-[#EAE4D3] dark:bg-[#030A06] border-[#5C4A3D]/20 dark:border-[#c6a87c]/20`}>
                  <div className={`flex justify-between items-center backdrop-blur-xl pt-5 pb-4 px-4 sm:px-6 z-10 border-b rounded-t-2xl shrink-0 bg-[#FDFBF7]/60 dark:bg-[#c6a87c]/5 border-[#5C4A3D]/15 dark:border-[#c6a87c]/20`}>
                    <h2 className="text-lg sm:text-xl md:text-2xl font-mono font-normal tracking-tight truncate pr-4 text-[#2D241C] dark:text-[#FAFAFA]">{data.clusters[activeCluster].theme_label}</h2>
                    <button onClick={() => setActiveCluster(null)} className="p-2 hover:bg-[#FDFBF7] dark:hover:bg-[#c6a87c]/10 rounded-full transition-colors cursor-pointer shrink-0"><X className="w-5 h-5 sm:w-6 sm:h-6 text-[#5C4A3D] dark:text-[#c6a87c]" /></button>
                  </div>
                  <div className={`px-4 sm:px-6 py-3 border-b shrink-0 flex flex-wrap gap-2 items-center bg-[#F8F5EE]/40 dark:bg-black/20 border-[#5C4A3D]/15 dark:border-[#c6a87c]/20`}>
                    <div className="flex items-center gap-1.5 text-[#5C4A3D]/70 dark:text-[#c6a87c]/70 mr-1"><Filter className="w-3.5 h-3.5" /><span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Length:</span></div>
                    {['All', 'Short', 'Medium', 'Long'].map(f => (<button key={f} onClick={() => { setLengthFilter(f); setCurrentPage(1); if (modalScrollRef.current) modalScrollRef.current.scrollTop = 0; }} className={`px-3 py-1 sm:py-1.5 rounded-md text-[10px] sm:text-xs font-medium transition-colors cursor-pointer ${lengthFilter === f ? 'bg-[#5C4A3D] dark:bg-[#c6a87c]/20 text-[#FAFAFA]' : 'bg-[#FDFBF7] dark:bg-[#c6a87c]/5 text-[#5C4A3D] dark:text-[#c6a87c] border border-[#5C4A3D]/15 dark:border-transparent hover:bg-[#EAE4D3] dark:hover:bg-[#c6a87c]/10'}`}>{f}</button>))}
                    <span className="ml-auto text-[10px] sm:text-xs font-mono text-[#5C4A3D]/60 dark:text-[#c6a87c]/50">{filteredItems.length} matches</span>
                  </div>
                  <div ref={modalScrollRef} onScroll={handleModalScroll} className="p-4 sm:p-6 flex flex-col gap-4 sm:gap-6 overflow-y-auto flex-grow smart-scrollbar">
                    {filteredItems.length === 0 ? <div className="flex flex-col items-center justify-center h-full text-[#5C4A3D]/50 dark:text-[#c6a87c]/50 italic mt-10"><p>No {lengthFilter.toLowerCase()} hadiths found.</p></div> : paginatedItems.map((item, idx) => (<HadithCard key={idx} item={item} onVerseClick={handleVerseClick} handleCopyHadith={handleCopyHadith} searchMode={searchMode} onFindSimilar={handleFindSimilar} vaultItems={vaultItems} />))}
                    {totalPages > 1 && filteredItems.length > 0 && (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 sm:pt-6 border-t border-[#5C4A3D]/15 dark:border-[#c6a87c]/20 mt-2 sm:mt-4">
                        <button onClick={() => { setCurrentPage(prev => Math.max(prev - 1, 1)); modalScrollRef.current.scrollTop = 0; }} disabled={safeCurrentPage === 1} className={`flex items-center justify-center gap-1 w-full sm:w-auto px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer ${safeCurrentPage === 1 ? 'opacity-30 cursor-not-allowed text-[#5C4A3D]/50 dark:text-slate-500' : 'text-[#2D241C] dark:text-[#c6a87c] hover:bg-[#FDFBF7] dark:hover:bg-[#c6a87c]/10'}`}><ChevronLeft className="w-5 h-5" /> Previous</button>
                        <span className="font-mono text-xs sm:text-sm text-[#5C4A3D]/60 dark:text-[#c6a87c]/60">Page {safeCurrentPage} of {totalPages}</span>
                        <button onClick={() => { setCurrentPage(prev => Math.min(prev + 1, totalPages)); modalScrollRef.current.scrollTop = 0; }} disabled={safeCurrentPage === totalPages} className={`flex items-center justify-center gap-1 w-full sm:w-auto px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer ${safeCurrentPage === totalPages ? 'opacity-30 cursor-not-allowed text-[#5C4A3D]/50 dark:text-slate-500' : 'text-[#2D241C] dark:text-[#c6a87c] hover:bg-[#FDFBF7] dark:hover:bg-[#c6a87c]/10'}`}>Next <ChevronRight className="w-5 h-5" /></button>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            );
          })()}
        </AnimatePresence>

        {/* --- MAP VIEW: THE ANCHOR POPUP MODAL --- */}
        <AnimatePresence>
          {showAnchorModal && anchorHadith && (
            <div className="fixed inset-0 z-[5000] flex items-center justify-center pointer-events-auto p-4 sm:p-0">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAnchorModal(false)} className="absolute inset-0 bg-[#2D241C]/60 dark:bg-[#020604]/80 backdrop-blur-md cursor-pointer" />
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-[#EAE4D3] dark:bg-[#030A06] border border-[#5C4A3D]/20 dark:border-[#c6a87c]/20 w-full sm:w-[90vw] max-w-[600px] max-h-[85vh] flex flex-col shadow-2xl rounded-2xl z-[5001] overflow-hidden">
                <div className="flex justify-between items-center bg-[#FDFBF7]/60 dark:bg-[#c6a87c]/5 backdrop-blur-xl pt-5 pb-4 px-6 z-10 border-b border-[#5C4A3D]/15 dark:border-[#c6a87c]/20 shrink-0">
                  <div>
                    <h3 className="font-mono text-sm tracking-widest uppercase text-[#2D241C] dark:text-[#FAFAFA] font-bold mb-0.5 flex items-center gap-2"><Sparkles className="w-4 h-4 text-[#c6a87c]" /> Anchored Source</h3>
                    <p className="text-[10px] sm:text-xs text-[#5C4A3D]/60 dark:text-[#c6a87c]/60 font-mono m-0 leading-relaxed pr-4">
                      {anchorHadith.full_reference || `Book: ${anchorHadith.book}, Vol: ${anchorHadith.volume}, ${anchorHadith.sub_book}, Chapter: ${anchorHadith.chapter}`}
                    </p>
                  </div>
                  <button onClick={() => setShowAnchorModal(false)} className="p-2 hover:bg-[#FDFBF7] dark:hover:bg-[#c6a87c]/10 rounded-full transition-colors cursor-pointer shrink-0 self-start"><X className="w-5 h-5 text-[#5C4A3D] dark:text-[#c6a87c]" /></button>
                </div>
                <div className="p-6 sm:p-8 overflow-y-auto flex-grow smart-scrollbar">
                  {anchorHadith.arabic_text && <div className="mb-6"><p className="font-arabic text-3xl sm:text-4xl text-right leading-[2.2] text-[#2D241C] dark:text-slate-100" dir="rtl" lang="ar" style={{ fontFamily: activeFontFamily, fontVariantLigatures: 'normal', fontFeatureSettings: '"ccmp" 1, "mark" 1, "mkmk" 1' }}>{anchorHadith.arabic_text}</p></div>}
                  <div className={anchorHadith.arabic_text ? "border-t border-[#5C4A3D]/10 dark:border-[#c6a87c]/20 pt-6" : ""}><p className="text-base sm:text-lg text-[#5C4A3D] dark:text-[#c6a87c] leading-relaxed font-serif">{anchorHadith.english_text}</p></div>
                  <div className="mt-6 flex justify-end pt-4 border-t border-[#5C4A3D]/10 dark:border-[#c6a87c]/20">
                    <button onClick={(e) => {
                      e.stopPropagation();
                      handleCopyHadith(anchorHadith);
                      setAnchorCopied(true);
                      setTimeout(() => setAnchorCopied(false), 2000);
                    }} className={`flex items-center gap-2 text-xs font-mono transition-colors px-4 py-2 rounded-md cursor-pointer ${anchorCopied ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10' : 'text-[#5C4A3D] hover:text-[#2D241C] hover:bg-[#FDFBF7] dark:bg-[#c6a87c]/10 dark:hover:bg-[#c6a87c]/20 dark:text-[#c6a87c] dark:hover:text-[#FAFAFA]'}`}>
                      {anchorCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}<span>{anchorCopied ? 'Copied!' : 'Copy Text'}</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

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

        <AnimatePresence>
          {quranPopup && (
            <div className="fixed inset-0 z-[3000] flex items-center justify-center pointer-events-auto p-4 sm:p-0">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setQuranPopup(null)} className="absolute inset-0 bg-[#2D241C]/60 dark:bg-[#020604]/80 backdrop-blur-md cursor-pointer" />
              <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative bg-[#EAE4D3] dark:bg-[#030A06] border border-[#5C4A3D]/20 dark:border-[#c6a87c]/20 w-full sm:w-[90vw] max-w-[600px] max-h-[85vh] flex flex-col shadow-2xl rounded-2xl z-[3001] overflow-hidden">
                <div className="flex justify-between items-center bg-[#FDFBF7]/60 dark:bg-[#c6a87c]/5 backdrop-blur-xl pt-5 pb-4 px-6 z-10 border-b border-[#5C4A3D]/15 dark:border-[#c6a87c]/20 shrink-0">
                  <div><h3 className="font-mono text-sm tracking-widest uppercase text-[#2D241C] dark:text-[#FAFAFA] font-bold mb-0.5">Surah {quranPopup.data.surahName}</h3><p className="text-xs text-[#5C4A3D]/60 dark:text-[#c6a87c]/60 font-mono m-0">Verse {quranPopup.ayah}</p></div>
                  <button onClick={() => setQuranPopup(null)} className="p-2 hover:bg-[#FDFBF7] dark:hover:bg-[#c6a87c]/10 rounded-full transition-colors cursor-pointer shrink-0"><X className="w-5 h-5 text-[#5C4A3D] dark:text-[#c6a87c]" /></button>
                </div>
                <div className="p-6 sm:p-8 overflow-y-auto flex-grow smart-scrollbar">
                  <div className="mb-6"><p className="font-arabic text-3xl sm:text-4xl text-right leading-[2.2] text-[#2D241C] dark:text-slate-100" dir="rtl" lang="ar" style={{ fontFamily: activeFontFamily, fontVariantLigatures: 'normal', fontFeatureSettings: '"ccmp" 1, "mark" 1, "mkmk" 1' }}>{quranPopup.data.ar}</p></div>
                  <div className="border-t border-[#5C4A3D]/10 dark:border-[#c6a87c]/20 pt-6"><p className="text-base sm:text-lg text-[#5C4A3D] dark:text-[#c6a87c] leading-relaxed font-serif">{quranPopup.data.en}</p></div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

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
        <AnimatePresence>
          {showUpdates && (
            <div className="fixed inset-0 z-[2000] flex items-center justify-center pointer-events-auto p-4 sm:p-0">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowUpdates(false)} className="absolute inset-0 bg-[#2D241C]/40 dark:bg-black/60 backdrop-blur-sm cursor-pointer" />
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-[#FDFBF7] dark:bg-[#151518] border border-[#5C4A3D]/15 dark:border-[#c6a87c]/20 w-full sm:w-[90vw] max-w-[600px] max-h-[80vh] flex flex-col shadow-2xl rounded-[2rem] z-[2001] overflow-hidden">

                <div className="flex justify-between items-center bg-[#FDFBF7]/95 dark:bg-[#1c1c20]/95 backdrop-blur-xl pt-6 pb-5 px-6 sm:px-8 z-10 border-b border-[#5C4A3D]/10 dark:border-[#c6a87c]/10 shrink-0">
                  <h2 className="text-xl sm:text-2xl font-serif tracking-tight text-[#2D241C] dark:text-[#FAFAFA] flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-[#c6a87c]" />
                    Updates Log
                  </h2>
                  <button onClick={() => setShowUpdates(false)} className="p-2 hover:bg-[#5C4A3D]/5 dark:hover:bg-[#c6a87c]/10 rounded-full transition-colors cursor-pointer shrink-0">
                    <X className="w-5 h-5 text-[#5C4A3D] dark:text-[#c6a87c]" />
                  </button>
                </div>

                <div className="p-6 sm:p-8 overflow-y-auto flex-grow smart-scrollbar flex flex-col gap-8">

                  {/* --- PERMANENT PLATFORM SCHEDULE NOTICE --- */}
                  <div className="p-5 rounded-2xl bg-[#c6a87c]/10 border border-[#c6a87c]/20 flex flex-col sm:flex-row gap-4 items-start sm:items-center shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-[#c6a87c]/20 flex items-center justify-center shrink-0">
                      <CalendarDays className="w-5 h-5 text-[#c6a87c]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#2D241C] dark:text-[#FAFAFA] text-base mb-1 tracking-tight">The Sunday Drop</h3>
                      <p className="text-sm text-[#5C4A3D]/90 dark:text-slate-300 leading-relaxed font-serif">
                        Al-Kisa is a living library. We unlock new dimensions of the platform <strong className="text-[#c6a87c] font-bold">every Sunday</strong>—from fresh masterclass episodes and newly mapped Hadith volumes, to sacred liturgies and interactive study tools.
                      </p>
                    </div>
                  </div>

                  <div className="w-full h-px bg-gradient-to-r from-transparent via-[#5C4A3D]/10 dark:via-[#c6a87c]/20 to-transparent" />

                  {APP_UPDATES.map((update, idx) => (
                    <div key={idx} className="relative pl-6 sm:pl-8 border-l-[1.5px] border-[#5C4A3D]/15 dark:border-[#c6a87c]/20">

                      {/* The Premium Timeline Dot */}
                      <div className="absolute -left-[4.5px] top-2 w-2 h-2 rounded-full bg-[#c6a87c] ring-4 ring-[#FDFBF7] dark:ring-[#151518]" />

                      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mb-3 gap-1 sm:gap-4">
                        <h3 className="font-sans font-bold text-lg sm:text-xl text-[#2D241C] dark:text-[#FAFAFA] tracking-tight">{update.version}</h3>
                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#5C4A3D]/50 dark:text-[#c6a87c]/60">{update.date}</span>
                      </div>

                      <ul className="flex flex-col gap-3">
                        {update.changes.map((change, cIdx) => (
                          <li key={cIdx} className="text-sm sm:text-base text-[#5C4A3D]/90 dark:text-slate-300 flex items-start gap-3 leading-relaxed font-serif">
                            <span className="text-[#c6a87c] mt-2 font-bold text-[10px]">✦</span>
                            <span>{change}</span>
                          </li>
                        ))}
                      </ul>

                    </div>
                  ))}
                </div>

              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showInfo && (
            <div className="fixed inset-0 z-[2000] flex items-center justify-center pointer-events-auto p-4 sm:p-0">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowInfo(false)} className="absolute inset-0 bg-[#2D241C]/60 dark:bg-[#020604]/80 backdrop-blur-md cursor-pointer" />
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-[#EAE4D3] dark:bg-[#030A06] border border-[#5C4A3D]/20 dark:border-[#c6a87c]/20 w-full sm:w-[90vw] max-w-[600px] max-h-[85vh] flex flex-col shadow-2xl rounded-2xl z-[2001]">
                <div className="flex justify-between items-center bg-[#FDFBF7]/60 dark:bg-[#c6a87c]/5 backdrop-blur-xl pt-5 pb-4 px-5 z-10 border-b border-[#5C4A3D]/15 dark:border-[#c6a87c]/20 rounded-t-2xl shrink-0"><h2 className="text-lg sm:text-xl font-mono font-bold tracking-tight text-[#2D241C] dark:text-[#FAFAFA] flex items-center gap-2"><KisaLogo className="w-5 h-5 text-[#5C4A3D] dark:text-[#c6a87c]" />How to Use Al-Kisa</h2><button onClick={() => setShowInfo(false)} className="p-2 hover:bg-[#FDFBF7] dark:hover:bg-[#c6a87c]/10 rounded-full transition-colors cursor-pointer shrink-0"><X className="w-5 h-5 text-[#5C4A3D] dark:text-[#c6a87c]" /></button></div>

                <div className="p-5 sm:p-6 overflow-y-auto flex-grow smart-scrollbar flex flex-col gap-6 text-[#5C4A3D] dark:text-[#c6a87c]">
                  <div>
                    <h3 className="font-bold text-base sm:text-lg mb-2 text-[#2D241C] dark:text-[#FAFAFA]">Welcome to Al-Kisa</h3>
                    <p className="leading-relaxed text-xs sm:text-sm">Al-Kisa is a semantic search engine designed specifically to explore authentic Twelver Shia literature, prioritizing core texts like <i>al-Kafi</i>, <i>Bihar al-Anwar</i>, and <i>Basa'ir al-Darajat</i>. It maps verified texts mathematically so you can explore concepts without AI hallucinations.</p>
                  </div>
                  <hr className="border-[#5C4A3D]/10 dark:border-[#c6a87c]/10" />

                  <div>
                    <h3 className="font-bold text-base sm:text-lg flex items-center gap-2 mb-3 text-[#2D241C] dark:text-[#FAFAFA]"><LibraryIcon className="w-4 h-4 text-[#5C4A3D]/70 dark:text-[#c6a87c]" /> Features</h3>
                    <div className="mb-4">
                      <h4 className="font-semibold text-sm sm:text-base flex items-center gap-1.5 mb-1"><Search className="w-3.5 h-3.5 text-[#5C4A3D]/70 dark:text-[#c6a87c]" /> Dual Search Engine</h4>
                      <ul className="flex flex-col gap-2 text-xs sm:text-sm pl-5 list-disc mb-2">
                        <li><b>Concept Mode:</b> Uses AI vector math to find underlying themes, even if exact words aren't used. Returns interactive thematic clusters.</li>
                        <li><b>Keyword Mode:</b> Strictly searches the exact English or Arabic text you type, functioning like a traditional database index.</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-sm sm:text-base flex items-center gap-1.5 mb-1"><LibraryBig className="w-3.5 h-3.5 text-[#c6a87c]" /> Digital Archive (Transcript Library)</h4>
                      <p className="leading-relaxed text-xs sm:text-sm mb-2">Read meticulously structured and translated transcripts of foundational scholarly series (e.g., The File of Fatima). Features a premium editorial UI with automatic section summaries, bold emphasis, and a persistent reading state.</p>
                    </div>
                  </div>
                  <hr className="border-[#5C4A3D]/10 dark:border-[#c6a87c]/10" />

                  <div>
                    <h3 className="font-bold text-base sm:text-lg flex items-center gap-2 mb-3 text-[#2D241C] dark:text-[#FAFAFA]"><Sparkles className="w-4 h-4 text-[#5C4A3D]/70 dark:text-[#c6a87c]" /> Advanced Features</h3>
                    <ul className="flex flex-col gap-4 text-xs sm:text-sm leading-relaxed">
                      <li>
                        <b className="text-[#2D241C] dark:text-[#FAFAFA] flex items-center gap-1.5 mb-0.5"><Layout className="w-3.5 h-3.5 text-[#5C4A3D]/70 dark:text-[#c6a87c]" /> Dynamic Concept Map</b>
                        Concept searches generate a beautiful, non-overlapping orbital map of themes. The "Top Matches" node is highlighted, and you can switch to a traditional List View at any time.
                      </li>
                      <li>
                        <b className="text-[#2D241C] dark:text-[#FAFAFA] flex items-center gap-1.5 mb-0.5"><Sparkles className="w-3.5 h-3.5 text-[#5C4A3D]/70 dark:text-[#c6a87c]" /> Vector Hopping ("Find Similar")</b>
                        Click "Find Similar" on any hadith to use its mathematical signature to instantly discover related narrations. The original source is cleanly pinned to the top as an "Anchor" so you never lose your place.
                      </li>
                      <li>
                        <b className="text-[#2D241C] dark:text-[#FAFAFA] flex items-center gap-1.5 mb-0.5"><BookOpen className="w-3.5 h-3.5 text-amber-500" /> Reverse Quran Tafsir</b>
                        Read all 114 Surahs. If Al-Kisa detects narrations referencing a specific Ayah, a "Related Hadiths" button appears. Click it to open a seamless popup of contextual narrations.
                      </li>
                    </ul>
                  </div>
                  <hr className="border-[#5C4A3D]/10 dark:border-[#c6a87c]/10" />

                  <div>
                    <h3 className="font-bold text-base sm:text-lg flex items-center gap-2 mb-3 text-[#2D241C] dark:text-[#FAFAFA]"><Clock className="w-4 h-4 text-[#5C4A3D]/70 dark:text-[#c6a87c]" /> Workflow & Study Tools</h3>
                    <ul className="flex flex-col gap-3 text-xs sm:text-sm leading-relaxed list-disc pl-4">
                      <li><b className="text-[#2D241C] dark:text-[#FAFAFA]">Study History & Quick Resume:</b> Click the empty search bar to instantly resume your 5 most recent searches/recitations, or click the Clock icon to open your full History drawer.</li>
                      <li><b className="text-[#2D241C] dark:text-[#FAFAFA]">Source Filtering:</b> Use the Source dropdown to isolate searches strictly to specific books like <i>al-Kafi</i>.</li>
                      <li><b className="text-[#2D241C] dark:text-[#FAFAFA]">Smart Copy:</b> Click "Copy Text" on any Hadith or Anchored Source to instantly copy the full reference, Arabic text, Chain of Narrators, English translation, and a Kisa link to your clipboard.</li>
                    </ul>
                  </div>

                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
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
