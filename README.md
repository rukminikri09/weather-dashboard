# Weather Dashboard

A responsive weather app built with HTML, CSS and vanilla JavaScript. Search any city to see current conditions and a 5-day forecast.

**Live demo:** _add your Vercel / Netlify link here_

## Features
- Search box and Search button (pressing Enter also searches)
- Live data from the free [Open-Meteo](https://open-meteo.com/en/docs) geocoding and forecast APIs (no API key)
- Loading spinner while data is fetched
- Error handling: empty input, city not found, HTTP errors and no internet
- Responsive cards: a row on laptop, stacked on phone (CSS Grid and Flexbox)
- Dark / light mode toggle that remembers your choice
- Extras: °C / °F switch, recent searches saved in localStorage
- Favourites: star a city to save it, click the star again to remove it (saved in localStorage)
- “Use my location” button (Geolocation API)
- Page background changes with the weather (sunny, cloudy, rainy, snowy, stormy)

## Concepts practised
`fetch`, `async / await`, `try / catch`, `response.ok` and status codes, JSON, DOM manipulation, template strings, destructuring, arrow functions, localStorage.

## Run locally
Open `index.html` in a browser, or use a local server such as the VS Code Live Server extension.

## Project structure
- `index.html`: page structure
- `style.css`: layout, themes and responsive rules
- `script.js`: `fetchJson` / `getWeather` (fetching), `displayWeather` (display), `showError` (errors)
