"""Produce the designed PDF research brief from the same summary as the dashboard."""
import json
from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph

ROOT = Path(__file__).resolve().parents[1]
S = json.loads((ROOT / 'analysis' / 'summary.json').read_text(encoding='utf-8'))
D = json.loads((ROOT / 'dashboard' / 'data.js').read_text(encoding='utf-8').removeprefix('window.WB_DATA = ').removesuffix(';\n'))
OUT = ROOT / 'output' / 'worldbank_2020_report.pdf'
OUT.parent.mkdir(exist_ok=True)
W, H = A4
INK = colors.HexColor('#142631')
MUTED = colors.HexColor('#526a74')
TEAL = colors.HexColor('#007f80')
ORANGE = colors.HexColor('#d9784c')
PALE = colors.HexColor('#e9f2ef')
LINE = colors.HexColor('#d9e4e3')
BG = colors.HexColor('#f8faf8')

font = 'Helvetica'
font_bold = 'Helvetica-Bold'
regular = Path('C:/Windows/Fonts/arial.ttf')
bold = Path('C:/Windows/Fonts/arialbd.ttf')
if regular.exists() and bold.exists():
    pdfmetrics.registerFont(TTFont('Arial', str(regular)))
    pdfmetrics.registerFont(TTFont('Arial-Bold', str(bold)))
    font, font_bold = 'Arial', 'Arial-Bold'

styles = {
    'body': ParagraphStyle('body', fontName=font, fontSize=9.8, leading=15, textColor=INK, alignment=TA_LEFT),
    'small': ParagraphStyle('small', fontName=font, fontSize=8.3, leading=12, textColor=MUTED),
    'callout': ParagraphStyle('callout', fontName=font_bold, fontSize=12.3, leading=18, textColor=INK),
}

c = canvas.Canvas(str(OUT), pagesize=A4)
c.setTitle('World Bank 2020 country fact sheet - research assessment')
c.setAuthor('Research analysis of user-supplied data')

def text(x, y, value, size=10, color=INK, bold=False):
    c.setFillColor(color); c.setFont(font_bold if bold else font, size); c.drawString(x, y, value)

def para(x, y, width, value, style='body'):
    p = Paragraph(value, styles[style]); _, h = p.wrap(width, H)
    p.drawOn(c, x, y-h)
    return y-h

def line(x1,y1,x2,y2,color=LINE,width=1):
    c.setStrokeColor(color); c.setLineWidth(width); c.line(x1,y1,x2,y2)

def start(page, section):
    c.setFillColor(BG); c.rect(0,0,W,H,fill=1,stroke=0)
    c.setFillColor(INK); c.rect(0,H-48,W,48,fill=1,stroke=0)
    text(42,H-30,'WORLD FACT SHEET  /  2020',9,colors.white,True)
    text(W-170,H-30,'RESEARCH ASSESSMENT',8,colors.HexColor('#b9d7d2'))
    text(42,H-76,section.upper(),8,TEAL,True)
    line(42,49,W-42,49)
    text(42,32,'Source: user-supplied CSV attributed to World Bank Data',7.3,MUTED)
    text(W-76,32,f'{page} / 5',8,MUTED)

def title(y, heading, subtitle=None):
    text(42,y,heading,22,INK,True)
    if subtitle: text(42,y-22,subtitle,9.5,MUTED)

def metric(x,y,w,label,value,note):
    c.setFillColor(colors.white);c.setStrokeColor(LINE);c.roundRect(x,y,w,91,4,fill=1,stroke=1)
    text(x+13,y+68,label.upper(),7.7,MUTED,True)
    text(x+13,y+37,value,22,INK,True)
    text(x+13,y+15,note,7.5,MUTED)

def horizontal_bars(x,y,width,items,maxval,color=TEAL,labels=True):
    for i,(name,value) in enumerate(items):
        yy=y-i*24
        text(x,yy,name,8.4,INK)
        c.setFillColor(PALE);c.rect(x+122,yy-1,width-122,9,fill=1,stroke=0)
        c.setFillColor(color);c.rect(x+122,yy-1,max(2,(width-122)*abs(value)/maxval),9,fill=1,stroke=0)
        if labels: text(x+width+7,yy-1,f'{value:+.2f}%' if color==ORANGE else f'{value:,.1f}',8,MUTED,True)

