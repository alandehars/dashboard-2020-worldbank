(() => {
  const {rows, columns} = window.WB_DATA;
  const keys = {
    pop: 'Population, total', growth: 'GDP growth (annual %)',
    gdppc: 'GDP per capita (constant 2010 US$)', hci: 'Human capital index (HCI) (scale 0-1)',
    urban: 'Urban population', consumption: 'Final consumption expenditure (% of GDP)'
  };
  const metrics = [
    [keys.gdppc, 'GDP per capita (constant 2010 US$)', '$'],
    [keys.growth, 'GDP growth (annual %)', '%'],
    [keys.hci, 'Human capital index', 'decimal'],
    [keys.pop, 'Population', 'count'],
    ['Age dependency ratio (% of working-age population)', 'Age dependency ratio', '%'],
    [keys.consumption, 'Consumption (% of GDP)', '%'],
    ['Unemployment, total (% of total labor force) (modeled ILO estimate)', 'Unemployment', '%'],
    ['Women Business and the Law Index Score (scale 1-100)', 'Women, Business and the Law score', 'score'],
    ['Population growth (annual %)', 'Population growth', '%'],
    ['Military expenditure (% of GDP)', 'Military expenditure (% of GDP)', '%'],
    ['Fixed broadband subscriptions (per 100 people)', 'Fixed broadband subscriptions', 'per 100']
  ];
  const metricMap = Object.fromEntries(metrics.map(m => [m[0], m]));
  const el = id => document.getElementById(id);
  const fmt = (v, type, digits=1) => {
    if (v == null || !Number.isFinite(v)) return '—';
    if (type === 'count') return Math.abs(v) >= 1e9 ? (v/1e9).toFixed(2)+'bn' : Math.abs(v) >= 1e6 ? (v/1e6).toFixed(1)+'m' : Math.round(v).toLocaleString();
    if (type === '$') return '$'+Math.round(v).toLocaleString();
    if (type === 'decimal') return v.toFixed(3);
    return v.toFixed(digits)+(type === '%' ? '%' : '');
  };
  const median = values => { const a = values.filter(v => v != null).sort((x,y)=>x-y); return a.length ? (a[(a.length-1)>>1]+a[a.length>>1])/2 : null; };
  const palette = ['#007f80','#436f9a','#d88257','#6f8b62','#96709a','#c29a3f','#6b808a','#ad6e6f'];
  const regions = [...new Set(rows.map(r=>r.Region))].sort();
  const color = region => palette[regions.indexOf(region)%palette.length];
  regions.forEach(name => el('region').add(new Option(name.replace(/([a-z])([A-Z])/g,'$1 $2'),name)));
  for (const id of ['xmetric','ymetric','rankmetric']) metrics.forEach(m=>el(id).add(new Option(m[1],m[0])));
  el('xmetric').value = keys.gdppc; el('ymetric').value=keys.hci; el('rankmetric').value=keys.growth;
  const selected = () => rows.filter(r => (!el('region').value || r.Region===el('region').value) && r.country.toLowerCase().includes(el('search').value.trim().toLowerCase()));
  const svgNode = (tag, attrs={}) => { const n=document.createElementNS('http://www.w3.org/2000/svg',tag); for(const [k,v] of Object.entries(attrs)) n.setAttribute(k,v); return n; };
  function drawScatter(data) {
    const target=el('scatter'); target.replaceChildren();
    const xk=el('xmetric').value, yk=el('ymetric').value;
    let pts=data.filter(r=>r[xk]!=null && r[yk]!=null);
    let log=el('logx').checked && pts.every(r=>r[xk]>0);
    if (el('logx').checked && !log) el('scatter-note').textContent='Log X is unavailable when the selected measure includes zero or negative values. Linear scale is shown.';
    else el('scatter-note').textContent=`${pts.length} of ${data.length} selected countries have both measures. Circle area indicates population; colors identify source region labels. Association is descriptive, not causal.`;
    if (!pts.length) {target.textContent='No countries have both selected values.';return;}
    const W=760,H=390,L=73,R=25,T=22,B=56;
    const xv=pts.map(r=>log?Math.log10(r[xk]):r[xk]), yv=pts.map(r=>r[yk]);
    const ext=a=>{let lo=Math.min(...a),hi=Math.max(...a),pad=(hi-lo||Math.abs(hi)||1)*.07;return [lo-pad,hi+pad]};
    const [xmin,xmax]=ext(xv),[ymin,ymax]=ext(yv);
    const xs=v=>L+(v-xmin)/(xmax-xmin)*(W-L-R),ys=v=>H-B-(v-ymin)/(ymax-ymin)*(H-T-B);
    const svg=svgNode('svg',{viewBox:`0 0 ${W} ${H}`,preserveAspectRatio:'xMidYMid meet'});
    for(let i=0;i<=4;i++){
      const x=L+i*(W-L-R)/4,y=T+i*(H-T-B)/4;
      svg.append(svgNode('line',{x1:x,y1:T,x2:x,y2:H-B,class:'gridline'}),svgNode('line',{x1:L,y1:y,x2:W-R,y2:y,class:'gridline'}));
      const xt=svgNode('text',{x,y:H-B+19,'text-anchor':'middle',class:'tick'}),yt=svgNode('text',{x:L-9,y:y+4,'text-anchor':'end',class:'tick'});
      const rawX=log?10**(xmin+i*(xmax-xmin)/4):xmin+i*(xmax-xmin)/4;
      xt.textContent=fmt(rawX,metricMap[xk][2],rawX<10?1:0); yt.textContent=fmt(ymax-i*(ymax-ymin)/4,metricMap[yk][2],1);
      svg.append(xt,yt);
    }
    svg.append(svgNode('line',{x1:L,y1:H-B,x2:W-R,y2:H-B,class:'axis'}),svgNode('line',{x1:L,y1:T,x2:L,y2:H-B,class:'axis'}));
    pts=[...pts].sort((a,b)=>b[keys.pop]-a[keys.pop]);
    pts.forEach(r=>{
      const radius=4+Math.sqrt(r[keys.pop]/Math.max(...rows.map(q=>q[keys.pop])))*17;
      const c=svgNode('circle',{cx:xs(log?Math.log10(r[xk]):r[xk]),cy:ys(r[yk]),r:radius,fill:color(r.Region),class:'point',tabindex:'0','aria-label':`${r.country}: ${metricMap[xk][1]} ${fmt(r[xk],metricMap[xk][2])}; ${metricMap[yk][1]} ${fmt(r[yk],metricMap[yk][2])}`});
      const show=e=>{const t=el('tooltip');t.innerHTML='';let b=document.createElement('b');b.textContent=r.country;t.append(b);for(const [name,value] of [[metricMap[xk][1],fmt(r[xk],metricMap[xk][2])],[metricMap[yk][1],fmt(r[yk],metricMap[yk][2])],['Population',fmt(r[keys.pop],'count')]]){let s=document.createElement('span');s.textContent=`${name}: ${value}`;t.append(s)}t.hidden=false;const rect=c.getBoundingClientRect();t.style.left=Math.min(window.innerWidth-250,(e.clientX||rect.left)+14)+'px';t.style.top=Math.max(10,(e.clientY||rect.top)-85)+'px'};
      c.addEventListener('mouseenter',show);c.addEventListener('mousemove',show);c.addEventListener('focus',show);c.addEventListener('mouseleave',()=>el('tooltip').hidden=true);c.addEventListener('blur',()=>el('tooltip').hidden=true);svg.append(c);
    });
    target.append(svg);
  }
  function drawRanking(data){
    const key=el('rankmetric').value,meta=metricMap[key],asc=el('rankorder').value==='bottom';
    const vals=data.filter(r=>r[key]!=null).sort((a,b)=>asc?a[key]-b[key]:b[key]-a[key]).slice(0,10);
    const max=Math.max(...vals.map(r=>Math.abs(r[key])),1);el('ranking').replaceChildren();
    vals.forEach(r=>{const row=document.createElement('div');row.className='rank-row';const name=document.createElement('span');name.className='rank-name';name.textContent=r.country;name.title=r.country;const track=document.createElement('div');track.className='bar-track';const bar=document.createElement('div');bar.className='bar'+(r[key]<0?' negative':'');bar.style.width=Math.max(2,Math.abs(r[key])/max*100)+'%';track.append(bar);const value=document.createElement('span');value.className='rank-value';value.textContent=fmt(r[key],meta[2]);row.append(name,track,value);el('ranking').append(row)});
    el('rank-note').textContent=`${data.filter(r=>r[key]!=null).length} of ${data.length} selected countries report this measure. Bars show magnitude; orange denotes negative values.`;
  }
  function drawKpis(data){
    const pop=data.reduce((s,r)=>s+r[keys.pop],0),growth=data.map(r=>r[keys.growth]).filter(v=>v!=null),negative=growth.filter(v=>v<0).length,urban=data.reduce((s,r)=>s+r[keys.urban],0);
    const items=[['Countries in view',data.length.toString(),'of 57 in the supplied sample'],['Population represented',fmt(pop,'count'),'sum of selected country populations'],['Median GDP growth',fmt(median(growth),'%'),`${negative} of ${growth.length} with data contracted`],['Urban share',pop?fmt(urban/pop*100,'%'):'—','population-weighted within selection']];
    el('kpis').innerHTML=items.map(([label,val,note])=>`<div class="kpi"><div class="label">${label}</div><strong>${val}</strong><small>${note}</small></div>`).join('');
  }
  function drawRegions(data){
    el('region-body').replaceChildren();
    [...new Set(data.map(r=>r.Region))].sort().forEach(region=>{
      const group=data.filter(r=>r.Region===region),tr=document.createElement('tr');
      [region.replace(/([a-z])([A-Z])/g,'$1 $2'),group.length,fmt(group.reduce((s,r)=>s+r[keys.pop],0),'count'),fmt(median(group.map(r=>r[keys.growth])),'%')].forEach(v=>{const td=document.createElement('td');td.textContent=v;tr.append(td)});el('region-body').append(tr);
    });
  }
  function drawQuality(data){
    const names=[keys.pop,keys.growth,keys.gdppc,keys.hci,keys.consumption,'Individuals using the Internet (% of population)','Employment to population ratio, 15+, female (%) (national estimate)','Domestic credit provided by financial sector (% of GDP)','Women Business and the Law Index Score (scale 1-100)'];
    el('quality').replaceChildren();names.forEach(key=>{const n=data.filter(r=>r[key]!=null).length,p=data.length?n/data.length*100:0,d=document.createElement('div');d.className='quality-item';const name=document.createElement('span');name.className='name';name.textContent=key;name.title=key;const track=document.createElement('div');track.className='quality-track';const fill=document.createElement('div');fill.className='quality-fill';fill.style.width=p+'%';track.append(fill);const value=document.createElement('span');value.className='quality-value';value.textContent=`${n}/${data.length}`;d.append(name,track,value);el('quality').append(d)});
  }
  function drawTable(data){
    el('country-body').replaceChildren();data.forEach(r=>{const tr=document.createElement('tr');[r.country,r.Region.replace(/([a-z])([A-Z])/g,'$1 $2'),fmt(r[keys.pop],'count'),fmt(r[keys.growth],'%'),fmt(r[keys.gdppc],'$'),fmt(r[keys.hci],'decimal'),fmt(r[keys.urban]/r[keys.pop]*100,'%')].forEach(v=>{const td=document.createElement('td');td.textContent=v;tr.append(td)});el('country-body').append(tr)});
  }
  function render(){const data=selected();el('filter-count').textContent=`${data.length} / ${rows.length} countries shown`;drawKpis(data);drawScatter(data);drawRanking(data);drawRegions(data);drawQuality(data);drawTable(data)}
  for(const id of ['region','search','xmetric','ymetric','rankmetric','rankorder','logx'])el(id).addEventListener(id==='search'?'input':'change',render);
  el('reset').addEventListener('click',()=>{el('region').value='';el('search').value='';render()});
  el('download').addEventListener('click',()=>{const esc=v=>'"'+String(v??'').replaceAll('"','""')+'"';const lines=[columns.map(esc).join(','),...selected().map(r=>columns.map(k=>esc(r[k])).join(','))];const blob=new Blob([lines.join('\r\n')+'\r\n'],{type:'text/csv;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='worldbank_2020_filtered.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)});
  render();
})();
