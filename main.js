//packages
//import Chart from 'chart.js'



//Global constants
const parameters = document.querySelector("#parameters");
const simpleChart = document.querySelector("#simpleChart");
var parameterCheck = document.querySelectorAll(".parameter_check");
var csvAsJson = {};
var t = {};
var yParameters = {};
let myChart;



//Eventlistener upload csv
document.getElementById("csvFile").addEventListener("change", async function(event) {
    const file = event.target.files[0];
    csvAsJson = await readCsv(file);
    await getTime(csvAsJson);   
    displayParameters(yParameters);
    
});




  


//Read csv
async function readCsv(file)   {
    return new Promise((resolve, reject) => {
        if (!file) return;
        
        const reader = new FileReader();
        const Json = {}
        reader.onload = async function(e) {
            const text = e.target.result;
            const lines = text.split("\n").map(line => line.trim()).filter(line => line); // Remove empty lines
            if (lines.length < 2) return; // Ensure we have at least a header + one row

            const headers = lines[0].split("\t").map(header => header.trim());
            

            // Initialize keys with empty arrays
            headers.forEach(header => {
                Json[header] = [];
            });

            // Process each row
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split("\t").map(value => value.trim());
                
                // Add each value to its corresponding key
                headers.forEach((header, index) => {
                    Json[header].push(Math.round(parseFloat(values[index])*100)/100); 
                });
            }
            resolve(Json)
        };
        reader.onerror = (error) => reject(error);
        reader.readAsText(file);
    });
}

//seperatate t from y parameters
async function getTime(csvAsJson)   {
    t = {'time [s]': []};
    t['time [s]'].push(csvAsJson['Log Timestamp [498]'][0]);
    for (let i = 1; i < csvAsJson['Log Timestamp [498]'].length; i++)  {
        new_t = Math.round((t['time [s]'][i-1] + csvAsJson['Log Timestamp [498]'][i]/1000)*100)/100;
        t['time [s]'].push(new_t);
    } 
    yParameters = {...csvAsJson};
    delete yParameters['Log Timestamp [498]'];
}

//display csv parameters
function displayParameters(yParameters) {
    //delete all old parameters
    const oldParameters = document.querySelectorAll(".parameter");
    oldParameters.forEach((oldParamter) => {
        oldParamter.remove();
    });
    if (JSON.stringify(yParameters) === '{}') {console.log('DisplayParamters returned'); return;} // check if jsonobject is empty. 

    for (const key in yParameters) {
        //for each key(parameter in the json object create a div with parameter class)
        const new_parameter = document.createElement("div");
        new_parameter.classList.add('parameter');


        //for each div with parameter class create a parameter label with the key as text and parameter_value as class. 
        const new_parameter_value = document.createElement("p");
        new_parameter_value.textContent = key;
        new_parameter_value.classList.add('parameter_value');
        new_parameter.appendChild(new_parameter_value);

        //for each div with parameter class add a checkbox with class parameter_checkbox.
        const new_parameter_checkbox = document.createElement("input");
        new_parameter_checkbox.setAttribute("type", "radio");
        new_parameter_checkbox.setAttribute("value", key);
        new_parameter_checkbox.setAttribute("name", "y-variable");
        new_parameter_checkbox.classList.add('parameter_check');
        new_parameter.appendChild(new_parameter_checkbox);
        parameters.appendChild(new_parameter);
    }
    parameterCheck = document.querySelectorAll(".parameter_check");
    //Eventlister for buttons
    parameterCheck.forEach((parameterSelected) => {
    parameterSelected.addEventListener("change", async function(event) {
        
        //console.log(event.target.value);
        displaygraph(t['time [s]'], yParameters[event.target.value], event.target.value);
    })
})
}

function displaygraph(tValues, yValues, parameter) {
   
    if (myChart) {
        myChart.destroy();
        myChart = null; // Clear reference
    }

    myChart = new Chart(simpleChart, {
        type: 'line',
        data: {
            labels: tValues,
            datasets: [{
                label: parameter,
                data: yValues,
                borderColor: 'blue',
                borderWidth: 2,
                fill: false
            }]
        },
        options: {
            //responsive: true,
            animation: false,
            /*
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            },
            */
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Time (s)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: parameter
                    }
                }
            },
            plugins: {
                /*
                decimation: {
                    enabled: true,
                    algorithm: 'lttb', // 'lttb' (Largest Triangle Three Buckets) is great for line charts
                    samples: 100 // Reduces dataset to 100 points when zoomed in
                },
                */
                zoom: {
                    pan: {
                        enabled: true,
                        mode: 'xy' // Enable panning on the x-axis
                    },
                    zoom: {
                        wheel: {
                            enabled: true,
                            speed: 0.4
                        },
                        pinch: {
                            enabled: true // Enable pinch zooming on touch devices
                        },
                        mode: 'xy', // Zoom in/out on the x-axis                        
                    }
                }
            }       
        },        
    });
}

