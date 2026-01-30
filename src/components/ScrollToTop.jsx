import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop Component
 * 
 * Automatically scrolls the window to the top (0, 0) whenever the route (pathname) changes.
 * This fixes the issue where navigating to a new page keeps the previous scroll position.
 */
export default function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        // Immediate scroll to top
        window.scrollTo(0, 0);
    }, [pathname]);

    return null;
}
