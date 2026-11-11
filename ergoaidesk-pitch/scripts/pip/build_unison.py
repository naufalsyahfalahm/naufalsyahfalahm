import numpy as np, subprocess, json, wave
SR=48000
def rd(path):
    pcm=subprocess.run(["ffmpeg","-v","error","-i",path,"-ac","1","-ar",str(SR),"-f","f32le","-"],capture_output=True,check=True).stdout
    return np.frombuffer(pcm,dtype=np.float32).copy()
def wr(path,x):
    subprocess.run(["ffmpeg","-v","error","-y","-f","f32le","-ar",str(SR),"-ac","1","-i","-","-c:a","pcm_s16le",path],input=x.astype(np.float32).tobytes(),check=True)
def lufs(x):
    r=subprocess.run(["ffmpeg","-nostats","-f","f32le","-ar",str(SR),"-ac","1","-i","-","-af","ebur128=peak=true","-f","null","-"],input=x.astype(np.float32).tobytes(),capture_output=True)
    t=r.stderr.decode(); s=t[t.rfind("Summary"):]
    I=float([l for l in s.splitlines() if l.strip().startswith("I:")][0].split()[1])
    P=[l for l in s.splitlines() if "Peak:" in l]; P=float(P[0].split()[1]) if P else float("nan")
    return I,P
# 2b: conservative denoise, no gating, no pitch change
def denoise(inp,out): subprocess.run(["ffmpeg","-v","error","-y","-i",inp,"-af","afftdn=nr=6:nf=-45","-ar",str(SR),out],check=True)
denoise("work/tya_s1.wav","work/tya_s1_dn.wav"); denoise("work/zaky_s1.wav","work/zaky_s1_dn.wav")
T,Z=rd("work/tya_s1_dn.wav"),rd("work/zaky_s1_dn.wav")
def speech_span(x,lo,hi,lead=0.15):
    w=int(0.02*SR); n=len(x)//w; db=10*np.log10((x[:n*w].reshape(n,w)**2).mean(1)+1e-12)
    thr=np.percentile(db,95)-30; idx=[i for i in range(int(lo/0.02),min(n,int(hi/0.02))) if db[i]>thr]
    return max(0,idx[0]*0.02-lead),idx[-1]*0.02+0.02+lead
tz=speech_span(Z,5.0,12.9); tt=speech_span(T,4.0,13.6)
print("trimmed spans (slice s): zaky %.2f-%.2f  tya %.2f-%.2f"%(*tz,*tt))
# placement on the main timeline: zaky slice z -> 156.446+z ; tya slice u -> u + 156.446 - d_median(-0.130)
D=-0.130; OZ=156.446; OT=OZ-D
C0,C1=161.30,169.70           # canvas = whole frames (4839..5091)
n=int(round((C1-C0)*SR)); mix=np.zeros(n,dtype=np.float32)
def put(x,span,o,gain_db):
    a,b=span; seg=x[int(a*SR):int(b*SR)]*10**(gain_db/20)
    i=int(round((o+a-C0)*SR))
    if i<0: seg=seg[-i:]; i=0
    seg=seg[:max(0,n-i)]
    mix[i:i+len(seg)]+=seg
put(Z,tz,OZ,-3.0); put(T,tt,OT,-3.0)
# 100 ms fades at the canvas edges (crossfade with the ducked voiceover)
f=int(0.1*SR); ramp=np.linspace(0,1,f,dtype=np.float32); mix[:f]*=ramp; mix[-f:]*=ramp[::-1]
# loudness reference: 20 s before the closing (140-160 s) of the current voiceover
ref=rd("public/voiceover.mp3"); Iref,_=lufs(ref[int(140*SR):int(160*SR)])
cur=ref[int(161.30*SR):int(169.70*SR)]; Icur,_=lufs(cur)
I0,_=lufs(mix)
print("LUFS: reference 140-160 s %.1f | existing sentence window %.1f | unison before gain %.1f"%(Iref,Icur,I0))
g=0.0
if abs(I0-Iref)>1.0: g=Iref-I0
mix*=10**(g/20)
# true-peak limit -1.5 dBTP (4x oversampled check, simple limiter loop)
def tp(x):
    y=subprocess.run(["ffmpeg","-v","error","-f","f32le","-ar",str(SR),"-ac","1","-i","-","-af","aresample=192000","-f","f32le","-"],input=x.tobytes(),capture_output=True).stdout
    y=np.frombuffer(y,dtype=np.float32); return 20*np.log10(np.abs(y).max()+1e-12)
p=tp(mix)
if p>-1.6:
    mix*=10**((-1.6-p)/20); p=tp(mix)
I1,_=lufs(mix)
print("applied gain %+.1f dB | LUFS after %.1f (ref %.1f, diff %+.1f LU) | true peak %.2f dBTP"%(g,I1,Iref,I1-Iref,p))
wr("work/pip/closing_unison.wav",mix)
json.dump(dict(canvas=[C0,C1],tya_offset=OT,zaky_offset=OZ,gain_db=float(g),lufs_ref=float(Iref),lufs_before=float(I0),lufs_after=float(I1),true_peak=float(p),d_median=D),open("work/unison_info.json","w"))
