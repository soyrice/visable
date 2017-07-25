function renderEsriMap(placesData) {
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


        //var places = getPlacesData()
        var places = placesData;

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
        locatePlacesAndAddToMap(places);


        function addLocationButton() {

            var locateBtn = new Locate({
                view: sceneView
            });

            sceneView.ui.add(locateBtn, {
                position: "top-left"
            });

        }

        function locatePlacesAndAddToMap(places) {


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
            for (var i = 0; i < places.length; i++) {

                var address = {
                    "OBJECTID": i,
                    "singleLine": places[i]
                };
                addresses.push(address)
            }

            var params = {
                addresses: addresses
            }

            locatorTask.addressesToLocations(params).then(function (locations) {

                var places = [];

                console.log(locations);

                locations.forEach(function (loc) {

                    console.log(loc);

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
                        placePoint: placePoint

                    }
                    places.push(place)
                });


                addPlacesToMap(places, graphicsLayer, sceneView, markerSymbol);
                addListOfPlaces(places);


            }).otherwise(function (err) {
                console.log(response)
            })
        }


        function addPlacesToMap(places, graphicsLayer, sceneView, markerSymbol) {


            var minX = Number.MAX_VALUE, minY = Number.MAX_VALUE, maxX = -Number.MAX_VALUE, maxY = -Number.MAX_VALUE;

            // Add places to map
            for (var i = 0; i < places.length; i++) {

                var place = places[i];


                var xCord = Math.round(place.x)
                var yCord = Math.round(place.y)

                if (minX > xCord) {
                    minX = xCord
                }

                if (maxX < xCord) {
                    maxX = xCord
                    console.log(xCord)
                }

                if (minY > yCord) {
                    minY = yCord

                }

                if (maxY < yCord) {
                    maxY = yCord
                }


                var pointGraphic = new Graphic({
                    geometry: place.placePoint,
                    symbol: markerSymbol,
                    attribute: {
                        "name": place.name
                    }
                });
                console.log(place.name);

                pointGraphic.popupTemplate = {
                    title: place.name,
                    content: getGeoEnrichmentData(place)
                };

                graphicsLayer.add(pointGraphic)
            }

            console.log(minX, minY, maxX, maxY);

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

        function addListOfPlaces(places) {

            var domElement = "<ul id=\"places_list\">";

            var i = 0;
            places.forEach(function (place) {

                var placesId = "places_" + i;
                domElement += "<li id=\"" + placesId + "\">" + place.name + "</li>";
                i++;
            });
            domElement += "</ul>"

            var listView = domConstruct.toDom(domElement);

            sceneView.ui.add(listView, {
                position: "bottom-right"
            });

            var k = 0;
            places.forEach(function (place) {

                on(dom.byId("places_" + k), "click", function (evt) {

                    places.sort(function(a, b) {return a.name.localeCompare(b.name);} );

                    console.log("Places, ", places);

                    var i = 0;
                    places.forEach(function (place) {

                        var placesId = "places_" + i;
                        domElement += "<li id=\"" + placesId + "\">&bull; " + place.name + "</li>";
                        i++;
                    });
                    domElement += "</ul>"
                    sceneView.goTo(place.placePoint);
                });
                k++;
            });
        }

        function getGeoEnrichmentData(place) {

            if(place == null){
                return 'No data found'
            }

            var studyAreas = [];

            var studyArea = {
                address: {
                    text:place.name
                }
            };

            studyAreas.push(studyArea);

            var studyAreasJson = JSON.stringify(studyAreas);
            console.log(studyAreasJson);

            dojo.config.xRequestedWith = "";

            var queryObject = {
                studyAreas: studyAreasJson,
                token: TEMP_TOKEN,
                f: 'pjson',
                dataCollections:'["KeyGlobalFacts"]'
            };

            var totalPopulation ='No population found'

            return request(GEO_ENRICHMENT_URL, {
                query: queryObject, headers: {
                    "X-Requested-With": null
                }
            }).then(function (data) {

                try {
                    var parsedData = JSON.parse(data)
                    totalPopulation = parsedData.results[0].value.FeatureSet[0].features[0].attributes.TOTPOP
                }
                catch(err) {
                    console.log(err.message);
                }
                console.log(totalPopulation);
                return 'Total population:' + totalPopulation;

            }, function (err) {
                console.log(err);
                return err.message;

            }, function (evt) {
                return evt;
            });

        }


    });
}

function getPlacesData() {
    return ['Texas', 'New York', 'Redlands', 'Dubai'];
}
//renderEsriMap(getPlacesData());