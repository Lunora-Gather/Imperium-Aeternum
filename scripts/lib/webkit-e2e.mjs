import { webkit } from 'playwright-core';

export async function launchWebKit() {
  const browser = await webkit.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const runtimeErrors = [];
    page.on('pageerror', error => runtimeErrors.push(error.message));
    return {
      navigate: url => page.goto(url),
      evaluate: expression => page.evaluate(expression),
      setMobileViewport: (width = 390) => page.setViewportSize({ width, height: 844 }),
      close: () => browser.close(),
      runtimeErrors,
    };
  } catch (error) {
    await browser.close();
    throw error;
  }
}
