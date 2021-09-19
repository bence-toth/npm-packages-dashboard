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

const startDate = "2019-01-01";
const data = [];

const aggregateWeeklyData = (dailyData) => {
  var weekLength = 7;
  const weeklyData = [];
  for (var i = 0; i < dailyData.downloads.length; i += weekLength) {
    weeklyData.push(
      dailyData.downloads
        .slice(i, i + weekLength)
        .reduce((accumulator, current) => ({
          downloads: accumulator.downloads + current.downloads,
          day: accumulator.day,
        }))
    );
  }
  return {
    ...dailyData,
    downloads: weeklyData.slice(0, -1),
  };
};

const getLastWeeksDownloads = (data) =>
  data.downloads[data.downloads.length - 1].downloads;

const getPackagesData = () => {
  const packagesDataPromise = new Promise((resolve) => {
    const fetches = packages.map((package) =>
      fetch(
        `https://api.npmjs.org/downloads/range/${startDate}:${today}/${package.name}`
      )
        .then((response) => response.json())
        .then((data) => ({
          ...package,
          downloads: data.downloads,
        }))
    );
    Promise.all(fetches).then((packagesData) => {
      packagesData.forEach((packageDownloadsInfo) => {
        const dailyData = aggregateWeeklyData(packageDownloadsInfo);
        data.push(dailyData);
        return data;
      });
      data.sort(
        (left, right) =>
          getLastWeeksDownloads(right) - getLastWeeksDownloads(left)
      );
      resolve(data);
    });
  });
  return packagesDataPromise;
};

const renderCharts = () => {
  getPackagesData().then((data) => {
    data.forEach((package) => {
      const chartContainer = document.createElement("div");
      chartContainer.classList.add("chartContainer");
      chartContainer.innerHTML = `
        <h2>${package.name}</h2>
        <div>
          <div id="chart-${package.name}"></div>
        </div>
      `;
      document.getElementById("chartsContainer").appendChild(chartContainer);
      const chart = new ApexCharts(
        document.getElementById(`chart-${package.name}`),
        {
          chart: {
            type: "line",
          },
          series: [
            {
              name: "Downloads",
              data: package.downloads.map((dataPoint) => dataPoint.downloads),
            },
          ],
          xaxis: {
            categories: package.downloads.map((dataPoint) => dataPoint.day),
          },
        }
      );
      chart.render();
    });
  });
};

renderCharts();
