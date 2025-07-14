module.exports = (req, res, next) => {
  // Dummy auth middleware: always allow
  next();
};
