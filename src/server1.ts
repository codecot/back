import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import json from 'koa-json';
import logger from 'koa-logger';
import mount from 'koa-mount';
import serve from 'koa-static';
import cors from '@koa/cors';

import router from './router';

const app = new Koa();

// Middlewares
app.use(cors());
app.use(logger());
app.use(bodyParser());
app.use(json());
app.use(mount('/public', serve(process.cwd() + '/public')));

// Routers
app.use(router.routes()).use(router.allowedMethods());

const PORT: number = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const init = () => null;

export default init;
