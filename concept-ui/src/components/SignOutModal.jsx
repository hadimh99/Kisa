import { motion, AnimatePresence } from 'framer-motion';
import { User } from 'lucide-react';

// Sign-out confirmation modal extracted from App.jsx (markup unchanged).
// onConfirm preserves the original inline behaviour (sign out + close).
export default function SignOutModal({ open, onCancel, onConfirm }) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4 bg-[#FDFBF7]/40 dark:bg-[#020805]/60 backdrop-blur-md pointer-events-auto">
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-sm p-6 sm:p-8 bg-[#FDFBF7] dark:bg-[#0A120E] border border-[#5C4A3D]/10 dark:border-[#c6a87c]/20 rounded-[2rem] shadow-2xl text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
              <User className="w-5 h-5 text-red-500" />
            </div>
            <h2 className="text-xl sm:text-2xl font-serif text-[#2D241C] dark:text-[#FAFAFA] mb-2">Sign Out?</h2>
            <p className="text-sm text-[#5C4A3D]/80 dark:text-[#FAFAFA]/60 mb-6">Are you sure you want to sign out of your account?</p>
            <div className="flex gap-3">
              <button onClick={onCancel} className="flex-1 py-3 rounded-xl font-medium text-[#5C4A3D] dark:text-[#FAFAFA] bg-[#F8F5EE] dark:bg-[#1A1510] hover:bg-[#EAE4D3] dark:hover:bg-[#251E17] transition-colors border border-[#5C4A3D]/10 dark:border-[#c6a87c]/20 cursor-pointer">Cancel</button>
              <button onClick={onConfirm} className="flex-1 py-3 rounded-xl font-medium text-white bg-red-500 hover:bg-red-600 transition-colors shadow-sm cursor-pointer">Sign Out</button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
