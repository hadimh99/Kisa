import React from 'react';
import { MapPin, ExternalLink } from 'lucide-react';

const Footer = ({ theme = 'light', setActiveTab, KisaLogo, setShowSearchOverlay }) => {

    // 3-Tier Theme Engine — mirrors the Glossary color system
    const isDark = theme === 'dark';
    const isSepia = theme === 'sepia';

    const colors = {
        bg: isDark ? 'bg-[#0c0d10]' : isSepia ? 'bg-[#F4EFE4]' : 'bg-[#efe7d6]',
        textPrimary: isDark ? 'text-white' : isSepia ? 'text-[#2D241C]' : 'text-[#1D1D1F]',
        textSecondary: isDark ? 'text-zinc-500' : isSepia ? 'text-[#5C4A3D]/60' : 'text-[#5C4A3D]/50',
        textTertiary: isDark ? 'text-zinc-600' : isSepia ? 'text-[#5C4A3D]/40' : 'text-[#5C4A3D]/35',
        border: isDark ? 'border-zinc-800/60' : isSepia ? 'border-[#c6a87c]/20' : 'border-[#5C4A3D]/10',
        divider: isDark ? 'from-transparent via-zinc-800 to-transparent' : isSepia ? 'from-transparent via-[#c6a87c]/30 to-transparent' : 'from-transparent via-[#5C4A3D]/15 to-transparent',
        hoverBg: isDark ? 'hover:bg-zinc-900' : isSepia ? 'hover:bg-[#c6a87c]/5' : 'hover:bg-[#5C4A3D]/5',
    };

    const exploreLinks = [
        { label: 'Global Search', action: 'overlay' },
        { label: 'The Academy', tab: 'library' },
        { label: 'Hadith Library', tab: 'hadith' },
        { label: 'Theological Glossary', tab: 'glossary' },
    ];

    const resourceLinks = [
        { label: 'Al-Qayyimah', href: 'https://alqayyimah.org' },
        { label: 'Al-Mawaddah', href: 'https://almawaddah.be' },
        { label: 'Al-Qamar TV', href: 'https://alqamar.tv' },
    ];

    const legalLinks = [
        { label: 'Privacy Policy', tab: 'privacy' },
        { label: 'Terms of Service', tab: 'terms' },
        { label: 'Legal Disclaimer', tab: 'disclaimer' },
    ];

    const handleNavClick = (tab) => {
        if (setActiveTab) {
            window.scrollTo(0, 0);
            setActiveTab(tab);
        }
    };

    return (
        <footer className={`w-full transition-colors duration-500 ${colors.bg}`}>

            {/* ─── Top Section: 3-Column Grid ─── */}
            <div className="max-w-6xl mx-auto px-6 sm:px-8 pt-16 pb-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 lg:gap-16">

                    {/* Column 1 — Brand */}
                    <div className="flex flex-col gap-5 md:pr-4">
                        <div className="flex items-center gap-3">
                            {KisaLogo && (
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isDark ? 'bg-[#c6a87c]/10 border border-[#c6a87c]/20' : isSepia ? 'bg-[#c6a87c]/15 border border-[#c6a87c]/25' : 'bg-[#2D241C]/5 border border-[#2D241C]/10'}`}>
                                    <KisaLogo className="w-5 h-5 text-[#c6a87c]" />
                                </div>
                            )}
                            <span style={{ fontFamily: '"Fraunces", Georgia, serif' }} className={`text-xl font-medium tracking-tight ${colors.textPrimary}`}>
                                Al-<span className="italic text-[#9c7327] dark:text-[#cda767]">Kisa</span>
                            </span>
                        </div>

                        <p className={`text-sm leading-relaxed font-serif max-w-xs ${colors.textSecondary}`}>
                            A humble learning platform dedicated to Knowing Your Imam and serving him.
                        </p>

                        <div className={`flex items-center gap-1.5 ${colors.textTertiary}`}>
                            <MapPin className="w-3 h-3" />
                            <span className="text-[11px] font-sans font-medium uppercase tracking-widest">
                                Built in London, UK
                            </span>
                        </div>
                    </div>

                    {/* Column 2 — Explore */}
                    <div className="flex flex-col gap-5">
                        <h3 className={`text-[10px] font-sans font-bold uppercase tracking-[0.2em] ${isDark ? 'text-[#c6a87c]/70' : 'text-[#c6a87c]'}`}>
                            Explore
                        </h3>
                        <nav className="flex flex-col gap-1">
                            {exploreLinks.map((link) => (
                                <button
                                    key={link.label}
                                    onClick={() => {
                                        if (link.action === 'overlay' && setShowSearchOverlay) {
                                            setShowSearchOverlay(true);
                                            window.scrollTo(0, 0);
                                        } else {
                                            handleNavClick(link.tab);
                                        }
                                    }}
                                    className={`relative text-left text-sm font-sans font-medium py-2 rounded-lg transition-all duration-300 cursor-pointer group ${colors.textSecondary} ${colors.hoverBg} hover:text-[#c6a87c]`}
                                >
                                    <span className="absolute -left-5 opacity-0 group-hover:opacity-100 group-hover:-left-4 transition-all text-[#c6a87c]">→</span>
                                    {link.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Column 3 — Resources */}
                    <div className="flex flex-col gap-5">
                        <h3 className={`text-[10px] font-sans font-bold uppercase tracking-[0.2em] ${isDark ? 'text-[#c6a87c]/70' : 'text-[#c6a87c]'}`}>
                            Resources
                        </h3>
                        <nav className="flex flex-col gap-1">
                            {resourceLinks.map((link) => (
                                <a
                                    key={link.href}
                                    href={link.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`relative text-sm font-sans font-medium py-2 rounded-lg transition-all duration-300 group inline-flex items-center gap-2 ${colors.textSecondary} ${colors.hoverBg} hover:text-[#c6a87c]`}
                                >
                                    <span className="absolute -left-5 opacity-0 group-hover:opacity-100 group-hover:-left-4 transition-all text-[#c6a87c]">→</span>
                                    {link.label}
                                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity duration-300" />
                                </a>
                            ))}
                        </nav>
                    </div>
                </div>
            </div>

            {/* ─── Divider ─── */}
            <div className="max-w-6xl mx-auto px-6 sm:px-8">
                <div className={`h-px w-full bg-gradient-to-r ${colors.divider}`} />
            </div>

            {/* ─── Bottom Bar ─── */}
            <div className="max-w-6xl mx-auto px-6 sm:px-8 py-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">

                    {/* Left — Copyright */}
                    <p className={`text-xs font-sans ${colors.textTertiary} text-center sm:text-left`}>
                        © 2026 Al-Kisa. All rights reserved.
                    </p>

                    {/* Right — Legal Links */}
                    <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-center">
                        {legalLinks.map((link, idx) => (
                            <React.Fragment key={link.tab}>
                                <button
                                    onClick={() => handleNavClick(link.tab)}
                                    className={`text-xs font-sans font-medium px-2 py-1 rounded-md transition-all duration-300 cursor-pointer ${colors.textTertiary} hover:text-[#c6a87c] ${colors.hoverBg}`}
                                >
                                    {link.label}
                                </button>
                                {idx < legalLinks.length - 1 && (
                                    <span className={`text-[8px] ${colors.textTertiary} select-none`}>·</span>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
