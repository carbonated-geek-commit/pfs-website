// Computes meeting statuses (past / next / upcoming) at build time from
// meetings.json. Statuses shift automatically each time the site rebuilds —
// the deploy workflow also runs on a weekly cron so this stays fresh.
const meetings = require("./meetings.json");

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Current date in the club's timezone, as YYYY-MM-DD
function todayPacific() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

module.exports = function () {
  const today = todayPacific();
  const sorted = [...meetings].sort((a, b) => a.date.localeCompare(b.date));
  const nextDate = sorted.map((m) => m.date).find((d) => d >= today);

  const items = sorted.map((m) => {
    const [y, mo, d] = m.date.split("-").map(Number);
    const dt = new Date(y, mo - 1, d);
    let status = "upcoming";
    if (m.date < today) status = "past";
    else if (m.date === nextDate) status = "next";
    return {
      ...m,
      status,
      tag: status === "past" ? "Past" : status === "next" ? "Next meeting" : "Upcoming",
      shortDate: `${MONTHS_SHORT[mo - 1]} ${d}`,
      longDate: `${WEEKDAYS[dt.getDay()]}, ${MONTHS_LONG[mo - 1]} ${d}`,
      year: y,
      icsStart: `${m.date.replace(/-/g, "")}T183000`,
      icsEnd: `${m.date.replace(/-/g, "")}T203000`,
    };
  });

  return {
    items,
    next: items.find((m) => m.status === "next") || null,
    year: items.length ? items[items.length - 1].year : new Date().getFullYear(),
  };
};
