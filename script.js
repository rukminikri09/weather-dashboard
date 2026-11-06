// Weather Dashboard - Assignment 3
// Uses the free Open-Meteo APIs (no API key needed)

const geoUrl = "https://geocoding-api.open-meteo.com/v1/search";
const weatherUrl = "https://api.open-meteo.com/v1/forecast";

// grab the elements we need from the page
const searchForm = document.getElementById("searchForm");
const cityInput = document.getElementById("cityInput");
const statusBox = document.getElementById("status");
const currentBox = document.getElementById("current");
const forecastBox = document.getElementById("forecast");
const recentBox = document.getElementById("recent");
const favouritesBox = document.getElementById("favourites");
const locBtn = document.getElementById("locBtn");
const unitBtn = document.getElementById("unitBtn");
const themeBtn = document.getElementById("themeBtn");

let unit = localStorage.getItem("unit") || "C";
let lastResult = null; // last search, so we can redraw when the unit changes
let recentCities = JSON.parse(localStorage.getItem("recent")) || [];
let favourites = JSON.parse(localStorage.getItem("favourites")) || [];

// ---------- fetching data ----------

// fetch a url and return the json, throws an error if something fails
async function fetchData(url) {
  let response;
  try {
    response = await fetch(url);
  } catch (error) {
    // fetch only fails like this when there is no internet
    throw new Error("NETWORK");
  }

  if (!response.ok) {
    throw new Error("HTTP " + response.status);
  }

  const data = await response.json();
  return data;
}

// get the forecast for a latitude/longitude
async function getForecast(latitude, longitude) {
  const url = weatherUrl + "?latitude=" + latitude + "&longitude=" + longitude +
    "&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m" +
    "&daily=weather_code,temperature_2m_max,temperature_2m_min" +
    "&forecast_days=5&timezone=auto";
  return await fetchData(url);
}

// city name -> latitude/longitude -> weather
async function getWeather(city) {
  const geoData = await fetchData(geoUrl + "?name=" + encodeURIComponent(city) + "&count=1");

  if (!geoData.results || geoData.results.length === 0) {
    throw new Error("NOT_FOUND");
  }

  const { latitude, longitude, name, country } = geoData.results[0];
  const weather = await getForecast(latitude, longitude);
  return { name: name, place: name + ", " + country, weather: weather };
}

// ask the browser for the user's position (Geolocation API)
function getPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("NO_GEO"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position.coords),
      () => reject(new Error("GEO_DENIED"))
    );
  });
}

// ---------- showing data ----------

// the API gives a weather code number, this turns it into an icon, text and a sky type
function getWeatherInfo(code) {
  if (code === 0) return { icon: "☀️", text: "Clear sky", sky: "clear" };
  if (code <= 2) return { icon: "⛅", text: "Partly cloudy", sky: "cloud" };
  if (code === 3) return { icon: "☁️", text: "Overcast", sky: "cloud" };
  if (code <= 48) return { icon: "🌫️", text: "Fog", sky: "cloud" };
  if (code <= 57) return { icon: "🌦️", text: "Drizzle", sky: "rain" };
  if (code <= 67) return { icon: "🌧️", text: "Rain", sky: "rain" };
  if (code <= 77) return { icon: "❄️", text: "Snow", sky: "snow" };
  if (code <= 82) return { icon: "🌧️", text: "Rain showers", sky: "rain" };
  if (code <= 86) return { icon: "🌨️", text: "Snow showers", sky: "snow" };
  return { icon: "⛈️", text: "Thunderstorm", sky: "storm" };
}

// the API always gives celsius, convert if the user picked fahrenheit
function formatTemp(celsius) {
  let temp = celsius;
  if (unit === "F") {
    temp = (celsius * 9) / 5 + 32;
  }
  return Math.round(temp) + "°" + unit;
}

function showWeather() {
  if (lastResult === null) return;

  const { current, daily } = lastResult.weather;
  const info = getWeatherInfo(current.weather_code);
  document.body.dataset.sky = info.sky; // changes the page background

  // star button to add/remove this city from favourites (not shown for "My location")
  let starButton = "";
  if (lastResult.name !== "My location") {
    const isFav = favourites.includes(lastResult.name);
    starButton = `<button type="button" class="star" data-fav="${lastResult.name}" aria-label="Add or remove favourite">${isFav ? "★" : "☆"}</button>`;
  }

  currentBox.hidden = false;
  currentBox.innerHTML = `
    <div class="icon">${info.icon}</div>
    <div>
      <h2>${lastResult.place} ${starButton}</h2>
      <p class="temp">${formatTemp(current.temperature_2m)}</p>
      <p>${info.text}</p>
    </div>
    <ul class="stats">
      <li>💨 Wind ${current.wind_speed_10m} km/h</li>
      <li>💧 Humidity ${current.relative_humidity_2m}%</li>
    </ul>
  `;

  // build one card for each forecast day
  let cards = "";
  for (let i = 0; i < daily.time.length; i++) {
    const dayInfo = getWeatherInfo(daily.weather_code[i]);
    const date = new Date(daily.time[i] + "T12:00:00");
    const dayName = date.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });

    cards += `
      <article class="day">
        <h3>${dayName}</h3>
        <div class="icon">${dayInfo.icon}</div>
        <p>${dayInfo.text}</p>
        <p><strong>${formatTemp(daily.temperature_2m_max[i])}</strong> / ${formatTemp(daily.temperature_2m_min[i])}</p>
      </article>
    `;
  }
  forecastBox.innerHTML = cards;
}

