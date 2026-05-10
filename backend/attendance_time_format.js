/**
 * Canonical 12-hour slot label ("9:00 AM - 11:00 AM") for attendance + notifications.
 * Accepts legacy 24-hour "HH:MM" or "HH:MM:SS" from DB; passes through strings that already contain a 12-hour range.
 */
function attendanceSlotDisplay(storedTime, numClasses) {
    const nRaw = Number(numClasses);
    const hours =
        Number.isFinite(nRaw) && nRaw > 0 ? nRaw : 1;

    const s =
        storedTime === null || storedTime === undefined
            ? ''
            : String(storedTime).trim();
    if (!s) return '';

    if (/\b(AM|PM)\s*-\s*.+\b(AM|PM)/i.test(s)) {
        return s;
    }

    const clock = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (!clock) {
        return s;
    }

    const h = parseInt(clock[1], 10);
    const min = parseInt(clock[2], 10);

    const start = new Date();
    start.setHours(h, min, 0, 0);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + hours * 60);

    const fmt = (d) => {
        let hr = d.getHours();
        const mn = String(d.getMinutes()).padStart(2, '0');
        const ampm = hr >= 12 ? 'PM' : 'AM';
        hr = hr % 12;
        hr = hr || 12;
        return `${hr}:${mn} ${ampm}`;
    };

    return `${fmt(start)} - ${fmt(end)}`;
}

module.exports = { attendanceSlotDisplay };
