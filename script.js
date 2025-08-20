(function () {
	'use strict';

	/**
	 * Weekend countdown logic
	 * - Countdown naar vrijdag 17:00 (locale tijd)
	 * - In weekend (vrij 17:00 → ma 08:00): toon "WEEKEND 🎉"
	 * - Robuust over weekgrenzen en rond middernacht
	 */

	/** @type {HTMLElement} */
	const elDays = document.getElementById('js-days');
	/** @type {HTMLElement} */
	const elHours = document.getElementById('js-hours');
	/** @type {HTMLElement} */
	const elMinutes = document.getElementById('js-minutes');
	/** @type {HTMLElement} */
	const elSeconds = document.getElementById('js-seconds');
	/** @type {HTMLElement} */
	const elGrid = document.getElementById('js-grid');
	/** @type {HTMLElement} */
	const elWeekend = document.getElementById('js-weekend');
	/** @type {HTMLElement} */
	const elNote = document.getElementById('js-note');

	function pad2(value) {
		return String(value).padStart(2, '0');
	}

	function isWeekendNow(now) {
		// Weekend definitie: vrijdag 17:00 t/m maandag 08:00
		const day = now.getDay(); // 0=Zo..6=Za
		const hours = now.getHours();
		const mins = now.getMinutes();
		const totalMinutes = hours * 60 + mins;

		// Vrijdag na 17:00
		if (day === 5 && totalMinutes >= 17 * 60) return true;
		// Zaterdag (hele dag) en Zondag (hele dag)
		if (day === 6 || day === 0) return true;
		// Maandag voor 08:00
		if (day === 1 && totalMinutes < 8 * 60) return true;
		return false;
	}

	function getNextFridayAt1700(now) {
		const result = new Date(now);
		const currentDay = result.getDay(); // 0=Zo..5=Vr..6=Za

		let daysUntilFriday = (5 - currentDay + 7) % 7;
		result.setDate(result.getDate() + daysUntilFriday);
		result.setHours(17, 0, 0, 0);

		// Als het al voorbij 17:00 is op vrijdag, pak volgende week
		if (currentDay === 5 && now.getTime() >= result.getTime()) {
			result.setDate(result.getDate() + 7);
		}
		return result;
	}

	function getNextMondayAt0800(now) {
		const result = new Date(now);
		const currentDay = result.getDay();
		let daysUntilMonday = (1 - currentDay + 7) % 7;
		result.setDate(result.getDate() + daysUntilMonday);
		result.setHours(8, 0, 0, 0);

		// Als het al voorbij maandag 08:00 vandaag, pak volgende week
		if (currentDay === 1 && now.getTime() >= result.getTime()) {
			result.setDate(result.getDate() + 7);
		}
		return result;
	}

	function diffToParts(target, now) {
		const totalMs = Math.max(0, target.getTime() - now.getTime());
		const totalSeconds = Math.floor(totalMs / 1000);
		const seconds = totalSeconds % 60;
		const totalMinutes = Math.floor(totalSeconds / 60);
		const minutes = totalMinutes % 60;
		const totalHours = Math.floor(totalMinutes / 60);
		const hours = totalHours % 24;
		const days = Math.floor(totalHours / 24);
		return { days, hours, minutes, seconds, totalMs };
	}

	function setHidden(el, hidden) {
		if (!el) return;
		el.hidden = hidden;
		el.setAttribute('aria-hidden', hidden ? 'true' : 'false');
	}

	function update() {
		const now = new Date();
		const weekend = isWeekendNow(now);

		if (weekend) {
			const nextMonday = getNextMondayAt0800(now);
			// Alleen WEEKEND tonen in het weekend
			setHidden(elGrid, true);
			setHidden(elWeekend, false);
			if (elNote) setHidden(elNote, true);
			// Veiligheidsnet: ververs net na 08:00
			const { totalMs } = diffToParts(nextMonday, now);
			return totalMs;
		} else {
			const nextFriday = getNextFridayAt1700(now);
			const parts = diffToParts(nextFriday, now);

			setHidden(elWeekend, true);
			setHidden(elGrid, false);
			if (elNote) setHidden(elNote, false);

			if (elDays) elDays.textContent = String(parts.days);
			if (elHours) elHours.textContent = pad2(parts.hours);
			if (elMinutes) elMinutes.textContent = pad2(parts.minutes);
			if (elSeconds) elSeconds.textContent = pad2(parts.seconds);

			return parts.totalMs;
		}
	}

	// Ticker: update elke seconde, maar plan een nauwkeurige timeout tot de volgende seconde
	let rafId = 0;
	let timeoutId = 0;

	function scheduleNextTick() {
		const now = new Date();
		const msToNextSecond = 1000 - (now.getMilliseconds());
		clearTimeout(timeoutId);
		timeoutId = setTimeout(loop, Math.max(200, msToNextSecond));
	}

	function loop() {
		const msRemaining = update();
		// Als het nog ver weg is, blijf toch elke seconde updaten voor secondenweergave
		scheduleNextTick();
	}

	function onVisibilityChange() {
		if (document.visibilityState === 'visible') {
			update();
		}
	}

	// Init
	document.addEventListener('visibilitychange', onVisibilityChange);
	update();
	scheduleNextTick();
})();


