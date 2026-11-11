import json,re,collections,sys
f=sys.argv[1]
r=json.load(open(f))
ts=open("src/generated/pip.ts").read()
T=json.loads(re.search(r"= (\{.*\}) as const",ts).group(1))
def lvl(fr,k):
    if not k: return 0
    if fr<=k[0][0]: return k[0][1]
    for a,b in zip(k[:-1],k[1:]):
        if fr<=b[0]: return a[1]+(b[1]-a[1])*(fr-a[0])/(b[0]-a[0]) if b[0]>a[0] else b[1]
    return k[-1][1]
bad=collections.defaultdict(list); n=0
for fr,h in r.items():
    fr=int(fr); R=max(lvl(fr,T["A"]["right"]),lvl(fr,T["B"]["right"])); L=lvl(fr,T["B"]["left"])
    for e in h or []:
        inR=("R" in e["zone"]) and R>0.05; inL=("L" in e["zone"]) and L>0.05
        if inR or inL:
            n+=1; bad[(e["tag"],e["txt"][:30],e["zone"])].append((fr,e["l"],e["t"],e["r"],e["b"]))
print("frames probed",len(r),"overlapping element-frames",n)
for k,v in bad.items(): print(k,"frames",min(x[0] for x in v),"-",max(x[0] for x in v),"rect",min(x[1] for x in v),min(x[2] for x in v),max(x[3] for x in v),max(x[4] for x in v))
