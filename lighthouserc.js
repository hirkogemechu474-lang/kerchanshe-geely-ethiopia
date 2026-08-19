module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3002/',
        'http://localhost:3002/models',
        'http://localhost:3002/models/coolray',
        'http://localhost:3002/electric',
        'http://localhost:3002/dealers',
      ],
      startServerCommand: 'npm run start --prefix web',
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.85 }],
        'categories:accessibility': ['error', { minScore: 0.90 }],
        'categories:best-practices': ['warn', { minScore: 0.90 }],
        'categories:seo': ['error', { minScore: 0.95 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