# Page 1
start(1,'Executive summary')
title(H-112,'A broad 2020 contraction','Findings from a selected 57-country fact sheet')
metric(42,H-250,119,'Countries','57','selected sample')
metric(170,H-250,119,'GDP declines','45 / 55','observed growth')
metric(298,H-250,119,'Median growth','-4.02%','country median')
metric(426,H-250,127,'Population','6.20bn','sample total')
y=H-280
text(42,y,'The central finding',12,TEAL,True)
y=para(42,y-10,W-84,'GDP growth is available for 55 countries. Forty-five recorded a contraction, while ten recorded positive growth. The median country posted a 4.02% decline. These are results for the supplied selection, not a world growth estimate.')
y-=29
text(42,y,'What the data can show',12,TEAL,True)
y=para(42,y-10,W-84,'The file combines population, economic, financial, digital and human-capital indicators in one cross-section. It supports comparisons across included countries and exploration of associations. It cannot establish a time trend or a causal explanation for 2020 outcomes.')
y-=32
c.setFillColor(PALE);c.roundRect(42,y-87,W-84,87,4,fill=1,stroke=0)
para(57,y-14,W-114,'<b>Scope note.</b> The CSV contains no explicit year field, extraction date or country-selection rule. The requester described it as a 2020 World Bank fact sheet. The 6.20 billion population sum refers only to the 57 included countries.', 'callout')
y-=126
text(42,y,'Key interpretation',12,TEAL,True)
para(42,y-11,W-84,'GDP per capita and the human capital index have a strong rank association in this sample (Spearman rho = 0.879, n = 55). This is descriptive evidence, not a causal result. Missing values vary widely across indicators and are left missing throughout the project.')
c.showPage()

# Page 2
start(2,'Economic outcomes')
title(H-112,'Economic outcomes varied','Annual GDP growth among countries with data')
text(42,H-173,'DEEPEST REPORTED CONTRACTIONS',8,TEAL,True)
bottom=[(d['country'],d['value']) for d in S['bottom_growth'][:5]]
horizontal_bars(42,H-201,430,bottom,12,ORANGE)
text(42,H-355,'HIGHEST REPORTED GROWTH',8,TEAL,True)
top=[(d['country'],d['value']) for d in S['top_growth'][:5]]
horizontal_bars(42,H-383,430,top,7,TEAL)
line(42,H-522,W-42,H-522)
text(42,H-549,'Beyond the headline',12,INK,True)
para(42,H-560,W-84,'The country-level median is -4.02%. The reported final consumption expenditure share has a median of 75.54% among 48 countries with values. That measure includes more than household spending and should not be read as a direct account of consumer behavior. GDP growth is defined by the World Bank as an annual percentage change in real output based on constant local currency.')
para(42,H-661,W-84,'Japan and the United Arab Emirates have no GDP growth value in this CSV. Their absence from the growth rankings is a missing-data issue, not evidence of zero growth.', 'small')
c.showPage()

# Page 3
start(3,'Population and development')
title(H-112,'Population shapes the sample','Different weighting choices answer different questions')
text(42,H-171,'LARGEST POPULATIONS IN THE SUPPLIED FILE',8,TEAL,True)
top_pop=[(d['country'],d['value']/1e9) for d in S['top_population'][:7]]
horizontal_bars(42,H-202,420,top_pop,1.5,TEAL,False)
for i,(_,value) in enumerate(top_pop): text(475,H-202-i*24,f'{value:.2f}bn',8,MUTED,True)
para(42,H-382,W-84,'China and India together account for 44.9% of population in this 57-country sample. The population-weighted urban share of the sample is 56.4%. Both figures depend on which countries are included and must not be labeled global estimates.')
line(42,H-452,W-42,H-452)
text(42,H-482,'GDP per capita and human capital',12,INK,True)
para(42,H-493,W-84,'GDP per capita is present for 55 countries, with a median of $9,322 in constant 2010 US dollars. The top five observed values are Norway ($90,885), Ireland ($81,297), Switzerland ($80,132), Denmark ($63,880) and Singapore ($56,349). The human capital index median is 0.629 across all 57 countries.')
para(42,H-603,W-84,'The rank correlation between GDP per capita and HCI is 0.879 across 55 complete country pairs. This strong positive association does not account for confounding factors or reveal direction of influence. GDP per capita is output per person, not median income or a purchasing-power-adjusted welfare measure.', 'small')
c.showPage()

