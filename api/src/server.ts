import path from 'node:path';

import { createApp } from './app';
import { createDb } from './db';

const PORT = Number(process.env.PORT ?? 3000);
const DB_FILE = process.env.DB_FILE ?? path.join(__dirname, '..', 'data', 'nicy.db');

const db = createDb(DB_FILE);
const app = createApp(db);

app.listen(PORT, () => {
  console.log(`Nicy Kitchen API escuchando en http://localhost:${PORT}`);
});
