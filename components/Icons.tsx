
import React from 'react';

export const LotusLogo: React.FC<{ className?: string; size?: number }> = ({ className = "", size = 32 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 100 100" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="50" cy="50" r="48" stroke="currentColor" strokeWidth="2"/>
    <path 
      d="M50 25C55 40 65 50 80 50C65 50 55 60 50 75C45 60 35 50 20 50C35 50 45 40 50 25Z" 
      stroke="currentColor" 
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="50" cy="50" r="4" fill="currentColor"/>
  </svg>
);

export const ScoreCircle: React.FC<{ score: number; size?: number; glow?: boolean }> = ({ score, size = 100, glow = false }) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  
  const getColor = () => {
    if (score >= 85) return '#B66E79'; // Rose
    if (score >= 70) return '#B66E79'; 
    return '#4A4A5C'; // Neutral
  };

  const color = getColor();

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 100 100" 
        className={`transform -rotate-90 ${glow && score >= 85 ? 'drop-shadow-[0_0_15px_rgba(182,110,121,0.5)]' : ''}`}
      >
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="#E5E7EB10"
          strokeWidth="6"
          fill="transparent"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke={color}
          strokeWidth="6"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <span className="absolute text-xl font-serif text-charcoal font-bold">
        {score}%
      </span>
    </div>
  );
};

export const LotusPattern: React.FC<{ className?: string }> = ({ className = "" }) => (
  <svg width="100%" height="100%" viewBox="0 0 800 800" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <g opacity="0.05">
      <path d="M400 100C420 200 480 250 550 250C480 250 420 300 400 400C380 300 320 250 250 250C320 250 380 200 400 100Z" fill="#B66E79"/>
      <path d="M150 450C165 525 210 562 262 562C210 562 165 600 150 675C135 600 90 562 37 562C90 562 135 525 150 450Z" fill="#B66E79"/>
      <path d="M650 550C665 625 710 662 762 662C710 662 665 700 650 775C635 700 590 662 537 662C590 662 635 625 650 550Z" fill="#B66E79"/>
      <path d="M500 50C510 100 540 125 575 125C540 125 510 150 500 200C490 150 460 125 425 125C460 125 490 100 500 50Z" fill="#B66E79"/>
    </g>
  </svg>
);

export const PhoneIllustration: React.FC<{ className?: string }> = ({ className = "" }) => (
  <svg width="320" height="480" viewBox="0 0 320 480" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Shadow */}
    <rect x="40" y="60" width="240" height="400" rx="40" fill="black" fillOpacity="0.1" filter="blur(20px)"/>
    {/* Body */}
    <rect x="40" y="40" width="240" height="400" rx="40" fill="#2A2A35" stroke="#4A4A5C" strokeWidth="2"/>
    <rect x="50" y="50" width="220" height="380" rx="32" fill="#1C1C26"/>
    {/* Screen Elements */}
    <rect x="140" y="60" width="40" height="4" rx="2" fill="#333333"/>
    <rect x="70" y="100" width="180" height="60" rx="12" fill="#B66E79" fillOpacity="0.1" stroke="#B66E79" strokeOpacity="0.3"/>
    <path d="M160 120C165 130 170 135 180 135C170 135 165 140 160 150C155 140 150 135 140 135C150 135 155 130 160 120Z" fill="#B66E79"/>
    <rect x="70" y="180" width="120" height="8" rx="4" fill="#333333"/>
    <rect x="70" y="200" width="180" height="8" rx="4" fill="#333333" fillOpacity="0.5"/>
    <rect x="70" y="220" width="150" height="8" rx="4" fill="#333333" fillOpacity="0.3"/>
    
    <circle cx="160" cy="380" r="24" fill="#B66E79" fillOpacity="0.2"/>
    <path d="M160 370C163 376 166 379 172 379C166 379 163 382 160 388C157 382 154 379 148 379C154 379 157 376 160 370Z" fill="#B66E79"/>
  </svg>
);
