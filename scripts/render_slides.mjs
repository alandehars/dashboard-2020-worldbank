import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {FileBlob,PresentationFile} from '@oai/artifact-tool';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const src=path.join(root,'output','worldbank_2020_briefing.pptx');
const out=path.join(root,'.build','ppt','preview');
await fs.mkdir(out,{recursive:true});
const ppt=await PresentationFile.importPptx(await FileBlob.load(src));
for(let i=0;i<7;i++){
  const png=await ppt.export({slide:ppt.slides.getItem(i),format:'png',scale:.8});
  await fs.writeFile(path.join(out,`slide-${i+1}.png`),new Uint8Array(await png.arrayBuffer()));
}
console.log(out);
