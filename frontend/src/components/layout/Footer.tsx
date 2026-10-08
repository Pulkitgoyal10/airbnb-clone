import { footerLinks } from '@/lib/mock';

export function Footer() {
  return (
    <footer className="mt-8 border-t border-[#ddd] bg-[#f7f7f7] px-5 py-10 text-[#222]">
      <div className="mx-auto grid max-w-[1400px] gap-8 md:grid-cols-3">
        {Object.entries(footerLinks).map(([title, links]) => (
          <div key={title}>
            <h3 className="mb-3 text-sm font-semibold">{title}</h3>
            <div className="flex flex-col gap-3 text-sm text-[#444]">
              {links.map((link) => (
                <a href="#" key={link}>
                  {link}
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-10 flex max-w-[1400px] flex-col items-center gap-4 text-sm text-[#444]">
        <p>© 2026 Airbnb Clone, Inc.</p>
      </div>
    </footer>
  );
}
