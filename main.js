//Global constants
const parameters = document.querySelector("#parameters");
const simpleChart = document.querySelector("#simpleChart");
const display = document.querySelector('#DisplayOptions');
const lightdarkemoji = document.querySelector('#lightdarkemoji')
var displaymode = display.value;
var csvAsJson = {};
var t = {};
var yParameters = {}
var datalist = [];
var parameterlist = [];
var myChart;
var prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)").matches;

lightdarkemoji.textContent = prefersDarkScheme ? '🌙': '☀️';


function changelightdark() {
    prefersDarkScheme = prefersDarkScheme ? 0:1;
    document.documentElement.style.setProperty('color-scheme', prefersDarkScheme ? "dark":"light");
    lightdarkemoji.textContent = prefersDarkScheme ? "🌙":"☀️";
    displaygraph(t['time [s]'], datalist, parameterlist);
}

lightdarkemoji.addEventListener("click", changelightdark);
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (window.matchMedia("(prefers-color-scheme: dark)").matches != prefersDarkScheme) {
        changelightdark();
    }
});


display.addEventListener("change", async function() {
    displaymode = display.value;
    displaygraph(t['time [s]'], datalist, parameterlist);
})

//main program
document.getElementById("csvFile").addEventListener("change", async function(event) {
    const file = event.target.files[0];
    csvAsJson = await readCsv(file);
    await getTime();   
    displayParameters();
    displayCreateParameterButton();
    createCreateParameterEventListener();
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
async function getTime()   {
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
function displayParameters() {
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
        new_parameter_checkbox.setAttribute("type", "checkbox");
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
            datalist = [];
            parameterlist = [];
            parameterCheck.forEach((checkbox) => {
            
                if (checkbox.checked)  {
                    datalist.push(yParameters[checkbox.getAttribute("value")]);
                    parameterlist.push(checkbox.getAttribute("value"));
                 
                }

            })
            displaygraph(t['time [s]'], datalist, parameterlist);
        })
    })
}

//display createParameterButton
function displayCreateParameterButton()   {
    const createParameterButtonBox = document.querySelector("#createParameterButtonBox")
    const createParameterButton = document.createElement("button");
    createParameterButton.textContent = 'new parameter';
    createParameterButton.setAttribute('id', "createParameterButton");
    createParameterButtonBox.appendChild(createParameterButton);
}

