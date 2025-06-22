const apiKey = "c81c4878f47849d994062706252206";

const resultBox = document.getElementById("result");
const inputBox = document.getElementById("locationInput");
const recentContainer = document.getElementById("recent-searches");

function updateRecentSearches() {
  recentContainer.innerHTML = "";
  recentCities.forEach(city => {
    const btn = document.createElement("button");
    btn.textContent = city;
    btn.onclick = () => {
      inputBox.value = city;
      getWeather(city);
    };
    recentContainer.appendChild(btn);
  });
}

let recentCities = JSON.parse(localStorage.getItem("recentCities")) || [];

function getWeather(city = null) {
  const location = city || inputBox.value.trim();
  if (!location) {
    resultBox.innerHTML = "<p>Please enter a location.</p>";
    resultBox.classList.remove("hidden");
    document.getElementById("forecast").classList.add("hidden");
    return;
  }

  const locLower = location.toLowerCase();
  if (!recentCities.some(c => c.toLowerCase() === locLower)) {
    recentCities.unshift(location);
    if (recentCities.length > 5) recentCities.pop();
    localStorage.setItem("recentCities", JSON.stringify(recentCities));
    updateRecentSearches();
  }

  fetchWeatherByQuery(location);
}

function useMyLocation() {
  if (navigator.geolocation) {
    alert("Attempting to detect your current location...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        fetchWeatherByCoords(latitude, longitude);
      },
      (error) => {
        alert("Location access denied. Please allow location access or enter a city manually.");
        console.warn("Geolocation error:", error.message);
      }
    );
  } else {
    alert("Geolocation is not supported by your browser.");
  }
}

function fetchWeatherByQuery(query) {
  const url = `http://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${query}&days=5&aqi=no&alerts=no`;
  fetchAndDisplay(url);
}

function fetchWeatherByCoords(lat, lon) {
  const url = `http://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${lat},${lon}&days=5&aqi=no&alerts=no`;
  fetchAndDisplay(url, lat, lon);
}

function fetchAndDisplay(url, lat = null, lon = null) {
  fetch(url)
    .then(res => {
      if (!res.ok) throw new Error("Failed to fetch weather data.");
      return res.json();
    })
    .then(data => {
      const { name, country, localtime } = data.location;
      const { temp_c, condition, is_day } = data.current;

      document.body.style.background = is_day
        ? "linear-gradient(135deg, #74ebd5, #ACB6E5)"
        : "linear-gradient(135deg, #2c3e50, #4ca1af)";

      resultBox.innerHTML = `
        <h3>${name}, ${country}</h3>
        <p><img src="${condition.icon}" alt="${condition.text}" />
        ${temp_c}&deg;C - ${condition.text}</p>
        <p style="margin-top: 8px;">Local Time: ${localtime}</p>
        ${lat !== null && lon !== null ? `<p>Latitude: ${lat.toFixed(4)} | Longitude: ${lon.toFixed(4)}</p>` : ""}
      `;
      resultBox.classList.remove("hidden");

      if (data.forecast && data.forecast.forecastday) {
        showForecast(data.forecast.forecastday);
      } else {
        document.getElementById("forecast").classList.add("hidden");
      }
    })
    .catch(err => {
      resultBox.innerHTML = `<p>Error: ${err.message}</p>`;
      resultBox.classList.remove("hidden");
      document.getElementById("forecast").classList.add("hidden");
    });
}

function showForecast(forecastDays) {
  const forecastContainer = document.getElementById("forecast");
  forecastContainer.innerHTML = "";

  forecastDays.forEach(day => {
    const date = new Date(day.date);
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    const formattedDate = date.toLocaleDateString(undefined, options);

    const card = document.createElement("div");
    card.className = "forecast-card";

    card.innerHTML = `
      <div class="forecast-date">${formattedDate}</div>
      <img src="${day.day.condition.icon}" alt="${day.day.condition.text}" />
      <div>${day.day.avgtemp_c}&deg;C</div>
      <div>${day.day.condition.text}</div>
    `;

    forecastContainer.appendChild(card);
  });

  forecastContainer.classList.remove("hidden");
}

window.onload = updateRecentSearches;
