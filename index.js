// ** 1. Constants and Variables **

    const openModal = document.querySelector(".open-modal");
    const refresh = document.querySelector(".refresh-button");
    const closeModal = document.querySelector(".close-modal");
    const modal = document.querySelector(".modal");
    const today = new Date().toISOString().split('T')[0];

    //current ID to edit
    let currentEventId = null;

// ** 2. Initial Setup **

    //prevent user from setting date before today
    document.getElementById("new-event-date").setAttribute("min", today);

    //load all events in local storage
    window.addEventListener("DOMContentLoaded", loadEvents);


// ** 3. Event Listeners **


    openModal.addEventListener("click", () => {
        modal.showModal();
    });

    closeModal.addEventListener("click", () => {
        modal.close();
    });

    refresh.addEventListener("click", () => {
        loadEvents();
    });

    // Event listener to handle form submission
    document.getElementById("event-form").addEventListener("submit", () => {

        const Id = `event-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
        const eventName = document.getElementById("new-event-name").value;
        const eventDescription = document.getElementById("new-event-description").value;
        const eventDate = document.getElementById("new-event-date").value;
        const eventLocation = document.getElementById("new-event-location").value;

        console.log("Event Name:", eventName);
        console.log("Event Description:", eventDescription);
        console.log("Event Date:", eventDate);
        console.log("Event Location:", eventLocation);

        const eventData = {
            id: Id,
            name: eventName,
            description: eventDescription,
            date: eventDate,
            location: eventLocation
        };
        //Save data
        localStorage.setItem(Id, JSON.stringify(eventData));
        insertEventToEventList(eventData);

        //clear input after submission and close
        document.getElementById("event-form").reset();
        document.querySelector(".modal").close();
        

    });

    document.getElementById("edit-event-form").addEventListener("submit", () => {
        if (currentEventId) {
        
            const eventToEdit = JSON.parse(localStorage.getItem(currentEventId));

            // Update the event data
            eventToEdit.name = document.getElementById("edit-event-name").value;
            eventToEdit.description = document.getElementById("edit-event-description").value;
            eventToEdit.date = document.getElementById("edit-event-date").value;
            eventToEdit.location = document.getElementById("edit-event-location").value;

            localStorage.setItem(currentEventId, JSON.stringify(eventToEdit));

            const eventToEditDiv = document.getElementById(currentEventId);
            eventToEditDiv.querySelector(".event-name").innerHTML = `<strong>Name:</strong> ${eventToEdit.name}`;
            eventToEditDiv.querySelector(".event-description").innerHTML = `<strong>Description:</strong> ${eventToEdit.description}`;
            eventToEditDiv.querySelector(".event-date").innerHTML = `<strong>Date:</strong> ${eventToEdit.date}`;
            eventToEditDiv.querySelector(".event-location").innerHTML = `<strong>Location:</strong> ${eventToEdit.location}`;

            // Reset currentEventId
            currentEventId = null;

            document.querySelector(".edit-modal").close();
        }
    });



// ** 4. Main Functions / Helper Functions **

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
            displayData(dailyReport)
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


    //Populate the list with existing events
    function loadEvents() {
        const eventContainer = document.getElementById("event-container");
        eventContainer.innerHTML = "";

        let eventListToOrganzed = [];

        //sort event based on date
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key.startsWith("event-")) continue;
        
            const eventData = JSON.parse(localStorage.getItem(key));
            eventListToOrganzed.push(eventData);
        }

        //Sort by descending order, if no date found, move to front
        eventListToOrganzed.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
        
            const isDateAInvalid = isNaN(dateA);
            const isDateBInvalid = isNaN(dateB);
        
            if (isDateAInvalid && isDateBInvalid) {
                return 0;
            }
            if (isDateAInvalid) {
                return -1;
            }
            if (isDateBInvalid) {
                return 1;
            }

            return dateA - dateB;
            });
    
        for (let i = 0; i < eventListToOrganzed.length; i++) {
            insertEventToEventList(eventListToOrganzed[i]);
        }
    }


    //Insert a eventData to the front of div class "event-container"
    function insertEventToEventList(eventData)
    {
        const eventContainer = document.getElementById("event-container");
        const eventDiv = document.createElement("div");
        eventDiv.classList.add("events");
        eventDiv.innerHTML = `
                <h3 class="event-name"><strong>Name:</strong> ${eventData.name}</h3>
                <p class="event-description"><strong>Description:</strong> ${eventData.description}</p>
                <p class="event-date"><strong>Date:</strong> ${eventData.date}</p>
                <p class="event-location"><strong>Location:</strong> ${eventData.location}</p>

                <button class="delete-button">Delete</button>
                <button class="mark-complete-button">Mark Complete</button>
                <button class="get-weather-button">Get Weather</button>
            `;

        eventDiv.id = eventData.id;

        eventDiv.onclick = () => {
            //set the id to edit
            currentEventId = eventData.id;

            const eventToEdit = JSON.parse(localStorage.getItem(currentEventId));

            const openEditModal = document.querySelector(".edit-modal");
            document.getElementById("edit-event-name").value = eventToEdit.name;
            document.getElementById("edit-event-description").value = eventToEdit.description;
            document.getElementById("edit-event-date").value = eventToEdit.date;
            document.getElementById("edit-event-location").value = eventToEdit.location;

            currentEventId = eventData.id;
            openEditModal.showModal();
            document.getElementById("edit-event-date").setAttribute("min", today);
        };

        eventDiv.querySelector(".delete-button").onclick = (event) => {
            event.stopPropagation();
            console.log("event id:", eventData.id);
            localStorage.removeItem(eventData.id);
            loadEvents();

        };

        eventDiv.querySelector(".mark-complete-button").onclick = (event) => {
            event.stopPropagation();
            console.log("event id:", eventData.id);
        };

        eventContainer.insertBefore(eventDiv, eventContainer.firstChild);
    }