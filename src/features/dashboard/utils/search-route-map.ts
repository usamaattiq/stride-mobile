type RoutePoint = {
  latitude: number;
  longitude: number;
  label: string;
};

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

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
    <style>
      html, body, #map { height: 100%; margin: 0; padding: 0; background: #f3f4f6; }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script>
      const ORIGIN = ${originJson};
      const DESTINATION = ${destinationJson};
      const BRAND = '#B42318';

      function post(status, detail) {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ status: status, detail: detail || '' }));
        }
      }

      function makeMarker(map, position, title, letter) {
        return new google.maps.Marker({
          map: map,
          position: position,
          title: title,
          label: {
            text: letter,
            color: '#FFFFFF',
            fontWeight: '700',
            fontSize: '12px',
          },
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: BRAND,
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2,
            scale: 14,
          },
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
        map.fitBounds(bounds, { top: 28, right: 24, bottom: 28, left: 24 });
      }

      function drawFallback(map) {
        const path = [
          new google.maps.LatLng(ORIGIN.lat, ORIGIN.lng),
          new google.maps.LatLng(DESTINATION.lat, DESTINATION.lng),
        ];
        makeMarker(map, path[0], ORIGIN.label, 'A');
        makeMarker(map, path[1], DESTINATION.label, 'B');
        fitRoute(map, path);
        animatePath(map, path);
      }

      function initMap() {
        const map = new google.maps.Map(document.getElementById('map'), {
          center: { lat: ORIGIN.lat, lng: ORIGIN.lng },
          zoom: 7,
          disableDefaultUI: true,
          zoomControl: false,
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
            makeMarker(map, overview[0] || { lat: ORIGIN.lat, lng: ORIGIN.lng }, ORIGIN.label, 'A');
            makeMarker(
              map,
              overview[overview.length - 1] || { lat: DESTINATION.lat, lng: DESTINATION.lng },
              DESTINATION.label,
              'B',
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