# Page 4
start(4,'Data quality and methods')
title(H-112,'Coverage is uneven','Observed country values out of 57')
coverage=[('Population',57),('Human capital index',57),('GDP growth',55),('GDP per capita',55),('Consumption share',48),('Internet use',29),('Domestic credit',12)]
for i,(name,n) in enumerate(coverage):
    yy=H-177-i*29
    text(42,yy,name,8.7,INK)
    c.setFillColor(PALE);c.rect(174,yy-2,299,11,fill=1,stroke=0)
    c.setFillColor(TEAL);c.rect(174,yy-2,299*n/57,11,fill=1,stroke=0)
    text(486,yy,f'{n} / 57',8.5,MUTED,True)
line(42,H-391,W-42,H-391)
text(42,H-421,'Method and validation',12,INK,True)
para(42,H-432,W-84,'Empty cells are treated as missing, never zero. Country medians are unweighted. Urban share divides summed urban population by summed total population. Spearman rho uses complete country pairs. The population sex components reconcile exactly in every row; age dependency components reconcile within floating-point rounding. These arithmetic checks do not verify extraction provenance.')
text(42,H-552,'Limitations',12,INK,True)
para(42,H-563,W-84,'The CSV lacks a year column, extraction vintage, series IDs and country-selection rule. Region labels are uneven and several groups have just one country. Current World Bank metadata can use newer base years; this analysis preserves the supplied constant 2010 US dollar labels. Comparisons are descriptive and should not be interpreted causally.')
text(42,H-685,'Source and reproducibility',10,TEAL,True)
para(42,H-697,W-84,'Source: supplied final_demographics_data.csv, credited by the requester to data.worldbank.org. Rebuild: scripts/build_data.py. Detailed methods, indicator metadata links and limitations: analysis/report.md and analysis/methodology.md.', 'small')
c.showPage()
# Page 5
start(5,'Verdict and recommendations')
title(H-112,'What the evidence supports','Research verdict and priorities for next analysis')
c.setFillColor(PALE);c.roundRect(42,H-291,W-84,135,4,fill=1,stroke=0)
text(57,H-181,'RESEARCH VERDICT',8,TEAL,True)
para(57,H-193,W-114,'The selected countries show a broad output contraction in the supplied 2020 snapshot. Development levels and population scale vary sharply. The file supports descriptive sample comparisons; undocumented country selection, missing observation dates and uneven coverage prevent defensible world-level or causal conclusions.', 'callout')
y=H-308
recommendations=[
 ('01  Label the denominator','Show the number of observed countries for each statistic. Distinguish country medians from population-weighted shares and label every total as a sample total.'),
 ('02  Prefer stronger coverage','Use population, HCI, GDP growth and GDP per capita for broad comparisons. Treat internet use (29 values) and domestic credit (12 values) as limited exploratory subsets.'),
 ('03  Recover provenance','Confirm the original extraction date, World Bank series IDs, observation years and country-selection rule. Keep the supplied constant 2010 US dollar basis visible.'),
 ('04  Build a time series before inference','Obtain a documented multi-year panel to assess pre-2020 levels and later recovery. Test sensitivity to country weighting and influential observations before policy use.')
]
for heading,body in recommendations:
    text(42,y,heading,11,TEAL,True)
    y=para(42,y-9,W-84,body)-32
line(42,H-698,W-42,H-698)
para(42,H-708,W-84,'Full methods, detailed country tables and source links are in analysis/report.md. The interactive dashboard recalculates views after filtering and preserves missing values.', 'small')
c.showPage()
c.save()
print(OUT)
