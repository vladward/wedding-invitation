import { test, expect } from '@playwright/test';

test.describe('Главная страница и приветствие', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Проверка основных заголовков и имен', async ({ page }) => {
    const title = page.locator('.greetings__title');
    await expect(title).toContainText('Владислав');
    await expect(title).toContainText('Мария');
  });

  test('Проверка даты свадьбы в шапке', async ({ page }) => {
    const date = page.locator('.greetings__date');
    await expect(date).toContainText('29 августа 2026');
  });

  test('Проверка наличия главного изображения', async ({ page }) => {
    const mainImg = page.locator('.greetings__image img');
    await expect(mainImg).toBeVisible();
    await expect(mainImg).toHaveAttribute('src', /\.\/assets\/img-header\.png/);
  });
});

test.describe('Интерактивный календарь', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Генерация сетки дней в августе', async ({ page }) => {
    const days = page.locator('#calendar-days .waiting__card-day');
    await expect(days).toHaveCount(36);
  });

  test('Проверка пустых ячеек в начале календаря', async ({ page }) => {
    const firstDay = page.locator('#calendar-days .waiting__card-day').nth(5);
    await expect(firstDay).toHaveText('1');
  });

  test('Подсветка даты свадьбы в календаре', async ({ page }) => {
    const activeDay = page.locator('.waiting__card-day--active');
    await expect(activeDay).toHaveText('29');
    await expect(activeDay).toHaveCSS('background-color', /rgb/);
  });
});

test.describe('Таймер обратного отсчета', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Отображение всех блоков таймера', async ({ page }) => {
    const timerItems = page.locator('.timeout__item');
    await expect(timerItems).toHaveCount(4);
  });

  test('Таймер показывает числа', async ({ page }) => {
    const days = page.locator('#days');
    await expect(days).not.toBeEmpty();
    const val = await days.innerText();
    expect(parseInt(val)).toBeGreaterThanOrEqual(0);
  });

  test('Форматирование чисел с ведущим нулем', async ({ page }) => {
    const seconds = await page.locator('#seconds').innerText();
    if (parseInt(seconds) < 10) {
      expect(seconds.length).toBe(2);
      expect(seconds[0]).toBe('0');
    }
  });
});

test.describe('Глубокое тестирование таймера', () => {

  test('Секунды реально уменьшаются', async ({ page }) => {
    await page.goto('/');
    const secondsElement = page.locator('#seconds');
    const startValue = await secondsElement.innerText();

    await page.waitForTimeout(1200);

    const endValue = await secondsElement.innerText();
    expect(startValue).not.toBe(endValue);
  });

  test('Отображение заглушки, если дата свадьбы уже прошла', async ({ page }) => {
    const pastWeddingDate = new Date(2026, 8, 1).getTime();

    await page.addInitScript((time) => {
      const OriginalDate = Date;
      window.Date = class extends OriginalDate {
        constructor(...args) {
          super();
          if (args.length === 0) return new OriginalDate(time);
          return new OriginalDate(...args);
        }
      };
      Date.now = () => time;
    }, pastWeddingDate);

    await page.goto('/');

    const timeoutWrapper = page.locator('.timeout__wrapper');
    await expect(timeoutWrapper).toContainText('Мы уже женаты! ❤️', { timeout: 5000 });
  });
});

test.describe('Локация и контакты', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Проверка ссылки на Яндекс Карты', async ({ page }) => {
    const mapLink = page.locator('.location .button');
    await expect(mapLink).toHaveAttribute('href', /yandex\.by\/maps/);
    await expect(mapLink).toHaveAttribute('target', '_blank');
    await expect(mapLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  test('Проверка корректности телефонов', async ({ page }) => {
    const vladPhone = page.locator('a[href="tel:+375292329164"]');
    const mashaPhone = page.locator('a[href="tel:+375255309333"]');
    await expect(vladPhone).toBeVisible();
    await expect(mashaPhone).toBeVisible();
  });
});

