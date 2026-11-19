"""Draw a compact, self-contained world-news page from news.json."""
import json
import os
import struct
import zlib
from pathlib import Path

W = H = 960
PAPER = (246, 243, 234)
INK = (24, 31, 35)
RED = (177, 48, 43)
MUTED = (105, 107, 101)
PALE = (226, 218, 201)
BLUE = (49, 94, 119)
GOLD = (207, 153, 67)

# A hand-drawn 5 by 7 uppercase alphabet keeps the renderer dependency-free.
FONT = {
 'A':('01110','10001','10001','11111','10001','10001','10001'), 'B':('11110','10001','10001','11110','10001','10001','11110'),
 'C':('01111','10000','10000','10000','10000','10000','01111'), 'D':('11110','10001','10001','10001','10001','10001','11110'),
 'E':('11111','10000','10000','11110','10000','10000','11111'), 'F':('11111','10000','10000','11110','10000','10000','10000'),
 'G':('01111','10000','10000','10111','10001','10001','01111'), 'H':('10001','10001','10001','11111','10001','10001','10001'),
 'I':('11111','00100','00100','00100','00100','00100','11111'), 'J':('00111','00010','00010','00010','10010','10010','01100'),
 'K':('10001','10010','10100','11000','10100','10010','10001'), 'L':('10000','10000','10000','10000','10000','10000','11111'),
 'M':('10001','11011','10101','10101','10001','10001','10001'), 'N':('10001','11001','10101','10011','10001','10001','10001'),
 'O':('01110','10001','10001','10001','10001','10001','01110'), 'P':('11110','10001','10001','11110','10000','10000','10000'),
 'Q':('01110','10001','10001','10001','10101','10010','01101'), 'R':('11110','10001','10001','11110','10100','10010','10001'),
 'S':('01111','10000','10000','01110','00001','00001','11110'), 'T':('11111','00100','00100','00100','00100','00100','00100'),
 'U':('10001','10001','10001','10001','10001','10001','01110'), 'V':('10001','10001','10001','10001','10001','01010','00100'),
 'W':('10001','10001','10001','10101','10101','10101','01010'), 'X':('10001','10001','01010','00100','01010','10001','10001'),
 'Y':('10001','10001','01010','00100','00100','00100','00100'), 'Z':('11111','00001','00010','00100','01000','10000','11111'),
 '0':('01110','10001','10011','10101','11001','10001','01110'), '1':('00100','01100','00100','00100','00100','00100','01110'),
 '2':('01110','10001','00001','00010','00100','01000','11111'), '3':('11110','00001','00001','01110','00001','00001','11110'),
 '4':('00010','00110','01010','10010','11111','00010','00010'), '5':('11111','10000','10000','11110','00001','00001','11110'),
 '6':('01110','10000','10000','11110','10001','10001','01110'), '7':('11111','00001','00010','00100','01000','01000','01000'),
 '8':('01110','10001','10001','01110','10001','10001','01110'), '9':('01110','10001','10001','01111','00001','00001','01110'),
 '/':('00001','00010','00010','00100','01000','01000','10000'), '-':('00000','00000','00000','11111','00000','00000','00000'),
 '.':('00000','00000','00000','00000','00000','00110','00110'), ',':('00000','00000','00000','00000','00110','00110','00100'),
 ':':('00000','00110','00110','00000','00110','00110','00000'), '+':('00000','00100','00100','11111','00100','00100','00000'),
 '&':('01100','10010','10100','01000','10101','10010','01101'), "'":('00100','00100','00010','00000','00000','00000','00000'),
 '?':('01110','10001','00001','00010','00100','00000','00100'), ' ':('00000',)*7,
}

