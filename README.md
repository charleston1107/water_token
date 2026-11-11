# Water Token System

A responsive React + TypeScript institutional dashboard with a persistent student account, timestamp-based shower controller, regional assessment reports and a shared incentive ledger.

## Run

Requires Node.js 22 or newer.

```sh
npm install
npm run dev
```

Open the local address printed by Vite. Use `npm run build` for the production bundle and `npm run preview` to serve it. Fonts load from Google Fonts, with local Arial fallbacks.

## Verify the exhibition flow

```sh
npm test
npm run build
```

Start a shower: at 10 seconds the yellow indicator turns on; at 20 seconds the red indicator turns on; at 25 seconds the personal account reaches zero; at 30 seconds stop to see 60 WT consumed, 50 WT personal deductions and 10 WT dorm deductions. The shower keeps running when navigating to the regional page. Both reserves empty after 235 seconds from the initial account and water access stops automatically. Repeated sessions continue using the current account.

Regional assessments advance every 30 seconds across both pages. Refreshing retains the current account, active shower and regional assessment epoch. Elapsed shower consumption during a closed tab is reconciled on return. Local storage is the demonstration ledger; no backend is required.

Expand **Administration** in the footer to approve a +5 WT Dryshine award or use **Reset Demo**. Each approval is an independent approved participation record and transfers 5 WT from the limited university pool. Reset restores the original account and regional epoch. The renewal policy is displayed; daily renewal is not scheduled automatically so exhibition state remains stable until reset.

## Files and editing data

- `src/main.tsx`: shared interface components, both dashboards, navigation and admin controls.
- `src/style.css`: strict personal and regional palettes, responsive layouts, typography.
- `src/domain.ts`: initial allocations, timestamp-based consumption, session summaries, reserve hierarchy, bonuses, shortfalls and reset initialization.
- `src/store.ts`: centralized account state, local storage, event handling and view-independent clock.
- `src/regional.ts`: six predefined regional reports and assessment-cycle calculation.
- `src/hardware.ts`: domain event bus and hardware transport boundary.
- `src/domain.test.ts`: calculation, threshold, transfer, cycle and adapter tests.

## Arduino connection

The UNO R3 potentiometer controller is implemented. See [Arduino wiring and setup guide](arduino/README.md) for wiring, uploading, browser setup, threshold calibration and troubleshooting.

- Firmware: `arduino/shower/shower.ino` (A0, 115200 baud, start >800, stop <760).
- Browser transport: `src/serial.ts`; line protocol and edge handling: `src/serialProtocol.ts`.
- Connection panel: `src/ArduinoControl.tsx`; protocol and interaction tests: `src/serialProtocol.test.ts`.

Use desktop Chrome or Edge at localhost or an HTTPS deployment. Click **CONNECT ARDUINO** and choose the USB serial port. Close Arduino Serial Monitor first. The board sends physical valve state; the existing hardware event bus handles timing and billing. Disconnect or loss of valid readings for three seconds ends the shower. Reset and forced stop require a low-to-high knob transition before starting again. External status LEDs and water actuators remain future integrations via `LED_STATE_CHANGE` and `SHOWER_FORCE_STOP`.

## Deploy to GitHub Pages

The repository includes `.github/workflows/deploy.yml`. It tests, builds and publishes the `dist` folder when you push to `main`. Relative asset URLs in `vite.config.ts` support Pages repository subpaths without editing the repository name.

1. Create an empty public GitHub repository, for example `water-token-system`. Leave the README, .gitignore and license initialization options unchecked.
2. From this project's root folder, run the commands below, replacing `YOUR_USERNAME` with your GitHub username. These initialization commands assume a new local repository.

```sh
git init
git branch -M main
git add .
git commit -m "Add Water Token System and Pages deployment"
git remote add origin https://github.com/YOUR_USERNAME/water-token-system.git
```

3. In the GitHub repository, open **Settings → Pages → Build and deployment → Source → GitHub Actions**.
4. Push the code:

```sh
git push -u origin main
```

5. In the **Actions** tab, wait for **Deploy Water Token System to GitHub Pages** to finish. The deployed URL appears in the deployment output and **Settings → Pages**, normally `https://YOUR_USERNAME.github.io/water-token-system/`.
6. If the first workflow ran before Pages was enabled, enable Pages and rerun the workflow using **Actions → Deploy Water Token System to GitHub Pages → Run workflow**.

Subsequent updates:

```sh
git add .
git commit -m "Update Water Token System"
git push
```

`node_modules`, `dist` and TypeScript build metadata are excluded by `.gitignore`. Commit `package-lock.json`, the source and `.github/workflows/deploy.yml`. GitHub will build the website; uploading source files alone to a branch-based Pages site will not compile React.

The Pages workflow sets `VITE_SHOW_ARDUINO=false`, hiding the USB controller panel. Shower buttons, balances, summaries, regional assessments and reset remain fully functional. Local `npm run dev` keeps the Arduino panel visible. To show it on Pages, set that workflow variable to `'true'` and redeploy.

Accounts are stored in each visitor's browser, without a shared server database. The deployed site and localhost have separate demonstration state.
# water_token
