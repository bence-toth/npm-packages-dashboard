const packages = [
  { name: "@bence.a.toth/cra-template", repo: "bence-toth/cra-template" },
  { name: "@bence.a.toth/eslint-config", repo: "bence-toth/eslint-config" },
  { name: "create-react-thing", repo: "bence-toth/create-react-thing" },
  { name: "react-hook-clipboard", repo: "bence-toth/react-hook-clipboard" },
  {
    name: "react-hook-device-orientation",
    repo: "bence-toth/react-hook-device-orientation",
  },
  { name: "react-hook-geolocation", repo: "bence-toth/react-hook-geolocation" },
  {
    name: "react-hook-local-web-storage",
    repo: "bence-toth/react-hook-local-web-storage",
  },
  { name: "react-hook-media-query", repo: "bence-toth/react-hook-media-query" },
  { name: "react-hook-mouse", repo: "bence-toth/react-hook-mouse" },
  {
    name: "react-hook-screen-orientation",
    repo: "bence-toth/react-hook-screen-orientation",
  },
  { name: "react-hook-selection", repo: "bence-toth/react-hook-selection" },
  {
    name: "react-hook-session-web-storage",
    repo: "bence-toth/react-hook-session-web-storage",
  },
  {
    name: "react-hook-viewport-size",
    repo: "bence-toth/react-hook-viewport-size",
  },
  {
    name: "react-hook-viewport-visibility",
    repo: "bence-toth/react-hook-viewport-visibility",
  },
  { name: "split-mp3", repo: "bence-toth/split-mp3" },
  { name: "triangle-mosaic", repo: "bence-toth/triangle-mosaic" },
];

const today = new Date();
const todayYear = today.getFullYear();
const todayMonth = String(today.getMonth() + 1).padStart(2, "0");
const todayDay = String(today.getDate() + 1).padStart(2, "0");
const todayDate = [todayYear, todayMonth, todayDay].join("-");
const weekLength = 7;

const startDate = "2019-01-01";
const packagesData = [];

const aggregateWeeksDataFromIndex = (dailyData, index) =>
  dailyData.slice(index, index + weekLength).reduce((accumulator, current) => ({
    downloads: accumulator.downloads + current.downloads,
    day: accumulator.day,
  }));

const aggregateWeeklyData = (dailyData) => {
  const weeklyData = [];
  for (let index = 0; index < dailyData.length; index += weekLength) {
    weeklyData.push(aggregateWeeksDataFromIndex(dailyData, index));
  }
  return weeklyData.slice(0, -1);
};

const getLastWeeksDownloads = (packageData) =>
  packageData.downloads[packageData.downloads.length - 1].downloads;

const sortByLastWeeksDownloads = (left, right) =>
  getLastWeeksDownloads(right) - getLastWeeksDownloads(left);

const getPackagesDataFromNpm = (packages) => {
  const packagesDataPromise = new Promise((resolve) => {
    const fetches = packages.map((package) =>
      fetch(
        `https://api.npmjs.org/downloads/range/${startDate}:${today}/${package.name}`
      )
        .then((response) => response.json())
        .then((packageData) => ({
          ...package,
          downloads: aggregateWeeklyData(packageData.downloads),
        }))
    );
    Promise.all(fetches).then((packagesData) => {
      packagesData.sort(sortByLastWeeksDownloads);
      resolve(packagesData);
    });
  });
  return packagesDataPromise;
};

const getPackagesDataFromGitHub = (packages) => {
  const packagesPromise = new Promise((resolve) => {
    const fetches = packages.map((package) =>
      fetch(`https://api.github.com/repos/${package.repo}`)
        .then((response) => response.json())
        .then((packageData) => ({
          stars: packageData.stargazers_count,
          watchers: packageData.watchers_count,
          forks: packageData.forks_count,
          issues: packageData.open_issues_count,
          ...package,
        }))
    );
    Promise.all(fetches).then((packagesData) => {
      resolve(packagesData);
    });
  });
  return packagesPromise;
};

