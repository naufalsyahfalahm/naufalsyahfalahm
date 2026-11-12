# Ergo AI Desk usage walkthrough (Remotion)

Step-by-step walkthrough built only from the interactive-mockup assets (all screens are mockups with simulated data).
See `report.md` (probes, trims, placeholders, verification), `captions_check.md`, `focus_check.md`.

```bash
npm install
npm run dev      # Remotion Studio
npm run render   # out/ergoai-usage.mp4 + out/ergoai-usage.srt
npm run stills   # out/stills/
```

Everything editable is in `src/config.ts` and `src/captions.ts`. Language: `lang` in config or `--props='{"lang":"id"}'`.
Optional voiceover: `public/audio/voiceover.wav` (run `npm run scan` after adding it).
