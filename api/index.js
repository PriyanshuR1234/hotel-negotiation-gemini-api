const health = require('./health');
const negotiate = require('./negotiate');
const clearHistory = require('./clear-history');

module.exports = (req, res) => {
  const { pathname } = new URL(req.url, `http://${req.headers.host}`);

  switch (pathname) {
    case '/api/health':
      return health(req, res);
    case '/api/negotiate':
      return negotiate(req, res);
    case '/api/clear-history':
      return clearHistory(req, res);
    default:
      res.status(404).json({ error: 'Not found' });
  }
}; 