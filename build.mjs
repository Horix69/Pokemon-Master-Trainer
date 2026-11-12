import { createRequire } from 'node:module';
import { resolve,extname } from 'node:path';
import { build } from 'esbuild';
import { readFile,writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
process.chdir(fileURLToPath(new URL('.',import.meta.url)));
const bundle=await build({write:false,plugins:[{name:'local-files',setup(api){api.onResolve({filter:/.*/},args=>({path:args.importer?createRequire(args.importer).resolve(args.path):resolve(args.path),namespace:'source'}));api.onLoad({filter:/.*/,namespace:'source'},async args=>({contents:await readFile(args.path,'utf8'),loader:extname(args.path)==='.tsx'?'tsx':extname(args.path)==='.ts'?'ts':'js'}));}}],entryPoints:['ui/app.mjs'],outfile:'ui/game.js',bundle:true,minify:true,jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'}});
await writeFile('ui/game.js',bundle.outputFiles[0].contents);
const shell=await readFile('ui/shell.html','utf8');
await writeFile('index.html',shell.replace('<script type="module" src="./ui/app.mjs"></script>','<script src="ui/game.js"></script>'));


