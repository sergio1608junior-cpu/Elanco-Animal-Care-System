 <!-- LEAFLET JS -->

    /* ==========================================================================
       SECTION 1: CONSTANTS & CONFIGURATION
       ========================================================================== */
    const API_URL = 'https://dev-task.elancoapps.com/data/tick-sightings';
    const LOCAL_KEY = 'elancoReports';
    const ONE_DAY_MS = 86400000;

    const SPECIES_COLORS = {
      'Passerine tick': '#38bdf8',
      'Southern rodent tick': '#a78bfa',
      'Marsh tick': '#f472b6',
      'Tree-hole tick': '#fb923c',
      'Fox/badger tick': '#e5e7eb'
    };
    const DEFAULT_SPECIES_COLOR = '#9ca6b8';

    const SEVERITY_COLORS = {
      'Low': '#10b981',
      'Medium': '#f59e0b',
      'High': '#ef4444'
    };

    const UK_CITIES = {
      Liverpool: [53.4084, -2.9916],
      London: [51.5074, -0.1278],
      Manchester: [53.4808, -2.2426],
      Birmingham: [52.4862, -1.8904],
      Leeds: [53.8008, -1.5491],
      Newcastle: [54.9783, -1.6178],
      Edinburgh: [55.9533, -3.1883],
      Glasgow: [55.8642, -4.2518],
      Cardiff: [51.4816, -3.1791],
      Bristol: [51.4545, -2.5879]
    };

    const CITY_LOOKUP = {
      'liverpool': UK_CITIES.Liverpool,
      'london': UK_CITIES.London,
      'manchester': UK_CITIES.Manchester,
      'birmingham': UK_CITIES.Birmingham,
      'leeds': UK_CITIES.Leeds,
      'newcastle': UK_CITIES.Newcastle,
      'edinburgh': UK_CITIES.Edinburgh,
      'glasgow': UK_CITIES.Glasgow,
      'cardiff': UK_CITIES.Cardiff,
      'bristol': UK_CITIES.Bristol,
      'southampton': [50.9097, -1.4044],
      'sheffield': [53.3811, -1.4701],
      'nottingham': [52.9548, -1.1581],
      'leicester': [52.6369, -1.1398]
    };

    /* ==========================================================================
       SECTION 2: GLOBAL STATE VARIABLES
       ========================================================================== */
    let mapInstance = null;
    let markersLayerGroup = null;
    let allSightingsData = [];
    let activeFilteredSightings = [];
    let timelineMinDate = new Date();
    let playTimer = null;

    /* ==========================================================================
       SECTION 3: HELPER UTILITIES
       ========================================================================== */
    const formatDate = d => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const escapeHtml = str => String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    function calculateDistanceKm(coord1, coord2) {
      const R = 6371;
      const dLat = (coord2[0] - coord1[0]) * Math.PI / 180;
      const dLon = (coord2[1] - coord1[1]) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(coord1[0] * Math.PI / 180) * Math.cos(coord2[0] * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    function showToast(message) {
      const toast = document.getElementById('toast-notification');
      if (!toast) return;
      toast.textContent = message;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 3000);
    }

    /* ==========================================================================
       SECTION 4: DATA FETCHING & NORMALISATION
       ========================================================================== */
    function normalizeSighting(item, index, prefix) {
      if (!item) return null;

      const cityName = String(item.location || item.city || item.town || item.place || '').trim();
      const cityKey = cityName.toLowerCase();

      let lat = parseFloat(item.lat || item.latitude);
      let lng = parseFloat(item.lng || item.lon || item.long || item.longitude);

      if (isNaN(lat) || isNaN(lng)) {
        const baseCoords = CITY_LOOKUP[cityKey] || UK_CITIES.London;
        lat = baseCoords[0] + (Math.random() - 0.5) * 0.15;
        lng = baseCoords[1] + (Math.random() - 0.5) * 0.25;
      }

      const rawDate = item.date || item.dateTime || item.timestamp || item.reportedAt;
      const dateObj = new Date(rawDate);
      if (isNaN(dateObj.getTime())) return null;

      const rawSpecies = String(item.species || item.tickSpecies || item.type || 'Unknown');
      const speciesKey = Object.keys(SPECIES_COLORS).find(k => k.toLowerCase() === rawSpecies.toLowerCase()) || 'Other';

      const rawSev = String(item.severity || item.risk || item.level || '').toLowerCase();
      const severityKey = /high|severe|3/.test(rawSev) ? 'High' : /med|moder|2/.test(rawSev) ? 'Medium' : 'Low';

      return {
        id: prefix + (item.id || index),
        lat, lng,
        date: dateObj,
        species: speciesKey,
        rawSpecies,
        severity: severityKey,
        city: cityName || 'UK',
        notes: item.notes || item.description || item.comment || ''
      };
    }

    function generateDemoSightings() {
      const cities = Object.keys(UK_CITIES);
      const speciesList = Object.keys(SPECIES_COLORS);
      const demoList = [];
      const now = Date.now();

      for (let i = 0; i < 200; i++) {
        const randomDaysAgo = Math.random() * 730;
        const d = new Date(now - randomDaysAgo * ONE_DAY_MS);
        const city = cities[Math.floor(Math.random() * cities.length)];
        const r = Math.random();

        demoList.push({
          id: 'demo-' + i,
          lat: UK_CITIES[city][0] + (Math.random() - 0.5) * 0.3,
          lng: UK_CITIES[city][1] + (Math.random() - 0.5) * 0.4,
          date: d,
          species: speciesList[Math.floor(Math.random() * speciesList.length)],
          rawSpecies: '',
          severity: r < 0.5 ? 'Low' : r < 0.85 ? 'Medium' : 'High',
          city: city,
          notes: 'Sample demo sighting data.'
        });
      }
      return demoList;
    }

    async function loadAllData() {
      let sightings = [];
      let isLive = false;

      // Skip live fetch if opened directly from local filesystem (file://) to prevent CORS console warnings
      if (window.location.protocol !== 'file:') {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        try {
          const response = await fetch(API_URL, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          if (response.ok) {
            const data = await response.json();
            const items = Array.isArray(data) ? data : (data.data || data.results || []);
            sightings = items.map((obj, i) => normalizeSighting(obj, i, 'api-')).filter(Boolean);
            isLive = sightings.length > 0;
          }
        } catch (err) {
          console.warn('Live API fetch skipped or failed. Fallback mode engaged.');
        }
      }

      if (!isLive) {
        sightings = generateDemoSightings();
      }

      const rawLocalStorage = localStorage.getItem(LOCAL_KEY);
      if (rawLocalStorage) {
        try {
          const localData = JSON.parse(rawLocalStorage);
          if (Array.isArray(localData)) {
            localData
              .map((obj, i) => normalizeSighting(obj, i, 'local-'))
              .filter(Boolean)
              .forEach(s => sightings.push(s));
          }
        } catch (e) {
          console.error('Error parsing local storage:', e);
        }
      }

      const badge = document.getElementById('data-source-badge');
      if (badge) {
        badge.className = isLive ? 'live' : 'demo';
        badge.textContent = isLive ? 'Live API Data' : 'Demo Mode (API Offline/Blocked)';
      }

      return sightings;
    }

    /* ==========================================================================
       SECTION 5: MAP RENDERING & MARKERS
       ========================================================================== */
	function initMap() {
      mapInstance = L.map('map').setView([54.3, -2.5], 6);

      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 16,
        attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
      }).addTo(mapInstance);

      markersLayerGroup = L.layerGroup().addTo(mapInstance);
      setTimeout(() => mapInstance.invalidateSize(), 200);
    }

    function createCustomMarkerIcon(sighting) {
      const daysOld = (Date.now() - sighting.date) / ONE_DAY_MS;
      const size = daysOld <= 7 ? 24 : daysOld <= 30 ? 19 : 14;
      const isPulse = daysOld <= 7 ? ' pulse-pin' : '';

      const sevColor = SEVERITY_COLORS[sighting.severity] || '#10b981';
      const specColor = SPECIES_COLORS[sighting.species] || DEFAULT_SPECIES_COLOR;

      return L.divIcon({
        className: 'pin-wrapper' + isPulse,
        iconSize: [size, size],
        html: `<span class="pin-marker" style="width:${size}px;height:${size}px;background:${sevColor};border-color:${specColor}"></span>`
      });
    }

    function getSelectedSliderDate() {
      const slider = document.getElementById('timeline-slider');
      return new Date(timelineMinDate.getTime() + (parseInt(slider.value, 10) + 1) * ONE_DAY_MS - 1);
    }

    function renderMapMarkers() {
      markersLayerGroup.clearLayers();
      const cutoffDate = activeFilteredSightings.length ? getSelectedSliderDate() : new Date(0);
      const visibleSightings = activeFilteredSightings.filter(s => s.date <= cutoffDate);

      visibleSightings.forEach(s => {
        const marker = L.marker([s.lat, s.lng], {
          icon: createCustomMarkerIcon(s),
          title: `${s.species}, ${s.severity} Severity, ${s.city}, ${formatDate(s.date)}`
        });

        marker.on('click', () => displaySightingDetails(s));
        marker.addTo(markersLayerGroup);
      });

      document.getElementById('sightings-count').textContent = `Showing ${visibleSightings.length} of ${allSightingsData.length} sightings`;
      document.getElementById('timeline-date-label').textContent = activeFilteredSightings.length ? formatDate(cutoffDate) : '—';
    }

    /* ==========================================================================
       SECTION 6: FILTERS & TIMELINE PLAYBACK LOGIC
       ========================================================================== */
    function applyFilters() {
      stopAutoPlay();

      const city = document.getElementById('filter-city').value;
      const dateFrom = document.getElementById('filter-date-from').value;
      const dateTo = document.getElementById('filter-date-to').value;
      const species = document.getElementById('filter-species').value;
      const severity = document.getElementById('filter-severity').value;

      activeFilteredSightings = allSightingsData.filter(s => {
        if (dateFrom && s.date < new Date(dateFrom)) return false;
        if (dateTo && s.date > new Date(dateTo + 'T23:59:59')) return false;
        if (species && s.species !== species) return false;
        if (severity && s.severity !== severity) return false;
        if (city && calculateDistanceKm([s.lat, s.lng], UK_CITIES[city]) > 50) return false;
        return true;
      }).sort((a, b) => a.date - b.date);

      const slider = document.getElementById('timeline-slider');
      if (activeFilteredSightings.length > 0) {
        const earliest = activeFilteredSightings[0].date;
        timelineMinDate = new Date(earliest.getFullYear(), earliest.getMonth(), earliest.getDate());
        const maxDays = Math.ceil((activeFilteredSightings[activeFilteredSightings.length - 1].date - timelineMinDate) / ONE_DAY_MS);

        slider.max = maxDays;
        slider.value = maxDays;
        slider.disabled = false;
      } else {
        slider.max = 0;
        slider.value = 0;
        slider.disabled = true;
      }

      renderMapMarkers();
      closeSightingDetails();
      renderHistogram(activeFilteredSightings, city ? `Activity within 50 km of ${city}` : 'Activity across the UK');
    }

    function stopAutoPlay() {
      if (playTimer) {
        clearInterval(playTimer);
        playTimer = null;
        const btn = document.getElementById('btn-play');
        btn.innerHTML = '&#9654;';
        btn.setAttribute('aria-pressed', 'false');
      }
    }

    function toggleAutoPlay() {
      if (playTimer) {
        stopAutoPlay();
        return;
      }

      const slider = document.getElementById('timeline-slider');
      if (slider.disabled) return;

      if (parseInt(slider.value, 10) >= parseInt(slider.max, 10)) {
        slider.value = 0;
      }

      const step = Math.max(1, Math.ceil(parseInt(slider.max, 10) / 120));
      const btn = document.getElementById('btn-play');
      btn.innerHTML = '&#10074;&#10074;';
      btn.setAttribute('aria-pressed', 'true');

      playTimer = setInterval(() => {
        const nextVal = parseInt(slider.value, 10) + step;
        slider.value = Math.min(nextVal, parseInt(slider.max, 10));
        renderMapMarkers();

        if (parseInt(slider.value, 10) >= parseInt(slider.max, 10)) {
          stopAutoPlay();
        }
      }, 120);
    }

    function renderHistogram(list, caption) {
      const now = new Date();
      const monthBuckets = [];

      for (let i = 23; i >= 0; i--) {
        monthBuckets.push(new Date(now.getFullYear(), now.getMonth() - i, 1));
      }

      const counts = monthBuckets.map(m => list.filter(s =>
        s.date.getFullYear() === m.getFullYear() && s.date.getMonth() === m.getMonth()
      ).length);

      const maxVal = Math.max(1, ...counts);
      document.getElementById('timeline-caption').textContent = `${caption}: ${list.length} sightings in last 24 months`;

      const barsContainer = document.getElementById('histogram-bars');
      barsContainer.innerHTML = counts.map((count, i) => {
        const monthStr = monthBuckets[i].toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
        return `<i style="height:${(count / maxVal) * 100}%" title="${monthStr}: ${count}"></i>`;
      }).join('');

      document.getElementById('axis-start-date').textContent = monthBuckets[0].toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
      document.getElementById('axis-end-date').textContent = monthBuckets[23].toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
    }

    /* ==========================================================================
       SECTION 7: SIGHTING DETAILS CARD
       ========================================================================== */
    function displaySightingDetails(sighting) {
      const box = document.getElementById('detail-box');
      const speciesColor = SPECIES_COLORS[sighting.species] || DEFAULT_SPECIES_COLOR;

      box.innerHTML = `
        <div class="top">
          <h3 id="detail-heading">
            <span class="legend-dot" style="background:${speciesColor}"></span>
            ${escapeHtml(sighting.species === 'Other' && sighting.rawSpecies ? sighting.rawSpecies : sighting.species)}
          </h3>
          <button class="close-btn" type="button" aria-label="Close" id="btn-close-detail">&times;</button>
        </div>
        <dl>
          <dt>Severity</dt>
          <dd><span class="severity-pill" style="background:${SEVERITY_COLORS[sighting.severity]}">${sighting.severity}</span></dd>
          <dt>Date</dt>
          <dd>${formatDate(sighting.date)}</dd>
          <dt>Location</dt>
          <dd>${escapeHtml(sighting.city)} (${sighting.lat.toFixed(3)}, ${sighting.lng.toFixed(3)})</dd>
          ${sighting.notes ? `<dt>Notes</dt><dd>${escapeHtml(sighting.notes)}</dd>` : ''}
        </dl>
        <div class="detail-actions">
          <a class="btn primary" href="contact.html?lat=${sighting.lat.toFixed(5)}&lng=${sighting.lng.toFixed(5)}#report-heading">Report</a>
          <a class="btn" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=${sighting.lat},${sighting.lng}">Directions</a>
          <button class="btn" type="button" id="btn-share-sighting">Share</button>
        </div>
      `;

      box.classList.add('open');
      document.getElementById('btn-close-detail').onclick = closeSightingDetails;

      const shareBtn = document.getElementById('btn-share-sighting');
      if (shareBtn) {
        shareBtn.onclick = () => {
          const shareUrl = `${window.location.origin}${window.location.pathname}?id=${sighting.id}`;
          navigator.clipboard.writeText(shareUrl).then(() => {
            showToast('Sighting link copied to clipboard!');
          }).catch(() => {
            showToast('Unable to copy link.');
          });
        };
      }
    }

    function closeSightingDetails() {
      const box = document.getElementById('detail-box');
      if (box) box.classList.remove('open');
    }

    function populateFilterDropdowns() {
      const citySelect = document.getElementById('filter-city');
      Object.keys(UK_CITIES).sort().forEach(c => {
        const opt = document.createElement('option');
        opt.value = c;
        opt.textContent = c;
        citySelect.appendChild(opt);
      });

      const speciesSelect = document.getElementById('filter-species');
      const speciesLegend = document.getElementById('legend-species-list');

      Object.keys(SPECIES_COLORS).forEach(s => {
        const opt = document.createElement('option');
        opt.value = s;
        opt.textContent = s;
        speciesSelect.appendChild(opt);

        if (speciesLegend) {
          const span = document.createElement('span');
          span.innerHTML = `<span class="legend-dot" style="background:${SPECIES_COLORS[s]}"></span>${s}`;
          speciesLegend.appendChild(span);
        }
      });
    }

    /* ==========================================================================
       SECTION 8: INITIALISATION
       ========================================================================== */
    document.addEventListener('DOMContentLoaded', async () => {
      initMap();
      populateFilterDropdowns();

      document.getElementById('timeline-slider').addEventListener('input', renderMapMarkers);
      document.getElementById('btn-play').addEventListener('click', toggleAutoPlay);
      document.getElementById('filter-city').addEventListener('change', applyFilters);
      document.getElementById('filter-date-from').addEventListener('change', applyFilters);
      document.getElementById('filter-date-to').addEventListener('change', applyFilters);
      document.getElementById('filter-species').addEventListener('change', applyFilters);
      document.getElementById('filter-severity').addEventListener('change', applyFilters);

      document.getElementById('btn-reset-filters').addEventListener('click', () => {
        document.getElementById('filter-city').value = '';
        document.getElementById('filter-date-from').value = '';
        document.getElementById('filter-date-to').value = '';
        document.getElementById('filter-species').value = '';
        document.getElementById('filter-severity').value = '';
        applyFilters();
      });

      allSightingsData = await loadAllData();
      applyFilters();
    });
