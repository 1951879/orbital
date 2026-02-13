import { useState, useEffect } from 'react';

export type LayoutMode = 'carousel' | 'grid';
export type Orientation = 'portrait' | 'landscape';

interface LayoutInfo {
    mode: LayoutMode;
    orientation: Orientation;
}

// Matches the custom `md` breakpoint in index.html:
// (min-width: 768px) and (min-height: 600px) → grid
// Below that → carousel
const GRID_QUERY = '(min-width: 768px) and (min-height: 600px)';
const PORTRAIT_QUERY = '(orientation: portrait)';

export const useLayoutMode = (): LayoutInfo => {
    const [info, setInfo] = useState<LayoutInfo>(() => ({
        mode: window.matchMedia(GRID_QUERY).matches ? 'grid' : 'carousel',
        orientation: window.matchMedia(PORTRAIT_QUERY).matches ? 'portrait' : 'landscape',
    }));

    useEffect(() => {
        const gridMql = window.matchMedia(GRID_QUERY);
        const portMql = window.matchMedia(PORTRAIT_QUERY);

        const update = () => {
            setInfo({
                mode: gridMql.matches ? 'grid' : 'carousel',
                orientation: portMql.matches ? 'portrait' : 'landscape',
            });
        };

        gridMql.addEventListener('change', update);
        portMql.addEventListener('change', update);
        return () => {
            gridMql.removeEventListener('change', update);
            portMql.removeEventListener('change', update);
        };
    }, []);

    return info;
};
