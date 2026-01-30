import React from 'react';

const Logo = ({ className = "h-8 w-auto" }) => {
    return (
        <img
            src="/logo.png"
            alt="Bharat Peak Business Logo"
            className={className}
        />
    );
};

export default Logo;
