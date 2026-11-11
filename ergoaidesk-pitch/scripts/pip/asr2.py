import sys, json, subprocess, numpy as np
from faster_whisper import WhisperModel
name,path=sys.argv[1],sys.argv[2]
pcm=subprocess.run(["ffmpeg","-v","error","-i",path,"-ac","1","-ar","16000","-f","f32le","-"],capture_output=True,check=True).stdout
a=np.frombuffer(pcm,dtype=np.float32)
m=WhisperModel("work/models/small.en",device="cpu",compute_type="int8",cpu_threads=2)
segs,_=m.transcribe(a,language="en",word_timestamps=True,beam_size=5,vad_filter=True,vad_parameters=dict(min_silence_duration_ms=300,speech_pad_ms=200,threshold=0.3),condition_on_previous_text=False,no_speech_threshold=0.95,log_prob_threshold=-3.0,compression_ratio_threshold=3.0)
out=[]
for s in segs:
    out.append({"start":s.start,"end":s.end,"text":s.text,"words":[{"w":w.word,"s":w.start,"e":w.end,"p":w.probability} for w in s.words]})
json.dump(out,open(f"work/{name}.words2.json","w"))
print(name,"segments",len(out))
