import numpy as np, json, sys, itertools
sys.path.insert(0,"work")
from corr import load, band, env, ncc
M=env(band(load("main"))); F={"tya":env(band(load("tya"))),"zaky":env(band(load("zaky")))}
ph=json.load(open("work/phrases.json"))
TOL=0.025
def pts_for(p):
    ref=F[p["spk"]]; o=p["off"]; s,e=p["start"],p["end"]; out=[]; t=s
    while t<e-0.4:
        te=min(t+1.0,e); tpl=M[int(t*100):int(te*100)]
        lo=max(0,int((t+o-0.5)*100)); hi=min(len(ref),int((te+o+0.5)*100))
        if tpl.std()>=0.3:
            c=ncc(tpl,ref[lo:hi]); i=int(np.argmax(c)); d=0.0
            if 0<i<len(c)-1:
                a,b,cc=c[i-1],c[i],c[i+1]; den=a-2*b+cc; d=0.5*(a-cc)/den if den else 0
            if c[i]>=0.8: out.append(((t+te)/2,(lo+i+d)/100-t))
        t+=0.25
    return np.array(out)
def best_plateaus(pts,kmax=3):
    t,o=pts[:,0],pts[:,1]; n=len(o)
    for k in range(1,kmax+1):
        best=None
        for cuts in itertools.combinations(range(3,n-2),k-1):
            b=[0,*cuts,n]; ok=True; dev=0; meds=[]
            for a,c in zip(b[:-1],b[1:]):
                if c-a<3: ok=False;break
                m=np.median(o[a:c]); meds.append(m); dev=max(dev,np.abs(o[a:c]-m).max())
            if ok and (best is None or dev<best[0]): best=(dev,b,meds)
        if best and best[0]<=TOL: return best
    return best
def refine_cut(s,e,tb0,o1,o2,ref):
    best=None
    for tb in np.arange(max(s+0.3,tb0-0.7),min(e-0.3,tb0+0.7),0.01):
        sc=0
        for a,b,o in ((s,tb,o1),(tb,e,o2)):
            x=M[int(a*100):int(b*100)]; y=ref[int((a+o)*100):int((b+o)*100)]
            if len(x)!=len(y) or len(x)<5: sc=-9;break
            x=(x-x.mean())/(x.std()+1e-9); y=(y-y.mean())/(y.std()+1e-9); sc+=float((x*y).sum())
        if best is None or sc>best[0]: best=(sc,tb)
    return best[1]
segments=[]
for p in ph:
    pts=pts_for(p); ref=F[p["spk"]]; s,e=p["start"],p["end"]
    dev0=np.abs(pts[:,1]-np.median(pts[:,1])).max()
    if dev0<=TOL or len(pts)<8:
        segments.append(dict(spk=p["spk"],start=s,end=e,off=round(float(np.median(pts[:,1])),3)))
        print(f'{p["spk"]:5} {s:7.2f}-{e:7.2f} const {np.median(pts[:,1]):8.3f} (dev {dev0*1000:.0f} ms)'); continue
    dev,b,meds=best_plateaus(pts)
    cuts=[]
    for j in range(1,len(b)-1):
        tb0=(pts[b[j]-1,0]+pts[b[j],0])/2
        cuts.append(refine_cut(s,e,tb0,meds[j-1],meds[j],ref))
    edges=[s,*cuts,e]
    for j,(a,c) in enumerate(zip(edges[:-1],edges[1:])):
        segments.append(dict(spk=p["spk"],start=round(a,2),end=round(c,2),off=round(float(meds[j]),3)))
    print(f'{p["spk"]:5} {s:7.2f}-{e:7.2f} {len(meds)} plateaus dev {dev*1000:.0f} ms: '+", ".join(f"{a:.2f}-{c:.2f}@{m:.3f}" for a,c,m in zip(edges[:-1],edges[1:],meds)))
json.dump(segments,open("work/segments.json","w"),indent=1)
