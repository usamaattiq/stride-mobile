/**
 * Interactive map for signup location (WebView + Maps JavaScript API).
 * Requires EXPO_PUBLIC_GOOGLE_MAPS_API_KEY with Maps JavaScript API and Geocoding API enabled.
 */
export function buildSignupMapPickerHtml(
  apiKey: string,
  initialPin: { latitude: number; longitude: number },
): string {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
    <style>
      html, body { height: 100%; margin: 0; padding: 0; }
      #map-wrap { position: relative; height: 100%; width: 100%; }
      #map { height: 100%; width: 100%; }
      #center-pin {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 28px;
        height: 40px;
        margin-left: -14px;
        margin-top: -40px;
        pointer-events: none;
        z-index: 2;
      }
    </style>
  </head>
  <body>
    <div id="map-wrap">
      <div id="map"></div>
      <svg id="center-pin" viewBox="0 0 28 40" aria-hidden="true">
        <path
          fill="#B42318"
          stroke="#FFFFFF"
          stroke-width="2"
          d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.3 21.7 0 14 0z"
        />
        <circle cx="14" cy="14" r="5" fill="#FFFFFF" />
      </svg>
    </div>
    <script>
      let map;
      let geocoder;
      let idleTimer;
      let userLocationMarker;

      function sendSelection(lat, lng, address) {
        window.ReactNativeWebView.postMessage(
          JSON.stringify({ latitude: lat, longitude: lng, address: address || '' }),
        );
      }

      function reverseGeocodeAndSend(lat, lng) {
        if (!geocoder) {
          sendSelection(lat, lng, '');
          return;
        }
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === 'OK' && results && results.length > 0) {
            sendSelection(lat, lng, results[0].formatted_address || '');
          } else {
            sendSelection(lat, lng, '');
          }
        });
      }

      function publishMapCenter() {
        const center = map.getCenter();
        if (!center) return;
        const lat = center.lat();
        const lng = center.lng();
        reverseGeocodeAndSend(lat, lng);
      }

      function schedulePublishMapCenter() {
        if (idleTimer) clearTimeout(idleTimer);
        idleTimer = setTimeout(publishMapCenter, 250);
      }

      window.__MUSAFIR_SET_LOCATION = function(lat, lng, address) {
        if (!map) return;
        map.panTo({ lat, lng });
        map.setZoom(16);
        if (address) {
          sendSelection(lat, lng, address);
        } else {
          reverseGeocodeAndSend(lat, lng);
        }
      };

      // Live device location — a separate blue dot, distinct from the fixed
      // center pin (which represents the value being picked). Only updates
      // the dot's position; never moves/zooms the map itself.
      window.__MUSAFIR_SHOW_USER_LOCATION = function(lat, lng) {
        if (!map) return;
        const pos = { lat, lng };
        if (!userLocationMarker) {
          userLocationMarker = new google.maps.Marker({
            position: pos,
            map: map,
            zIndex: 1,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 7,
              fillColor: '#4285F4',
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 2,
            },
          });
        } else {
          userLocationMarker.setPosition(pos);
        }
      };

      // Maps JavaScript API dropped its built-in "My Location" button years
      // ago — this recreates one as a standard custom control (Google's own
      // mechanism for adding controls docked alongside zoom/etc.), styled to
      // match. Tapping it defers to the native app's location permission flow
      // rather than the browser's own geolocation prompt.
      function createLocateMeControl() {
        const button = document.createElement('button');
        button.type = 'button';
        button.setAttribute('aria-label', 'Locate me');
        button.style.cssText =
          'width:40px;height:40px;margin:10px;border:none;border-radius:2px;' +
          'background:#fff;box-shadow:0 1px 4px rgba(0,0,0,0.3);cursor:pointer;' +
          'display:flex;align-items:center;justify-content:center;padding:0;';
        button.innerHTML =
          '<svg width="18" height="18" viewBox="0 0 24 24">' +
          '<path fill="#666" d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3' +
          'c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3' +
          '.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-' +
          '3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>' +
          '</svg>';
        button.addEventListener('click', function () {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'recenter' }));
        });
        return button;
      }

      function initMap() {
        const initial = { lat: ${initialPin.latitude}, lng: ${initialPin.longitude} };
        geocoder = new google.maps.Geocoder();
        map = new google.maps.Map(document.getElementById('map'), {
          center: initial,
          zoom: 15,
          disableDefaultUI: true,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          rotateControl: false,
          scaleControl: false,
        });

        map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(createLocateMeControl());

        reverseGeocodeAndSend(initial.lat, initial.lng);

        map.addListener('idle', schedulePublishMapCenter);
      }
    </script>
    <script async defer src="https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap"></script>
  </body>
</html>`;
}
