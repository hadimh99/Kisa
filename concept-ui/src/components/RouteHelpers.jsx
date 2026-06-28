import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// Router-driven side-effect helpers extracted from App.jsx (logic unchanged).

export const DeepLinkCatcher = () => {
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

export const ScrollToTop = () => {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  return null;
};
