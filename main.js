const parametersContainer = document.getElementById("parameters");
const chartCanvas = document.getElementById("simpleChart");
const displaySelect = document.getElementById("DisplayOptions");

let displayMode = displaySelect.value;
let csvData = {};
let timeData = [];
let yParameters = {};
let selectedDataList = [];
let selectedParameterNames = [];
let myChart = null;

// Update display mode when the select element changes
displaySelect.addEventListener("change", () => {
  displayMode = displaySelect.value;
  if (timeData.length && selectedDataList.length) {
    renderChart(timeData, selectedDataList, selectedParameterNames);
  }
});

// CSV file upload event listener
document.getElementById("csvFile").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (file) {
    try {
      csvData = await readCsv(file);
      processTimeData(csvData);
      displayParameters({ ...csvData });
    } catch (error) {
      console.error("Error reading CSV:", error);
    }
  }
});

// Read CSV file (assuming tab-delimited)
async function readCsv(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
      if (lines.length < 2) {
        return reject(new Error("CSV must contain a header and at least one row."));
      }

      const headers = lines[0].split("\t").map((header) => header.trim());
      const data = {};
      headers.forEach((header) => (data[header] = []));

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split("\t").map((value) => value.trim());
        headers.forEach((header, index) => {
          const num = parseFloat(values[index]);
          data[header].push(isNaN(num) ? values[index] : Math.round(num * 100) / 100);
        });
      }
      resolve(data);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsText(file);
  });
}

// Process time data (assumes time is in the column "Log Timestamp [498]")
function processTimeData(data) {
  if (!data["Log Timestamp [498]"] || !data["Log Timestamp [498]"].length) return;
  timeData = [];
  timeData.push(data["Log Timestamp [498]"][0]);
  for (let i = 1; i < data["Log Timestamp [498]"].length; i++) {
    const newTime = Math.round((timeData[i - 1] + data["Log Timestamp [498]"][i] / 1000) * 100) / 100;
    timeData.push(newTime);
  }
  yParameters = { ...data };
  delete yParameters["Log Timestamp [498]"];
}

// Dynamically create parameter checkboxes
function displayParameters(params) {
  parametersContainer.innerHTML = ""; // Clear existing parameters

  if (Object.keys(params).length === 0) return;

  for (const key in params) {
    const paramDiv = document.createElement("div");
    paramDiv.className = "parameter";

    const label = document.createElement("label");
    label.textContent = key;
    label.className = "parameter-label";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = key;
    checkbox.name = "y-variable";
    checkbox.className = "parameter-checkbox";

    // Update chart when a checkbox is toggled
    checkbox.addEventListener("change", () => {
      selectedDataList = [];
      selectedParameterNames = [];
      document.querySelectorAll(".parameter-checkbox").forEach((box) => {
        if (box.checked) {
          selectedDataList.push(yParameters[box.value]);
          selectedParameterNames.push(box.value);
        }
      });
      if (timeData.length && selectedDataList.length) {
        renderChart(timeData, selectedDataList, selectedParameterNames);
      }
    });

    paramDiv.appendChild(label);
    paramDiv.appendChild(checkbox);
    parametersContainer.appendChild(paramDiv);
  }
}

// Render the chart using Chart.js
function renderChart(tValues, yValues, parameterNames) {
  const datasets = [];
  const yAxisLimits = {};
  const yAxes = {
    x: {
      title: {
        display: true,
        text: "Time (s)"
      }
    }
  };

  // Destroy existing chart if needed
  if (myChart) {
    myChart.destroy();
    myChart = null;
  }

  yValues.forEach((dataArray, i) => {
    datasets.push({
      label: parameterNames[i],
      data: dataArray,
      borderWidth: 2,
      fill: false,
      yAxisID: `y${i}`,
      pointRadius: 0,       // Hide points by default
      pointHoverRadius: 0   // Hide hover points by default
    });

    // Configure the y-axis based on the selected display mode
    switch (displayMode) {
      case "Fully stacked":
        yAxes[`y${i}`] = {
          title: { display: true, text: parameterNames[i] },
          type: "linear",
          offset: true,
          position: "left",
          stack: "demo"
        };
        yAxisLimits[`y${i}`] = {
          min: Math.min(...dataArray) - (Math.max(...dataArray) - Math.min(...dataArray)) * 0.1,
          max: Math.max(...dataArray) + (Math.max(...dataArray) - Math.min(...dataArray)) * 0.1
        };
        break;
      case "Semi stacked":
        yAxes[`y${i}`] = {
          display: false,
          title: { display: true, text: parameterNames[i] },
          type: "linear",
          offset: true,
          position: "left",
          min: Math.min(...dataArray) - i * (Math.max(...dataArray) - Math.min(...dataArray)),
          max: Math.max(...dataArray) + (yValues.length - 1 - i) * (Math.max(...dataArray) - Math.min(...dataArray))
        };
        yAxisLimits[`y${i}`] = {
          min: Math.min(...dataArray) - i * (Math.max(...dataArray) - Math.min(...dataArray)),
          max: Math.max(...dataArray) + (yValues.length - 1 - i) * (Math.max(...dataArray) - Math.min(...dataArray))
        };
        break;
      case "not stacked":
      default:
        yAxes[`y${i}`] = {
          display: false,
          title: { display: true, text: parameterNames[i] },
          type: "linear",
          offset: true,
          position: "left",
          min: Math.min(...dataArray) - (Math.max(...dataArray) - Math.min(...dataArray)) * 0.1,
          max: Math.max(...dataArray) + (Math.max(...dataArray) - Math.min(...dataArray)) * 0.1
        };
        yAxisLimits[`y${i}`] = {
          min: Math.min(...dataArray) - (Math.max(...dataArray) - Math.min(...dataArray)) * 0.1,
          max: Math.max(...dataArray) + (Math.max(...dataArray) - Math.min(...dataArray)) * 0.1
        };
        break;
    }
  });

  myChart = new Chart(chartCanvas, {
    type: "line",
    data: {
      labels: tValues,
      datasets: datasets
    },
    options: {
      responsive: true,
      animation: false,
      scales: yAxes,
      plugins: {
        zoom: {
          limits: yAxisLimits,
          pan: {
            enabled: true,
            onPanStart({ chart, point }) {
              const area = chart.chartArea;
              const marginX = area.width * 0.1;
              const marginY = area.height * 0.1;
              if (
                point.x < area.left + marginX ||
                point.x > area.right - marginX ||
                point.y < area.top + marginY ||
                point.y > area.bottom - marginY
              ) {
                return false;
              }
            },
            mode: "xy",
            threshold: 100,
            speed: 0.3
          },
          zoom: {
            wheel: { enabled: true, speed: 0.1 },
            pinch: { enabled: true, speed: 0.2 },
            mode: "xy"
          }
        }
      }
    }
  });
}

// Toggle point markers on mouse events
function togglePointMarkers(radius) {
  if (myChart) {
    myChart.data.datasets.forEach((dataset) => {
      dataset.pointRadius = radius;
      dataset.pointHoverRadius = radius;
    });
    myChart.update();
  }
}

chartCanvas.addEventListener("mousedown", (e) => {
  if (e.button === 0) {
    togglePointMarkers(3); // Show markers when left mouse is pressed
  }
});

chartCanvas.addEventListener("mouseup", (e) => {
  if (e.button === 0) {
    togglePointMarkers(0); // Hide markers on release
  }
});

chartCanvas.addEventListener("mouseleave", () => {
  togglePointMarkers(0);
});