function showLoading() {
  statusBox.className = "status";
  statusBox.innerHTML = '<span class="spinner"></span> Loading weather…';
}

function showError(error) {
  // hide old results so the error is the only thing on screen
  currentBox.hidden = true;
  forecastBox.innerHTML = "";
  document.body.removeAttribute("data-sky");

  let message;
  if (error.message === "EMPTY") {
    message = "Please type a city name to search.";
  } else if (error.message === "NOT_FOUND") {
    message = "We couldn’t find that city. Check the spelling and try again.";
  } else if (error.message === "NO_GEO") {
    message = "Your browser doesn’t support location. Try searching for a city instead.";
  } else if (error.message === "GEO_DENIED") {
    message = "Location access was blocked. Allow it in your browser, or search for a city.";
  } else if (error.message === "NETWORK") {
    message = "No internet connection. Check your network and try again.";
  } else {
    message = "Something went wrong (" + error.message + "). Please try again.";
  }

  statusBox.className = "status error";
  statusBox.textContent = message;
}

// ---------- recent searches ----------

function showRecent() {
  let chips = "";
  for (const city of recentCities) {
    chips += `<button type="button" data-city="${city}">${city}</button>`;
  }
  recentBox.innerHTML = chips;
}

function saveRecent(city) {
  // remove it if it is already there, then add to the front
  recentCities = recentCities.filter((c) => c !== city);
  recentCities.unshift(city);
  recentCities = recentCities.slice(0, 5); // keep only the last 5

  localStorage.setItem("recent", JSON.stringify(recentCities));
  showRecent();
}

// ---------- favourites ----------

function showFavourites() {
  let chips = "";
  for (const city of favourites) {
    chips += `<button type="button" data-city="${city}">★ ${city}</button>`;
  }
  favouritesBox.innerHTML = chips;
}

function toggleFavourite(city) {
  if (favourites.includes(city)) {
    favourites = favourites.filter((c) => c !== city);
  } else {
    favourites.push(city);
  }
  localStorage.setItem("favourites", JSON.stringify(favourites));
  showFavourites();
  showWeather(); // redraw so the star updates
}

// ---------- theme and unit ----------

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  themeBtn.textContent = theme === "dark" ? "☀️" : "🌙";
  localStorage.setItem("theme", theme);
}

function setUnit(newUnit) {
  unit = newUnit;
  unitBtn.textContent = "°" + unit;
  localStorage.setItem("unit", unit);
  showWeather(); // redraw with the new unit
}

// ---------- search ----------

async function searchCity(city) {
  city = city.trim();

  if (city === "") {
    showError(new Error("EMPTY"));
    return;
  }

  showLoading();

  try {
    lastResult = await getWeather(city);
    showWeather();
    statusBox.textContent = "";
    saveRecent(lastResult.name);
  } catch (error) {
    showError(error);
  }
}

// weather for the user's current position
async function searchMyLocation() {
  showLoading();

  try {
    const { latitude, longitude } = await getPosition();
    const weather = await getForecast(latitude, longitude);
    lastResult = { name: "My location", place: "My location", weather: weather };
    showWeather();
    statusBox.textContent = "";
  } catch (error) {
    showError(error);
  }
}

// ---------- events ----------

// the form handles both the Search button and pressing Enter
searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  searchCity(cityInput.value);
});

// clicking a recent or favourite chip searches that city
function chipClick(event) {
  const city = event.target.dataset.city;
  if (city) {
    cityInput.value = city;
    searchCity(city);
  }
}
recentBox.addEventListener("click", chipClick);
favouritesBox.addEventListener("click", chipClick);

// the star button is inside the current weather card
currentBox.addEventListener("click", (event) => {
  const city = event.target.dataset.fav;
  if (city) toggleFavourite(city);
});

locBtn.addEventListener("click", searchMyLocation);

themeBtn.addEventListener("click", () => {
  const isDark = document.documentElement.dataset.theme === "dark";
  setTheme(isDark ? "light" : "dark");
});

unitBtn.addEventListener("click", () => {
  setUnit(unit === "C" ? "F" : "C");
});

// ---------- on page load ----------

const savedTheme = localStorage.getItem("theme");
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
setTheme(savedTheme || (prefersDark ? "dark" : "light"));
setUnit(unit);
showRecent();
showFavourites();
