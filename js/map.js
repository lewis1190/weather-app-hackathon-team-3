let map;
let heatmap;

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 13,
    center: { lat: 37.782, lng: -122.447 },
  });

  // Heatmap data
  const heatmapData = [
    new google.maps.LatLng(37.782, -122.447),
    new google.maps.LatLng(37.782, -122.445),
    new google.maps.LatLng(37.782, -122.443),
    new google.maps.LatLng(37.782, -122.441),
  ];

  // Create heatmap layer
  heatmap = new google.maps.visualization.HeatmapLayer({
    data: heatmapData,
    map: null   // Start hidden
  });

  document.getElementById("toggle-heatmap").addEventListener("click", toggleHeatmap);
}

function toggleHeatmap() {
  heatmap.setMap(heatmap.getMap() ? null : map);
}

window.onload = initMap;
