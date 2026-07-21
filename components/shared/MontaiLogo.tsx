interface MontaiLogoProps {
  size?: number;
}

export default function MontaiLogo({ size = 40 }: MontaiLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="montaiGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
      </defs>

      {/* Rounded square background */}
      <rect width="120" height="120" rx="28" fill="url(#montaiGrad)" />

      {/* Film strip holes — top */}
      <rect x="14" y="12" width="8" height="8" rx="2" fill="#0A0A0B" opacity="0.3" />
      <rect x="30" y="12" width="8" height="8" rx="2" fill="#0A0A0B" opacity="0.3" />
      <rect x="46" y="12" width="8" height="8" rx="2" fill="#0A0A0B" opacity="0.3" />
      <rect x="66" y="12" width="8" height="8" rx="2" fill="#0A0A0B" opacity="0.3" />
      <rect x="82" y="12" width="8" height="8" rx="2" fill="#0A0A0B" opacity="0.3" />
      <rect x="98" y="12" width="8" height="8" rx="2" fill="#0A0A0B" opacity="0.3" />

      {/* Film strip holes — bottom */}
      <rect x="14" y="100" width="8" height="8" rx="2" fill="#0A0A0B" opacity="0.3" />
      <rect x="30" y="100" width="8" height="8" rx="2" fill="#0A0A0B" opacity="0.3" />
      <rect x="46" y="100" width="8" height="8" rx="2" fill="#0A0A0B" opacity="0.3" />
      <rect x="66" y="100" width="8" height="8" rx="2" fill="#0A0A0B" opacity="0.3" />
      <rect x="82" y="100" width="8" height="8" rx="2" fill="#0A0A0B" opacity="0.3" />
      <rect x="98" y="100" width="8" height="8" rx="2" fill="#0A0A0B" opacity="0.3" />

      {/* Letter M */}
      <path
        d="M28 82V38L44 62L60 38L60 82"
        stroke="#0A0A0B"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M60 82V38L76 62L92 38V82"
        stroke="#0A0A0B"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
