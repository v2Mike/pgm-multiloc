import {config} from '../config.ts';
import * as $ from 'jquery';
import loadGoogleMapsApi from 'load-google-maps-api';
import {Location} from './app.ts';
import {IMapOptions, Map} from './map.ts';
import {IBeehiveOptions, Beehive} from './beehive.ts';

export class GMaps {
    private map: Map;
    private gmap: google.maps.Map;
    private geocoder: google.maps.Geocoder;
    private infowindow: google.maps.InfoWindow;

    constructor() {
        this.map = new Map();
        loadGoogleMapsApi({
            key: config.googleMapsKey,
            libraries: ['places', 'geometry']
        }).then((googleMaps) => {
            this.initMap();
        });
    }

    public getMap(): Map {
        return this.map;
    }

    private initMap(): void {
        this.gmap = new google.maps.Map(document.getElementById('map'), {
            zoom: config.zoom,
            center: new google.maps.LatLng(config.latitude, config.longitude),
            mapTypeControl: true
        });

        let input = document.getElementById('pac-input') as HTMLInputElement;
        this.gmap.controls[google.maps.ControlPosition.TOP_CENTER].push(document.getElementById('custom-map-controls'));

        this.gmap.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(document.getElementById('generate-trigger'));

        this.gmap.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(document.getElementById('github-buttons'));

        let autocomplete = new google.maps.places.Autocomplete(input);
        autocomplete.bindTo('bounds', this.gmap);

        autocomplete.addListener('place_changed', () => {
            let place = autocomplete.getPlace();
            if (place.geometry) {
                this.gmap.setCenter(place.geometry.location);
                this.gmap.setZoom(config.zoom);
            }
        });
        
        document.getElementById('submit').addEventListener('click', () => {
            this.geocoder = new google.maps.Geocoder;
            this.infowindow = new google.maps.InfoWindow;
            
            let geo_input = document.getElementById('latlng') as HTMLInputElement;
            var latlngStr = geo_input.value.split(',', 2);
            var latlng = {lat: parseFloat(latlngStr[0]), lng: parseFloat(latlngStr[1])};
            
            this.geocoder.geocode({'location': latlng}, (results, status) => {
                var status_string: string = String(status);
                if (status_string === 'OK') {
                  if (results[1]) {
                    this.gmap.setZoom(13);
                    this.gmap.setCenter(latlng);
                    this.map.addBeehive(new Location(parseFloat(latlngStr[0]), parseFloat(latlngStr[1])));
                  } else {
                    window.alert('No results found');
                  }
                } else {
                  window.alert('Geocoder failed due to: ' + status);
                }
            });
        });

        this.gmap.addListener('click', (event: google.maps.MouseEvent) => {
            this.map.addBeehive(new Location(event.latLng.lat(), event.latLng.lng()));
        });

        google.maps.event.addListenerOnce(this.gmap, 'idle', () => {
            this.map.initMap(<IMapOptions>{ gmap: this.gmap });
        });

    }
}
