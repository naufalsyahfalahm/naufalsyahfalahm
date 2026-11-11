import numpy as np, json, sys
sys.path.insert(0,"work")
from corr import load, band, env, ncc
M=env(band(load("main"))); F={"tya":env(band(load("tya"))),"zaky":env(band(load("zaky")))}
rows=json.load(open("work/chunkmatch.json"))
x=load("main"); h=80; n=len(x)//h
db=10*np.log10((x[:n*h].reshape(n,h)**2).mean(1)+1e-12); thr=np.percentile(db,95)-28; act=db>thr
def phrases(s,e,minpause=0.08,minlen=0.6):
    a=act[int(s*100):int(e*100)]; segs=[];i=0
    while i<len(a):
        if a[i]:
            j=i
            while j<len(a) and a[j]: j+=1
            segs.append([i,j]); i=j
        else: i+=1
    m=[]
    for p,q in segs:
        if m and (p-m[-1][1])*0.01<minpause: m[-1][1]=q
        else: m.append([p,q])
    out=[]
    for p,q in m:
        if out and (q-out[-1][0])*0.01<minlen: out[-1][1]=q   # merge short bits forward
        elif (q-p)*0.01<minlen and out: out[-1][1]=q
        else: out.append([p,q])
    return [(s+p*0.01,s+q*0.01) for p,q in out]
res=[]
for r in rows:
    a,b=r["tya"],r["zaky"]
    if a["peak"]-b["peak"]>0.1: spk=("tya",a["off"])
    elif b["peak"]-a["peak"]>0.1: spk=("zaky",b["off"])
    else: spk=None
    if spk is None:
        print(f'{r["start"]:7.2f}-{r["end"]:7.2f} UNASSIGNED'); continue
    k,o=spk; ref=F[k]
    for ps,pe in phrases(r["start"],r["end"]):
        tpl=M[int(ps*100):int(pe*100)]
        lo=max(0,int((ps+o-2.0)*100)); hi=min(len(ref),int((pe+o+2.0)*100))
        c=ncc(tpl,ref[lo:hi]); i=int(np.argmax(c)); pk=float(c[i]); off=(lo+i)/100-ps
        res.append(dict(spk=k,start=round(ps,2),end=round(pe,2),off=round(off,2),peak=round(pk,3)))
        print(f'{k:5} {ps:7.2f}-{pe:7.2f} ({pe-ps:4.1f}s) off={off:8.2f} (clip {o:8.2f}, d={off-o:+.2f}) pk={pk:.2f}')
json.dump(res,open("work/phrases.json","w"),indent=1)
