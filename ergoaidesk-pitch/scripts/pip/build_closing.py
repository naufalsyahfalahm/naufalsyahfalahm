"""Closing audio v2: sentence 1 = Tya alone (Mbak_Tya.mp4 take); sentences 2-3 = Tya (Mbak_Tya_2.mp4) + Zaky (Zaky_2.mp4), both recordings, as a unison."""
import numpy as np, subprocess, json
SR=48000
def rd(path):
    return np.frombuffer(subprocess.run(["ffmpeg","-v","error","-i",path,"-ac","1","-ar",str(SR),"-f","f32le","-"],capture_output=True,check=True).stdout,dtype=np.float32).copy()
def wr(path,x): subprocess.run(["ffmpeg","-v","error","-y","-f","f32le","-ar",str(SR),"-ac","1","-i","-","-c:a","pcm_s16le",path],input=x.astype(np.float32).tobytes(),check=True)
def lufs(x):
    r=subprocess.run(["ffmpeg","-nostats","-f","f32le","-ar",str(SR),"-ac","1","-i","-","-af","ebur128=peak=true","-f","null","-"],input=x.astype(np.float32).tobytes(),capture_output=True)
    s=r.stderr.decode(); s=s[s.rfind("Summary"):]
    return float([l for l in s.splitlines() if l.strip().startswith("I:")][0].split()[1])
def tp(x):
    y=np.frombuffer(subprocess.run(["ffmpeg","-v","error","-f","f32le","-ar",str(SR),"-ac","1","-i","-","-af","aresample=192000","-f","f32le","-"],input=x.astype(np.float32).tobytes(),capture_output=True).stdout,dtype=np.float32)
    return float(20*np.log10(np.abs(y).max()+1e-12))
def denoise(i,o):
    subprocess.run(["ffmpeg","-v","error","-y","-i",i,"-af","afftdn=nr=6:nf=-45","-ar",str(SR),o],check=True)
    # afftdn delays the signal (about 28 ms): measure it against the input and remove it, so timing is unchanged
    a,b=rd(i),rd(o); n=min(len(a),len(b)); X=np.fft.rfft(a[:n],2*n); Y=np.fft.rfft(b[:n],2*n); c=np.fft.irfft(Y*np.conj(X)); m=4800
    d=int(np.argmax(np.concatenate([c[-m:],c[:m+1]])))-m
    wr(o,np.concatenate([b[max(d,0):],np.zeros(max(d,0),dtype=np.float32)]))
    print("denoise latency removed: %.1f ms (%s)"%(d/SR*1000,i))
denoise("work/tya_s1.wav","work/tya_s1_dn.wav"); denoise("work/tya2.wav","work/tya2_dn.wav"); denoise("work/zaky2.wav","work/zaky2_dn.wav")
T1,T2,V=rd("work/tya_s1_dn.wav"),rd("work/tya2_dn.wav"),rd("work/zaky2_dn.wav")
VO=rd("public/voiceover.mp3"); ref=lufs(VO[int(140*SR):int(160*SR)])
C0,C1=161.30,174.00; n=int(round((C1-C0)*SR))
def canvas(): return np.zeros(n,dtype=np.float32)
def put(buf,x,a,b,main_of_slice_time):   # x slice, [a,b] slice seconds, placed at main_of_slice_time(a)
    seg=x[int(a*SR):int(b*SR)].copy(); i=int(round((main_of_slice_time-C0)*SR))
    if i<0: seg=seg[-i:]; i=0
    seg=seg[:max(0,n-i)]; buf[i:i+len(seg)]+=seg
fade=lambda seg,k=0.02: None
# ---- sentence 1: Tya alone. speech onset 5.00 s in the slice -> 161.45 s on the main timeline
S1=canvas(); a,b=4.85,13.45
seg=T1[int(a*SR):int(b*SR)].copy(); f=int(0.25*SR); seg[-f:]*=np.linspace(1,0,f,dtype=np.float32); f2=int(0.05*SR); seg[:f2]*=np.linspace(0,1,f2,dtype=np.float32)
i=int(round((161.45-0.15-C0)*SR)); S1[i:i+len(seg)]+=seg
g1=ref-lufs(S1[:int(169.9-C0)*SR] if False else S1[int((161.3-C0)*SR):int((169.9-C0)*SR)]); S1*=10**(g1/20)
# ---- sentences 2-3: unison. Zaky_2 time u -> main u+168.60 (onset 1.30 s -> 169.90 s); Tya_2 time u -> main u - D + 168.60
D=0.26   # median start offset (Tya_2 minus Zaky_2, same word, faster-whisper word starts), s
S2=canvas()
put(S2,V*10**(-3/20),1.15,5.35,1.15+168.60)
put(S2,T2*10**(-3/20),1.35,5.35,1.35-D+168.60)
seg_lo,seg_hi=int((169.6-C0)*SR),int((173.9-C0)*SR)
I0=lufs(S2[seg_lo:seg_hi]); g2=0.0 if abs(I0-ref)<=1.0 else ref-I0; S2*=10**(g2/20)
mix=S1+S2
f=int(0.1*SR); ramp=np.linspace(0,1,f,dtype=np.float32); mix[:f]*=ramp; mix[-f:]*=ramp[::-1]
p=tp(mix)
if p>-1.6:
    # look-ahead limiter instead of a global gain cut, so the loudness target is kept
    lim=subprocess.run(["ffmpeg","-v","error","-f","f32le","-ar",str(SR),"-ac","1","-i","-","-af","alimiter=limit=%.4f:attack=5:release=60:level=disabled"%(10**(-2.2/20)),"-f","f32le","-"],input=mix.tobytes(),capture_output=True,check=True).stdout
    mix=np.frombuffer(lim,dtype=np.float32).copy(); p=tp(mix)
    if p>-1.6: mix*=10**((-1.6-p)/20); p=tp(mix)
r1=lufs(mix[int((161.3-C0)*SR):int((169.55-C0)*SR)]); r2=lufs(mix[seg_lo:seg_hi])
print("ref %.1f | S1 gain %+.1f dB -> %.1f LUFS | S2 before %.1f, gain %+.1f -> %.1f LUFS | true peak %.2f dBTP"%(ref,g1,r1,I0,g2,r2,p))
wr("work/pip/closing_unison.wav",mix)
json.dump(dict(canvas=[C0,C1],ref=ref,s1_gain=float(g1),s1_lufs=r1,s2_lufs_before=float(I0),s2_gain=float(g2),s2_lufs=r2,true_peak=p,d_median=D,tya_s1_onset_main=161.45,tya2_main_offset=168.60-D,zaky2_main_offset=168.60),open("work/closing_info.json","w"))
