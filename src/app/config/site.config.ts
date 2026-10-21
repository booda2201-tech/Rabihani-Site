import { environment } from '../../environments/environment';

export const API_BASE_URL = environment.apiBaseUrl;

/** Production origin, no trailing slash. Canonical links, social previews and the QR all point here. Keep in sync with robots.txt and sitemap.xml. */
export const SITE_URL = 'https://rabahni.com';
export const SITE_NAME = 'ربحني';
export const SITE_DESCRIPTION =
  'ربحني تطبيق مصري بيخليك تكسب نقاط من كل مشترياتك عند الشركات المشاركة، وتزايد بيها على موبايلات وإلكترونيات وأجهزة منزلية حقيقية. حمّل التطبيق مجانًا على Android و iOS.';

/** Relative to API_BASE_URL. Expects `ResetPasswordPayload`; emailOrPhone + token arrive in the link's query string. */
export const RESET_PASSWORD_PATH = 'Auth/reset-password';

/** Egypt */
export const COUNTRY_ID = 3;

export const CURRENCY_LABEL = 'جنيه';

/**
 * Store links live here only.
 * `qr` matches the printed QR codes: /download sends phones to their store and desktops to the download section.
 */
export const DOWNLOAD_LINKS = {
  android: 'https://play.google.com/store/apps/details?id=hendal.rabhny.mazad',
  ios: 'https://apps.apple.com/eg/app/%D8%B1%D8%A8%D8%AD%D9%86%D9%8A/id6813184088',
  qr: `${SITE_URL}/download/`,
};

export const SOCIAL_LINKS = {
  instagram: 'https://www.instagram.com/rabahny.app/',
  facebook: 'https://www.facebook.com/profile.php?id=61595836253104',
};

export interface CategoryFilter {
  id: number | null;
  label: string;
}

export const CATEGORY_FILTERS: CategoryFilter[] = [
  { id: null, label: 'الكل' },
  { id: 1, label: 'إلكترونيات' },
  { id: 2, label: 'هواتف' },
  { id: 4, label: 'منزل ومطبخ' },
];

export interface Partner {
  name: string;
  displayName: string;
  kind: string;
  tagline: string;
  mark: string;
  from: string;
  to: string;
}

export const PARTNERS: Partner[] = [
  {
    name: 'Bubblehope',
    displayName: 'بابل هوب',
    kind: 'مشروبات',
    tagline: 'اشرب من بابل هوب، امسح QR، واكسب نقاطك فورًا',
    mark: 'B',
    from: '#f472b6',
    to: '#8b5cf6',
  },
  {
    name: 'FORTO',
    displayName: 'فورتو',
    kind: 'غسيل عربيات',
    tagline: 'اغسل عربيتك في FORTO، امسح QR، واكسب نقاطك فورًا',
    mark: 'F',
    from: '#38bdf8',
    to: '#2563eb',
  },
  {
    name: 'T4TEA',
    displayName: 'تي فور تي',
    kind: 'شاي ومشروبات',
    tagline: 'اشتري من T4TEA، امسح QR، واكسب نقاطك فورًا',
    mark: 'T4',
    from: '#34d399',
    to: '#047857',
  },
  {
    name: 'شاي الصعيد',
    displayName: 'شاي الصعيد',
    kind: 'شاي',
    tagline: 'اشتري من شاي الصعيد، امسح QR، واكسب نقاطك فورًا',
    mark: 'ص',
    from: '#f59e0b',
    to: '#b45309',
  },
  {
    name: 'الأمانة لمواد البناء',
    displayName: 'الأمانة',
    kind: 'مواد بناء',
    tagline: 'اشتري من الأمانة، امسح QR، واكسب نقاطك فورًا',
    mark: 'أ',
    from: '#d4af37',
    to: '#78591a',
  },
];
