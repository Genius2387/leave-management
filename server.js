const jsonServer = require('json-server');
const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();

const PORT = 3001;

server.use(middlewares);
server.use(jsonServer.bodyParser);

// Custom route: server time (used for date validation)
server.get('/server-time', (req, res) => {
  res.json({ time: new Date().toISOString() });
});

// Add CORS headers for development
server.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

server.use(router);

server.listen(PORT, () => {
  console.log(`JSON Server running at http://localhost:${PORT}`);
  console.log(`Available endpoints:`);
  console.log(`  GET    /employees`);
  console.log(`  GET    /employees/:id`);
  console.log(`  PATCH  /employees/:id`);
  console.log(`  GET    /leaves`);
  console.log(`  POST   /leaves`);
  console.log(`  PATCH  /leaves/:id`);
  console.log(`  GET    /server-time`);
});
