import numpy as np, json, sys
sys.path.insert(0,"work")
from corr import load, band, env, ncc
SR=8000
x=load("main")
h=80  # 10 ms
n=len(x)//h
db=10*np.log10((x[:n*h].reshape(n,h)**2).mean(1)+1e-12)
# threshold relative to speech level
thr=np.percentile(db,95)-28
print("db p95",np.percentile(db,95),"thr",thr)
act=db>thr
def runs(a,min_gap,min_len):
    out=[];i=0
    while i<len(a):
        if a[i]:
            j=i
            while j<len(a) and a[j]: j+=1
            out.append([i,j]); i=j
        else: i+=1
    m=[]
    for s,e in out:
        if m and (s-m[-1][1])*0.01<min_gap: m[-1][1]=e
        else: m.append([s,e])
    return [(s*0.01,e*0.01) for s,e in m if (e-s)*0.01>=min_len]
for gap in (0.4,):
    cl=runs(act,gap,0.3)
    print(gap,len(cl))
    for s,e in cl: print(f"  {s:7.2f} {e:7.2f} dur {e-s:5.2f}")
json.dump(cl,open("work/clips.json","w"))
