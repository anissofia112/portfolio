// js/weather.js

// Comprehensive WMO Weather interpretation with Day/Night awareness
const weatherMap = {
    0: { day: { desc: "Clear sky", icon: "☀️" }, night: { desc: "Clear sky", icon: "🌙" } },
    1: { day: { desc: "Mainly clear", icon: "🌤️" }, night: { desc: "Mainly clear", icon: "🌤️" } },
    2: { day: { desc: "Partly cloudy", icon: "⛅" }, night: { desc: "Partly cloudy", icon: "☁️" } },
    3: { day: { desc: "Overcast", icon: "☁️" }, night: { desc: "Overcast", icon: "☁️" } },
    45: { day: { desc: "Foggy", icon: "🌫️" }, night: { desc: "Foggy", icon: "🌫️" } },
    48: { day: { desc: "Depositing rime fog", icon: "🌫️" }, night: { desc: "Depositing rime fog", icon: "🌫️" } },
    51: { day: { desc: "Light drizzle", icon: "🌦️" }, night: { desc: "Light drizzle", icon: "🌧️" } },
    53: { day: { desc: "Moderate drizzle", icon: "🌦️" }, night: { desc: "Moderate drizzle", icon: "🌧️" } },
    55: { day: { desc: "Dense drizzle", icon: "🌧️" }, night: { desc: "Dense drizzle", icon: "🌧️" } },
    61: { day: { desc: "Slight rain", icon: "🌧️" }, night: { desc: "Slight rain", icon: "🌧️" } },
    63: { day: { desc: "Moderate rain", icon: "🌧️" }, night: { desc: "Moderate rain", icon: "🌧️" } },
    65: { day: { desc: "Heavy rain", icon: "⛈️" }, night: { desc: "Heavy rain", icon: "⛈️" } },
    71: { day: { desc: "Slight snow", icon: "🌨️" }, night: { desc: "Slight snow", icon: "🌨️" } },
    73: { day: { desc: "Moderate snow", icon: "🌨️" }, night: { desc: "Moderate snow", icon: "🌨️" } },
    75: { day: { desc: "Heavy snow", icon: "❄️" }, night: { desc: "Heavy snow", icon: "❄️" } },
    80: { day: { desc: "Rain showers", icon: "🌦️" }, night: { desc: "Rain showers", icon: "🌧️" } },
    81: { day: { desc: "Moderate showers", icon: "🌧️" }, night: { desc: "Moderate showers", icon: "🌧️" } },
    82: { day: { desc: "Violent showers", icon: "⛈️" }, night: { desc: "Violent showers", icon: "⛈️" } },
    95: { day: { desc: "Thunderstorm", icon: "⛈️" }, night: { desc: "Thunderstorm", icon: "⛈️" } },
    96: { day: { desc: "Thunderstorm with slight hail", icon: "⛈️" }, night: { desc: "Thunderstorm with hail", icon: "⛈️" } },
    99: { day: { desc: "Thunderstorm with heavy hail", icon: "⛈️" }, night: { desc: "Thunderstorm with hail", icon: "⛈️" } }
};

function getWeatherMeta(code, isDay = 1) {
    const entry = weatherMap[code];
    if (!entry) return { desc: "Variable", icon: "⛅" };
    return isDay === 1 ? entry.day : entry.night;
}

// Track active location for auto-refresh
let activeCoordinates = { lat: 6.1254, lon: 102.2381, name: "Kota Bharu" };

// Header live date
const headerDate = document.getElementById('header-date');
if (headerDate) {
    headerDate.innerText = new Intl.DateTimeFormat(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
    }).format(new Date());
}

