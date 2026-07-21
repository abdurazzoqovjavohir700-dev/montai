const fs = require('fs');
fs.mkdirSync('out', { recursive: true });

// Premium splash screen — shown while Vercel app loads
const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Montai</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 100%; height: 100%;
      background: #07080D;
      display: flex; align-items: center; justify-content: center;
      font-family: -apple-system, 'Segoe UI', 'Inter', sans-serif;
      overflow: hidden;
      user-select: none;
    }
    .wrap {
      display: flex; flex-direction: column;
      align-items: center; gap: 24px;
      animation: fadeIn 0.4s ease;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .logo-ring {
      position: relative;
      width: 80px; height: 80px;
    }
    .logo-ring svg {
      width: 80px; height: 80px;
      animation: float 4s ease-in-out infinite;
      filter: drop-shadow(0 6px 24px rgba(96,165,250,0.35));
    }
    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50%       { transform: translateY(-6px); }
    }
    .title {
      font-size: 22px; font-weight: 700; letter-spacing: -0.04em;
      background: linear-gradient(160deg, #F0F0F2 0%, #8D95A6 100%);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .dots {
      display: flex; gap: 6px; align-items: center;
    }
    .dot {
      width: 5px; height: 5px; border-radius: 50%;
      background: rgba(96,165,250,0.5);
      animation: pulse 1.2s ease-in-out infinite;
    }
    .dot:nth-child(2) { animation-delay: 0.2s; }
    .dot:nth-child(3) { animation-delay: 0.4s; }
    @keyframes pulse {
      0%, 100% { opacity: 0.3; transform: scale(0.8); }
      50%       { opacity: 1;   transform: scale(1.2); }
    }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="logo-ring">
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#60A5FA"/>
            <stop offset="100%" stop-color="#3B82F6"/>
          </linearGradient>
        </defs>
        <rect width="120" height="120" rx="28" fill="url(#g)"/>
        <rect x="14" y="12" width="8" height="8" rx="2" fill="#0A0A0B" opacity="0.3"/>
        <rect x="30" y="12" width="8" height="8" rx="2" fill="#0A0A0B" opacity="0.3"/>
        <rect x="46" y="12" width="8" height="8" rx="2" fill="#0A0A0B" opacity="0.3"/>
        <rect x="66" y="12" width="8" height="8" rx="2" fill="#0A0A0B" opacity="0.3"/>
        <rect x="82" y="12" width="8" height="8" rx="2" fill="#0A0A0B" opacity="0.3"/>
        <rect x="98" y="12" width="8" height="8" rx="2" fill="#0A0A0B" opacity="0.3"/>
        <rect x="14" y="100" width="8" height="8" rx="2" fill="#0A0A0B" opacity="0.3"/>
        <rect x="30" y="100" width="8" height="8" rx="2" fill="#0A0A0B" opacity="0.3"/>
        <rect x="46" y="100" width="8" height="8" rx="2" fill="#0A0A0B" opacity="0.3"/>
        <rect x="66" y="100" width="8" height="8" rx="2" fill="#0A0A0B" opacity="0.3"/>
        <rect x="82" y="100" width="8" height="8" rx="2" fill="#0A0A0B" opacity="0.3"/>
        <rect x="98" y="100" width="8" height="8" rx="2" fill="#0A0A0B" opacity="0.3"/>
        <path d="M28 82V38L44 62L60 38L60 82" stroke="#0A0A0B" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M60 82V38L76 62L92 38V82" stroke="#0A0A0B" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
    <div class="title">Montai</div>
    <div class="dots">
      <div class="dot"></div>
      <div class="dot"></div>
      <div class="dot"></div>
    </div>
  </div>
  <script>
    // Navigate to the live app
    window.location.replace('https://montai-plum.vercel.app');
  </script>
</body>
</html>`;

fs.writeFileSync('out/index.html', html);
console.log('out/index.html created (Montai splash screen)');