test.describe('Адаптивность и Анкета', () => {
  test('Перенос формы в десктопный контейнер', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 800 });
    await page.goto('/');
    const desktopContainer = page.locator('#desktop-form-container');
    await expect(desktopContainer.locator('#confirmation-form')).toBeVisible();
  });

  test('Проверка наличия и видимости формы в модальном окне на мобильных', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const openBtn = page.locator('#confirmation-dialog-open');
    await expect(openBtn).toBeVisible();

    await openBtn.click();

    const formInModal = page.locator('#modal-form-container #confirmation-form');
    await expect(formInModal).toBeVisible();

    const input = formInModal.locator('#guest-name');
    await expect(input).toBeVisible();
    await expect(input).toHaveAttribute('placeholder', 'Имя, фамилия');
  });

  test('Открытие и закрытие диалога', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    const dialog = page.locator('#confirmation-dialog');
    await page.click('#confirmation-dialog-open');
    await expect(dialog).toHaveAttribute('open', '');
    await page.click('#confirmation-dialog-close');
    await expect(dialog).not.toHaveAttribute('open', '');
  });
});

test.describe('Валидация и отправка формы', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 800 });
    await page.goto('/');
  });

  test('Блокировка отправки без имени', async ({ page }) => {
    await page.click('button[type="submit"]');
    const isInvalid = await page.evaluate(() => {
      return document.getElementById('guest-name').validity.valueMissing;
    });
    expect(isInvalid).toBe(true);
  });

  test('Сброс формы при закрытии мобильного диалога', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.click('#confirmation-dialog-open');
    await page.fill('#guest-name', 'Тест');
    await page.click('#confirmation-dialog-close');
    await page.click('#confirmation-dialog-open');
    await expect(page.locator('#guest-name')).toHaveValue('');
  });

  test('Состояние кнопки при отправке', async ({ page }) => {
    await page.fill('#guest-name', 'Иван Иванов');
    await page.click('button[type="submit"]');
    const btn = page.locator('#confirmation-form button[type="submit"]');
    await expect(btn).toBeDisabled();
    await expect(btn).toHaveText('Отправляем...');
  });
});

test.describe('Визуальные элементы', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Наличие разделителей в секциях', async ({ page }) => {
    const separators = page.locator('.separation .separator');
    const count = await separators.count();
    expect(count).toBeGreaterThan(3);
  });

  test('Отображение футера с оверлеем', async ({ page }) => {
    const footerOverlay = page.locator('.footer__overlay');
    await expect(footerOverlay).toBeVisible();
    await expect(footerOverlay).toHaveCSS('backdrop-filter', /blur/);
  });
});

test.describe('Дополнительные проверки логики и UX', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Проверка блокировки прокрутки при открытом модальном окне', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    await page.click('#confirmation-dialog-open');
    await expect(async () => {
      const overflow = await page.evaluate(() => document.body.style.overflowY);
      expect(overflow).toBe('hidden');
    }).toPass();

    await page.click('#confirmation-dialog-close');

    await expect(async () => {
      const overflowAfter = await page.evaluate(() => document.body.style.overflowY);
      expect(overflowAfter).toBe('auto');
    }).toPass();
  });

  test('Работа радиокнопок выбора присутствия', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 800 });
    const radioMaybe = page.locator('input[value="maybe"]');
    const radioNo = page.locator('input[value="no"]');

    await radioMaybe.check();
    await expect(radioMaybe).toBeChecked();

    await radioNo.check();
    await expect(radioNo).toBeChecked();
    await expect(radioMaybe).not.toBeChecked();
  });

  test('Множественный выбор в чекбоксах алкоголя', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 800 });
    const champagne = page.locator('input[name="preferences_champagne"]');
    const vodka = page.locator('input[name="preferences_vodka"]');

    await champagne.check();
    await vodka.check();

    await expect(champagne).toBeChecked();
    await expect(vodka).toBeChecked();
  });

  test('Связь меток label с полями ввода через ID', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 800 });
    await page.click('text=Как Вас зовут ?');
    await expect(page.locator('#guest-name')).toBeFocused();
  });

  test('Наличие обязательных атрибутов безопасности у всех изображений', async ({ page }) => {
    const images = await page.locator('img').all();
    for (const img of images) {
      await expect(img).toHaveAttribute('alt');
    }
  });

  test('Проверка доступности интерактивных элементов для клавиатуры', async ({ page }) => {
    await page.keyboard.press('Tab');
    const activeElement = await page.evaluate(() => document.activeElement.tagName);
    expect(activeElement).not.toBe('BODY');
  });

  test('Проверка семантики важных текстовых блоков', async ({ page }) => {
    const strongText = page.locator('.wishlist__description strong');
    await expect(strongText).toHaveText('семейной винотеки');
  });

  test('Целостность структуры календаря после рендера', async ({ page }) => {
    const grid = page.locator('#calendar-days');
    await expect(grid).toHaveCSS('display', 'grid');
  });

  test('Отсутствие горизонтальной прокрутки на мобильном устройстве', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBe(clientWidth);
  });

  test('Проверка формата времени в секции локации', async ({ page }) => {
    const timeElement = page.locator('.location__time');
    await expect(timeElement).toHaveAttribute('datetime', '16:00');
  });

  test('Проверка работы плейсхолдеров в текстовых полях', async ({ page }) => {
    const input = page.locator('#guest-name');
    await expect(input).toHaveAttribute('placeholder', 'Имя, фамилия');
  });
});

