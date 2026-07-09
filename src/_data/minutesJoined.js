// Joins the machine-owned Drive listing (minutes_files.json, written by
// scripts/sync-drive.js) to the human-owned synopses (minutes.json, edited in
// the CMS) by Drive file id. Newest file first.
const fs = require("fs");
const path = require("path");

function load(name) {
  const file = path.join(__dirname, name);
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

module.exports = function () {
  const files = load("minutes_files.json");
  const human = load("minutes.json");
  const byId = new Map(human.map((m) => [m.id, m]));

  return files
    .map((f) => {
      const meta = byId.get(f.id) || {};
      return {
        ...f,
        month: meta.month || f.title,
        synopsis: meta.synopsis || "",
      };
    })
    .sort((a, b) => String(b.modified || "").localeCompare(String(a.modified || "")));
};
