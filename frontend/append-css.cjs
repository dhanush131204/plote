const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

const newCSS = `

/* --- PREMIUM REAL ESTATE SAAS STYLES --- */

.app-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background-color: var(--color-bg);
}

.app-sidebar {
  width: 260px;
  background-color: var(--color-surface);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  padding: 1.5rem 1rem;
  z-index: 10;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 2rem;
  padding: 0 0.5rem;
}

.sidebar-logo svg {
  color: var(--color-accent);
}

.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  overflow-y: auto;
}

.nav-group-title {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-text-muted);
  letter-spacing: 0.05em;
  margin: 1.5rem 0 0.5rem 0.5rem;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  text-decoration: none;
  font-weight: 500;
  font-size: 0.9375rem;
  transition: all var(--duration) var(--ease-out);
}

.nav-item:hover {
  background-color: var(--color-bg-wash);
  color: var(--color-text);
}

.nav-item.active {
  background-color: color-mix(in oklch, var(--color-accent) 10%, transparent);
  color: var(--color-accent);
  font-weight: 600;
}

.sidebar-footer {
  margin-top: auto;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-border);
}

.profile-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding: 0 0.5rem;
}

.profile-avatar {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background-color: var(--color-accent);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}

.profile-info {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.profile-name {
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.profile-role {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.btn-logout {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--duration) var(--ease-out);
}

.btn-logout:hover {
  background-color: var(--color-bg-wash);
  color: var(--color-text);
}

.app-main-content {
  flex: 1;
  overflow-y: auto;
  background-color: var(--color-bg);
}

.dashboard-container {
  padding: 2rem 3rem;
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

.welcome-banner {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  background: linear-gradient(135deg, var(--color-surface) 0%, color-mix(in oklch, var(--color-accent) 5%, var(--color-surface)) 100%);
  padding: 2rem 2.5rem;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
}

.welcome-title {
  font-family: var(--font-display);
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 0.5rem;
}

.welcome-subtitle {
  color: var(--color-text-muted);
  font-size: 1.05rem;
}

.welcome-stats {
  display: flex;
  gap: 1rem;
}

.stat-badge {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 1rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: var(--shadow-sm);
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-accent);
}

.stat-label {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.section-title {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: var(--color-text);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-header .section-title {
  margin-bottom: 0;
}

.quick-actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.action-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  text-align: left;
  cursor: pointer;
  transition: all var(--duration) var(--ease-out);
  box-shadow: var(--shadow-sm);
}

.action-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--color-accent);
}

.action-icon {
  font-size: 2rem;
  background: color-mix(in oklch, var(--color-accent) 10%, transparent);
  width: 4rem;
  height: 4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
}

.action-text h3 {
  font-weight: 600;
  font-size: 1.05rem;
  color: var(--color-text);
  margin-bottom: 0.25rem;
}

.action-text p {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 2rem;
}

.project-card {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  overflow: hidden;
  transition: all var(--duration) var(--ease-out);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
}

.project-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
  border-color: var(--color-border-strong);
}

.project-card-image {
  position: relative;
  height: 200px;
  background-color: var(--color-bg-wash);
}

.project-card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.project-card-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  font-weight: 500;
}

.project-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: var(--color-surface);
  color: var(--color-text);
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  box-shadow: var(--shadow-sm);
}

.project-card-content {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.project-title {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 0.5rem;
}

.project-meta {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.project-meta-item {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.project-card-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: auto;
}

.project-card-actions .btn-primary,
.project-card-actions .btn-secondary {
  flex: 1;
  justify-content: center;
  display: flex;
}

.empty-state-premium {
  background: var(--color-surface);
  border: 1px dashed var(--color-border-strong);
  border-radius: var(--radius-lg);
  padding: 4rem 2rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.empty-state-premium.mini {
  padding: 2.5rem 1.5rem;
}

.empty-illustration {
  font-size: 3rem;
  margin-bottom: 1.5rem;
  opacity: 0.8;
}

.empty-state-premium h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 0.75rem;
}

.empty-state-premium p {
  color: var(--color-text-muted);
  max-width: 400px;
  margin-bottom: 2rem;
  line-height: 1.5;
}
`;

fs.appendFileSync('src/index.css', newCSS);
console.log('Appended layout CSS');
