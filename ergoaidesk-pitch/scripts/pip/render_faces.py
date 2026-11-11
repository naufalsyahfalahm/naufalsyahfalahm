import json, subprocess, sys
from pathlib import Path
FPS=30
U=Path("/root/.claude/uploads/b229099f-2597-5580-a7ef-9445cebf3b9a")
SRC={"tya":U/"08af3120-Mbak_Tya.mp4","zaky":U/"9a8b6b07-Zaky.mp4","tya2":U/"51b1f5a9-Mbak_Tya_2.mp4"}
LAB={"tya":"A","zaky":"B"}   # provisional labels (see report)
P=json.load(open("work/pieces.json"))
for spk,pieces in P.items():
    # quantise boundaries to the 30 fps grid
    edges=[round(p["m0"]*FPS) for p in pieces]+[5400]
    lines=[];labels=[]
    order=[]
    for p in pieces:
        k=p.get("src",spk)
        if k not in order: order.append(k)
    for i,p in enumerate(pieces):
        n=edges[i+1]-edges[i]
        if n<=0: continue
        s=p["src0"]-(p["m0"]*FPS-edges[i])/FPS  # keep source time consistent after rounding the start
        s=max(0.0,s)
        if p["mode"]=="play":
            f=f"[{order.index(p.get("src",spk))}:v]trim=start={s:.4f},setpts=PTS-STARTPTS,fps={FPS},tpad=stop_mode=clone:stop_duration=2,trim=end_frame={n},setpts=PTS-STARTPTS[p{i}]"
        else:
            f=f"[{order.index(p.get("src",spk))}:v]trim=start={s:.4f},setpts=PTS-STARTPTS,trim=end_frame=1,setpts=PTS-STARTPTS,fps={FPS},tpad=stop_mode=clone:stop={n-1},setpts=PTS-STARTPTS[p{i}]"
        lines.append(f);labels.append(f"[p{i}]")
    lines.append("".join(labels)+f"concat=n={len(labels)}:v=1:a=0,format=yuv420p[v]")
    script=Path(f"work/faces_{spk}.filter"); script.write_text(";\n".join(lines))
    out=Path(f"work/pip/face_{LAB[spk]}_aligned.mp4")
    subprocess.run(["ffmpeg","-v","error","-y",*sum((["-i",str(SRC[k])] for k in order),[]),"-filter_complex_script",str(script),"-map","[v]","-r",str(FPS),"-an",
                    "-c:v","libx264","-preset","veryfast","-crf","20","-pix_fmt","yuv420p",str(out)],check=True)
    print(out)
