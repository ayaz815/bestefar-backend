// Public show lists (read by the bestefar.no catalog without a login). Once
// ACCESS_ENFORCE=true they carry only what the catalog shows, never questions,
// answers or file links. The logged-in generator still gets full lists.
const { isAdminRequest } = require("./adminSession");

const CATALOG_FIELDS = [
  "id", "quizName", "quizType", "quizInfo", "isPublic", "accessTier",
  "numberOfScreens", "musicType", "createdAt", "updatedAt",
];

const toCatalogEntry = (show) => {
  const forms = show.quizForms || show.screens || [];
  const entry = {
    ...show,
    numberOfScreens: show.numberOfScreens ?? forms.length,
    musicType: (forms[0] && forms[0].firmNaming) || "", // AudioQuiz "Music Type" in the catalog
  };
  return Object.fromEntries(CATALOG_FIELDS.filter((f) => entry[f] !== undefined).map((f) => [f, entry[f]]));
};

// Full lists for the logged-in generator (its archive edits from them).
const forPublicList = (shows, req) =>
  process.env.ACCESS_ENFORCE === "true" && !isAdminRequest(req) ? shows.map(toCatalogEntry) : shows;

module.exports = { forPublicList, toCatalogEntry, CATALOG_FIELDS };
