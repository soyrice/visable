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

    "dojo/domReady!"

], function (Map, SceneView, MapView, Locate, Extent, Graphic, Point, SimpleMarkerSymbol, GraphicsLayer, Locator, JSON, PopupTemplate, on, dom, domConstruct) {


    // var places = getPlacesData()
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
            url: "https://utility.arcgis.com/usrsvcs/appservices/mEg43zDsRI275tGc/rest/services/World/GeocodeServer"
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
                    placePoint:placePoint

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
                content: "{name}",
                fieldInfos: [{
                    fieldName: "name",
                    format: {
                        digitSeparator: true,
                        places: 0
                    }
                }]
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

        console.log(domElement);

        var listView = domConstruct.toDom(domElement);

        sceneView.ui.add(listView, {
            position: "bottom-right"
        });

        var k = 0;
        places.forEach(function (place) {

            on(dom.byId("places_" + k), "click", function (evt) {

                var place = places[evt.currentTarget.id.split('_')[1]];
                console.log(place.name.split(',')[0]);

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
});
}

function getPlacesData(resultingArray)
{
    return ['Texas', 'New York', 'Redlands', 'Alabama'];
    //return resultingArray;
}

// window.onload = renderEsriMap;