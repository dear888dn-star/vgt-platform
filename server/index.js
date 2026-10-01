require('./env');
const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const { router: authRouter, loadUser } = require('./auth');
const { AI_ENABLED, MODEL } = require('./ai');

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());
app.use(loadUser);

app.use('/api/auth', authRouter);
app.use('/api/topics', require('./routes/topics'));
app.use('/api/selfstudy', require('./routes/selfstudy'));
app.use('/api/surveys', require('./routes/surveys'));
app.use('/api/trainer', require('./routes/trainer'));
app.use('/api/admin', require('./routes/admin'));
app.get('/api/health', (_req, res) => res.json({ ok: true, ai: AI_ENABLED }));
app.use('/api', (_req, res) => res.status(404).json({ error: 'Topilmadi' }));

app.use(express.static(path.join(__dirname, '..', 'public'), { extensions: ['html'] }));
app.get(/.*/, (_req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'index.html')));

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Server xatosi' });
});

if (require.main === module) {
  const port = Number(process.env.PORT) || 3000;
  app.listen(port, () => {
    console.log(`VGT platformasi: http://localhost:${port}`);
    console.log(AI_ENABLED ? `Sun'iy intellekt: yoqilgan (${MODEL})` : 'Sun\'iy intellekt: oflayn rejim (ANTHROPIC_API_KEY topilmadi)');
  });
}

module.exports = app;
