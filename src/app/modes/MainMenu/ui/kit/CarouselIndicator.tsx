import React from 'react';

interface CarouselIndicatorProps {
    panels: readonly { id: string; label: string }[];
    activeIndex: number;
}

export const CarouselIndicator: React.FC<CarouselIndicatorProps> = ({ panels, activeIndex }) => {
    return (
        <div className="flex items-center justify-center gap-2 py-2">
            {panels.map((panel, i) => {
                if (i === activeIndex) {
                    return (
                        <span key={panel.id} className="text-[10px] font-bold uppercase tracking-widest text-white">
                            {panel.label}
                        </span>
                    );
                }
                return (
                    <div
                        key={panel.id}
                        className="w-1.5 h-1.5 rounded-full bg-white/30"
                    />
                );
            })}
        </div>
    );
};