class Canvas:
    def __init__(self): self.p = bytearray(PAPER * W * H)
    def rect(self,x,y,w,h,c):
        x0=max(0,int(x)); y0=max(0,int(y)); x1=min(W,int(x+w)); y1=min(H,int(y+h))
        row=bytes(c)*max(0,x1-x0)
        for yy in range(y0,y1):
            i=(yy*W+x0)*3; self.p[i:i+len(row)]=row
    def line(self,x1,y1,x2,y2,c,th=1):
        dx=abs(x2-x1); sx=1 if x1<x2 else -1; dy=-abs(y2-y1); sy=1 if y1<y2 else -1; err=dx+dy
        while True:
            self.rect(x1-th//2,y1-th//2,th,th,c)
            if x1==x2 and y1==y2: break
            e=2*err
            if e>=dy: err+=dy; x1+=sx
            if e<=dx: err+=dx; y1+=sy
    def circle(self,cx,cy,r,color,fill=True,th=2):
        r2=r*r; inner=(r-th)*(r-th)
        for y in range(max(0,cy-r),min(H,cy+r+1)):
            for x in range(max(0,cx-r),min(W,cx+r+1)):
                d=(x-cx)**2+(y-cy)**2
                if d<=r2 and (fill or d>=inner): self.rect(x,y,1,1,color)
    def text(self,x,y,s,scale,color,maxw=None,leading=2):
        s=s.upper(); cols=max(1,(maxw//(6*scale)) if maxw else len(s)+1); words=s.split(' '); lines=[]; cur=''
        for word in words:
            test=(cur+' '+word).strip()
            if len(test)>cols and cur: lines.append(cur); cur=word
            else: cur=test
        if cur: lines.append(cur)
        yy=y
        for ln in lines:
            xx=x
            for ch in ln:
                rows=FONT.get(ch,FONT['?'])
                for ry,row in enumerate(rows):
                    for rx,on in enumerate(row):
                        if on=='1': self.rect(xx+rx*scale,yy+ry*scale,scale,scale,color)
                xx+=6*scale
            yy+=7*scale+leading
        return yy
    def png(self,path):
        raw=b''.join(b'\x00'+bytes(self.p[y*W*3:(y+1)*W*3]) for y in range(H))
        def chunk(tag,data): return struct.pack('>I',len(data))+tag+data+struct.pack('>I',zlib.crc32(tag+data)&0xffffffff)
        data=b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',W,H,8,2,0,0,0))+chunk(b'IDAT',zlib.compress(raw,9))+chunk(b'IEND',b'')
        Path(path).parent.mkdir(parents=True,exist_ok=True); Path(path).write_bytes(data)

def icon_summit(c,x,y):
    c.circle(x+88,y+82,64,(235,229,214)); c.circle(x+88,y+82,53,(246,243,234))
    c.line(x+28,y+120,x+148,y+120,INK,3)
    for i,col in enumerate((RED,INK,BLUE)):
        bx=x+45+i*30; c.rect(bx,y+77+(i%2)*5,18,43-(i%2)*5,col)
        c.rect(bx+2,y+70+(i%2)*5,14,7,GOLD)
    c.line(x+34,y+126,x+142,y+126,PALE,2)
    c.text(x+40,y+138,'APEC',1, MUTED)

def icon_bridge(c,x,y):
    # Keep the bridge intact; an editorial burst marks the reported strike
    # without implying a break, collapse, fire, or other unreported damage.
    c.line(x+8,y+115,x+192,y+115,BLUE,3)
    c.line(x+20,y+106,x+174,y+106,INK,3)
    c.line(x+37,y+105,x+37,y+62,RED,3); c.line(x+157,y+105,x+157,y+62,RED,3)
    c.line(x+37,y+66,x+157,y+66,RED,3)
    for i in range(7): c.line(x+42+i*18,y+68,x+32+i*23,y+104,PALE,1)
    c.line(x+82,y+106,x+82,y+80,INK,4); c.line(x+112,y+106,x+112,y+80,INK,4)
    c.circle(x+97,y+67,5,GOLD)
    c.line(x+97,y+53,x+97,y+47,RED,2); c.line(x+85,y+57,x+80,y+53,RED,2)
    c.line(x+109,y+57,x+114,y+53,RED,2); c.line(x+87,y+72,x+81,y+74,RED,2)
    c.line(x+107,y+72,x+113,y+74,RED,2)
    c.text(x+54,y+126,'CRIMEA',1,MUTED)

def icon_court(c,x,y):
    c.line(x+20,y+115,x+174,y+115,INK,3); c.line(x+31,y+108,x+163,y+108,GOLD,2)
    c.line(x+36,y+55,x+156,y+55,INK,2); c.line(x+96,y+38,x+96,y+55,INK,2)
    c.line(x+34,y+58,x+158,y+58,INK,2)
    for xx in (48,75,102,129,150):
        c.line(xx,y+62,xx,y+104,BLUE,4)
    c.line(x+30,y+55,x+96,y+29,RED,2); c.line(x+96,y+29,x+162,y+55,RED,2)
    c.circle(x+96,y+25,5,GOLD)
    c.text(x+53,y+126,'THE HAGUE',1,MUTED)

def render():
    root=Path(__file__).resolve().parent
    news=json.loads((root/'news.json').read_text(encoding='utf-8'))
    items=news['items']; c=Canvas()
    c.rect(48,42,864,5,RED)
    c.text(48,65,'WORLD / 19',4,INK)
    c.text(50,111,news['date'],2,MUTED)
    c.line(48,137,912,137,PALE,2)
    # Lead story occupies the full top half, with a visual summary and readable dek.
    c.text(48,165,'THE DAY IN THREE STORIES',2,RED)
    c.text(48,201,items[0]['title'],3,INK,maxw=590,leading=3)
    c.text(48,260,items[0]['summary'],2,INK,maxw=590,leading=5)
    icon_summit(c,700,177)
    c.text(48,351,'01  '+items[0]['category'],1,BLUE)
    c.text(48,372,'SOURCE: REUTERS LIVE COVERAGE  /  anewz.tv',1,MUTED)
    c.text(48,386,'PUBLISHED NOVEMBER 19, 2026',1,MUTED)
    c.line(48,418,912,418,INK,2)
    # Two concise side-by-side briefs retain equal weight and distinct visual cues.
    panels=[(48,440,414,465,items[1],icon_bridge),(498,440,414,465,items[2],icon_court)]
    for x,y,w,h,item,drawicon in panels:
        c.rect(x,y,w,5,RED)
        c.text(x,y+20,item['category'],1,BLUE,maxw=w)
        c.text(x,y+44,item['title'],2,INK,maxw=w,leading=4)
        drawicon(c,x+105,y+97)
        c.text(x,y+242,item['summary'],2,INK,maxw=w,leading=5)
        c.line(x,y+h-48,x+w,y+h-48,PALE,1)
        domain='reuters.com' if 'reuters.com' in item['sourceUrl'] else item['sourceUrl'].split('/')[2]
        c.text(x,y+h-37,'SOURCE: '+item['sourceName']+'  /  '+domain,1,MUTED,maxw=w)
        c.text(x,y+h-21,'PUBLISHED NOVEMBER 19, 2026',1,MUTED,maxw=w)
    c.line(48,925,912,925,RED,4)
    c.text(48,937,'WORLD NEWS  /  THURSDAY, NOVEMBER 19, 2026',1,MUTED)
    out=os.environ.get('MAKEFUN_OUTPUT_DIR',str(root/'output'))
    c.png(Path(out)/'entry.png')

if __name__=='__main__': render()
