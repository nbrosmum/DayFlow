const { test, expect } = require('@playwright/test');

test('preview supports task creation, editing, completion, search, and deletion', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => { errors.push(error.message); console.error(error.message); });
  page.on('console', entry => { if (entry.type() === 'error') console.error(entry.text()); });
  await page.goto('/');
  await expect(page.getByText('Preview · changes reset on restart')).toBeVisible();
  await page.getByLabel('Add a task').click();
  await page.getByLabel('Task title', { exact: true }).fill('Plan native app');
  await page.getByLabel('Notes (optional)').fill('A focused first version');
  await page.getByRole('button', { name: 'Save to preview', exact: true }).click();
  await expect(page.getByText('Plan native app', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Edit Plan native app', exact: true }).click();
  await page.getByLabel('Task title', { exact: true }).fill('Build native app');
  await page.getByRole('button', { name: 'Save to preview', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Complete Build native app', exact: true }).click();
  await page.getByText('Tasks', { exact: true }).click();
  await page.getByRole('button', { name: 'Completed', exact: true }).click();
  await page.getByLabel('Find a task').fill('NATIVE');
  await expect(page.getByRole('button', { name: 'Edit Build native app', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Edit Build native app', exact: true }).click();
  page.once('dialog', dialog => dialog.accept());
  await page.getByText('Delete task', { exact: true }).click();
  await expect(page.getByText('Nothing found', { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('focus timer pauses, recovers after reload, and saves a finished session', async ({ page }) => {
  await page.goto('/focus');
  await page.getByRole('button', { name: '15 min', exact: true }).click();
  await expect(page.getByRole('timer')).toHaveText('15:00');
  await page.getByRole('button', { name: 'Begin focus', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Pause for a moment', exact: true })).toBeVisible();
  await expect(page.getByRole('timer')).toHaveText(/^(15:00|14:\d{2})$/);
  await page.getByRole('button', { name: 'Pause for a moment', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Continue focus', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Continue focus', exact: true })).toBeVisible();
  await expect(page.getByRole('timer')).toHaveText(/^(15:00|14:\d{2})$/);
  await page.getByRole('button', { name: 'Continue focus', exact: true }).click();
  await page.getByText('Finish early', { exact: true }).click();
  await page.getByRole('button', { name: 'Save session', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Begin focus', exact: true })).toBeVisible();
  await expect(page.getByText('A little focused time', { exact: true })).toBeVisible();
  await page.screenshot({ path: 'test-results/focus.png', fullPage: true });
});

test('phone-sized layout has no horizontal overflow and exposes all four tabs', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Your timeline', { exact: true })).toBeVisible();
  for (const label of ['Today', 'Tasks', 'Focus', 'Settings']) await expect(page.getByText(label, { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/today.png', fullPage: true });
});
