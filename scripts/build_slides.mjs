import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {Presentation, PresentationFile} from '@oai/artifact-tool';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const skill = 'C:/Users/User/.codex/plugins/cache/openai-primary-runtime/presentations/26.909.12148/skills/presentations';
const runtimePython = 'C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe';
process.env.RUNTIME_NODE_MODULES = 'C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const output = path.join(root,'output','worldbank_2020_briefing.pptx');
const staging = path.join(root,'.build','ppt');
await fs.mkdir(staging,{recursive:true});
await fs.mkdir(path.dirname(output),{recursive:true});
const summary = JSON.parse(await fs.readFile(path.join(root,'analysis','summary.json'),'utf8'));
const {finalizePresentation} = await import(pathToFileURL(path.join(skill,'container_tools','artifact_tool_utils.mjs')).href);

const C={ink:'#142631',teal:'#007F80',orange:'#D9784C',paper:'#F8FAF8',muted:'#526A74',line:'#DAE4E2',pale:'#E9F2EF',white:'#FFFFFF'};
const F='Arial';
const ppt=Presentation.create({slideSize:{width:1280,height:720}});

function shape(slide,x,y,w,h,fill,stroke='none',radius='rect'){
  return slide.shapes.add({geometry:radius,position:{left:x,top:y,width:w,height:h},fill,line:{fill:stroke,width:stroke==='none'?0:1}});
}
function txt(slide,s,x,y,w,h,size=22,color=C.ink,bold=false,align='left'){
  const q=shape(slide,x,y,w,h,'none');q.text=s;q.text.style={typeface:F,fontSize:size,color,bold,alignment:align,verticalAlignment:'middle',autoFit:'none',wrap:true};return q;
}
function base(section,num){
  const slide=ppt.slides.add();slide.background.fill=C.paper;
  shape(slide,0,0,1280,55,C.ink);txt(slide,'WORLD FACT SHEET  /  2020',68,12,500,32,15,C.white,true);txt(slide,section.toUpperCase(),836,12,376,32,14,'#BBDAD4',true,'right');
  shape(slide,68,668,1144,1,C.line);txt(slide,'Source: supplied 57-country CSV attributed to World Bank Data',68,677,900,25,13,C.muted);txt(slide,`${num} / 7`,1140,677,72,25,13,C.muted,false,'right');
  return slide;
}
function head(slide,title,sub){txt(slide,title,68,78,1130,70,43,C.ink,true);if(sub)txt(slide,sub,68,149,1100,38,20,C.muted);}
function note(slide,text){slide.speakerNotes.textFrame.setText(text);}
function bar(slide,y,name,val,maxVal,color,width=560,x=390,label=null){
  txt(slide,name,68,y-9,280,28,19,C.ink);
  shape(slide,x,y,width,17,C.pale);shape(slide,x,y,Math.max(3,Math.abs(val)/maxVal*width),17,color);
  txt(slide,label??String(val),x+width+14,y-10,170,32,18,C.ink,true);
}

