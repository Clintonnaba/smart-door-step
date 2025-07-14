module.exports = (role) => (req, res, next) => {
  // Dummy role middleware: always allow
  next();
};
