const menuToggle = document.getElementById('menuToggle');
const navMenu = document.getElementById('navMenu');
const navLinks = document.querySelectorAll('.nav a');
const themeToggle = document.getElementById('themeToggle');
const root = document.documentElement;
const revealItems = document.querySelectorAll('.reveal');
const predictionBox = document.getElementById('predictionBox');

menuToggle.addEventListener('click', () => {
  navMenu.classList.toggle('show');
});

navLinks.forEach(link => {
  link.addEventListener('click', () => {
    navMenu.classList.remove('show');
  });
});

themeToggle.addEventListener('click', () => {
  const currentTheme = root.getAttribute('data-theme');
  const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', nextTheme);
  themeToggle.innerHTML = nextTheme === 'dark'
    ? '<i class="fa-solid fa-moon"></i>'
    : '<i class="fa-solid fa-sun"></i>';
});

window.addEventListener('scroll', () => {
  let current = '';
  document.querySelectorAll('section').forEach(section => {
    const sectionTop = section.offsetTop - 140;
    if (window.scrollY >= sectionTop) {
      current = section.getAttribute('id');
    }
  });

  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === `#${current}`) {
      link.classList.add('active');
    }
  });
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.15 });

revealItems.forEach(item => observer.observe(item));

const map = L.map('satelliteMap', { zoomControl: true }).setView([25.4358, 81.8463], 6);

const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

const sarOverlay = L.layerGroup();
const cropLayer = L.layerGroup().addTo(map);

const sarZones = [
  { center: [25.55, 81.95], radius: 18000 },
  { center: [26.02, 82.21], radius: 14000 },
  { center: [24.98, 81.52], radius: 16000 }
];

sarZones.forEach(zone => {
  L.circle(zone.center, {
    radius: zone.radius,
    color: '#38bdf8',
    weight: 1.5,
    fillColor: '#38bdf8',
    fillOpacity: 0.12,
    dashArray: '6 6'
  }).bindTooltip('Simulated SAR intensity zone', { className: 'custom-tooltip' }).addTo(sarOverlay);
});

const cropFeatures = [
  {
    crop: 'Wheat',
    confidence: 92,
    description: 'High-confidence wheat classification from seasonal SAR backscatter pattern.',
    color: '#22c55e',
    coords: [[25.62,81.74],[25.69,81.86],[25.59,82.0],[25.48,81.88]]
  },
  {
    crop: 'Rice',
    confidence: 89,
    description: 'Likely rice area with water-sensitive SAR response and dense growth phase signal.',
    color: '#3b82f6',
    coords: [[25.22,81.55],[25.32,81.68],[25.25,81.84],[25.1,81.7]]
  },
  {
    crop: 'Maize',
    confidence: 86,
    description: 'Moderate-to-high maize classification supported by temporal variability pattern.',
    color: '#eab308',
    coords: [[25.88,82.12],[25.95,82.28],[25.84,82.37],[25.77,82.18]]
  }
];

cropFeatures.forEach(feature => {
  L.polygon(feature.coords, {
    color: feature.color,
    weight: 2,
    fillColor: feature.color,
    fillOpacity: 0.35
  })
    .bindPopup(`
      <div style="min-width:200px">
        <strong>${feature.crop}</strong><br>
        Confidence: ${feature.confidence}%<br>
        <span>${feature.description}</span>
      </div>
    `)
    .bindTooltip(`${feature.crop} • ${feature.confidence}%`, { className: 'custom-tooltip' })
    .addTo(cropLayer);
});

const pointLayer = L.layerGroup().addTo(map);
const markers = [
  { latlng: [25.48, 81.9], crop: 'Wheat', confidence: 92 },
  { latlng: [25.26, 81.67], crop: 'Rice', confidence: 89 },
  { latlng: [25.86, 82.26], crop: 'Maize', confidence: 86 }
];

markers.forEach(item => {
  L.circleMarker(item.latlng, {
    radius: 7,
    color: '#ffffff',
    weight: 1.5,
    fillColor: '#8b5cf6',
    fillOpacity: 0.9
  })
    .bindPopup(`<strong>${item.crop}</strong><br>Confidence: ${item.confidence}%`)
    .bindTooltip(`Classified point: ${item.crop}`, { className: 'custom-tooltip' })
    .addTo(pointLayer);
});

sarOverlay.addTo(map);

L.control.layers(
  { 'OpenStreetMap': osm },
  {
    'Simulated SAR Layer': sarOverlay,
    'Crop Classification Layer': cropLayer,
    'Classification Markers': pointLayer
  },
  { collapsed: false }
).addTo(map);

const legend = L.control({ position: 'bottomright' });
legend.onAdd = function () {
  const div = L.DomUtil.create('div', 'legend-control');
  div.innerHTML = `
    <div class="legend-title">Crop Legend</div>
    <div class="legend-row"><span class="legend-swatch" style="background:#22c55e"></span> Wheat</div>
    <div class="legend-row"><span class="legend-swatch" style="background:#3b82f6"></span> Rice</div>
    <div class="legend-row"><span class="legend-swatch" style="background:#eab308"></span> Maize</div>
    <div class="legend-row"><span class="legend-swatch" style="background:#8b5cf6"></span> Classified Point</div>
  `;
  return div;
};
legend.addTo(map);

const simulatedPredictions = [
  { crop: 'Wheat', confidence: 91, note: 'Strong winter crop signature.' },
  { crop: 'Rice', confidence: 88, note: 'Water-linked SAR response detected.' },
  { crop: 'Maize', confidence: 84, note: 'Moderate seasonal vegetation pattern.' }
];

map.on('click', function (e) {
  const randomPrediction = simulatedPredictions[Math.floor(Math.random() * simulatedPredictions.length)];

  L.popup()
    .setLatLng(e.latlng)
    .setContent(`
      <strong>Predicted crop:</strong> ${randomPrediction.crop}<br>
      <strong>Confidence:</strong> ${randomPrediction.confidence}%<br>
      <span>${randomPrediction.note}</span>
    `)
    .openOn(map);

  predictionBox.innerHTML = `
    <h4>Live prediction</h4>
    <p><strong>Crop:</strong> ${randomPrediction.crop}</p>
    <p><strong>Confidence:</strong> ${randomPrediction.confidence}%</p>
    <p>${randomPrediction.note}</p>
  `;
});
