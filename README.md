# NPM packages dashboard

The dashboard is [available on GitHub pages](https://bence-toth.github.io/npm-packages-dashboard/).

The dashboard monitors a number of NPM packages, and for each package it displays on a chart:

- weekly downloads over time
- number of GitHub issues
- number of GitHub watchers
- number of GitHub forks

It also adds some useful links:

- NPM package page
- GitHub repo
- Dependabot alerts
- dependents

The charts are sorted (descending) by last week's total downloads.

There is a additional chart displayed which aggregates weekly downloads, number of issues, watchers, and forks across all monitored packages.

## Configure which packages you want to track

The packages being monitored are configured in [`./packages.js`](./packages.js). This file declares an array named `packages`, in which each package has its descriptor object listed. The descriptor object includes the package's name (on NPM) and the package's repository (on GitHub). For example:

```js
{
  name: "@organization/package-name",
  repo: "organization/package-name"
}
```

## License

`npm-packages-dashboard` is [licensed under MIT](./LICENSE.md). Do what you will, and have fun.
