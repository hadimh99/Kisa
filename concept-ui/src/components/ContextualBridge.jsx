import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ContextualBridge = ({ text, ontology }) => {
    if (!ontology || ontology.length === 0) return <span>{text}</span>;

    const sortedTerms = [...ontology].sort((a, b) => b.variant.length - a.variant.length);
    const pattern = sortedTerms.map(item => item.variant.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    const regex = new RegExp(`\\b(${pattern})\\b`, 'gi');

    const parts = text.split(regex);

    return (
        <span>
            {parts.map((part, index) => {
                const match = sortedTerms.find(item => item.variant.toLowerCase() === part.toLowerCase());
                if (match) {
                    return <TooltipTerm key={index} term={part} details={match} />;
                }
                return part;
            })}
        </span>
    );
};

const TooltipTerm = ({ term, details }) => {
    const [show, setShow] = useState(false);
    const [offset, setOffset] = useState(0);
    const [isMobile, setIsMobile] = useState(false);
    const termRef = useRef(null);

    // Separate Device Detection
    useEffect(() => {
        const checkMobile = () => {
            // Check for touch capability or small screen
            setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useLayoutEffect(() => {
        if (!show || !termRef.current) return;

        const calculateOffset = () => {
            const screenWidth = window.innerWidth;
            const rect = termRef.current.getBoundingClientRect();
            const tooltipWidth = Math.min(280, screenWidth * 0.85);
            const halfTooltip = tooltipWidth / 2;
            const padding = 20;

            const wordCenter = rect.left + rect.width / 2;
            let moveBy = 0;

            if (wordCenter - halfTooltip < padding) {
                moveBy = padding - (wordCenter - halfTooltip);
            } else if (wordCenter + halfTooltip > screenWidth - padding) {
                moveBy = (screenWidth - padding) - (wordCenter + halfTooltip);
            }
            setOffset(moveBy);
        };

        calculateOffset();
        window.addEventListener('resize', calculateOffset);
        return () => window.removeEventListener('resize', calculateOffset);
    }, [show]);

    useEffect(() => {
        if (!show) return;
        const handleClose = () => setShow(false);
        window.addEventListener('click', handleClose);
        return () => window.removeEventListener('click', handleClose);
    }, [show]);

    // ==========================================
    // SEPARATE LOGIC BLOCKS
    // ==========================================

    // DESKTOP: Pure Hover
    const desktopHandlers = {
        onMouseEnter: () => setShow(true),
        onMouseLeave: () => setShow(false),
    };

    // MOBILE: Pure Click/Tap (stops the "hover" flash)
    const mobileHandlers = {
        onClick: (e) => {
            e.stopPropagation();
            e.preventDefault(); // Prevents emulated mouse events
            setShow(!show);
        }
    };

    return (
        <span
            ref={termRef}
            className="relative inline-block cursor-pointer border-b-2 border-dotted border-[#c6a87c] transition-all duration-200"
            {...(isMobile ? mobileHandlers : desktopHandlers)}
        >
            <span className="text-inherit">{term}</span>

            <AnimatePresence>
                {show && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        style={{
                            left: `calc(50% + ${offset}px)`,
                            x: '-50%',
                            width: isMobile ? '85vw' : '280px',
                            maxWidth: '280px'
                        }}
                        className="absolute bottom-full mb-4 z-[9999] p-5 rounded-2xl bg-[#121212] border border-[#c6a87c]/40 shadow-[0_20px_50px_rgba(0,0,0,0.6)] pointer-events-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-[#c6a87c]">
                                {details.domain}
                            </span>
                            <span className="text-xl font-sans text-white/90 leading-none antialiased">
                                {details.primary_arabic}
                            </span>
                        </div>

                        <div className="text-lg font-bold text-white mb-2 leading-tight font-sans">
                            {details.primary_english || details.name}
                        </div>

                        <p className="text-[14px] leading-relaxed text-gray-300 font-medium font-sans">
                            {details.definition}
                        </p>

                        <div className="mt-4 h-0.5 w-full bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 0.5 }}
                                className="h-full bg-[#c6a87c]"
                            />
                        </div>

                        <div
                            style={{ left: `calc(50% - ${offset}px)` }}
                            className="absolute top-full -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-[#121212]"
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </span>
    );
};

export default ContextualBridge;
