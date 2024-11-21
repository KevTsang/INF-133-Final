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
