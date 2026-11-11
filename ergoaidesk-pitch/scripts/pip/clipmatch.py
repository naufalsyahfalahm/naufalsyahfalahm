import numpy as np, json, sys
sys.path.insert(0,"work")
from corr import load, band, env, ncc
M=env(band(load("main"))); F={"tya":env(band(load("tya"))),"zaky":env(band(load("zaky")))}
clips=json.load(open("work/clips.json"))
out=[]
for s,e in clips:
    tpl=M[int(s*100):int(e*100)]
    row={"start":s,"end":e}
    for k,r in F.items():
        c=ncc(tpl,r); i=int(np.argmax(c)); pk=float(c[i]); m=c.copy(); m[max(0,i-150):i+150]=-1
        row[k]=dict(peak=round(pk,3),off=round(i/100-s,2),margin=round(pk-float(m.max()),3))
    out.append(row)
    a,b=row["tya"],row["zaky"]
    print(f"{s:7.2f}-{e:7.2f} ({e-s:5.1f}s)  tya pk={a['peak']:.3f} off={a['off']:8.2f} mg={a['margin']:.2f} | zaky pk={b['peak']:.3f} off={b['off']:8.2f} mg={b['margin']:.2f}")
json.dump(out,open("work/clipmatch.json","w"),indent=1)