const getSummaryChartMarkup = (summary) => `
  <header>
    <h2>Overall package downloads</h2>
    <ul>
      <li><i class="fa fa-star" aria-hidden="true"></i> ${summary.stars}</li>
      <li><i class="fa fa-eye" aria-hidden="true"></i> ${summary.watchers}</li>
      <li><i class="fa fa-code-fork" aria-hidden="true"></i> ${summary.forks}</li>
    </ul>
  </header>
  <div id="chart-summary"></div>
`;

const getChartMarkup = (package) => `
  <header>
    <h2>${package.name}</h2>
    <ul>
      <li><i class="fa fa-star" aria-hidden="true"></i> ${package.stars}</li>
      <li><i class="fa fa-eye" aria-hidden="true"></i> ${package.watchers}</li>
      <li><i class="fa fa-code-fork" aria-hidden="true"></i> ${package.forks}</li>
      <li><i class="fa fa-exclamation-circle" aria-hidden="true"></i> ${package.issues}</li>
    </ul>
  </header>
  <div id="chart-${package.name}"></div>
  <footer>
    <nav>
      <ul>
        <li>
          <a target="_blank" rel="noopener" href="https://github.com/${package.repo}">GitHub</a>
        </li>
        <li>
          <a target="_blank" rel="noopener" href="https://github.com/${package.repo}/security/dependabot">Dependabot alerts</a>
        </li>
        <li>
          <a target="_blank" rel="noopener" href="https://github.com/${package.repo}/network/dependents">Dependents</a>
        </li>
        <li>
          <a target="_blank" rel="noopener" href="https://www.npmjs.com/package/${package.name}">NPM</a>
        </li>
      </ul>
    </nav>
  </footer>
`;

const getChartParams = (packageData) => ({
  data: packageData.downloads.map((dataPoint) => ({
    downloads: dataPoint.downloads,
    date: new Date(dataPoint.day),
  })),
  type: "line",
  x: "date",
  y: "downloads",
  settings: {
    fitModel: "fit-width",
  },
  guide: {
    interpolate: "smooth-keep-extremum",
    x: { tickFormat: "month" },
  },
});

const renderAggregationChart = (packagesData) => {
  const aggregatedPackagesData = packagesData.reduce(
    (accumulator, current) => ({
      downloads: accumulator.downloads.map((accumulatedWeeklyValue, index) => ({
        day: accumulatedWeeklyValue.day,
        downloads:
          accumulatedWeeklyValue.downloads + current.downloads[index].downloads,
      })),
      stars: accumulator.stars + current.stars,
      watchers: accumulator.stars + current.watchers,
      forks: accumulator.forks + current.forks,
    })
  );
  const chartContainer = document.createElement("div");
  chartContainer.classList.add("chartContainer");
  chartContainer.innerHTML = getSummaryChartMarkup(aggregatedPackagesData);
  document.getElementById("chartsContainer").appendChild(chartContainer);
  const chart = new Taucharts.Chart(getChartParams(aggregatedPackagesData));
  chart.renderTo(document.getElementById("chart-summary"));
};

const renderPackageChart = (packageData) => {
  const chartContainer = document.createElement("div");
  chartContainer.classList.add("chartContainer");
  chartContainer.innerHTML = getChartMarkup(packageData);
  document.getElementById("chartsContainer").appendChild(chartContainer);
  const chart = new Taucharts.Chart(getChartParams(packageData));
  chart.renderTo(document.getElementById(`chart-${packageData.name}`));
};

const renderCharts = (packagesData) => {
  renderAggregationChart(packagesData);
  packagesData.forEach((packageData) => {
    renderPackageChart(packageData);
  });
};

getPackagesDataFromNpm(packages)
  .then(getPackagesDataFromGitHub)
  .then(renderCharts);
