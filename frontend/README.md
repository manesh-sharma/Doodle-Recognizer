# DoodleSense — React version

This is a React/Vite conversion of the supplied DoodleSense HTML prototype.

## Run

```bash
npm install
npm run dev
```

Then open the local Vite URL shown in the terminal.

## Included

- Explore/Home screen
- Play & Draw workspace
- Functional mouse/touch canvas
- Pencil, eraser, clear, save
- 11-color palette
- Brush size control
- New Word task generation
- AI loading/prediction flow
- Result/accuracy screen
- Gallery Vault with localStorage
- PNG download
- Login/nickname + guest mode
- About modal
- Community challenge toast
- Theme/status interaction

### Important
The current prediction values intentionally behave like the original prototype: they are simulated/randomized. To connect the real CNN/Keras model later, replace the `predict()` function in `src/App.jsx` with a call to your Flask/API endpoint.