async function fetchWeatherData(lat, lon, cityName) {
    const status = document.getElementById('search-status');
    if (status) status.innerText = "Fetching live forecast...";

    activeCoordinates = { lat, lon, name: cityName };

    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`;
        const res = await fetch(url);
        
        if (!res.ok) throw new Error("Weather service unavailable");
        const data = await res.json();

        const current = data.current;
        const meta = getWeatherMeta(current.weather_code, current.is_day);

        // Update timestamps and header info
        const now = new Date();
        const lastUpdatedElem = document.getElementById('last-updated');
        if (lastUpdatedElem) {
            lastUpdatedElem.innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        const headingElem = document.getElementById('current-heading');
        if (headingElem) headingElem.innerText = cityName;

        // Display actual local time at the queried location
        const timeElem = document.getElementById('current-time');
        if (timeElem && data.timezone) {
            const localTime = new Intl.DateTimeFormat(undefined, {
                timeZone: data.timezone,
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            }).format(now);
            timeElem.innerText = `Local time: ${localTime}`;
        }

        // Populate primary temperature blocks
        const tempElem = document.getElementById('current-temp');
        if (tempElem) tempElem.innerText = `${Math.round(current.temperature_2m)}°`;

        const conditionElem = document.getElementById('current-condition');
        if (conditionElem) conditionElem.innerText = meta.desc;

        const iconElem = document.getElementById('current-icon');
        if (iconElem) iconElem.innerText = meta.icon;

        const feelsLikeElem = document.getElementById('feels-like');
        if (feelsLikeElem) feelsLikeElem.innerText = `Feels like ${Math.round(current.apparent_temperature)}°`;

        // Weather statistics
        const humidityElem = document.getElementById('humidity');
        if (humidityElem) humidityElem.innerText = `${current.relative_humidity_2m}%`;

        const windElem = document.getElementById('wind');
        if (windElem) windElem.innerText = `${Math.round(current.wind_speed_10m)} km/h`;

        const rainChanceElem = document.getElementById('rain-chance');
        if (rainChanceElem) {
            const rainProb = data.daily?.precipitation_probability_max?.[0] ?? 0;
            rainChanceElem.innerText = `${rainProb}%`;
        }

        // Render 7-day forecast cards
        const grid = document.getElementById('forecast-grid');
        if (grid && data.daily) {
            grid.innerHTML = "";
            for (let i = 0; i < 7; i++) {
                const date = new Date(data.daily.time[i] + "T00:00:00");
                const dayName = i === 0 ? "Today" : date.toLocaleDateString(undefined, { weekday: 'short' });
                const dayMeta = getWeatherMeta(data.daily.weather_code[i], 1);

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
        }

        if (status) status.innerText = "";
    } catch (err) {
        if (status) status.innerText = "Error loading weather data. Please try again.";
    }
}

// Geocoding city name to coordinates
async function geocodeCity(city) {
    const status = document.getElementById('search-status');
    if (status) status.innerText = `Locating ${city}...`;

    try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
        const data = await res.json();

        if (data.results && data.results.length > 0) {
            const loc = data.results[0];
            const displayName = loc.admin1 ? `${loc.name}, ${loc.admin1}` : `${loc.name}, ${loc.country_code}`;
            fetchWeatherData(loc.latitude, loc.longitude, displayName);
        } else {
            if (status) status.innerText = "City not found. Please try another name.";
        }
    } catch (err) {
        if (status) status.innerText = "Search service unavailable.";
    }
}

// Reverse Geocoding coordinates to city name
async function reverseGeocode(lat, lon) {
    try {
        const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
        const data = await res.json();
        return data.city || data.locality || data.principalSubdivision || "Your Location";
    } catch (err) {
        return "Your Location";
    }
}

// Search form submit event
const locationForm = document.getElementById('location-form');
if (locationForm) {
    locationForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('location-input');
        const city = input ? input.value.trim() : "";
        if (city) geocodeCity(city);
    });
}

// Geolocation button event
const locationBtn = document.getElementById('use-location');
if (locationBtn) {
    locationBtn.addEventListener('click', () => {
        const status = document.getElementById('search-status');
        if (status) status.innerText = "Requesting location permission...";

        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    const lat = pos.coords.latitude;
                    const lon = pos.coords.longitude;
                    const detectedName = await reverseGeocode(lat, lon);
                    fetchWeatherData(lat, lon, detectedName);
                },
                (err) => {
                    if (status) {
                        status.innerText = err.code === 1 
                            ? "Location access denied." 
                            : "Unable to retrieve your location.";
                    }
                },
                { timeout: 10000 }
            );
        } else {
            if (status) status.innerText = "Geolocation is not supported by your browser.";
        }
    });
}

// Auto-refresh weather every 10 minutes
setInterval(() => {
    if (activeCoordinates.lat && activeCoordinates.lon) {
        fetchWeatherData(activeCoordinates.lat, activeCoordinates.lon, activeCoordinates.name);
    }
}, 10 * 60 * 1000);

// Initialize with default location
geocodeCity("Kota Bharu");
