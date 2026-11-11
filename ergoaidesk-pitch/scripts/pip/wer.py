import json,re,sys
def norm(s):
    s=s.lower().replace("ergo-ai desk","ergo ai desk").replace("multi-domain","multidomain").replace("-"," ")
    return re.findall(r"[a-z0-9']+",s)
REF=norm("ERGO-AI DESK integrates AI-based posture analysis and psychosocial assessment for multidomain ergonomic risk evaluation. Smarter assessment, healthier workplaces. Thank you.")
def wer(ref,hyp):
    d=list(range(len(hyp)+1))
    for i,r in enumerate(ref,1):
        p=d[:]; d[0]=i
        for j,h in enumerate(hyp,1): d[j]=min(p[j]+1,d[j-1]+1,p[j-1]+(r!=h))
    return d[-1]/len(ref)
def words_of(file):
    segs=json.load(open(file)); out=[]
    for s in segs:
        for w in s["words"]:
            for t in norm(w["w"]): out.append((t,w["s"],w["e"]))
    return out
def best(file,ref=REF):
    toks=words_of(file); n=len(ref); out=[]
    for i in range(len(toks)):
        for L in range(max(3,n-6),n+7):
            if i+L>len(toks): break
            hyp=[t[0] for t in toks[i:i+L]]
            out.append((wer(ref,hyp),toks[i][1],toks[i+L-1][2]," ".join(hyp)))
    out.sort(key=lambda x:x[0]); return out
if __name__=="__main__":
    print("REF:"," ".join(REF),len(REF))
    for n in ("tya","zaky"):
        for f in (f"work/{n}.words.json",f"work/{n}.words2.json"):
            try: r=best(f)
            except FileNotFoundError: continue
            print(n,f); seen=[]
            for w,s,e,h in r:
                if all(abs(s-x)>3 for x in seen):
                    seen.append(s); print(f"   WER={w:.3f}  {s:7.2f}-{e:7.2f}  {h}")
                if len(seen)==3: break
