import { test, expect } from '@playwright/test';

test.describe('Temp Chat App', () => {
  test('should display closed state correctly', async ({ page }) => {
    // Navigate to the home page
    await page.goto('/');

    // Check the page title
    await expect(page).toHaveTitle('temp');

    // Check that the "closed" state container is visible
    await expect(page.locator('#closed')).toBeVisible();
    
    // Check for the "temp is closed" message
    await expect(page.getByText('temp is closed')).toBeVisible();

    // Check that the countdown element exists
    await expect(page.locator('#countdown')).toBeVisible();

    // Check that the "open" state container is hidden
    await expect(page.locator('#open')).toBeHidden();
  });

  test('should show a ticking countdown', async ({ page }) => {
    await page.goto('/');

    const countdownLocator = page.locator('#countdown');

    // Get initial countdown text
    const initialText = await countdownLocator.textContent();
    expect(initialText).toMatch(/\d+h \d+m \d+s/);

    // Wait for 2 seconds
    await page.waitForTimeout(2000);

    // Get new countdown text
    const newText = await countdownLocator.textContent();
    expect(newText).toMatch(/\d+h \d+m \d+s/);

    // Assert that the countdown has changed
    expect(newText).not.toEqual(initialText);
  });

  test('should switch between open and closed states via WebSocket', async ({ page, request }) => {
    await page.goto('/');

    // Initially, it should be closed
    await expect(page.locator('#closed')).toBeVisible();
    await expect(page.locator('#open')).toBeHidden();

    // --- Force OPEN state ---
    const openResponse = await request.post('/test/set-status', {
      data: { isOpen: true }
    });
    expect(openResponse.ok()).toBeTruthy();

    // Wait for the UI to update
    await expect(page.locator('#open')).toBeVisible();
    await expect(page.locator('#closed')).toBeHidden();
    await expect(page.getByText('temp is open')).toBeVisible();

    // --- Force CLOSED state ---
    const closeResponse = await request.post('/test/set-status', {
      data: { isOpen: false }
    });
    expect(closeResponse.ok()).toBeTruthy();

    // Wait for the UI to update
    await expect(page.locator('#closed')).toBeVisible();
    await expect(page.locator('#open')).toBeHidden();
    await expect(page.getByText('temp is closed')).toBeVisible();
  });

  test('should allow users to send and receive messages when open', async ({ browser, page, request }) => {
    // Set a longer timeout for this test
    test.setTimeout(60000);
    // Create a second browser context to simulate a second user
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();

    // Set up promises to wait for WebSocket connection confirmation via console messages
    const wsConnectedPage1 = new Promise((resolve) => {
      page.on('console', msg => {
        if (msg.text() === 'connected') {
          resolve(null);
        }
      });
    });

    const wsConnectedPage2 = new Promise((resolve) => {
      page2.on('console', msg => {
        if (msg.text() === 'connected') {
          resolve(null);
        }
      });
    });

    // Navigate to the pages
    await page.goto('/');
    await page2.goto('/');

    // Wait for both pages to establish WebSocket connections
    await Promise.all([wsConnectedPage1, wsConnectedPage2]);

    // Force the chatroom to be open for this test
    const response = await request.post('/test/set-status', {
      data: { isOpen: true }
    });
    expect(response.ok()).toBeTruthy();

    // Wait for both pages to update their UI to the open state
    // We'll wait for the #open element to be visible with a reasonable timeout
    await Promise.all([
      expect(page.locator('#open')).toBeVisible({ timeout: 10000 }),
      expect(page2.locator('#open')).toBeVisible({ timeout: 10000 })
    ]);

    // User 1 sends a message
    const messageText = 'Hello from user 1!';
    const inputLocator = page.locator('#input');
    await inputLocator.fill(messageText);
    await inputLocator.press('Enter');

    // Wait for the message to appear on User 2's screen
    await expect(page2.locator('#messages')).toContainText(messageText);

    // Also check that User 1 can see their own message
    await expect(page.locator('#messages')).toContainText(messageText);

    // Clean up: close the second context
    await context2.close();
  });
});