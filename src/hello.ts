import Router from '@koa/router';

const router: Router = new Router();

router.get('/', async (ctx, next) => {
  ctx.body = 'hello world';
});

export default router;
