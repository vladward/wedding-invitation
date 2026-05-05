const {defineConfig, devices} = require('@playwright/test');

module.exports = defineConfig({
    testDir: './tests',
    fullyParallel: true,
    reporter: 'html',
    use: {
        baseURL: 'https://vladmasha2026.by',
        trace: 'on-first-retry',
    },
    projects: [
        {name: 'chrome', use: {...devices['Desktop Chrome']}},
        {name: 'safari', use: {...devices['Desktop Safari']}},
        {name: 'mobile-chrome', use: {...devices['Pixel 5']},},
        {name: 'mobile-safari', use: {...devices['iPhone 13']},},
    ],
});
