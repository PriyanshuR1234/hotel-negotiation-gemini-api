const health = require('./health');
const negotiate = require('./negotiate');

module.exports = (req, res) => {
  const { pathname } = new URL(req.url, `http://${req.headers.host}`);

  switch (pathname) {
    case '/api/health':
      return health(req, res);
    case '/api/negotiate':
      return negotiate(req, res);
    default:
      res.status(404).json({ error: 'Not found' });
  }
}; 