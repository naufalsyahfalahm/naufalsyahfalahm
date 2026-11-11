import numpy as np, sys, json
W="work"
def load(n): return np.fromfile(f"{W}/{n}.8k.f32",dtype=np.float32)
SR=8000
def band(x):  # 300-3400 Hz band-pass via FFT
    X=np.fft.rfft(x); f=np.fft.rfftfreq(len(x),1/SR); X[(f<300)|(f>3400)]=0; return np.fft.irfft(X,len(x)).astype(np.float32)
def env(x,rate=100):
    h=SR//rate; n=len(x)//h
    e=np.sqrt((x[:n*h].reshape(n,h)**2).mean(1)+1e-10); return np.log(e)   # log-energy envelope @100 Hz
def ncc(template,y):
    n=len(template); t=(template-template.mean()); tn=np.sqrt((t**2).sum())+1e-9
    size=1<<int(np.ceil(np.log2(len(y)+n)))
    num=np.fft.irfft(np.fft.rfft(y,size)*np.conj(np.fft.rfft(t,size)),size)[:len(y)-n+1]
    cs=np.concatenate([[0],np.cumsum(y)]); cs2=np.concatenate([[0],np.cumsum(y**2)])
    s=cs[n:]-cs[:-n]; s2=cs2[n:]-cs2[:-n]
    var=s2-s*s/n; den=np.sqrt(np.maximum(var,1e-9))*tn
    return num/den
def run(query,refs,win=4.0,hop=1.0):
    q=env(band(load(query))); out=[]
    R={k:env(band(load(k))) for k in refs}
    for t0 in np.arange(0,len(q)/100-win,hop):
        tpl=q[int(t0*100):int((t0+win)*100)]
        if tpl.std()<0.35: continue   # silence window
        row={"t":round(float(t0),1)}
        for k,r in R.items():
            c=ncc(tpl,r); i=int(np.argmax(c)); pk=float(c[i])
            m=c.copy(); m[max(0,i-150):i+150]=-1; row[k]=(round(pk,3),round(i/100,2),round(pk-float(m.max()),3))
        out.append(row)
    return out
if __name__=="__main__":
    q=sys.argv[1]; refs=sys.argv[2:]
    res=run(q,refs); json.dump(res,open(f"{W}/corr_{q}.json","w"))
    print(len(res),"windows")
