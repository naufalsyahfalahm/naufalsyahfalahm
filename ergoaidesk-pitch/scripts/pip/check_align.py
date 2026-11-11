import json, subprocess, sys, numpy as np
from pathlib import Path
sys.path.insert(0,"work")
from corr import band, env, ncc
FPS=30
U=Path("/root/.claude/uploads/b229099f-2597-5580-a7ef-9445cebf3b9a")
SRC={"tya":U/"08af3120-Mbak_Tya.mp4","zaky":U/"9a8b6b07-Zaky.mp4"}
P=json.load(open("work/pieces.json"))
def dec(path,extra=()):
    pcm=subprocess.run(["ffmpeg","-v","error",*extra,"-i",str(path),"-ac","1","-ar","8000","-f","f32le","-"],capture_output=True,check=True).stdout
    return np.frombuffer(pcm,dtype=np.float32)
main=dec(Path("out/ergoaidesk-pitch.mp4"))
Menv=env(band(main))
seg=json.load(open("work/segments.json"))
report={}
for spk,pieces in P.items():
    full=dec(SRC[spk]); out=np.zeros(5400*8000//30,dtype=np.float32)
    edges=[round(p["m0"]*FPS) for p in pieces]+[5400]
    for i,p in enumerate(pieces):
        if p["mode"]!="play": continue
        n=edges[i+1]-edges[i]; s=p["src0"]-(p["m0"]*FPS-edges[i])/FPS
        a=int(round(s*8000)); seglen=n*8000//30
        chunk=full[a:a+seglen]; out[edges[i]*8000//30: edges[i]*8000//30+len(chunk)]=chunk
    Fenv=env(band(out))
    rows=[]
    for t0 in range(0,170,10):
        # restrict to windows where this speaker's phrases exist (main time) 
        ss=[s for s in seg if s["spk"]==spk and s["start"]<t0+10 and s["end"]>t0]
        cov=sum(min(s["end"],t0+10)-max(s["start"],t0) for s in ss)
        if cov<3.0: continue
        tpl=Menv[t0*100:(t0+10)*100]
        lo=max(0,(t0-1)*100); hi=(t0+11)*100
        c=ncc(tpl,Fenv[lo:hi]); i=int(np.argmax(c)); lag=((lo+i)/100-t0)
        rows.append((t0,round(lag*1000),round(float(c[i]),3),round(cov,1)))
    report[spk]=rows
    print(spk)
    for r in rows: print(f"   {r[0]:3d}-{r[0]+10:3d} s  residual {r[1]:+5d} ms  ncc {r[2]:.3f}  speech {r[3]} s")
json.dump(report,open("work/residuals.json","w"))