// 1: cover
{
 const s=base('Research briefing',1);
 txt(s,'A 2020 country\nfact sheet',68,100,890,168,63,C.ink,true);
 txt(s,'Economic contraction, population scale and data coverage',70,300,940,56,26,C.muted);
 shape(s,68,415,1144,135,C.pale);
 txt(s,'57',96,436,170,61,48,C.teal,true);txt(s,'countries',96,503,220,30,18,C.muted);
 txt(s,'45 / 55',385,436,260,61,48,C.teal,true);txt(s,'GDP contractions',385,503,290,30,18,C.muted);
 txt(s,'-4.02%',805,436,320,61,48,C.teal,true);txt(s,'median GDP growth',805,503,330,30,18,C.muted);
 txt(s,'A descriptive analysis of the supplied country selection. The CSV does not include an explicit year field.',68,582,1100,54,18,C.muted);
 note(s,'All statistics calculated from the user-supplied final_demographics_data.csv, described as a 2020 World Bank fact sheet. Scope: 57 selected countries, not the world. See analysis/report.md.');
}
// 2: growth
{
 const s=base('Economic outcomes',2);head(s,'Contraction was widespread','45 of 55 countries with GDP growth data reported a decline.');
 txt(s,'DEEPEST DECLINES',68,205,440,30,16,C.teal,true);
 summary.bottom_growth.slice(0,5).forEach((d,i)=>bar(s,264+i*60,d.country,d.value,12,C.orange,510,397,`${d.value.toFixed(2)}%`));
 shape(s,68,565,1144,70,C.pale);txt(s,'The country median was -4.02%. Japan and the United Arab Emirates have no growth observation in this CSV.',89,575,1090,53,19,C.ink);
 note(s,'Source: supplied CSV. GDP growth is annual percentage growth based on constant local currency according to World Bank metadata: https://databank.worldbank.org/metadataglossary/sustainable-development-goals-%28sdgs%29/series/NY.GDP.MKTP.KD.ZG. Descriptive rankings apply only to this sample.');
}
// 3: positive observations
{
 const s=base('Economic outcomes',3);head(s,'Ten countries grew','The strongest positive rates came from diverse regions.');
 txt(s,'HIGHEST OBSERVED GDP GROWTH',68,205,660,30,16,C.teal,true);
 summary.top_growth.slice(0,5).forEach((d,i)=>bar(s,264+i*60,d.country,d.value,7,C.teal,510,397,`+${d.value.toFixed(2)}%`));
 shape(s,68,565,1144,70,C.pale);txt(s,'A single-year snapshot describes variation; it cannot explain why countries followed different paths.',89,575,1090,53,19,C.ink);
 note(s,'Source: supplied CSV; GDP growth available for 55 of 57 countries. This slide is descriptive, not causal.');
}
// 4: population
{
 const s=base('Population',4);head(s,'Scale changes the picture','China and India account for 44.9% of population in the selected sample.');
 txt(s,'POPULATION, BILLIONS',68,205,500,30,16,C.teal,true);
 summary.top_population.slice(0,5).forEach((d,i)=>bar(s,264+i*60,d.country,d.value/1e9,1.5,C.teal,510,397,`${(d.value/1e9).toFixed(2)}bn`));
 shape(s,68,565,1144,70,C.pale);txt(s,'Sample population sums to 6.20bn. Its population-weighted urban share is 56.4%. Neither is a world estimate.',89,575,1090,53,19,C.ink);
 note(s,'Source: supplied CSV. Urban share equals sum of Urban population divided by sum of Population, total. Population definition: https://databank.worldbank.org/metadataglossary/world-development-indicators/series/SP.POP.TOTL.');
}
// 5: development
{
 const s=base('Development',5);head(s,'Output and human capital move together','A strong rank association appears across 55 complete country pairs.');
 txt(s,'0.879',68,237,390,115,93,C.teal,true);
 txt(s,'Spearman rank correlation',68,355,460,37,23,C.ink,true);
 txt(s,'GDP per capita versus human capital index',68,395,490,59,20,C.muted);
 shape(s,610,221,3,303,C.line);
 txt(s,'$9,322',660,241,530,80,56,C.ink,true);txt(s,'Median GDP per capita',660,326,500,35,23,C.ink,true);
 txt(s,'Constant 2010 US dollars, 55 reported values',660,369,510,53,19,C.muted);
 shape(s,68,565,1144,70,C.pale);txt(s,'The association is descriptive. It does not establish causation, welfare or individual income.',89,575,1090,53,19,C.ink);
 note(s,'Source: supplied CSV. Spearman rho = 0.8793650793650793 for 55 countries with both values. Median GDP per capita = 9322.335713 constant 2010 US dollars. HCI median for 57 countries = 0.628506422.');
}
// 6: coverage and interpretation
{
 const s=base('Data quality',6);head(s,'Read the gaps before comparing','Indicator coverage varies from 57 countries to fewer than 15.');
 const coverage=[['Population',57],['Human capital index',57],['GDP growth',55],['GDP per capita',55],['Consumption share',48],['Internet use',29],['Domestic credit',12]];
 coverage.forEach(([n,v],i)=>bar(s,221+i*48,n,v,57,C.teal,520,443,`${v} / 57`));
 txt(s,'The CSV has no year field, extraction vintage or country-selection rule. Small regional groups and missing data limit generalization.',68,584,1100,64,18,C.muted);
 note(s,'Coverage from supplied CSV. Domestic credit refers to Domestic credit provided by financial sector (% of GDP). Data audit: 2692 of 3363 numeric cells present. Full limitations and definitions: analysis/report.md and analysis/methodology.md.');
}
// 7: verdict and recommendations
{
 const s=base('Research verdict',7);head(s,'Use the evidence at its true scope','The strongest conclusion is descriptive and sample-specific.');
 shape(s,68,218,1144,102,C.pale);
 txt(s,'The supplied selection shows a broad 2020 contraction. It does not establish a world estimate or causal explanation.',89,233,1080,76,24,C.ink,true);
 txt(s,'RECOMMENDED NEXT STEPS',68,356,550,30,16,C.teal,true);
 const recs=[
  ['01','Label every denominator','State observed country counts and whether a figure is country- or population-weighted.'],
  ['02','Use coverage to set scope','Favor near-complete indicators for broad comparisons; treat sparse fields as subsets.'],
  ['03','Recover provenance','Verify series IDs, observation years and country selection before trend or policy analysis.']
 ];
 recs.forEach(([n,h,b],i)=>{const y=402+i*75;txt(s,n,68,y,60,33,23,C.teal,true);txt(s,h,133,y,340,34,22,C.ink,true);txt(s,b,475,y,720,42,18,C.muted)});
 note(s,'Research verdict based only on the user-supplied CSV. 45 of 55 growth observations are negative. The file lacks explicit year, extraction vintage, series IDs and country-selection rule. Full recommendations: analysis/report.md.');
}

const candidate=path.join(staging,'candidate.pptx');
await (await PresentationFile.exportPptx(ppt)).save(candidate);
const result=await finalizePresentation({
  workspaceDir:root,candidatePath:candidate,finalPath:output,pythonExecutable:runtimePython,
  integrityValidatorPath:path.join(skill,'container_tools','inspect_presentation_package_integrity.py'),
  layoutValidatorPath:path.join(skill,'container_tools','inspect_presentation_layout_geometry.py'),
  layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-heading-fit'],
  requiredNativeTableOwnerSlides:[],fontPolicy:{basis:'design',families:['Arial']},
  verifyArtifactToolImport:true,receiptPath:path.join(staging,'validation_v3.json')
});
console.log(JSON.stringify({output,result}));
