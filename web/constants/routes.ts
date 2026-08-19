/** Application route constants */

export const ROUTES = {
  home:       '/',
  models:     '/models',
  electric:   '/electric',
  service:    '/service',
  dealers:    '/dealers',
  financing:  '/financing',
  news:       '/news',
  about:      '/about',
  compare:    '/compare',
  configure:  '/configure',
  quote:      '/quote',
  testDrive:  '/test-drive',
  parts:      '/parts',
  reviews:    '/reviews',
  account:    '/account',
  login:      '/login',
  register:   '/register',
  // Admin routes
  admin: {
    dashboard:  '/admin/dashboard',
    login:      '/admin/login',
    vehicles:   '/admin/vehicles',
    analytics:  '/admin/analytics',
    users:      '/admin/users',
  },
} as const;
