const HOME_URL = "https://www.sarathchandra.com/";
const SANDBOX_URL = "https://www.sarathchandra.com/the-sandbox/";

const navLinks = [
  { href: "https://www.sarathchandra.com/about/", label: "About" },
  { href: "https://www.sarathchandra.com/blog/", label: "Blog" },
  { href: SANDBOX_URL, label: "The Sandbox" },
  { href: "https://www.sarathchandra.com/topics/", label: "Topics" },
];

export function SiteMasthead() {
  return (
    <header className="siteMasthead" aria-label="Sarathchandra site navigation">
      <a className="siteIdentity" href={HOME_URL}>
        <span className="siteName">Chathura Sarathchandra</span>
        <span className="siteKicker">The Sandbox / AgentWorld</span>
      </a>
      <nav className="siteNav" aria-label="Primary site links">
        {navLinks.map((link) => (
          <a href={link.href} key={link.href}>
            {link.label}
          </a>
        ))}
      </nav>
      <a className="siteHomeLink" href={HOME_URL}>
        Back to home
      </a>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="siteFooter">
      <span>AgentWorld is a personal research sandbox by Chathura Sarathchandra.</span>
      <span>
        Views and simulations are personal and educational, not statements from any
        employer or affiliated organization.
      </span>
    </footer>
  );
}

export function WorldWatermark() {
  return (
    <div className="worldWatermark" aria-hidden="true">
      sarathchandra.com / AgentWorld
    </div>
  );
}
