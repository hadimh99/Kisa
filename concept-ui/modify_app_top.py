import re

with open('src/App.jsx', 'r') as f:
    content = f.read()

deep_link_catcher = """

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

function AppContent() {
"""

content = content.replace("export default function App() {", deep_link_catcher)

active_tab_logic = """
  const navigate = useNavigate();
  const location = useLocation();

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
"""

content = re.sub(
    r"const \[activeTab, setActiveTab\] = useState\(\(\) => \{[\s\S]*?return 'home';\s*\}\);\s*",
    active_tab_logic,
    content
)

content = re.sub(
    r"useEffect\(\(\) => \{\s*localStorage\.setItem\('kisa_active_tab', activeTab\);\s*\}, \[activeTab\]\);\s*",
    "",
    content
)

export_block = """
export default function App() {
  return (
    <BrowserRouter>
      <ScrollRestoration />
      <DeepLinkCatcher />
      <AppContent />
    </BrowserRouter>
  );
}
"""
content = content + export_block

with open('src/App.jsx', 'w') as f:
    f.write(content)
