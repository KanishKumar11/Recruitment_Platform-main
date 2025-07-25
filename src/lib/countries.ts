// Source: ISO 3166-1 country codes with emoji flags
export interface Country {
  code: string;
  name: string;
  emoji: string;
}

export const countries: Country[] = [
  { code: 'US', name: 'United States', emoji: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', emoji: '🇬🇧' },
  { code: 'CA', name: 'Canada', emoji: '🇨🇦' },
  { code: 'AU', name: 'Australia', emoji: '🇦🇺' },
  { code: 'IN', name: 'India', emoji: '🇮🇳' },
  { code: 'DE', name: 'Germany', emoji: '🇩🇪' },
  { code: 'FR', name: 'France', emoji: '🇫🇷' },
  { code: 'JP', name: 'Japan', emoji: '🇯🇵' },
  { code: 'CN', name: 'China', emoji: '🇨🇳' },
  { code: 'BR', name: 'Brazil', emoji: '🇧🇷' },
  { code: 'SG', name: 'Singapore', emoji: '🇸🇬' },
  { code: 'AE', name: 'United Arab Emirates', emoji: '🇦🇪' },
  { code: 'SA', name: 'Saudi Arabia', emoji: '🇸🇦' },
  { code: 'ZA', name: 'South Africa', emoji: '🇿🇦' },
  { code: 'NG', name: 'Nigeria', emoji: '🇳🇬' },
  { code: 'EG', name: 'Egypt', emoji: '🇪🇬' },
  { code: 'KE', name: 'Kenya', emoji: '🇰🇪' },
  { code: 'MX', name: 'Mexico', emoji: '🇲🇽' },
  { code: 'AR', name: 'Argentina', emoji: '🇦🇷' },
  { code: 'RU', name: 'Russia', emoji: '🇷🇺' },
  { code: 'IT', name: 'Italy', emoji: '🇮🇹' },
  { code: 'ES', name: 'Spain', emoji: '🇪🇸' },
  { code: 'NL', name: 'Netherlands', emoji: '🇳🇱' },
  { code: 'SE', name: 'Sweden', emoji: '🇸🇪' },
  { code: 'CH', name: 'Switzerland', emoji: '🇨🇭' },
  { code: 'NO', name: 'Norway', emoji: '🇳🇴' },
  { code: 'DK', name: 'Denmark', emoji: '🇩🇰' },
  { code: 'FI', name: 'Finland', emoji: '🇫🇮' },
  { code: 'IE', name: 'Ireland', emoji: '🇮🇪' },
  { code: 'PT', name: 'Portugal', emoji: '🇵🇹' },
  { code: 'BE', name: 'Belgium', emoji: '🇧🇪' },
  { code: 'AT', name: 'Austria', emoji: '🇦🇹' },
  { code: 'IL', name: 'Israel', emoji: '🇮🇱' },
  { code: 'TR', name: 'Turkey', emoji: '🇹🇷' },
  { code: 'PL', name: 'Poland', emoji: '🇵🇱' },
  { code: 'SE', name: 'Sweden', emoji: '🇸🇪' },
  { code: 'ID', name: 'Indonesia', emoji: '🇮🇩' },
  { code: 'PH', name: 'Philippines', emoji: '🇵🇭' },
  { code: 'VN', name: 'Vietnam', emoji: '🇻🇳' },
  { code: 'TH', name: 'Thailand', emoji: '🇹🇭' },
  { code: 'MY', name: 'Malaysia', emoji: '🇲🇾' },
  { code: 'PK', name: 'Pakistan', emoji: '🇵🇰' },
  { code: 'BD', name: 'Bangladesh', emoji: '🇧🇩' },
  { code: 'LK', name: 'Sri Lanka', emoji: '🇱🇰' },
  { code: 'NP', name: 'Nepal', emoji: '🇳🇵' },
  { code: 'KH', name: 'Cambodia', emoji: '🇰🇭' },
  { code: 'MM', name: 'Myanmar', emoji: '🇲🇲' },
  { code: 'LA', name: 'Laos', emoji: '🇱🇦' },
  { code: 'MN', name: 'Mongolia', emoji: '🇲🇳' },
  { code: 'BT', name: 'Bhutan', emoji: '🇧🇹' },
  { code: 'MV', name: 'Maldives', emoji: '🇲🇻' },
  { code: 'REMOTE', name: 'Remote', emoji: '🌍' }
].sort((a, b) => a.name.localeCompare(b.name));

// Get country by code
export const getCountryByCode = (code: string): Country | undefined => 
  countries.find(country => country.code === code);
