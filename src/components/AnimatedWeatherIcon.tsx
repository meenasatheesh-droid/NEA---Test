import React from 'react';

interface AnimatedWeatherIconProps {
  type: 'sunny' | 'partly-cloudy' | 'cloudy' | 'rain' | 'thunder' | 'haze' | 'wind';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const AnimatedWeatherIcon: React.FC<AnimatedWeatherIconProps> = ({
  type,
  size = 'md',
  className = '',
}) => {
  const sizeMap = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  const dim = sizeMap[size];

  switch (type) {
    case 'sunny':
      return (
        <div className={`relative flex items-center justify-center ${dim} ${className}`}>
          {/* Pulsing glow */}
          <div className="absolute inset-0 rounded-full bg-amber-400/20 blur-md animate-pulse" />
          {/* Rotating outer rays */}
          <svg viewBox="0 0 100 100" className="w-full h-full animate-[spin_12s_linear_infinite]">
            <circle cx="50" cy="50" r="22" fill="#fbbf24" />
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
              <line
                key={deg}
                x1="50"
                y1="14"
                x2="50"
                y2="2"
                stroke="#f59e0b"
                strokeWidth="5"
                strokeLinecap="round"
                transform={`rotate(${deg} 50 50)`}
              />
            ))}
          </svg>
        </div>
      );

    case 'partly-cloudy':
      return (
        <div className={`relative flex items-center justify-center ${dim} ${className}`}>
          {/* Peeking Sun */}
          <div className="absolute -top-1 -right-1 w-2/3 h-2/3 animate-[spin_16s_linear_infinite]">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <circle cx="50" cy="50" r="24" fill="#fbbf24" />
              {[0, 60, 120, 180, 240, 300].map((deg) => (
                <line
                  key={deg}
                  x1="50"
                  y1="16"
                  x2="50"
                  y2="5"
                  stroke="#f59e0b"
                  strokeWidth="6"
                  strokeLinecap="round"
                  transform={`rotate(${deg} 50 50)`}
                />
              ))}
            </svg>
          </div>
          {/* Floating Cloud */}
          <div className="relative z-10 w-full h-full flex items-center justify-center animate-[bounce_4s_ease-in-out_infinite]">
            <svg viewBox="0 0 100 80" className="w-4/5 h-4/5 drop-shadow-md">
              <path
                d="M 28 65 L 75 65 A 16 16 0 0 0 78 33 A 22 22 0 0 0 42 22 A 20 20 0 0 0 20 45 A 16 16 0 0 0 28 65 Z"
                fill="#cbd5e1"
              />
            </svg>
          </div>
        </div>
      );

    case 'cloudy':
      return (
        <div className={`relative flex items-center justify-center ${dim} ${className}`}>
          <div className="w-full h-full flex items-center justify-center animate-[bounce_5s_ease-in-out_infinite]">
            <svg viewBox="0 0 100 80" className="w-full h-full drop-shadow">
              <path
                d="M 25 65 L 78 65 A 18 18 0 0 0 80 30 A 24 24 0 0 0 40 18 A 22 22 0 0 0 16 44 A 18 18 0 0 0 25 65 Z"
                fill="#94a3b8"
              />
            </svg>
          </div>
        </div>
      );

    case 'rain':
      return (
        <div className={`relative flex flex-col items-center justify-center ${dim} ${className}`}>
          {/* Cloud */}
          <svg viewBox="0 0 100 65" className="w-4/5 h-3/5 drop-shadow-md">
            <path
              d="M 25 55 L 78 55 A 16 16 0 0 0 80 25 A 22 22 0 0 0 42 15 A 20 20 0 0 0 18 36 A 16 16 0 0 0 25 55 Z"
              fill="#64748b"
            />
          </svg>
          {/* Animated Falling Droplets */}
          <div className="flex justify-around w-3/5 mt-0.5">
            <span className="w-1 h-3 rounded-full bg-sky-400 animate-[pulse_0.8s_ease-in-out_infinite]" />
            <span className="w-1 h-3.5 rounded-full bg-sky-400 animate-[pulse_1s_ease-in-out_infinite_0.2s]" />
            <span className="w-1 h-3 rounded-full bg-sky-400 animate-[pulse_0.9s_ease-in-out_infinite_0.4s]" />
          </div>
        </div>
      );

    case 'thunder':
      return (
        <div className={`relative flex flex-col items-center justify-center ${dim} ${className}`}>
          {/* Dark Cloud */}
          <svg viewBox="0 0 100 60" className="w-4/5 h-3/5 drop-shadow-lg">
            <path
              d="M 25 55 L 78 55 A 16 16 0 0 0 80 25 A 22 22 0 0 0 42 15 A 20 20 0 0 0 18 36 A 16 16 0 0 0 25 55 Z"
              fill="#475569"
            />
          </svg>
          {/* Animated Flashing Lightning Bolt */}
          <div className="relative -mt-1 flex items-center justify-center">
            <svg
              viewBox="0 0 30 45"
              className="w-5 h-7 fill-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.9)] animate-pulse"
            >
              <polygon points="18,0 4,20 15,20 11,40 26,18 15,18" />
            </svg>
          </div>
        </div>
      );

    case 'haze':
      return (
        <div className={`relative flex items-center justify-center ${dim} ${className}`}>
          <div className="w-full h-full flex flex-col items-center justify-center space-y-1.5">
            <div className="w-4/5 h-1.5 rounded-full bg-amber-400/80 animate-[pulse_2s_ease-in-out_infinite]" />
            <div className="w-full h-1.5 rounded-full bg-amber-500/70 animate-[pulse_2.4s_ease-in-out_infinite_0.3s]" />
            <div className="w-3/5 h-1.5 rounded-full bg-amber-400/80 animate-[pulse_1.8s_ease-in-out_infinite_0.6s]" />
          </div>
        </div>
      );

    case 'wind':
    default:
      return (
        <div className={`relative flex items-center justify-center ${dim} ${className}`}>
          <svg viewBox="0 0 80 60" className="w-full h-full stroke-teal-400 fill-none stroke-[4] stroke-linecap-round">
            <path d="M 10 20 Q 40 20 50 15 A 8 8 0 1 0 45 6" className="animate-pulse" />
            <path d="M 5 32 Q 45 32 60 28 A 9 9 0 1 0 55 18" className="animate-[pulse_1.5s_ease-in-out_infinite_0.2s]" />
            <path d="M 15 44 Q 35 44 45 40 A 6 6 0 1 0 40 32" className="animate-[pulse_2s_ease-in-out_infinite_0.4s]" />
          </svg>
        </div>
      );
  }
};
