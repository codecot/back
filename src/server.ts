import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import filesRouter from './files';

const app = new Koa();

app.use(bodyParser());

app.use(filesRouter.routes());

app.listen(3000);

console.log('Server running on port 3000');
