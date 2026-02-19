import React from 'react';

export const LoadingScreen: React.FC = () => {
    return (
        <div className="absolute inset-0 bg-black flex items-center justify-center z-50">
            <div className="text-white text-2xl font-bold tracking-widest animate-pulse">
                ESTABLISHING DATALINK...
            </div>
        </div>
    );
};
