const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

// Replace colors and shadows
css = css.replace(
  /:root \{[\s\S]*?\}/,
  `:root {
  /* Real Estate SaaS Colors */
  --color-available: #0F5132;
  --color-booked: #D4AF37;
  --color-sold: #dc3545;
  --color-bg: #F8F9FB;
  --color-bg-wash: #f1f3f5;
  --color-surface: #FFFFFF;
  --color-border: #e5e7eb;
  --color-border-strong: #d1d5db;
  --color-text: #1F2937;
  --color-text-muted: #6b7280;
  --color-accent: #0F5132;
  --color-accent-hover: #0b3d25;
  --color-danger: #dc2626;
  --color-danger-bg: #fef2f2;
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --font-display: 'Inter', system-ui, sans-serif;
  --font-sans: 'Inter', system-ui, sans-serif;
  --ease-out: cubic-bezier(0.4, 0, 0.2, 1);
  --duration: 150ms;
}`
);

// Reduce some whitespace in common classes
css = css.replace(/padding: clamp\(1.5rem, 4vw, 2.5rem\);/g, 'padding: clamp(1rem, 3vw, 2rem);');
css = css.replace(/padding: clamp\(2.5rem, 6vw, 4rem\) 1.5rem;/g, 'padding: clamp(1.5rem, 4vw, 3rem) 1rem;');
css = css.replace(/gap: 1.5rem;/g, 'gap: 1rem;');
css = css.replace(/margin-bottom: 2rem;/g, 'margin-bottom: 1.5rem;');

fs.writeFileSync('src/index.css', css);
console.log('CSS updated');
