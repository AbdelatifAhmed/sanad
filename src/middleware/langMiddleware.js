const langMiddleware = (req, res, next) => {
  let lang = req.headers["accept-language"] || req.query.lang || (req.body && req.body.lang) || "en";
  
  // Normalize language key
  lang = lang.toLowerCase().trim();
  if (lang.startsWith("ar")) {
    req.lang = "ar";
  } else {
    req.lang = "en"; // Default to English
  }
  
  next();
};

module.exports = langMiddleware;
