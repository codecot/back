import Router from '@koa/router';
import filesRouter from './files';
import helloRouter from './hello';

const apiRouter = new Router({ prefix: '/api/v1' });
apiRouter.use('/files', filesRouter.routes());
apiRouter.use('/home', helloRouter.routes());

export default apiRouter;
