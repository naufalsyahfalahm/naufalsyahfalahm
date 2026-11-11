"""Builds per-speaker piece lists (main time -> face source time) and the PiP visibility plan."""
import json
FPS=30; TOTAL=5400
seg=json.load(open("work/segments.json"))
S={k:[s for s in seg if s["spk"]==k] for k in ("tya","zaky")}
CLOSE0=160.0
# closing overrides (existing-audio path)
ZAKY_S1_END=169.43   # main time where the Zaky closing sentence ends (his take continues with other words afterwards)
TYA_CLOSE=[(161.50,193.19-0.0,"S1"),(169.90,416.10,"S2")]   # (main_t0, tya_src_t0): onset-aligned, see report
def pieces(spk):
    """list of dict(m0,m1,src0,mode) in seconds on the main timeline, piecewise-constant offset."""
    ss=sorted(S[spk],key=lambda s:s["start"])
    # constant-offset intervals; boundary between two segments = midpoint of the gap (or the refined cut if contiguous)
    iv=[]
    for i,s in enumerate(ss):
        a=0.0 if i==0 else (ss[i-1]["end"]+s["start"])/2
        iv.append([a,None,s["off"]])
        if i>0: iv[-2][1]=a
    iv[-1][1]=CLOSE0
    # merge neighbours with identical offset
    out=[]
    for a,b,o in iv:
        if out and abs(out[-1]["off"]-o)<1e-9: out[-1]["m1"]=b
        else: out.append(dict(m0=a,m1=b,off=o))
    res=[dict(m0=p["m0"],m1=p["m1"],src0=p["m0"]+p["off"],mode="play") for p in out]
    if spk=="zaky":
        # closing: play his take of sentence 1, then hold its last frame
        last=res[-1]; last["m1"]=ZAKY_S1_END+0.30
        res.append(dict(m0=last["m1"],m1=180.0,src0=last["m1"]+out[-1]["off"],mode="hold"))
        res[-1]["src0"]=last["m1"]+out[-1]["off"]
        # closing segment starts at 161.5; segments covering 160..161.5 continue the same offset
        # (already covered because the last interval starts at the gap midpoint)
    else:
        res[-1]["m1"]=TYA_CLOSE[0][0]-0.0
        res[-1]["m1"]=CLOSE0
        res.append(dict(m0=CLOSE0,m1=TYA_CLOSE[1][0],src0=TYA_CLOSE[0][1]-(TYA_CLOSE[0][0]-CLOSE0),mode="play"))
        TYA_END=TYA_CLOSE[1][0]+(419.88-TYA_CLOSE[1][1])+0.30   # 'Thank you.' ends at 419.88 in her recording; then hold
        res.append(dict(m0=TYA_CLOSE[1][0],m1=TYA_END,src0=TYA_CLOSE[1][1],mode="play"))
        res.append(dict(m0=TYA_END,m1=180.0,src0=TYA_CLOSE[1][1]+(TYA_END-TYA_CLOSE[1][0]),mode="hold"))
    return res
if __name__=="__main__":
    P={k:pieces(k) for k in S}
    json.dump(P,open("work/pieces.json","w"),indent=1)
    for k,v in P.items():
        print(k)
        for p in v: print(f"  main {p['m0']:7.2f}-{p['m1']:7.2f}  src {p['src0']:8.2f} {p['mode']}")
