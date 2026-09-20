// Part of ais-simulator, a AIS message composer and transmitter.
//
// Copyright (c) 2020 Michael Wolf <michael@mictronics.de>
//
// This file is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// any later version.
//
// This file is distributed in the hope that it will be useful, but
// WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
// General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

// Minimal hand-written subset of Leaflet's API, covering only what this app uses.
declare namespace L {
	interface LatLngLiteral {
		lat: number;
		lng: number;
	}

	interface LeafletMouseEvent {
		latlng: LatLngLiteral;
	}

	interface MapOptions {
		center?: [number, number];
		zoom?: number;
	}

	class Map {
		constructor(id: string | HTMLElement, options?: MapOptions);
		setView: (center: [number, number], zoom?: number) => Map;
		on: (type: "click", fn: (e: LeafletMouseEvent) => void) => Map;
		invalidateSize: () => Map;
	}

	function map(id: string | HTMLElement, options?: MapOptions): Map;

	interface TileLayerOptions {
		attribution?: string;
		maxZoom?: number;
	}

	class TileLayer {
		addTo: (map: Map) => TileLayer;
	}

	function tileLayer(urlTemplate: string, options?: TileLayerOptions): TileLayer;

	interface DivIconOptions {
		html?: string;
		className?: string;
		iconSize?: [number, number];
		iconAnchor?: [number, number];
	}

	class DivIcon {
		constructor(options?: DivIconOptions);
	}

	function divIcon(options?: DivIconOptions): DivIcon;

	interface MarkerOptions {
		icon?: DivIcon;
	}

	class Marker {
		constructor(latlng: [number, number], options?: MarkerOptions);
		addTo: (map: Map) => Marker;
		setLatLng: (latlng: [number, number]) => Marker;
		on: (type: "click", fn: () => void) => Marker;
		getElement: () => HTMLElement | undefined;
		remove: () => Marker;
	}

	function marker(latlng: [number, number], options?: MarkerOptions): Marker;

	interface PathOptions {
		color?: string;
		weight?: number;
		dashArray?: string;
	}

	class Polyline {
		constructor(latlngs: Array<[number, number]>, options?: PathOptions);
		addTo: (map: Map) => Polyline;
		setLatLngs: (latlngs: Array<[number, number]>) => Polyline;
		remove: () => Polyline;
	}

	function polyline(latlngs: Array<[number, number]>, options?: PathOptions): Polyline;

	class Circle {
		constructor(latlng: [number, number], options?: PathOptions & { radius?: number });
		addTo: (map: Map) => Circle;
		setLatLng: (latlng: [number, number]) => Circle;
		setRadius: (radius: number) => Circle;
		remove: () => Circle;
	}

	function circle(latlng: [number, number], options?: PathOptions & { radius?: number }): Circle;
}
