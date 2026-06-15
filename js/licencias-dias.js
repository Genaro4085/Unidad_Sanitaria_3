/* Cálculo de días de licencia: solo días hábiles (lun–vie), sin feriados nacionales AR. */
const LicenciasDias = (() => {
  const FERIADOS_FIJOS = ['01-01', '03-24', '04-02', '05-01', '05-25', '06-20', '07-09', '12-08', '12-25'];

  function parseIso(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  function toIso(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function addDays(date, days) {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    d.setDate(d.getDate() + days);
    return d;
  }

  function easterSunday(year) {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month, day);
  }

  function nthWeekdayOfMonth(year, monthIndex, weekday, n) {
    let count = 0;
    const d = new Date(year, monthIndex, 1);
    while (d.getMonth() === monthIndex) {
      if (d.getDay() === weekday) {
        count += 1;
        if (count === n) return toIso(d);
      }
      d.setDate(d.getDate() + 1);
    }
    return null;
  }

  function feriadosNacionales(year) {
    const set = new Set(FERIADOS_FIJOS.map(mmdd => `${year}-${mmdd}`));
    const easter = easterSunday(year);

    set.add(toIso(addDays(easter, -48))); // Lunes de Carnaval
    set.add(toIso(addDays(easter, -47))); // Martes de Carnaval
    set.add(toIso(addDays(easter, -2)));  // Viernes Santo

    const sanMartin = nthWeekdayOfMonth(year, 7, 1, 3);
    const diversidad = nthWeekdayOfMonth(year, 9, 1, 2);
    const soberania = nthWeekdayOfMonth(year, 10, 1, 3);
    if (sanMartin) set.add(sanMartin);
    if (diversidad) set.add(diversidad);
    if (soberania) set.add(soberania);

    return set;
  }

  const cache = new Map();

  function getFeriados(year) {
    if (!cache.has(year)) cache.set(year, feriadosNacionales(year));
    return cache.get(year);
  }

  function isFinDeSemana(date) {
    const dow = date.getDay();
    return dow === 0 || dow === 6;
  }

  function isFeriado(date) {
    return getFeriados(date.getFullYear()).has(toIso(date));
  }

  function isDiaLicencia(date) {
    return !isFinDeSemana(date) && !isFeriado(date);
  }

  /** Cuenta días hábiles entre dos fechas inclusive (YYYY-MM-DD). */
  function contarDiasLicencia(desde, hasta) {
    if (!desde || !hasta) return 0;
    const start = parseIso(desde);
    const end = parseIso(hasta);
    if (end < start) return 0;

    let count = 0;
    const cur = new Date(start);
    while (cur <= end) {
      if (isDiaLicencia(cur)) count += 1;
      cur.setDate(cur.getDate() + 1);
    }
    return count;
  }

  function diasCalendario(desde, hasta) {
    if (!desde || !hasta) return 0;
    const start = parseIso(desde);
    const end = parseIso(hasta);
    if (end < start) return 0;
    return Math.round((end - start) / 86400000) + 1;
  }

  return { contarDiasLicencia, diasCalendario, isDiaLicencia, isFeriado, isFinDeSemana };
})();
