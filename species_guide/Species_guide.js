 <!-- MODULE 1: CHART ENGINE (STANDALONE) -->
    const TickChartEngine = (function() {
      let chartInstance = null;

      const years = ['2012', '2013', '2014', '2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      const dataset = {
        "Passerine tick": {
          annual: [4, 5, 6, 8, 5, 7, 6, 8, 4, 6, 5, 4, 2],
          seasonal: [2, 4, 8, 12, 9, 6, 5, 7, 9, 5, 2, 1]
        },
        "Southern rodent tick": {
          annual: [3, 4, 5, 6, 4, 5, 6, 7, 5, 6, 4, 4, 3],
          seasonal: [1, 2, 5, 9, 11, 8, 6, 7, 8, 3, 1, 1]
        },
        "Marsh tick": {
          annual: [2, 4, 5, 7, 5, 6, 7, 6, 5, 7, 6, 5, 3],
          seasonal: [1, 3, 7, 10, 8, 5, 4, 8, 10, 4, 2, 0]
        },
        "Tree-hole tick": {
          annual: [3, 3, 4, 6, 5, 6, 5, 5, 4, 5, 5, 4, 2],
          seasonal: [0, 2, 6, 11, 9, 7, 4, 6, 7, 2, 1, 0]
        },
        "Fox/badger tick": {
          annual: [2, 4, 4, 5, 4, 6, 5, 6, 4, 6, 4, 3, 2],
          seasonal: [1, 2, 6, 10, 8, 6, 5, 8, 6, 2, 0, 0]
        }
      };

      function init(canvasId) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        chartInstance = new Chart(ctx, {
          type: 'line',
          data: {
            labels: years,
            datasets: [{
              label: 'Sightings',
              data: dataset["Passerine tick"].annual,
              borderColor: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              borderWidth: 2,
              fill: true,
              tension: 0.3,
              pointBackgroundColor: '#10b981',
              pointRadius: 4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { grid: { color: 'rgba(26, 56, 43, 0.5)' }, ticks: { color: '#9ca6b8' } },
              y: { grid: { color: 'rgba(26, 56, 43, 0.5)' }, ticks: { color: '#9ca6b8' }, beginAtZero: true }
            }
          }
        });
      }

      function update(species, mode) {
        if (!chartInstance) return;
        const dataObj = dataset[species] || dataset["Passerine tick"];

        if (mode === 'annual') {
          chartInstance.data.labels = years;
          chartInstance.data.datasets[0].data = dataObj.annual;
          chartInstance.config.type = 'line';
        } else {
          chartInstance.data.labels = months;
          chartInstance.data.datasets[0].data = dataObj.seasonal;
          chartInstance.config.type = 'bar';
        }
        chartInstance.update();
      }

      return { init, update };
    })();

  <!-- MODULE 2: UI BUTTON CONTROLLERS (SEPARATED) -->
    document.addEventListener('DOMContentLoaded', function() {
      // 1. Initialize standalone Chart
      TickChartEngine.init('tickChart');

      let selectedSpecies = 'Passerine tick';
      let selectedMode = 'annual';

      const speciesData = {
        "Passerine tick": { latin: "Dermacentor frontalis", hosts: "Passerine birds, wild mammals, dogs", habitat: "Woodlands, hedgerows, scrubby vegetation", prevention: "Regular anti-parasitic treatment, check pet coats after walks." },
        "Southern rodent tick": { latin: "Ixodes acuminatus", hosts: "Rodents, voles, small pets", habitat: "Grassy fields, burrows, agricultural margins", prevention: "Keep grass trimmed, inspect outdoor animals frequently." },
        "Marsh tick": { latin: "Ixodes apronophorus", hosts: "Water voles, semi-aquatic fauna, dogs", habitat: "Wetlands, marshes, riverbanks", prevention: "Avoid dense wet vegetation; treat pets before outdoor trips." },
        "Tree-hole tick": { latin: "Ixodes arboricola", hosts: "Cavity-nesting birds, squirrels", habitat: "Tree hollows, bird boxes, old woodlands", prevention: "Avoid unmaintained bird nests/boxes during active season." },
        "Fox/badger tick": { latin: "Ixodes canisuga", hosts: "Foxes, badgers, domestic dogs", habitat: "Den sites, burrows, urban edge habitats", prevention: "Keep pets away from wildlife dens; apply approved tick collars." }
      };

      // 2. Sidebar species selection listener
      document.querySelectorAll('.btn-sidebar').forEach(button => {
        button.addEventListener('click', function() {
          document.querySelectorAll('.btn-sidebar').forEach(b => b.classList.remove('active'));
          this.classList.add('active');

          selectedSpecies = this.getAttribute('data-species');

          // Update Species Guide Article
          const info = speciesData[selectedSpecies];
          document.getElementById('species-info').innerHTML = `
            <h3>${selectedSpecies} (<i>${info.latin}</i>)</h3>
            <p><strong>Primary Hosts:</strong> ${info.hosts}</p>
            <p><strong>Habitat:</strong> ${info.habitat}</p>
            <p><strong>Prevention Tips:</strong> ${info.prevention}</p>
          `;

          // Notify Chart Engine independently
          TickChartEngine.update(selectedSpecies, selectedMode);
        });
      });

      // 3. Chart mode toggle button listener
      document.querySelectorAll('.btn-toggle').forEach(button => {
        button.addEventListener('click', function() {
          document.querySelectorAll('.btn-toggle').forEach(b => b.classList.remove('active'));
          this.classList.add('active');

          selectedMode = this.getAttribute('data-mode');
          document.getElementById('chart-heading').innerText = selectedMode === 'annual' ? 'Annual Sightings Growth' : 'Monthly Seasonal Activity';

          // Notify Chart Engine independently
          TickChartEngine.update(selectedSpecies, selectedMode);
        });
      });
    });
