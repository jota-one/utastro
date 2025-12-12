export default {
  apiBaseUrl: import.meta.env.PUBLIC_PB_BASE_URI,

  // API Configuration
  apiPrefix: import.meta.env.PUBLIC_API_PREFIX || '/api',
  sisiApiPrefix: import.meta.env.PUBLIC_SISI_API_PREFIX || '/api/events',
  
  // Authentication
  jwtCookieName: import.meta.env.JWT_COOKIE_NAME || 'utjwt',
  jwtSecretKey: import.meta.env.JWT_SECRET_KEY,
  
  // HCaptcha
  hcaptcha: {
    sitekey: import.meta.env.PUBLIC_HCAPTCHA_SITEKEY,
    secret: import.meta.env.HCAPTCHA_SECRET,
    enabled: import.meta.env.PUBLIC_HCAPTCHA_ENABLED === 'true',
  },
  
  // Google Maps
  gmap: {
    apiKey: import.meta.env.PUBLIC_GMAP_API_KEY,
    staticUrl: import.meta.env.PUBLIC_GMAP_STATIC_URL || 'https://maps.googleapis.com/maps/api/staticmap',
    staticLink: import.meta.env.PUBLIC_GMAP_STATIC_LINK || 'https://www.google.com/maps',
  },
  
  // Email & Communication
  mandrill: {
    apiKey: import.meta.env.MANDRILL_API_KEY,
  },
  webmasterEmail: import.meta.env.WEBMASTER_EMAIL || 'administration@urban-training.ch',
  
  // Feature Flags
  presenceCheckValidation: import.meta.env.PUBLIC_PRESENCE_CHECK_VALIDATION === 'true',
  dateRangeNav: import.meta.env.PUBLIC_DATE_RANGE_NAV === 'true',
  logger: import.meta.env.LOGGER === 'true',
  
  // Access Control & Roles
  acl: ['superadmin', 'admin', 'coach', 'user'],
  roles: {
    admin: 'admin',
    author: 'admin',
    publisher: 'admin',
    superadmin: 'superadmin',
    staff: 'coach',
    user: 'user',
  },
  
  // Signup Configuration
  signup: {
    password: {
      minLength: 8,
    },
    pending: {
      expirationInDays: 2,
    },
  },
  
  // Debug
  debug: {
    hateoas: false,
  },
}
