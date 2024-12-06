// ** 1. Constants and Variables **

    const openModal = document.querySelector(".open-modal");
    const refresh = document.querySelector(".refresh-button");
    const closeModal = document.querySelector(".close-modal");
    const modal = document.querySelector(".modal");
    const today = new Date().toISOString().split('T')[0];
    const newStartTimeInput = document.getElementById('new-event-start-time');
    const newEndTimeInput = document.getElementById('new-event-end-time');
    const editStartTimeInput = document.getElementById('edit-event-start-time');
    const editEndTimeInput = document.getElementById('edit-event-end-time');

    //current ID to edit
    let currentEventId = null;
    let address = null; 

    //global temperature variable
    let temperature = 0; 


// ** 2. Initial Setup **

    //load all events in local storage
    window.addEventListener("DOMContentLoaded", loadEvents);


// ** 3. Event Listeners **

    //prevent user from setting end time before start time
    newStartTimeInput.addEventListener('input', () => {
        const startTime = newStartTimeInput.value;
        const endTime = newEndTimeInput.value;

        if (startTime && endTime && endTime <= startTime) {
            alert('End time must be after start time');
            newStartTimeInput.value = '';
        }
    });
    newEndTimeInput.addEventListener('input', () => {
        const startTime = newStartTimeInput.value;
        const endTime = newEndTimeInput.value;

        if (startTime && endTime && endTime <= startTime) {
            alert('End time must be after start time');
            newEndTimeInput.value = '';
        }
    });
    editStartTimeInput.addEventListener('input', () => {
        const startTime = editStartTimeInput.value;
        const endTime = editEndTimeInput.value;

        if (startTime && endTime && endTime <= startTime) {
            alert('End time must be after start time');
            editStartTimeInput.value = '';
        }
    });
    editEndTimeInput.addEventListener('input', () => {
        const startTime = editStartTimeInput.value;
        const endTime = editEndTimeInput.value;

        if (startTime && endTime && endTime <= startTime) {
            alert('End time must be after start time');
            editEndTimeInput.value = '';
        }
    });


    //prevent user from setting date before today
    openModal.addEventListener("click", () => {
        modal.showModal();
        document.getElementById("new-event-date").setAttribute("min", today);
    });



    closeModal.addEventListener("click", () => {
        modal.close();
    });

    refresh.addEventListener("click", () => {
        loadEvents();
    });

    // Event listener to handle form submission when creating new events
    document.getElementById("event-form").addEventListener("submit", () => {

        const Id = `event-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
        const eventName = document.getElementById("new-event-name").value;
        const eventDescription = document.getElementById("new-event-description").value;
        const eventDate = document.getElementById("new-event-date").value;
        const startTime = document.getElementById("new-event-start-time").value;
        const endTime = document.getElementById("new-event-end-time").value;
        const eventLocation = document.getElementById("new-event-location").value;

        console.log("Event Name:", eventName);
        console.log("Event Description:", eventDescription);
        console.log("Event Date:", eventDate);
        console.log("Event Start Time:", startTime);
        console.log("Event End Time:", endTime);
        console.log("Event Location:", eventLocation);

        const eventData = {
            id: Id,
            name: eventName,
            description: eventDescription,
            date: eventDate,
            startTime: startTime,
            endTime : endTime,
            location: eventLocation,
            completed: "false"
        };
        //Save data
        localStorage.setItem(Id, JSON.stringify(eventData));
        const eventContainer = insertEventToEventList(eventData);
        eventContainer.classList.add("newly-added");



       
        //clear input after submission and close
        document.getElementById("event-form").reset();
        document.querySelector(".modal").close();

        

    });

    //Event listener to update event information
    document.getElementById("edit-event-form").addEventListener("submit", () => {
        if (currentEventId) {
        
            const eventToEdit = JSON.parse(localStorage.getItem(currentEventId));

            // Update the event data
            eventToEdit.name = document.getElementById("edit-event-name").value;
            eventToEdit.description = document.getElementById("edit-event-description").value;
            eventToEdit.date = document.getElementById("edit-event-date").value;
            eventToEdit.startTime = document.getElementById("edit-event-start-time").value;
            eventToEdit.endTime = document.getElementById("edit-event-end-time").value;
            eventToEdit.location = document.getElementById("edit-event-location").value;

            localStorage.setItem(currentEventId, JSON.stringify(eventToEdit));

            const eventToEditDiv = document.getElementById(currentEventId);
            eventToEditDiv.querySelector(".event-name").innerHTML = `<strong></strong> ${eventToEdit.name}`;
            eventToEditDiv.querySelector(".event-description").innerHTML = `<strong></strong> ${eventToEdit.description}`;
            eventToEditDiv.querySelector(".event-date").innerHTML = `<strong>Date:</strong> ${eventToEdit.date}`;
            eventToEditDiv.querySelector(".event-start-time").innerHTML = `<strong>Start Time:</strong> ${eventToEdit.startTime}`;
            eventToEditDiv.querySelector(".event-end-time").innerHTML = `<strong>End Time:</strong> ${eventToEdit.endTime}`;
            eventToEditDiv.querySelector(".event-location").innerHTML = `<strong>Location:</strong> ${eventToEdit.location}`;
            eventToEditDiv.classList.add("recently-edited");



            // Reset currentEventId
            currentEventId = null;



            document.querySelector(".edit-modal").close();



        }
    });



// ** 4. Main Functions / Helper Functions **
    async function callGeocodingAPI(address) {
        const apiKey = 'AIzaSyDI5PSATFRSVSgm9_BoWtZHYw-9YdbUWT4';
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
                //callWeatherAPI(coordinates.latitude, coordinates.longitude);
                callWeatherAPI(coordinates.latitude, coordinates.longitude).then((result) => {
                    temperature = result[0].temperature; 
                   // console.log("Temperature in callGeo is: ", temperature); 
                    //console.log("Temperature in callGeo result is: ", result[0].temperature); 

                });


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

        //Sort by ascending order, if no date found, move to back
        eventListToOrganzed.sort((a, b) => {

            //sort by date
            if (!a.date) {
                return -1;
            }
            else if (!b.date) {
                return 1;
            }
            else if (a.date !== b.date) {
                return b.date - a.date;
            }

            //if same day, sort by start Time
            if (!a.startTime) {
                return 1;
            }
            else if (!b.startTime) {
                return -1;
            }
            else if (a.startTime !== b.startTime) {
                return a.startTime > b.startTime ? -1 : 1;
            }

            // if same start, sort by end
            if (!a.endTime) {
                return 1;
            }
            if (!b.endTime) {
                return -1;
            }

            return a.endTime > b.endTime ? -1 : 1;
            });
    
        for (let i = 0; i < eventListToOrganzed.length; i++) {
            insertEventToEventList(eventListToOrganzed[i]);
        }
    }


    /* Invokes callGeocodingApi to assign the temperature value */
    function getTemp(address){
        callGeocodingAPI(address); 
        let temp = temperature; 

        // console.log("\n\ngetTemp called...\n\n")
        // console.log("City in getTemp is: " + address)
        // console.log("temperuture in getTemp ", temp);        
        return temp;

    }


    //Insert a eventData to the front of div class "event-container"
    function insertEventToEventList(eventData)
    {

        const eventContainer = document.getElementById("event-container");
        const eventDiv = document.createElement("div");
        eventDiv.classList.add("events");
        eventDiv.innerHTML = `
            <div>

                <h3 class="event-name"> ${eventData.name}</h3>
                <div class="event-description"> ${eventData.description}</div>
                
                <div class="event-info">
                    <span class="event-date"><strong>Date:</strong> ${eventData.date}</span>
                    <span class="event-start-time"><strong>Start Time:</strong> ${eventData.startTime}</span>
                    <span class="event-end-time"><strong>End Time:</strong> ${eventData.endTime}</span>
                    <span class="event-location"><strong>Location:</strong> ${eventData.location}</span>
                </div>
                <button class="delete-button">Delete</button>           
                <button class="mark-complete-button">Complete</button>
                <button class="get-weather-button">Weather</button >

            <div>
                
        `;
        
        /*Dynamically creates a div to display temperature for each event
          upon adding an event.
        */
       
        const removeTempDiv = eventDiv.querySelector('display-temperature');
        if(removeTempDiv){
            eventDiv.removeChild(removeTempDiv);
        }
        
        

        const tempDiv = document.createElement('display-temperature');
        tempDiv.id = 'display-temp'

        tempDiv.innerHTML = ' ';
        tempDiv.textContent = getTemp(eventData.location) + ' °C'; 
        eventDiv.appendChild(tempDiv)




        eventDiv.id = eventData.id;
        if(eventData.completed == true)
        {
        eventDiv.classList.add("completed-event");
        }

        eventDiv.onclick = () => {
            //set the id to edit
            currentEventId = eventData.id;

            const eventToEdit = JSON.parse(localStorage.getItem(currentEventId));

            const openEditModal = document.querySelector(".edit-modal");
            document.getElementById("edit-event-name").value = eventToEdit.name;
            document.getElementById("edit-event-description").value = eventToEdit.description;
            document.getElementById("edit-event-date").value = eventToEdit.date;
            document.getElementById("edit-event-start-time").value = eventToEdit.startTime;
            document.getElementById("edit-event-end-time").value = eventToEdit.endTime;
            document.getElementById("edit-event-location").value = eventToEdit.location;
            
            currentEventId = eventData.id;
            openEditModal.showModal();
            document.getElementById("edit-event-date").setAttribute("min", today);
            
            
            /*Dynamically creates a div to display temperature for each event
            upon editing the event. */
            
            const removeTempDiv = eventDiv.querySelector('display-temperature');
            if(removeTempDiv){
                eventDiv.removeChild(removeTempDiv);
            }
            
         
            const tempDiv = document.createElement('display-temperature');
            tempDiv.id = 'display-temp'

            tempDiv.innerHTML = ' ';
            tempDiv.textContent = getTemp(eventToEdit.location) + ' °C'; 
            eventDiv.appendChild(tempDiv)
            
        };

        eventDiv.querySelector(".delete-button").onclick = (event) => {
            event.stopPropagation();
            console.log("event id:", eventData.id);
            localStorage.removeItem(eventData.id);
            loadEvents();

        };
     

        eventDiv.querySelector(".mark-complete-button").onclick = (event) => {
            event.stopPropagation();
            const completion = JSON.parse(localStorage.getItem(eventData.id));
            if (completion && !completion.completed) {
                completion.completed = true;
                eventDiv.classList.add("completed-event");
            }
            else
            {
                completion.completed = false;
                eventDiv.classList.remove("completed-event");
            }
            localStorage.setItem(eventData.id, JSON.stringify(completion));

            console.log("event id:", eventData.id);
        };

        //get weather forecast
        eventDiv.querySelector(".get-weather-button").onclick = (event) => {
            event.stopPropagation();
            
            const id = JSON.parse(localStorage.getItem(eventData.id));
            callGeocodingAPI(id.location); 


        };
        eventContainer.insertBefore(eventDiv, eventContainer.firstChild);

        return eventDiv;
    }