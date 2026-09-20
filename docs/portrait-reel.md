# Portrait theme reel

The five scenes use the existing, owner-supplied resume portrait at `img/pic.jpeg`. They are AI-created illustrative scenes, animated with camera motion and short transitions, not recordings of actual workplace events or generated facial/body motion.

Generation used the built-in imagegen tool, not the API/CLI fallback. Scene 1 establishes visual continuity; scenes 2–5 use the original portrait and scene 1 as references. No TeraBox download was needed. Other personal photos were not copied into the repository.

| Scene | Theme | Keyframe |
| --- | --- | --- |
| 01 | Performance engineering and data | `img/theme-face-01.png` |
| 02 | Automation and operations | `img/theme-face-02.png` |
| 03 | Architecture and platform foundations | `img/theme-face-03.png` |
| 04 | Product planning and UX | `img/theme-face-04.png` |
| 05 | AI adoption and agent integrations | `img/theme-face-05.png` |

## Render and publish

Run `python3 scripts/render-portrait-reel.py`, then `node scripts/build.mjs`. The renderer requires FFmpeg and writes `img/theme-portrait-reel.mp4`: 1600 × 900, 24 fps, 20 seconds, no audio, H.264/yuv420p, 0.5-second keyframes and faststart. Each chapter is four seconds; 8-frame transitions are centered at 4, 8, 12 and 16 seconds. The original film remains available at `img/theme-reel.mp4`.

The webpage provides five scene buttons alongside wheel/touch scrubbing. On narrow screens, the video crops toward the face and the copy sits below it. Reduced-motion preferences continue to skip the film.

## Final generation prompts

## Scene 1

```text
Use case: identity-preserve. Asset: cinematic photographic keyframe for a personal software-engineer resume intro, scene 1 of 5, landscape 16:9.
Input image: the provided existing resume portrait is the sole identity reference. Preserve this exact person's facial features, Korean appearance, age, black round glasses, dark straight fringe haircut, skin texture, and black crewneck over a pale blue shirt. Do not beautify or redesign the face.
Scene: performance engineering and high-volume data. The same man is at a modern engineering workstation, a three-quarter waist-up view with his face turned clearly toward the camera, one hand naturally at a keyboard. Behind and beside him, a few softly defocused monitors show abstract streaming data traces and a decreasing latency curve, with subtle server-rack depth. No readable text, logos, numbers, real code, or business data.
Composition: his face centered at about 73% image width and 33% image height, subject occupies the right half, eyes and glasses sharp, head has generous top margin. Left 45% is naturally dark navy negative space for live webpage copy. Keep important face detail out of extreme edges. The face should be large enough to recognize in a mobile crop. Medium shot, not a distant person.
Look: photorealistic premium editorial portrait, practical cool cyan monitor light balanced with natural skin tones, restrained soft warm rim light, realistic hands and fabric, shallow depth of field, cinematic contrast. This is a professional reenactment, not an actual event photo. Single full-bleed scene, no collage, no borders, no captions, no watermark.
```

## Scene 2

```text
undefined
```

## Scene 3

```text
undefined
```

## Scene 4

```text
undefined
```

## Scene 5

```text
undefined
```

