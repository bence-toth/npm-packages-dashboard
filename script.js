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
  if (!dailyData) {
    return [];
  }
  const weeklyData = [];
  for (let index = 0; index < dailyData.length; index += weekLength) {
    weeklyData.push(aggregateWeeksDataFromIndex(dailyData, index));
  }
  return weeklyData.slice(0, -1);
};

const getLastWeeksDownloads = (packageData) => {
  if (packageData.downloads.length === 0) {
    return 0;
  }
  return packageData.downloads[packageData.downloads.length - 1].downloads;
};

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
          watchers: packageData.subscribers_count,
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
      <li><i class="fa fa-exclamation-circle" aria-hidden="true"></i> ${summary.issues}</li>
    </ul>
  </header>
  <div id="chart-summary"></div>
`;

const getChartMarkup = (package) => `
  <header>
    <h2>${package.name}</h2>
    <ul>
      <li>
        <a target="_blank" rel="noopener" href="https://github.com/${package.repo}/stargazers">
          <i class="fa fa-star" aria-hidden="true"></i> ${package.stars}
        </a>
      </li>
      <li>
        <a target="_blank" rel="noopener" href="https://github.com/${package.repo}/watchers">
          <i class="fa fa-eye" aria-hidden="true"></i> ${package.watchers}
        </a>
      </li>
      <li>
        <a target="_blank" rel="noopener" href="https://github.com/${package.repo}/network/members">
          <i class="fa fa-code-fork" aria-hidden="true"></i> ${package.forks}
        </a>
      </li>
      <li>
        <a target="_blank" rel="noopener" href="https://github.com/${package.repo}/issues">
          <i class="fa fa-exclamation-circle" aria-hidden="true"></i> ${package.issues}
        </a>
      </li>
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
          accumulatedWeeklyValue.downloads +
          (current?.downloads[index]?.downloads ?? 0),
      })),
      stars: accumulator.stars + current.stars,
      watchers: accumulator.watchers + current.watchers,
      forks: accumulator.forks + current.forks,
      issues: accumulator.issues + current.issues,
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
  if (packageData.downloads.length === 0) {
    return;
  }
  const chart = new Taucharts.Chart(getChartParams(packageData));
  chart.renderTo(document.getElementById(`chart-${packageData.name}`));
};

const renderCharts = (packagesData) => {
  renderAggregationChart(packagesData);
  packagesData.forEach((packageData) => {
    renderPackageChart(packageData);
  });
};

const loadTauchartsStylesheet = () => {
  const darkModeMediaQueryMatcher = window.matchMedia(
    "(prefers-color-scheme: dark)"
  );
  const stylesheetURL = darkModeMediaQueryMatcher.matches
    ? "https://cdn.jsdelivr.net/npm/taucharts@2/dist/taucharts.dark.min.css"
    : "https://cdn.jsdelivr.net/npm/taucharts@2/dist/taucharts.min.css";
  document
    .getElementsByTagName("head")[0]
    .insertAdjacentHTML(
      "beforeend",
      `<link rel="stylesheet" type="text/css" href="${stylesheetURL}" />`
    );
};

const init = () => {
  loadTauchartsStylesheet();
  getPackagesDataFromNpm(packages)
    .then(getPackagesDataFromGitHub)
    .then(renderCharts);
};

init();
