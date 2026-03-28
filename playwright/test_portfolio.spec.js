/**
 * Playwright E2E tests for Web-Portfolio static HTML pages
 */
const { test, expect } = require('@playwright/test');
const path = require('path');

const indexPath = 'file://' + path.join(__dirname, '..', 'index.html');
const gamePath = 'file://' + path.join(__dirname, '..', 'game.html');

test('index.html loads via file URL', async ({ page }) => {
  await page.goto(indexPath);
  // Page should load without throwing
  const title = await page.title();
  expect(title).toBeTruthy();
});

test('index.html has a page title', async ({ page }) => {
  await page.goto(indexPath);
  const title = await page.title();
  expect(title.length).toBeGreaterThan(0);
});

test('index.html title contains Portfolio or Tobi', async ({ page }) => {
  await page.goto(indexPath);
  const title = await page.title();
  expect(title).toMatch(/Portfolio|Tobi/i);
});

test('index.html has navigation links', async ({ page }) => {
  await page.goto(indexPath);
  const links = page.locator('a');
  const count = await links.count();
  expect(count).toBeGreaterThan(0);
});

test('index.html has GitHub link', async ({ page }) => {
  await page.goto(indexPath);
  const githubLink = page.locator('a[href*="github"]');
  await expect(githubLink).toBeVisible();
});

test('index.html body is visible', async ({ page }) => {
  await page.goto(indexPath);
  await expect(page.locator('body')).toBeVisible();
});

test('index.html has at least one heading', async ({ page }) => {
  await page.goto(indexPath);
  const heading = page.locator('h1, h2, h3').first();
  await expect(heading).toBeVisible();
});

test('index.html has collapsible buttons', async ({ page }) => {
  await page.goto(indexPath);
  const collapsibles = page.locator('.collapsible');
  const count = await collapsibles.count();
  expect(count).toBeGreaterThan(0);
});

test('game.html loads via file URL', async ({ page }) => {
  // game.js calls prompt() and startGame() on load - suppress dialogs
  page.on('dialog', async (dialog) => {
    await dialog.accept('TestPlayer');
  });
  await page.goto(gamePath);
  const title = await page.title();
  expect(title).toBeTruthy();
});

test('game.html has a canvas or game-container element', async ({ page }) => {
  page.on('dialog', async (dialog) => {
    await dialog.accept('TestPlayer');
  });
  await page.goto(gamePath);

  // Check for game-container div (game.html uses divs, not canvas)
  const gameContainer = page.locator('#game-container');
  const hasGameContainer = await gameContainer.count();

  // Or check for canvas as fallback
  const canvas = page.locator('canvas');
  const hasCanvas = await canvas.count();

  expect(hasGameContainer + hasCanvas).toBeGreaterThan(0);
});

test('game.html has Jump counter element', async ({ page }) => {
  page.on('dialog', async (dialog) => {
    await dialog.accept('TestPlayer');
  });
  await page.goto(gamePath);
  const jumpCounter = page.locator('#jump-counter');
  await expect(jumpCounter).toBeVisible();
});

test('game.html has leaderboard element', async ({ page }) => {
  page.on('dialog', async (dialog) => {
    await dialog.accept('TestPlayer');
  });
  await page.goto(gamePath);
  const leaderboard = page.locator('#leaderboard');
  await expect(leaderboard).toBeVisible();
});
