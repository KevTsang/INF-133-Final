async function callGeocodingAPI() {
  const apiKey = 'AIzaSyDI5PSATFRSVSgm9_BoWtZHYw-9YdbUWT4';
  const address = document.getElementById("location").value; //User Input
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;

  console.log(encodeURIComponent(address));

  const coordinates = fetch(url)
      .then(response => response.json())
      .then(data => {
          if (data.results && data.results.length > 0) {
                const location = data.results[0].geometry.location;
                const latitude = location.lat;
                const longitude = location.lng;
                console.log(latitude + " " + longitude);
                
                return { latitude, longitude };
          }
      })
      .then(coordinates => {
        callWeatherAPI(coordinates.latitude, coordinates.longitude);
      })
      .catch(error => {
          console.error('Error', error);
      });
}

async function callWeatherAPI(latitude, longitude) {
    try {
        const url = `https://api.weather.gov/points/${latitude},${longitude}`;
        
        //first fetch
        const response = await fetch(url);
        const data = await response.json();

        //second fetch to select daily forecast
        const forecastUrl = data.properties.forecast;
        const forecastResponse = await fetch(forecastUrl);
        const forecastData = await forecastResponse.json();

        //filter forecast detail
        const periods = forecastData.properties.periods;
        const dailyReport = [];
        for(const period of periods)
        {

            const filteredData = {
                name: period.name,
                temperature: period.temperature,
                detailedForecast: period.detailedForecast,
            };

            dailyReport.push(filteredData)
        }

        console.log(dailyReport);
        return dailyReport;

    } catch (error) {
        console.error('Error', error);
    }
}

//display dailyReport data in a table
function displayData(dailyReport){
    const dataContainer = document.getElementById('forecastDataContainer');
    
    //empty the div container
    dataContainer.innerHTML = ''; 
    // Create a table 
    const table = document.createElement('table');
    const headerRow = document.createElement('tr');
    
    // Create headers depending on object properties
    const headers = Object.keys(dailyReport[0]);  
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    // Create rows for each object
    dailyReport.forEach(item => {
        const row = document.createElement('tr');

        headers.forEach(header => {
            const cell = document.createElement('td');
            // Display the value of each item
            cell.textContent = item[header];  
            row.appendChild(cell);
        });

        table.appendChild(row);
    });

    // Append the table 
    dataContainer.appendChild(table);
} 