test.describe('Критические сценарии и бизнес-логика', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Стресс-тест ресайза: сохранение данных формы при перемещении в DOM', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 800 });
    const testName = 'Иван Иванов-Тестовый';
    await page.fill('#guest-name', testName);

    await page.setViewportSize({ width: 375, height: 667 });

    const inputInModal = page.locator('#modal-form-container #guest-name');
    await expect(inputInModal).toHaveValue(testName);
  });

  test('Проверка утечки событий: открытие диалога после многократного ресайза', async ({ page }) => {
    for (let i = 0; i < 5; i++) {
      await page.setViewportSize({ width: 1024, height: 800 });
      await page.setViewportSize({ width: 375, height: 667 });
    }

    await page.click('#confirmation-dialog-open');
    await expect(page.locator('#confirmation-dialog')).toBeVisible();
  });

  test('Интеграция с API: проверка структуры сетевого запроса к Google Script', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 800 });
    await page.goto('/');

    const input = page.locator('#desktop-form-container #guest-name');
    await expect(input).toBeVisible();

    await input.fill('Валидация Запроса');

    const [request] = await Promise.all([
      page.waitForRequest(req => req.url().includes('script.google.com') && req.method() === 'POST'),
      page.click('#desktop-form-container button[type="submit"]')
    ]);

    const postData = request.postData();

    expect(postData).toContain('"guest_name":"Валидация Запроса"');
    expect(postData).toContain('"preferences":{');
  });

  test('Логика таймера: корректность расчета дней до 29 августа', async ({ page }) => {
    const daysValue = await page.locator('#days').innerText();
    const daysInt = parseInt(daysValue);

    const now = new Date();
    const wedding = new Date(2026, 7, 29, 16, 0, 0);
    const expectedDays = Math.floor((wedding - now) / (1000 * 60 * 60 * 24));

    expect(Math.abs(daysInt - expectedDays)).toBeLessThanOrEqual(1);
  });

  test('Проверка доступности: управление фокусом в модальном окне', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.click('#confirmation-dialog-open');

    const isDialogOpen = await page.evaluate(() => {
      const dialog = document.getElementById('confirmation-dialog');
      return dialog.contains(document.activeElement) || document.activeElement === dialog;
    });
    expect(isDialogOpen).toBe(true);
  });

  test('Валидация CSS: работа backdrop-filter в футере', async ({ page }) => {
    const overlay = page.locator('.footer__overlay');
    const blurEffect = await overlay.evaluate((el) => {
      return window.getComputedStyle(el).getPropertyValue('backdrop-filter') ||
          window.getComputedStyle(el).getPropertyValue('-webkit-backdrop-filter');
    });
    expect(blurEffect).toContain('blur');
  });

  test('Стабильность календаря: проверка отсутствия лишних дней', async ({ page }) => {
    await page.goto('/');
    const grid = page.locator('#calendar-days');
    const allSpans = grid.locator('span');

    await expect(allSpans).toHaveCount(36);
  });

  test('UX: сброс состояния body после закрытия диалога через ESC', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    await page.click('#confirmation-dialog-open');

    await expect(async () => {
      const overflow = await page.evaluate(() => document.body.style.overflowY);
      expect(overflow).toBe('hidden');
    }).toPass();

    await page.keyboard.press('Escape');

    await expect(async () => {
      const overflowAfter = await page.evaluate(() => document.body.style.overflowY);
      expect(overflowAfter).toBe('auto');
    }).toPass({ timeout: 3000 });
  });
});
