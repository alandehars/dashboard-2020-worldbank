"""Generate source-driven SVG figures for the Markdown research report."""
import json
import math
from html import escape
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
S=json.loads((ROOT/'analysis'/'summary.json').read_text(encoding='utf-8'))
D=json.loads((ROOT/'dashboard'/'data.js').read_text(encoding='utf-8').removeprefix('window.WB_DATA = ').removesuffix(';\n'))
OUT=ROOT/'analysis'/'figures';OUT.mkdir(exist_ok=True)
INK='#142631';MUTED='#526a74';TEAL='#007f80';ORANGE='#d9784c';PALE='#e9f2ef';LINE='#d9e4e3'

def wrap(body,w=900,h=450,title='',subtitle=''):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" role="img" aria-label="{escape(title)}"><rect width="100%" height="100%" fill="#f8faf8"/><text x="40" y="46" font-family="Arial,sans-serif" font-size="24" font-weight="bold" fill="{INK}">{escape(title)}</text><text x="40" y="72" font-family="Arial,sans-serif" font-size="13" fill="{MUTED}">{escape(subtitle)}</text>{body}</svg>'''

def t(x,y,s,size=14,color=INK,weight='normal',anchor='start'):
    return f'<text x="{x}" y="{y}" font-family="Arial,sans-serif" font-size="{size}" font-weight="{weight}" text-anchor="{anchor}" fill="{color}">{escape(str(s))}</text>'

def rect(x,y,w,h,color):return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{color}"/>'

# Figure 1: broad contraction and observed extremes
items=S['bottom_growth'][:5]+S['top_growth'][:5]
items=sorted(items,key=lambda x:x['value'])
body=''
zero=494;scale=28
for i,d in enumerate(items):
    y=111+i*30;v=d['value'];x=zero+min(v,0)*scale;ww=abs(v)*scale
    body+=t(40,y+13,d['country'],13)+rect(x,y,ww,17,ORANGE if v<0 else TEAL)+t(821,y+13,f"{v:+.2f}%",13,INK,'bold','end')
body+=f'<line x1="{zero}" y1="102" x2="{zero}" y2="414" stroke="{LINE}" stroke-width="2"/>'
body+=t(40,428,'Selected extremes among 55 countries with reported GDP growth. Bars use a common zero line.',12,MUTED)
(OUT/'gdp_growth_extremes.svg').write_text(wrap(body,title='GDP growth: observed extremes',subtitle='2020 snapshot described by the requester; percentage growth')+'\n',encoding='utf-8')

# Figure 2: coverage
coverage=[('Population',57),('Human capital index',57),('GDP growth',55),('GDP per capita',55),('Consumption share',48),('Internet use',29),('Domestic credit',12)]
body=''
for i,(name,n) in enumerate(coverage):
    y=112+i*43
    body+=t(40,y+16,name,14)+rect(252,y,485,19,PALE)+rect(252,y,round(485*n/57),19,TEAL)+t(827,y+16,f'{n} / 57',14,INK,'bold','end')
body+=t(40,433,'Blank source cells are missing; they are not replaced with zero.',12,MUTED)
(OUT/'indicator_coverage.svg').write_text(wrap(body,title='Coverage differs by indicator',subtitle='Number of selected countries with a reported value')+'\n',encoding='utf-8')

# Figure 3: development association, individual countries
xkey='GDP per capita (constant 2010 US$)';ykey='Human capital index (HCI) (scale 0-1)'
pairs=[r for r in D['rows'] if r[xkey] is not None and r[ykey] is not None]
body=''
for tick in (0.4,0.5,0.6,0.7,0.8,0.9):
    y=380-(tick-.35)/.6*270
    body+=f'<line x1="97" y1="{y:.1f}" x2="835" y2="{y:.1f}" stroke="{LINE}"/>'+t(87,round(y+4),f'{tick:.1f}',12,MUTED,anchor='end')
low_log,high_log=math.log10(500),math.log10(100000)
for tick in (500,1000,10000,100000):
    x=100+(math.log10(tick)-low_log)/(high_log-low_log)*690
    body+=f'<line x1="{x:.1f}" y1="101" x2="{x:.1f}" y2="380" stroke="{LINE}"/>'+t(round(x),403,f'${tick:,}',12,MUTED,anchor='middle')
for r in pairs:
    x=100+(math.log10(r[xkey])-low_log)/(high_log-low_log)*690;y=380-(r[ykey]-.35)/.6*270
    body+=f'<circle cx="{x:.1f}" cy="{y:.1f}" r="5" fill="{TEAL}" fill-opacity=".66"><title>{escape(r["country"])}: ${r[xkey]:,.0f}, HCI {r[ykey]:.3f}</title></circle>'
body+=t(100,432,'GDP per capita (constant 2010 US$), logarithmic scale',12,MUTED)
body+=t(805,92,'HCI',12,MUTED,anchor='end')
(OUT/'gdp_hci_scatter.svg').write_text(wrap(body,title='GDP per capita and human capital',subtitle='55 complete country pairs; Spearman rho = 0.879; descriptive association')+'\n',encoding='utf-8')
print(*(str(p) for p in OUT.iterdir()),sep='\n')
