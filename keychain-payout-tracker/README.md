# Keychain Payout Tracker

A small, static tracker for three friends selling acrylic keychains for 10 dhs each. Record pieces sold and effort each week, then see payback, profit shares, total earnings, and the current top seller. It uses plain HTML, CSS, and vanilla JavaScript with no dependencies or build step.

## How to use

Open `keychain-payout-tracker/index.html` in a browser, or visit the tracker subpath on the published GitHub Pages site. Update the three placeholder names, costs, contributions, and profit percentages in Business setup. Add a week and enter each person's pieces sold and effort points (hours). Weekly payouts update immediately.

Sales proceeds first repay the team's recorded contributions, proportionally to the remaining amount each person is owed. Any remaining pool is split using the configured sales, effort, and money-in percentages. The percentage weights are normalized when they do not add up to 100%. The setup warning compares the casing and printing costs with the total contributions.

Your latest data is saved in this browser's local storage. Use **Export data** to download a JSON backup, or **Import data** to restore a valid backup in another browser. The app does not send data to a server. If browser storage is blocked, the tracker still works for the current page session.

## Run the tests

Node.js 18 or newer is required for the built-in test runner. No install step is needed:

```sh
cd keychain-payout-tracker
node --test calc.test.js
```

## Deploy to GitHub Pages

The included `.github/workflows/pages.yml` workflow publishes the repository root whenever changes are pushed to `main`, and can also be started manually. It keeps the existing homepage at `/` and publishes this tracker at `/keychain-payout-tracker/`.

1. In the repository, open **Settings > Pages** and set the publishing source to **GitHub Actions** if it is not already selected. Repository Pages settings are not changed by this project.
2. Push the changes to `main`, or run **Deploy to GitHub Pages** from the **Actions** tab. The workflow builds no assets; it uploads the static files directly.
3. After the deployment succeeds, open `https://sxennn.github.io/hyperspectra-website/keychain-payout-tracker/`.

The Pages workflow uploads the repository root, so the existing homepage remains available at the site root. For a different default branch, update the `push.branches` value in the workflow.

## License

MIT. See [LICENSE](LICENSE).
