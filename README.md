# Elanco-Animal-Care-System
Front-End Placement Project for Elanco, which I created using HTML, CSS and Java Script programming languages.
# Elanco — UK Tick Sighting Tracker (Frontend MVP)

**Candidate Name:** Sergio Fernandes de Azevedo Junior  
**Institution:** Liverpool John Moores University  
**Target Position:** Software Engineering Placement Program - FrontEnd 

---

## Project Overview
The **Elanco Tick Tracker** is a responsive, web-based public health application designed to help UK citizens, pet owners, and veterinarians monitor, visualize, and report tick activity across the country. The platform combines real-time data mapping, chronological playback, educational resources, and a community report form to aid public awareness and prevent tick-borne diseases.

---

## Project Choices & Technical Rationale

### 1. Architecture & Modular File Structure
To adhere to modern software engineering best practices (Separation of Concerns), the codebase separates structural markup, visual presentation, and executable logic into clean directory structures:
- **HTML5 ** Layout structures enhancing screen reader accessibility and navigation clarity.
- **CSS3 (`/css` directory):** Responsive grid/flexbox layouts themed with an executive dark-mode visual palette (`#09120e` dark background with `#10b981` emerald green highlights).
- **Vanilla JavaScript (`/js` directory):** Modular client-side scripts.

### 2. External Libraries & Map Settings
- **Leaflet.js (v1.9.4):** Chosen as the primary mapping library for lightweight, mobile-friendly 2D interactive tile rendering.
  - **Tile Layer Provider:** Uses the **Esri World Dark Gray Base** raster service (`https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}`). This layer provides a sleek dark style that matches Elanco's brand aesthetic while remaining 100% free, reliable, and completely unrestricted by API keys or local CORS policies.
  - **Custom Map Markers:** Features visual indicators for risk severity (color-coded low/medium/high centers), species types (outer ring border colors), and sighting age (large pulsing animations for recent sightings within 7 days).
- **Chart.js (v4.x):** Embedded in the Species Guide module to render annual growth trends (line chart) and monthly seasonal activity distributions (bar chart).

---

## Key Features & Requirements Summary

- **Interactive Map Visualization:** Dynamic UK sighting markers, distance radius filtering by major UK cities, date range pickers, and severity/species selectors.
- **Sighting Details & Timeline Playback:** Interactive sidebar detail cards populated on marker click, along with an auto-playing chronological timeline slider.
- **Quick Action Buttons:** Direct integration for Google Maps directions, URL sharing via clipboard, and quick navigation to reporting forms.
- **Species Identification & Education:** Detailed host, habitat, and prevention guide alongside dynamic interactive charts.
- **Sighting Reporting Form:** User submission form with input validation (error, warning, and success alerts), custom date/time/location pickers, and photo attachment capability.

---

## How to Run the Application Locally

> **CRITICAL SETUP NOTE ON FILE PATHS:**  
> The HTML files rely on relative directory linking to load the custom stylesheets (`css/`) and JavaScript logic files (`js/`). To ensure all styling and interactivity load properly:
> 1. Download or clone the entire repository as a complete folder structure.
> 2. **DO NOT rename, move, or separate** the `css/` or `js/` folders from the directory containing the HTML files.

### Step-by-Step Execution:
Direct Web Browser Execution
1. Open the project folder on your computer.
2. Double-click `main menu ` to launch directly in any modern web browser (Google Chrome, Microsoft Edge, Mozilla Firefox, or Safari).

---

## Walkthrough Demonstration Video
- **Google Drive Link:** [https://drive.google.com/file/d/1BzdgLoflGF-Wr11kOcY6FqIlUT7krZf5/view?usp=sharing]
