import { motion, AnimatePresence } from 'framer-motion';
import { X, Bookmark } from 'lucide-react';

// Authentication modal extracted from App.jsx (markup unchanged). State stays
// owned by App and is threaded through props; the inline setShowAuthModal(false)
// / handleEmailAuth / authEmail… references are now the props below.
export default function AuthModal({
  open,
  onClose,
  onSubmit,
  email,
  setEmail,
  password,
  setPassword,
  loading,
  isSignUp,
  setIsSignUp,
  message,
  setMessage,
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#FDFBF7]/40 dark:bg-[#020805]/60 backdrop-blur-md">
          <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="relative w-full max-w-md p-8 bg-[#FDFBF7] dark:bg-[#0A120E] border border-[#5C4A3D]/10 dark:border-[#c6a87c]/20 rounded-[2rem] shadow-2xl">
            <button onClick={onClose} className="absolute top-5 right-5 p-2 text-[#5C4A3D]/60 dark:text-[#FAFAFA]/60 hover:text-[#2D241C] dark:hover:text-[#c6a87c] transition-colors rounded-full hover:bg-[#5C4A3D]/5 dark:hover:bg-[#c6a87c]/10"><X className="w-5 h-5" /></button>
            <div className="text-center mb-8">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#c6a87c]/10 flex items-center justify-center border border-[#c6a87c]/20"><Bookmark className="w-5 h-5 text-[#c6a87c]" /></div>
              <h2 className="text-2xl font-serif text-[#2D241C] dark:text-[#FAFAFA] mb-2">Study Vault</h2>
              <p className="text-sm text-[#5C4A3D]/80 dark:text-[#FAFAFA]/60">Secure your research globally. No magic links required.</p>
            </div>
            <form onSubmit={onSubmit} className="space-y-4">
              <div><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" required className="w-full bg-transparent appearance-none outline-none rounded-xl py-3 px-4 text-base font-sans text-[#2D241C] dark:text-[#FAFAFA] placeholder:text-[#5C4A3D]/40 dark:placeholder:text-[#c6a87c]/40 border border-[#5C4A3D]/20 dark:border-[#c6a87c]/30 focus:border-[#c6a87c] focus:ring-1 focus:ring-[#c6a87c] transition-all" /></div>
              <div><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (min 6 chars)" required className="w-full bg-transparent appearance-none outline-none rounded-xl py-3 px-4 text-base font-sans text-[#2D241C] dark:text-[#FAFAFA] placeholder:text-[#5C4A3D]/40 dark:placeholder:text-[#c6a87c]/40 border border-[#5C4A3D]/20 dark:border-[#c6a87c]/30 focus:border-[#c6a87c] focus:ring-1 focus:ring-[#c6a87c] transition-all" /></div>
              <button type="submit" disabled={loading} className="w-full flex items-center justify-center py-3.5 rounded-xl font-medium text-[#FDFBF7] dark:text-[#0A120E] bg-[#2D241C] dark:bg-[#c6a87c] hover:bg-[#1A1510] dark:hover:bg-[#d4ba96] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? 'Authenticating...' : (isSignUp ? 'Create Account' : 'Sign In')}
              </button>
            </form>
            <div className="mt-5 text-center">
              <button onClick={() => { setIsSignUp(!isSignUp); setMessage({ text: '', type: '' }); }} className="text-sm font-medium text-[#5C4A3D]/80 dark:text-[#c6a87c]/80 hover:text-[#2D241C] dark:hover:text-[#FAFAFA] transition-colors cursor-pointer">
                {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Create one"}
              </button>
            </div>
            {message.text && (
              <div className={`mt-5 p-3.5 rounded-xl text-sm text-center font-medium ${message.type === 'error' ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20' : 'bg-[#c6a87c]/10 text-[#5C4A3D] dark:text-[#c6a87c] border border-[#c6a87c]/20'}`}>
                {message.text}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