function createCreateParameterEventListener()    {
    document.getElementById('createParameterButton').addEventListener("click", () => {
        const new_parameter = prompt("name of the new parameter");
        const equation = prompt("equation of the new parameter.");
        if (equation === null) {
            console.log("No input given");
        } else {
            
            try {
                const result = [];
                for (var i = 0; i < t['time [s]'].length; i++) {
                    const scope = {};
                    let equation_t = equation
                    let j = 0;
                    for (let key in yParameters) {
                        if (equation.includes(key.toString())) {
                            j++
                            equation_t = equation_t.replace(new RegExp(escapeRegex(key), 'g'), `var${j}_${i}`)
                            console.log(equation_t)
                            Object.assign(scope, {[`var${j}_${i}`]: yParameters[key][i]});
                        }                
                    }
                    result.push(math.evaluate(equation_t, scope));
                }                
                Object.assign(yParameters, {[new_parameter]: result})
                displayParameters()
            } catch (error) {
                console.error("Invalid input:", error.message);
                alert("Error: Invalid mathematical expression! Please try again.");
            }
            
        }
    })
}
//create myChart object
function displaygraph(tValues, yValues, parameter) {
    let dsets = [];
    let ylimits = {};
    if (!prefersDarkScheme) {
        var gridColor = 'rgb(180, 180, 180)';
        var textcolor = 'rgb(0, 0, 0)';
    } else {
        var gridColor = 'rgb(70, 70, 70)';
        var textcolor = 'rgb(250, 250, 250)';
    }
    
     if (myChart) {
         myChart.destroy();
         myChart = null; // Clear reference
     }
     let multiplescales = {
         'x': {
             title: {
                 display: true,
                 text: 'Time (s)',
                 color: textcolor
             },

             grid: {
                color: gridColor,
             },
             ticks: {
                color: textcolor
             }

           
         }
     }
 
 
     for (i=0; i < yValues.length; i++) {
         dsets[i] = {
             label: parameter[i],
             data: yValues[i],
             borderWidth: 2,
             fill: false,
             yAxisID: `y${i}`,
             pointStyle: 'circle',
             pointRadius: 1,
             pointHoverRadius: 6, 
         };
        switch(displaymode)    {
            case "fully stacked":
                multiplescales[`y${i}`] = 
                    {
                        
                        title: {
                            display: true,
                            text: parameter[i],   
                            color: textcolor 
                        },
                       
                        type: 'linear',
                        offset: true,
                        position: 'left',                        
                        stack: 'demo',
                        grid: {
                            color: gridColor
                        },
                        ticks: {
                            color: textcolor
                         }
            
            
                    }
                    ylimits[`y${i}`] = {
                        min: Math.min(...yValues[i]) - (Math.max(...yValues[i]) - Math.min(...yValues[i]))*0.1,
                        max: Math.max(...yValues[i]) + (Math.max(...yValues[i]) + Math.min(...yValues[i]))*0.1  
                    }
                    

                    break;
            case "semi stacked":
                multiplescales[`y${i}`] = 
                    {
                        display: false,
                        title: {
                            display: true,
                            text: parameter[i],
                            color: textcolor 
                        },
                        grid: {
                            color: gridColor
                        },
                        ticks: {
                            color: textcolor
                         },
            
                        type: 'linear',
                        offset: true,
                        position: 'left',

                        
                        //stack: FALSE,
                        min: Math.min(...yValues[i]) - i*(Math.max(...yValues[i]) - Math.min(...yValues[i])),
                        max: Math.max(...yValues[i]) + (yValues.length -1 -i)*(Math.max(...yValues[i]) - Math.min(...yValues[i]))            
                        
                    }
                    ylimits[`y${i}`] = {
                        min: Math.min(...yValues[i]) - i*(Math.max(...yValues[i]) - Math.min(...yValues[i])),  
                        max: Math.max(...yValues[i]) + (yValues.length -1 -i)*(Math.max(...yValues[i]) - Math.min(...yValues[i]))
                    }
                    break;
            case "not stacked": 
                multiplescales[`y${i}`] = 
                    {
                        display: false,
                        title: {
                            display: true,
                            text: parameter[i],  
                            color: textcolor
                        },
                        grid: {
                            color: gridColor
                        },
                        ticks: {
                            color: textcolor
                         },
            
                        type: 'linear',
                        offset: true,
                        position: 'left',

                    
                        //stack: FALSE,
                        min: Math.min(...yValues[i]) - (Math.max(...yValues[i]) - Math.min(...yValues[i]))*0.1,
                        max: Math.max(...yValues[i]) + (Math.max(...yValues[i]) - Math.min(...yValues[i]))*0.1            
                    }
                    ylimits[`y${i}`] = {
                        min: Math.min(...yValues[i]) - (Math.max(...yValues[i]) - Math.min(...yValues[i]))*0.1,
                        max: Math.max(...yValues[i]) + (Math.max(...yValues[i]) - Math.min(...yValues[i]))*0.1 
                }
        }
    }
    
    myChart = new Chart(simpleChart, {
        type: 'line',
        data: {
            labels: tValues,
            datasets: dsets,
            
        },
        options: {
            
            responsive: true,
            animation: false,
            
            scales : multiplescales,
            
            plugins: {
                legend: {
                    labels: {color: textcolor}
                },
                tooltip: {
                    enabled: true
                },
               
                zoom: {
                    limits: ylimits,
                    pan: {
                        enabled: true,
                        onPanStart({chart, point}) {
                            const area = chart.chartArea;
                            const w10 = area.width * 0.1;
                            const h10 = area.height * 0.1;
                            if (point.x < area.left + w10 || point.x > area.right - w10
                               || point.y < area.top + h10 || point.y > area.bottom - h10) {
                               return false; // abort
                            }
                        },
                        mode: 'xy', // Enable panning on the x-axis
                        threshold: 100, // Minimum distance to start panning (useful for touch devices)
                        speed: 0.3, // Adjust pan speed (lower = slower)
                    },
                    zoom: {
                        wheel: {
                            enabled: true,
                            speed: 0.1
                        },
                        pinch: {
                            enabled: true, // Enable pinch zooming on touch devices
                            speed: 0.2
                        },
                        mode: 'xy', // Zoom in/out on the x-axis                        
                    }
                }
            }       
        },        
    });
}

//used to get rid of special characters in string so that they can be used in methods. 
function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape regex special characters
}
