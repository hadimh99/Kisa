import React from 'react';
import clsx from 'clsx';

/**
 * Renders a standardized chapter title heading with a chapter number.
 * This component handles alignment, color, and structure to ensure consistency across the app.
 *
 * @param {object} props
 * @param {number|string} props.chapterNumber - The number to display (e.g., 4)
 * @param {string} props.chapterTitle - The main title text (e.g., "Introduction")
 * @param {string} props.className - Custom classes for sizing, margins, line-clamping, etc.
 */
export default function ChapterTitleHeading({ chapterNumber, chapterTitle, className }) {
    return (
        <h2 className={clsx(
            // FIX: Changed items-start to items-baseline, and tightened gap-2 to gap-1.5
            "font-bold text-zinc-900 dark:text-white leading-snug flex items-baseline gap-1.5",
            className
        )}>
            {/* FIX: Removed pt-[2px] so it doesn't push the number down artificially */}
            {chapterNumber && (
                <span className="font-mono shrink-0">{chapterNumber}.</span>
            )}

            <span>{chapterTitle}</span>
        </h2>
    );
}