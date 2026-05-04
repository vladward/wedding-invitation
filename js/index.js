document.addEventListener('DOMContentLoaded', () => {
    const WEDDING_DATE = new Date(2026, 7, 29, 16, 0, 0).getTime();
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzIcWLviPALDBInYQ5IMk9KjuerHgUNlC3OD7LrQEX-SKD3NG4_1sC8Fpoj-krlBz6bkg/exec';

    const dialog = document.getElementById('confirmation-dialog');
    const openButton = document.getElementById('confirmation-dialog-open');
    const closeButton = document.getElementById('confirmation-dialog-close');
    const body = document.body;
    const form = document.getElementById('confirmation-form');
    const desktopContainer = document.getElementById('desktop-form-container');
    const mobileContainer = document.getElementById('modal-form-container');

    const daysElement = document.getElementById('days');
    const hoursElement = document.getElementById('hours');
    const minutesElement = document.getElementById('minutes');
    const secondsElement = document.getElementById('seconds');
    const timeoutWrapper = document.querySelector('.timeout__wrapper');

    function renderCalendar(year, month, weddingDay) {
        const grid = document.getElementById('calendar-days');
        if (!grid) return;

        const firstDayIndex = new Date(year, month - 1, 1).getDay();
        const shift = (firstDayIndex === 0) ? 6 : firstDayIndex - 1;
        const daysInMonth = new Date(year, month, 0).getDate();

        grid.innerHTML = '';
        for (let i = 0; i < shift; i++) {
            const span = document.createElement('span');
            span.className = 'waiting__card-day';
            grid.appendChild(span);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const span = document.createElement('span');
            span.className = 'waiting__card-day';
            span.textContent = day;
            if (day === weddingDay) span.classList.add('waiting__card-day--active');
            grid.appendChild(span);
        }
    }

    function updateCountdown() {
        const now = new Date().getTime();
        const distance = WEDDING_DATE - now;

        if (distance < 0) {
            if (timeoutWrapper) timeoutWrapper.innerHTML = "Мы уже женаты! ❤️";
            return;
        }

        const d = Math.floor(distance / (1000 * 60 * 60 * 24));
        const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((distance % (1000 * 60)) / 1000);

        if (daysElement && daysElement.parentElement) {
            d > 99 ? daysElement.parentElement.classList.add('extra-margin') : daysElement.parentElement.classList.remove('extra-margin');
        }

        if (daysElement) daysElement.textContent = d;
        if (hoursElement) hoursElement.textContent = h.toString().padStart(2, '0');
        if (minutesElement) minutesElement.textContent = m.toString().padStart(2, '0');
        if (secondsElement) secondsElement.textContent = s.toString().padStart(2, '0');
    }

    function handleResponsiveForm() {
        if (!form || !desktopContainer || !mobileContainer) return;
        const target = window.innerWidth >= 560 ? desktopContainer : mobileContainer;
        if (!target.contains(form)) target.appendChild(form);
    }

    if (form) {
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const btn = form.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.innerText = 'Отправляем...';

            const formData = new FormData(event.target);
            const data = {
                preferences: {},
                guest_name: formData.get('guest_name'),
                will_come: formData.get('will_come'),
                with_guest: formData.get('with_guest')
            };

            formData.forEach((value, key) => {
                if (key.startsWith('preferences_')) {
                    data.preferences[key.replace('preferences_', '')] = true;
                }
            });

            try {
                await fetch(SCRIPT_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    body: JSON.stringify(data)
                });
                alert('Спасибо! Ваша анкета успешно отправлена.');
                dialog.close();
                form.reset();
            } catch (error) {
                alert('Ошибка отправки. Попробуйте еще раз.');
            } finally {
                btn.disabled = false;
                btn.innerText = 'Отправить';
            }
        });
    }

    window.addEventListener('resize', handleResponsiveForm);
    handleResponsiveForm();

    openButton?.addEventListener('click', () => {
        dialog.showModal();
        body.style.overflowY = 'hidden';
    });

    closeButton?.addEventListener('click', () => dialog.close());

    dialog?.addEventListener('close', () => {
        body.style.overflowY = 'auto';
        if (window.innerWidth < 560) form.reset();
    });

    renderCalendar(2026, 8, 29);
    setInterval(updateCountdown, 1000);
    updateCountdown();
});
