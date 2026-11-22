# Clock angle explorer

An interactive analogue clock for exploring angles. Set it to **09:00**: going from the hour hand to the minute hand takes **90° clockwise** or **270° counterclockwise**. Hide the answers and use the full-circle protractor to check your own measurement.

## Run locally

Open [index.html](./index.html) in a browser. Keep the other project files alongside it: the clock loads its stylesheet, scripts, and bundled copy of Three.js using relative paths. No server, package installation, build step, or internet connection is required.

## Use the clock

- **Set a time:** Drag either hand near its tip, choose an hour and minute from **00:00 to 23:59**, or select a preset. The dial uses a conventional 12-hour face.
- **Choose a clock mode:** **Realistic clock** advances the hour hand continuously as the minutes pass. **School clock** moves each hand independently and snaps the hour hand to the selected hour, even at 14:59.
- **Change the view:** **Default** looks straight down at the dial. In **3D**, drag an empty part of the face to rotate the clock without changing the time.
- **Measure by hand:** Under **Measurement tools**, turn off **Show angle arrows and values** and turn on **Full-circle protractor (360°)**. Rotate the marked rim until its zero line meets the hour hand. At the minute hand’s dotted guide, read the outer scale clockwise or the inner scale counterclockwise. For precise alignment, focus the fine-rotation slider and use the arrow keys for 0.5° steps.
- **Check your answer:** Turn the arrows and values back on. The two readings always add up to 360°; at noon and midnight, the clock uses 0° clockwise and 360° counterclockwise.

## Deploy to GitHub Pages

1. Add the project, including [.github/workflows/static.yml](./.github/workflows/static.yml) and the [vendor](./vendor/) directory, to your GitHub repository’s default branch.
2. In the repository, go to **Settings → Pages → Build and deployment** and select **GitHub Actions** as the source.
3. Open **Actions → Deploy clock to GitHub Pages → Run workflow** and select the default branch. Future pushes to that branch deploy automatically.
4. When the **deploy** job succeeds, follow its **github-pages** environment link to the live clock.

The workflow packages only the files the browser needs. It does not publish the README or repository metadata, and it does not require a `gh-pages` branch or a personal access token.

## Source files

| File | Purpose |
| --- | --- |
| [index.html](./index.html) | Dial, view switch, time controls, and measurement tools |
| [clock.js](./clock.js) | Three.js scene, hand movement, angle calculations, and rotating protractor |
| [styles.css](./styles.css) | Responsive layout, dial styling, and colors |
| [theme.js](./theme.js) | Light and dark theme selection |
| [vendor/three-clock.min.js](./vendor/three-clock.min.js) | Local Three.js bundle, including its MIT license |
