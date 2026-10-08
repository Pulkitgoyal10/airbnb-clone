export function Footer() {
  const footerLinks: Record<string, string[]> = {
    Support: [
      'Help Center',
      'AirCover',
      'Anti-discrimination',
      'Disability support',
      'Cancellation options',
      'Report neighborhood concern',
    ],
    Hosting: [
      'Airbnb your home',
      'AirCover for Hosts',
      'Hosting resources',
      'Community forum',
      'Hosting responsibly',
      'Airbnb-friendly apartments',
    ],
    Airbnb: [
      'Newsroom',
      'New features',
      'Careers',
      'Investors',
      'Gift cards',
      'Airbnb.org emergency stays',
    ],
  };

  return (
    <footer className="mt-16 border-t border-gray-200 bg-gray-50 px-5 py-10">
      <div className="mx-auto grid max-w-[1400px] gap-8 md:grid-cols-3">
        {Object.entries(footerLinks).map(([title, links]) => (
          <div key={title}>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">{title}</h3>
            <div className="flex flex-col gap-3 text-sm text-gray-600">
              {links.map((link) => (
                <a key={link} href="#" className="hover:underline">
                  {link}
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-10 max-w-[1400px] flex flex-col items-center gap-4 text-sm text-gray-600">
        <p>© 2024 Airbnb Clone, Inc.</p>
        <div className="flex gap-4">
          <a href="#" className="hover:underline">Privacy</a>
          <span>·</span>
          <a href="#" className="hover:underline">Terms</a>
          <span>·</span>
          <a href="#" className="hover:underline">Sitemap</a>
        </div>
      </div>
    </footer>
  );
}
