type RoutePoint = {
  latitude: number;
  longitude: number;
  label: string;
};

const PIN_COLORS = {
  departure: { fill: '#059669', inner: '#047857' },
  arrival: { fill: '#B42318', inner: '#912018' },
} as const;

/** Map pin marker — green for departure, red for arrival. */
function pinIconDataUrl(kind: 'departure' | 'arrival'): string {
  const colors = PIN_COLORS[kind];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="30" viewBox="0 0 28 40">
    <path fill="${colors.fill}" stroke="#FFFFFF" stroke-width="2"
      d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.3 21.7 0 14 0z"/>
    <circle cx="14" cy="14" r="5" fill="#FFFFFF"/>
    <circle cx="14" cy="14" r="3" fill="${colors.inner}"/>
  </svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

/**
 * Full-bleed Google Map with Directions route and draw-on animation.
 * Requires Maps JavaScript API (+ Directions API preferred).
 */
export function buildSearchRouteMapHtml(
  apiKey: string,
  origin: RoutePoint,
  destination: RoutePoint,
): string {
  const originJson = JSON.stringify({
    lat: origin.latitude,
    lng: origin.longitude,
    label: origin.label,
  });
  const destinationJson = JSON.stringify({
    lat: destination.latitude,
    lng: destination.longitude,
    label: destination.label,
  });
  const departureIcon = JSON.stringify(pinIconDataUrl('departure'));
  const arrivalIcon = JSON.stringify(pinIconDataUrl('arrival'));

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
    <style>
      html, body, #map { height: 100%; margin: 0; padding: 0; background: #f3f4f6; }
      /* Hide Maps footer chrome (keyboard shortcuts / Map Data / Terms links). */
      .gm-style-cc,
      .gmnoprint.gm-style-cc,
      .gm-style a[href^="https://maps.google.com/maps"],
      .gm-style-cc + .gmnoprint,
      button.gm-control-active[title="Keyboard shortcuts"],
      .gm-fullscreen-control,
      a[href*="policies.google.com"],
      a[href*="www.google.com/maps/@"] {
        display: none !important;
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script>
      const ORIGIN = ${originJson};
      const DESTINATION = ${destinationJson};
      const DEPARTURE_ICON = ${departureIcon};
      const ARRIVAL_ICON = ${arrivalIcon};
      const BRAND = '#B42318';

      function post(status, detail) {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ status: status, detail: detail || '' }));
        }
      }

      function makeMarker(map, position, title, iconUrl) {
        return new google.maps.Marker({
          map: map,
          position: position,
          title: title,
          icon: {
            url: iconUrl,
            scaledSize: new google.maps.Size(22, 30),
            anchor: new google.maps.Point(11, 30),
          },
          optimized: false,
        });
      }

      function animatePath(map, path) {
        const line = new google.maps.Polyline({
          path: [],
          geodesic: true,
          strokeColor: BRAND,
          strokeOpacity: 0.95,
          strokeWeight: 5,
          map: map,
        });

        const total = path.length;
        if (total < 2) {
          line.setPath(path);
          return;
        }

        const steps = Math.min(72, total);
        const chunk = Math.max(1, Math.ceil(total / steps));
        let index = 0;

        function tick() {
          index = Math.min(total, index + chunk);
          line.setPath(path.slice(0, index));
          if (index < total) {
            window.requestAnimationFrame(tick);
          } else {
            post('ready');
          }
        }

        window.requestAnimationFrame(tick);
      }

      function fitRoute(map, path) {
        const bounds = new google.maps.LatLngBounds();
        path.forEach(function (point) { bounds.extend(point); });
        map.fitBounds(bounds, { top: 36, right: 28, bottom: 28, left: 28 });
      }

      function drawFallback(map) {
        const path = [
          new google.maps.LatLng(ORIGIN.lat, ORIGIN.lng),
          new google.maps.LatLng(DESTINATION.lat, DESTINATION.lng),
        ];
        makeMarker(map, path[0], ORIGIN.label, DEPARTURE_ICON);
        makeMarker(map, path[1], DESTINATION.label, ARRIVAL_ICON);
        fitRoute(map, path);
        animatePath(map, path);
      }

      function initMap() {
        const map = new google.maps.Map(document.getElementById('map'), {
          center: { lat: ORIGIN.lat, lng: ORIGIN.lng },
          zoom: 7,
          disableDefaultUI: true,
          keyboardShortcuts: false,
          zoomControl: false,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          cameraControl: false,
          gestureHandling: 'greedy',
          clickableIcons: false,
          styles: [
            { featureType: 'poi', stylers: [{ visibility: 'off' }] },
            { featureType: 'transit', stylers: [{ visibility: 'off' }] },
          ],
        });

        const service = new google.maps.DirectionsService();
        service.route(
          {
            origin: { lat: ORIGIN.lat, lng: ORIGIN.lng },
            destination: { lat: DESTINATION.lat, lng: DESTINATION.lng },
            travelMode: google.maps.TravelMode.DRIVING,
          },
          function (result, status) {
            if (status !== 'OK' || !result || !result.routes || !result.routes[0]) {
              drawFallback(map);
              post('fallback', status);
              return;
            }

            const overview = result.routes[0].overview_path || [];
            makeMarker(
              map,
              overview[0] || { lat: ORIGIN.lat, lng: ORIGIN.lng },
              ORIGIN.label,
              DEPARTURE_ICON,
            );
            makeMarker(
              map,
              overview[overview.length - 1] || { lat: DESTINATION.lat, lng: DESTINATION.lng },
              DESTINATION.label,
              ARRIVAL_ICON,
            );
            fitRoute(map, overview);
            animatePath(map, overview);
          },
        );
      }

      window.initMap = initMap;
    </script>
    <script async defer src="https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&callback=initMap"></script>
  </body>
</html>`;
}
