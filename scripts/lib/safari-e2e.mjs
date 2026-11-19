import { Builder } from 'selenium-webdriver';
import safari from 'selenium-webdriver/safari.js';

export async function launchSafari() {
  if (process.platform !== 'darwin') throw new Error('Native Safari tests require macOS.');
  const service = new safari.ServiceBuilder('/usr/bin/safaridriver').build();
  let driver;
  async function close() {
    try { await driver?.quit(); }
    finally { await service.kill(); }
  }
  try {
    driver = await new Builder().disableEnvironmentOverrides()
      .usingServer(await service.start()).forBrowser('safari').build();
    return {
      navigate: url => driver.get(url),
      evaluate: expression => driver.executeScript(`return (${expression});`),
      async setMobileViewport() {
        const [width, height] = await driver.executeScript('return [outerWidth - innerWidth, outerHeight - innerHeight]');
        await driver.manage().window().setRect({ x: 0, y: 0, width: 390 + width, height: 844 + height });
      },
      close,
    };
  } catch (error) {
    await close();
    throw error;
  }
}
