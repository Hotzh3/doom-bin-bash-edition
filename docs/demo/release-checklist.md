# Release Checklist

Use this before a demo, handoff, or PR.

## Required Commands

```bash
npm run test
npm run lint
npm run build
```

## Manual Smoke

- Launch with `npm run dev`
- Start the raycast episode from menu with **`A`** or click **3D Mode**
- Verify move / turn / fire / weapon swap
- Verify token pickup, door open, at least one trigger, and one level exit
- Verify level-clear or episode-clear overlay instructions
- Return to menu with `ESC`
- Launch `ArenaScene` with **`B`**
- Verify arena still restarts and basic combat still works

## Browser Checks

- Open browser devtools once during the smoke pass
- Confirm there are no console errors
- Confirm there are no missing local asset requests or 404s

## Clean-Room Messaging

- Describe the game as an original retro horror raycast FPS
- Say inspiration is limited to classic genre feel, not copied content
- Do not imply Doom or Doom 64 assets, maps, code, names, or content are present

## Handoff Links

- Demo script: [docs/demo/raycast-demo-script.md](./raycast-demo-script.md)
- Manual feel checklist: [docs/playtest/raycast-feel-checklist.md](../playtest/raycast-feel-checklist.md)
- Portfolio / release readiness: [docs/phase25-release-readiness.md](../phase25-release-readiness.md)
- Documentation index: [docs/README.md](../README.md)
