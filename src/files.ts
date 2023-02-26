import Router from "@koa/router";
import fs from "fs-extra";
import path from "path";
import { cwd } from "node:process";
// import { PassThrough } from 'stream';

const router: Router = new Router();

// const workingDirectory: string = cwd();
const workingDirectory: string = path.join(cwd(), '../ui/src');

export const enum FILETYPE {
  FILE = 'file',
  DIRECTORY = 'directory',
  SYMLINK = 'symlink',
  OTHER = 'other',
}

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

// async function* walkDirAsync(dir: string): AsyncGenerator<string> {
//   const files = await fs.readdir(dir);
//   for (const file of files) {
//     const path = `${dir}/${file}`;
//     const stat = await fs.lstat(path);
//     if (stat.isDirectory()) {
//       yield* walkDir(path);
//     } else {
//       yield path;
//     }
//   }
// }

export type FileTree = {
  id: string;
  name: string;
  path: string;
  type: FILETYPE;
  children?: Array<FileTree>;
  size?: string;
  atime?: Date;
  mtime?: Date;
  ctime?: Date;
};

function truncateFilePath(filePath: string, dirPath: string): string {
  const relativePath = path.relative(dirPath, filePath);
  const segments = relativePath.split(path.sep);
  const truncatedSegments = segments.slice(Math.max(segments.length - 2, 0));
  const truncatedPath = truncatedSegments.join(path.sep);
  return truncatedPath.length > 0 ? truncatedPath : '.';
}

function formatFileSize(sizeInBytes: number, decimalPlaces = 2): string {
  const units = ['bytes', 'KB', 'MB', 'GB'];
  let size = sizeInBytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  const formattedSize = size.toFixed(decimalPlaces);
  const unit = units[unitIndex];

  return `${formattedSize} ${unit}`;
}

async function dirTree(filename: string, dirPath: string): Promise<FileTree> {
  const filetype = await detectType(filename);
  const stat = await fs.stat(filename);
  const info: FileTree = {
    id: `${stat.ino}`,
    name: path.basename(filename),
    path: truncateFilePath(filename, dirPath),
    type: filetype,
    atime: stat.atime,
    mtime: stat.mtime,
    ctime: stat.ctime,
    size: formatFileSize(stat.size, 2),
    // children: [],
  };
  if (filetype === FILETYPE.DIRECTORY) {
    info.children = await Promise.all(
      (
        await fs.readdir(filename)
      ).map(function (child) {
        return dirTree(path.join(filename, child), dirPath);
      })
    );
  }

  return info;
}

router.get('/', async (ctx, next) => {
  ctx.type = 'text/json';
  const files = await dirTree(
    path.join(workingDirectory, '.'),
    workingDirectory
  );
  ctx.body = JSON.stringify(files);
  // ctx.body = fs.createReadStream(`${workingDirectory}/index.html`);
  await next();
});

router.get('/:filePath', async (ctx, next) => {
  ctx.type = 'text/json';
  const files = await dirTree(
    path.join(workingDirectory, ctx.params.filePath),
    workingDirectory
  );
  ctx.body = JSON.stringify(files);
  await next();
});

// router.get('/:filePath', async (ctx, next) => {
//   const fileName = `${workingDirectory}/${ctx.params.filePath}`;
//   if (fs.isDir(fileName)) {
//     ctx.body = await fs.readFile(`${workingDirectory}/${ctx.params.filePath}`);
//     await next();
//   }
// )
//   ;

// function* streamFileGenerator(filePath: string) {
//   const stream = fs.createReadStream(filePath);
//   const passThrough = new PassThrough();
//   stream.pipe(passThrough);
//   yield passThrough;
// }

router.get('/get/:filePath', async (ctx, next) => {
  const filePath = path.join(workingDirectory, ctx.params.filePath);
  try {
    ctx.body = await fs.readFile(filePath, 'utf8');
    await next();
  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = 'Error reading file';
  }

  // const fileGenerator = streamFileGenerator(filePath);
  // ctx.response.set(
  //   'Content-Disposition',
  //   `attachment; filename=${ctx.params.filePath}`
  // );
  // ctx.response.type = 'application/octet-stream';
  // ctx.body = fileGenerator.next().value;
  //
  // ctx.req.on('close', () => {
  //   fileGenerator.return();
  //   // cleanup any resources if necessary
  // });
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
