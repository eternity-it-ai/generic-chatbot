interface HeaderProps {
  companyName: string;
  logoUrl: string | null;
  companyUrl: string;
}

export default function Header({
  companyName,
  logoUrl,
  companyUrl,
}: HeaderProps) {
  const getLogoUrl = () => {
    if (logoUrl) return logoUrl;
    if (companyUrl) {
      const cleanDomain = companyUrl
        .replace("https://", "")
        .replace("http://", "")
        .split("/")[0];
      return `https://www.google.com/s2/favicons?domain=${cleanDomain}&sz=128`;
    }
    return null;
  };

  const logo = getLogoUrl();

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4 h-[72.5px]">
      <div className="flex items-center gap-4">
        {logo && (
          <img src={logo} alt="Company Logo" className="w-10 h-10 rounded-lg" />
        )}
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold text-gray-700">
            {companyName}
          </span>
          <span className="text-sm text-gray-500">Strategy Portal</span>
        </div>
      </div>
    </div>
  );
}
