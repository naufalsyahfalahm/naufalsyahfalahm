import numpy as np, json, sys
sys.path.insert(0,"work")
from corr import load, band, env, ncc
M=env(band(load("main"))); F={"tya":env(band(load("tya"))),"zaky":env(band(load("zaky")))}
ph=json.load(open("work/phrases.json"))
segs=[]
for p in ph:
    ref=F[p["spk"]]; o=p["off"]; s,e=p["start"],p["end"]
    pts=[]
    t=s
    while t<e-0.4:
        te=min(t+1.2,e); tpl=M[int(t*100):int(te*100)]
        lo=max(0,int((t+o-0.5)*100)); hi=min(len(ref),int((te+o+0.5)*100))
        if tpl.std()<0.3: t+=0.3; continue
        c=ncc(tpl,ref[lo:hi]); i=int(np.argmax(c))
        # sub-sample refinement (parabolic)
        d=0.0
        if 0<i<len(c)-1: 
            a,b,cc=c[i-1],c[i],c[i+1]; den=a-2*b+cc; d=0.5*(a-cc)/den if den!=0 else 0
        if c[i]>=0.8: pts.append(((t+te)/2,(lo+i+d)/100-t,float(c[i])))
        t+=0.3
    pts=np.array(pts)
    tm,om=pts[:,0],pts[:,1]
    A=np.vstack([np.ones_like(tm),tm-s]).T
    coef,*_=np.linalg.lstsq(A,om,rcond=None)
    resid=om-A@coef
    const=np.median(om); rc=om-const
    segs.append(dict(spk=p["spk"],start=s,end=e,off0=float(coef[0]),slope=float(coef[1]),n=len(pts),
        max_resid_lin=float(np.abs(resid).max()),max_resid_const=float(np.abs(rc).max()),const=float(const)))
    print(f'{p["spk"]:5} {s:7.2f}-{e:7.2f} n={len(pts):2d} const={const:8.3f} (max dev {np.abs(rc).max()*1000:4.0f} ms) | lin slope={coef[1]*100:+.2f}% (max resid {np.abs(resid).max()*1000:4.0f} ms)')
json.dump(segs,open("work/segfit.json","w"),indent=1)
