//packages
//import Chart from 'chart.js'



//Global constants
const parameters = document.querySelector("#parameters");
const simpleChart = document.querySelector("#simpleChart");
const display = document.querySelector('#DisplayOptions');
var displaymode = display.value;
var csvAsJson = {};
var t = {};
var yParameters = {}
var datalist = [];
var parameterlist = [];
let myChart;

display.addEventListener("change", async function(event) {
    displaymode = display.value;
    displaygraph(t['time [s]'], datalist, parameterlist);
})



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

function displaygraph(tValues, yValues, parameter) {
    let dsets = [];
    let ylimits = {}
     if (myChart) {
         myChart.destroy();
         myChart = null; // Clear reference
     }
     let multiplescales = {
         'x': {
             title: {
                 display: true,
                 text: 'Time (s)'
             }
         }
     }
 
 
     for (i=0; i < yValues.length; i++) {
         dsets[i] = {
             label: parameter[i],
             data: yValues[i],
             borderWidth: 2,
             fill: false,
             yAxisID: `y${i}`
         };
        console.log(displaymode);
        switch(displaymode)    {
            case "Fully stacked":
                console.log('Fully stacked activated')
                multiplescales[`y${i}`] = 
                    {
                        
                        title: {
                            display: true,
                            text: parameter[i]    
                        },
                        
                        type: 'linear',
                        offset: true,
                        position: 'left',

                        
                        stack: 'demo',
                        //min: Math.min(...yValues[i]) - (Math.max(...yValues[i]) - Math.min(...yValues[i]))*0.1,
                        //max: Math.max(...yValues[i]) + (Math.max(...yValues[i]) - Math.min(...yValues[i]))*0.1           
                    }
                    ylimits[`y${i}`] = {
                        min: Math.min(...yValues[i]) - (Math.max(...yValues[i]) - Math.min(...yValues[i]))*0.1,
                        max: Math.max(...yValues[i]) + (Math.max(...yValues[i]) + Math.min(...yValues[i]))*0.1  
                    }
                    break;
            case "Semi stacked":
                console.log('Semi stacked activated')
                multiplescales[`y${i}`] = 
                    {
                        display: false,
                        title: {
                            display: true,
                            text: parameter[i]    
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
            console.log('not stacked activated')
                multiplescales[`y${i}`] = 
                    {
                        display: false,
                        title: {
                            display: true,
                            text: parameter[i]    
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
     console.log(multiplescales)
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