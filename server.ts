// server.ts (POLLING MODEL - NO SOCKET.IO)
import dotenv from 'dotenv';
import path from 'path';
const envPath = process.env.NODE_ENV === 'development' ? path.resolve(process.cwd(), '.env.local') : path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });
import { createServer, IncomingMessage, ServerResponse } from 'http';
import { parse } from 'url';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const appPort = parseInt( (process.env.NEXT_PUBLIC_APP_URL && new URL(process.env.NEXT_PUBLIC_APP_URL).port) || process.env.PORT || '3000', 10 );
const nextApp = next({ dev, hostname, port: appPort });
const handle = nextApp.getRequestHandler();

console.log(`[SERVER] Next.js app configured for internal port: ${appPort}`);
nextApp.prepare().then(() => {
  const httpServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    try { const parsedUrl = parse(req.url!, true); await handle(req, res, parsedUrl); }
    catch (err) { console.error('[SERVER] HTTP Error:', err); res.statusCode = 500; res.end('Internal Error'); }
  });
  httpServer.on('error', (err: NodeJS.ErrnoException) => { console.error(`[SERVER] HTTP Listen Error:`, err); process.exit(1); });
  httpServer.listen(appPort, () => { console.log(`[SERVER]> Buzzly Next.js App (Polling) ready on http://${hostname}:${appPort}`); });
}).catch(err => { console.error("[SERVER] Next.js prep error:", err); process.exit(1); });