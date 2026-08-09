import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, type Plugin} from 'vite';

/**
 * Espelha em dev os rewrites de /pro, /admin, /site do vercel.json — sem
 * isso, `vite dev` cai no fallback padrão (index.html raiz) para qualquer
 * path que não seja um arquivo real, ex. /site/termos ou /pro sem barra
 * final. Não afeta produção: o vercel.json continua sendo quem manda lá.
 */
function devRewrites(): Plugin {
  const rewrites: [RegExp, string][] = [
    [/^\/site(\/.*)?$/, '/site/index.html'],
    [/^\/pro(\/.*)?$/, '/pro/index.html'],
    [/^\/admin(\/.*)?$/, '/admin/index.html'],
  ];
  return {
    name: 'eventpro-dev-rewrites',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const url = req.url?.split('?')[0];
        if (!url || url.includes('.')) return next(); // deixa assets (js/css/img) passarem direto
        const hit = rewrites.find(([pattern]) => pattern.test(url));
        if (hit) req.url = hit[1];
        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), devRewrites()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        input: {
          main:  path.resolve(__dirname, 'index.html'),
          site:  path.resolve(__dirname, 'site/index.html'),
          pro:   path.resolve(__dirname, 'pro/index.html'),
          admin: path.resolve(__dirname, 'admin/index.html'),
        },
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
