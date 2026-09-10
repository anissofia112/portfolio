const weatherMap = {
    0: { desc: "Clear sky", icon: "☀️" },
    1: { desc: "Mainly clear", icon: "🌤️" },
    2: { desc: "Partly cloudy", icon: "⛅" },
    3: { desc: "Overcast", icon: "☁️" },
    45: { desc: "Foggy", icon: "🌫️" },
    48: { desc: "Depositing rime fog", icon: "🌫️" },
    51: { desc: "Light drizzle", icon: "🌦️" },
    61: { desc: "Slight rain", icon: "🌧️" },
    63: { desc: "Moderate rain", icon: "🌧️" },
    65: { desc: "Heavy rain", icon: "🌧️" },
    80: { desc: "Rain showers", icon: "🌦️" },
    95: { desc: "Thunderstorm", icon: "⛈️" }
};

function getIcon(code) {
    return weatherMap[code] || { desc: "Variable", icon: "⛅" };
}

// Update Header Date
const headerDate = document.getElementById('header-date');
if (headerDate) {
    headerDate.innerText = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

async function fetchWeatherData(lat, lon, cityName) {
    const status = document.getElementById('search-status');
    if (status) status.innerText = "Fetching forecast...";

    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`;
        const res = await fetch(url);
        const data = await res.json();

        const current = data.current;
        const meta = getIcon(current.weather_code);

        document.getElementById('last-updated').innerText = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        document.getElementById('current-heading').innerText = cityName;
        document.getElementById('current-time').innerText = "Current conditions";
        
        document.getElementById('current-temp').innerText = `${Math.round(current.temperature_2m)}°`;
        document.getElementById('current-condition').innerText = meta.desc;
        document.getElementById('current-icon').innerText = meta.icon;
        document.getElementById('feels-like').innerText = `Feels like ${Math.round(current.apparent_temperature)}°`;
        
        document.getElementById('humidity').innerText = `${current.relative_humidity_2m}%`;
        document.getElementById('wind').innerText = `${current.wind_speed_10m} km/h`;
        document.getElementById('rain-chance').innerText = `${data.daily.precipitation_probability_max[0]}%`;

        const grid = document.getElementById('forecast-grid');
        grid.innerHTML = "";
        
        for (let i = 0; i < 7; i++) {
            const date = new Date(data.daily.time[i]);
            const dayName = i === 0 ? "Today" : date.toLocaleDateString(undefined, { weekday: 'short' });
            const dayMeta = getIcon(data.daily.weather_code[i]);
            
            grid.innerHTML += `
                <div class="forecast-card">
                    <span class="forecast-day">${dayName}</span>
                    <span class="forecast-icon" aria-hidden="true">${dayMeta.icon}</span>
                    <div class="forecast-temps">
                        <strong>${Math.round(data.daily.temperature_2m_max[i])}°</strong>
                        <span>${Math.round(data.daily.temperature_2m_min[i])}°</span>
                    </div>
                </div>
            `;
        }
        
        if (status) status.innerText = "";
    } catch (err) {
        if (status) status.innerText = "Error loading weather data.";
    }
}

async function geocodeCity(city) {
    const status = document.getElementById('search-status');
    if (status) status.innerText = "Locating...";
    try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`);
        const data = await res.json();
        
        if (data.results && data.results.length > 0) {
            const loc = data.results[0];
            fetchWeatherData(loc.latitude, loc.longitude, loc.name);
        } else {
            if (status) status.innerText = "City not found.";
        }
    } catch (err) {
        if (status) status.innerText = "Search failed.";
    }
}

document.getElementById('location-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const city = document.getElementById('location-input').value.trim();
    if (city) geocodeCity(city);
});

document.getElementById('use-location').addEventListener('click', () => {
    const status = document.getElementById('search-status');
    if (status) status.innerText = "Requesting location permission...";
    
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            (pos) => fetchWeatherData(pos.coords.latitude, pos.coords.longitude, "Your Location"),
            () => { if (status) status.innerText = "Location permission denied."; }
        );
    } else {
        if (status) status.innerText = "Geolocation not supported.";
    }
});

geocodeCity("Kota Bharu");
