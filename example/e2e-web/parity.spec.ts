/** Web parity flow (mirrors e2e/parity.yaml) plus the mouse-wheel behaviour check. */
import { expect, test } from '@playwright/test';

test('parity flow (mirrors e2e/parity.yaml)', async ({ page }) => {
  await page.goto('/');
  const id = (testId: string) => page.getByTestId(testId);

  await expect(page.getByText('September').first()).toBeVisible();
  await page.screenshot({ path: 'screenshots/parity-01-initial.png' });

  await id('calendar-next').click();
  await expect(page.getByText('October').first()).toBeVisible();
  await id('calendar-day-2026-10-14').click();
  await page.screenshot({ path: 'screenshots/parity-02-calendar-selected.png' });

  await id('calendar-month-label').click();
  await page.screenshot({ path: 'screenshots/parity-03-month-jumper.png' });
  await id('calendar-jumper-month-2').click();
  await expect(page.getByText('March').first()).toBeVisible();

  await id('date-picker-trigger').scrollIntoViewIfNeeded();
  await id('date-picker-trigger').click();
  await expect(id('date-picker-sheet')).toBeVisible();
  await page.screenshot({ path: 'screenshots/parity-04-sheet.png' });
  await id('date-picker-backdrop').click({ position: { x: 20, y: 20 } });

  await id('toggle-theme').click();
  await page.screenshot({ path: 'screenshots/parity-05-dark.png' });
});

test('mouse wheel steps the time wheel', async ({ page }) => {
  await page.goto('/');
  const hours = page.getByTestId('wheel-hours');
  await hours.scrollIntoViewIfNeeded();
  // Non-vacuous: the attribute must exist and be non-empty before and change after.
  await expect(hours).toHaveAttribute('aria-valuetext', /.+/);
  const before = await hours.getAttribute('aria-valuetext');
  expect(before).toBeTruthy();
  await hours.hover();
  await page.mouse.wheel(0, 40);
  await expect(hours).not.toHaveAttribute('aria-valuetext', before as string);
  await expect(hours).toHaveAttribute('aria-valuetext', /.+/);
});
