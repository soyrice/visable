function renderEsriMap(placesData)
{
	require([
		"esri/Map",
		"esri/views/SceneView",
		"esri/views/MapView",
		"esri/widgets/Locate",
		"esri/geometry/Extent",

		"esri/Graphic",
		"esri/geometry/Point",
		"esri/symbols/SimpleMarkerSymbol",
		"esri/layers/GraphicsLayer",

		"esri/tasks/Locator",

		"dojo/json",

		"esri/PopupTemplate",

		"dojo/on",
		"dojo/dom",
		"dojo/dom-construct",
		"dojo/request",

		"dojo/domReady!"

	], function (Map, SceneView, MapView, Locate, Extent, Graphic, Point, SimpleMarkerSymbol, GraphicsLayer, Locator, JSON, PopupTemplate, on, dom, domConstruct, request) {

		var GEO_ENRICHMENT_URL = 'http://geoenrich.arcgis.com/arcgis/rest/services/World/geoenrichmentserver/GeoEnrichment/enrich';
		var LOCATOR_TASK = 'https://utility.arcgis.com/usrsvcs/appservices/mEg43zDsRI275tGc/rest/services/World/GeocodeServer';
		var TEMP_TOKEN = 'u_7Ga6wk_5Yxx9CW639yf1awRxJWibOD5AjyCuYG0TgqEYmVDOrz3WEfb-x03tDAmFNXOSkp3Pt1MYNtZHdfdJW_sX3UpaRaY99PpgUN7jTBzcjQCzkj-sF5SaFiEkymDj-jf46tf37ooPUU97yJIQ..';

		var map = new Map({
			basemap: "streets",
			ground: "world-elevation"
		});

		var sceneView = new SceneView({
			container: "mapDiv",
			map: map,
			scale: 50000000
		});

		addLocationButton();
		addBasemapCycleButton(map);
		locatePlacesAndAddToMap(placesData);

		function addLocationButton()
		{
			var locateBtn = new Locate({
				view: sceneView
			});

			sceneView.ui.add(locateBtn, {
				position: "top-left"
			});
		}

		var currBasemapId = 1;
		var baseMaps = ["streets", "satellite", "hybrid", "topo", "gray", "dark-gray", "oceans", "national-geographic", "terrain", "osm", "dark-gray-vector", "gray-vector",  "streets-vector", "streets-night-vector", "streets-relief-vector", "streets-navigation-vector", "topo-vector"];
		function addBasemapCycleButton(map)
		{
			var cycleButton = "<i class=\"fa fa-refresh fa-3x\" aria-hidden=\"true\" style=\"color:#fff;\"></i>";
			var domElement = domConstruct.toDom(cycleButton);
			on(domElement, "click", function (event) {
				map.basemap = baseMaps[currBasemapId % baseMaps.length];
				currBasemapId++;
			})

			sceneView.ui.add(domElement , {
				position: "bottom-left"
			});
		}

		function locatePlacesAndAddToMap(placesData)
		{
			// Add graphics layer
			var graphicsLayer = new GraphicsLayer();
			map.add(graphicsLayer)

			// Initialize a symbol
			var markerSymbol = new SimpleMarkerSymbol({
				style: "circle",
				color: "blue",
				outline: {
					color: [255, 255, 225],
					width: 3
				}
			});

			// Create a locator task using the world geocoding service
			var locatorTask = new Locator({
				url: LOCATOR_TASK
			});

			var addresses = []

			// Add places to map
			for (var i = 0; i < placesData.length; i++) {

				var address = {
					"OBJECTID": i,
					"singleLine": placesData[i]
				};
				addresses.push(address)
			}

			var params = {
				addresses: addresses
			}

			locatorTask.addressesToLocations(params).then(function (locations) {

				var places = [];

				locations.forEach(function (loc)
				{
					var placePoint = new Point({
						x: loc.location.x,
						y: loc.location.y,
						z: 1010
					});

					var place = {
						name: loc.attributes.LongLabel,
						x: loc.location.x,
						y: loc.location.y,
						subregion: loc.attributes.Subregion,
						placePoint: placePoint,
						country:loc.attributes.Country
					};

					places.push(place)
				});

				addPlacesToMap(places, graphicsLayer, sceneView, markerSymbol);
				addListOfPlaces(places);

			}).otherwise(function (err) {
				console.log(response)
			})
		}

		function addPlacesToMap(places, graphicsLayer, sceneView, markerSymbol)
		{
			var minX = Number.MAX_VALUE, minY = Number.MAX_VALUE, maxX = -Number.MAX_VALUE, maxY = -Number.MAX_VALUE;

			// Add places to map
			for (var i = 0; i < places.length; i++)
			{
				var place = places[i];

				var xCord = Math.round(place.x)
				var yCord = Math.round(place.y)

				if (minX > xCord) { minX = xCord }
				if (maxX < xCord) {	maxX = xCord }
				if (minY > yCord) { minY = yCord }
				if (maxY < yCord) {	maxY = yCord }

				var pointGraphic = new Graphic({
					geometry: place.placePoint,
					symbol: markerSymbol,
					attribute: {
						"name": place.name
					}
				});

				pointGraphic.popupTemplate = {
					title: place.name,
					content: getGeoEnrichmentData(place)
				};

				graphicsLayer.add(pointGraphic)
			}

			var placesExtent = new Extent({
				xmin: minX,
				ymin: minY,
				xmax: maxX,
				ymax: maxY
			});

			var mapPadding = 50;

			sceneView.padding = {
				top: mapPadding,
				left: mapPadding,
				right: mapPadding,
				bottom: mapPadding
			};

			sceneView.then(function () {
				sceneView.goTo(placesExtent);
			})
		}

		function addListOfPlaces(places)
		{
			places.sort(function(a, b) {return a.name.localeCompare(b.name);} );

			var domElement = "<ul id=\"places_list\">";

			var i = 0;
			places.forEach(function (place)
			{
				var placesId = "places_" + i;
				domElement += "<li id=\"" + placesId + "\">" + place.name + "</li>";
				i++;
			});

			domElement += "</ul>";

			var listView = domConstruct.toDom(domElement);

			sceneView.ui.add(listView, {
				position: "bottom-right"
			});

			var k = 0;
			places.forEach(function (place) {

				on(dom.byId("places_" + k), "click", function (evt)
				{
					var place = places[evt.currentTarget.id.split('_')[1]];

					chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
						 chrome.tabs.sendMessage(tabs[0].id, {
							 action : "searchForWord",
							 source : (place.name.split(',')[0])
						 }, function(response) {}); 
					 });
					
					sceneView.goTo(place.placePoint);
				});
				k++;
			});
		}

		function getGeoEnrichmentData(place)
		{
			if (place == null || place.country !='USA')
				return '';

			var studyAreas = [];

			var studyArea = {
				geometry: {
					x:place.x,
					y:place.y
				},
				areaType:"StandardGeography",
				intersectingGeographies:[
					{"sourceCountry":"US","layer":"US.Places"},
					{"sourceCountry":"US","layer":"US.States"},
				]
			};

			studyAreas.push(studyArea);

			var studyAreasJson = JSON.stringify(studyAreas);

			dojo.config.xRequestedWith = "";

			var queryObject = {
				studyAreas: studyAreasJson,
				token: TEMP_TOKEN,
				f: 'pjson'
			};

			return request(GEO_ENRICHMENT_URL, {
				query: queryObject, headers: {
					"X-Requested-With": null
				}
			}).then(function (data) {
				var totalPopulation =''
				try {
					var parsedData = JSON.parse(data);
					var attributes = parsedData.results[0].value.FeatureSet[0].features[0].attributes;
					totalPopulation = attributes.TOTPOP.toLocaleString() + " people live in " + attributes.StdGeographyName;
				}
				catch(err) {
					console.log(err.message);
				}
				return  totalPopulation;

			}, function (err) {
				console.log(err);
				return '';

			}, function (evt) {
				return '';
			});
		}
	});
}