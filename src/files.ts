import Router from '@koa/router';
import fs from 'fs-extra';
import { cwd } from 'node:process';
import { PassThrough } from 'stream';

const router: Router = new Router();

const workingDirectory: string = cwd();

export const enum FILETYPE {
  FILE = 'file',
  DIRECTORY = 'directory',
  SYMLINK = 'symlink',
  OTHER = 'other',
}
∏
async function detectType(path: string): Promise<FILETYPE> {
  const stat = await fs.lstat(path);
  if (stat.isFile()) {
    return FILETYPE.FILE;
  }
  if (stat.isDirectory()) {
    return FILETYPE.DIRECTORY;
  }
  if (stat.isSymbolicLink()) {
    return FILETYPE.SYMLINK;
  }
  return FILETYPE.OTHER;
}

async function* walkDir(dir: string): AsyncGenerator<string> {
  const files = await fs.readdir(dir);
  for (const file of files) {
    const path = `${dir}/${file}`;
    const stat = await fs.lstat(path);
    if (stat.isDirectory()) {
      yield* walkDir(path);
    } else {
      yield path;
    }
  }
}

router.get('/', async (ctx) => {
  ctx.type = 'text/html';
  ctx.body = fs.createReadStream(`${workingDirectory}/index.html`);
});

router.get('/:filePath', async (ctx, next) => {
  ctx.type = 'text/html';
  ctx.body = fs.createReadStream(`${workingDirectory}/${ctx.params.filePath}`);
});

// router.get('/:filePath', async (ctx, next) => {
//   const fileName = `${workingDirectory}/${ctx.params.filePath}`;
//   if (fs.isDir(fileName)) {
//     ctx.body = await fs.readFile(`${workingDirectory}/${ctx.params.filePath}`);
//     await next();
//   }
// )
//   ;

function* streamFileGenerator(filePath: string) {
  const stream = fs.createReadStream(filePath);
  const passThrough = new PassThrough();
  stream.pipe(passThrough);
  yield passThrough;
}

router.get('/a/:filePath', async (ctx, next) => {
  const filePath = `${workingDirectory}/${ctx.params.filePath}`;
  const fileGenerator = streamFileGenerator(filePath);

  ctx.response.set(
    'Content-Disposition',
    `attachment; filename=${ctx.params.filePath}`
  );
  ctx.response.type = 'application/octet-stream';
  ctx.body = fileGenerator.next().value;

  ctx.req.on('close', () => {
    fileGenerator.return();
    // cleanup any resources if necessary
  });
});

// router.post('/', async (ctx) => {
//   const { filePath, fileContent } = ctx.request.body;
//   await fs.outputFile(filePath, fileContent);
//   ctx.status = 201;
// });

export default router;
// import { Context, DefaultState } from 'koa';
// import Router from 'koa-router';

// export const filesRouter = new Router();

// filesRouter.put('/:filePath', async (ctx) => {
//   const { fileContent } = ctx.request.body;
//   await fs.outputFile(ctx.params.filePath, fileContent);
//   ctx.status = 204;
// });
//
// filesRouter.delete('/:filePath', async (ctx) => {
//   await fs.unlink(ctx.params.filePath);
//   ctx.status = 204;
// });
//
// filesRouter.get('/:folderPath', async (ctx) => {
//   ctx.body = await fs.readdir(ctx.params.folderPath);
//   ctx.status = 200;
// });
//
// export default filesRouter;
