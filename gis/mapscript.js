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


    "dojo/domReady!"

], function(Map, SceneView, MapView, Locate, Extent, Graphic, Point,  SimpleMarkerSymbol, GraphicsLayer, Locator, JSON) {


    var placesData = getPlacesData()

    var map = new Map({
        basemap: "streets",
        ground: "world-elevation"
    });

    var sceneView = new SceneView({
        container: "mapDiv",
        map: map,
        scale: 50000000
    });

    // Add graphics layer
    var graphicsLayer = new GraphicsLayer();
    map.add(graphicsLayer)

    // add places data to map
    var places = placesData.places;

    // Initialize a symbol
    var markerSymbol = new SimpleMarkerSymbol({
        style: "circle",
        color: "blue",
        outline: {
            color: [ 255, 255, 225 ],
            width: 3
        }
    });

    addPlacesToMap(places, graphicsLayer, sceneView, markerSymbol);

    addLocationButton()


    getLocationOfPlaces(places)

    function addLocationButton(){

        var locateBtn = new Locate({
            view: sceneView
        });

        sceneView.ui.add(locateBtn, {
            position: "top-left"
        });

    }

    function getLocationOfPlaces(places){

        // Create a locator task using the world geocoding service
        var locatorTask = new Locator({
            url: "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer"
        });

        var addresses = []

        // Add places to map
        for (var i = 0; i < places.length; i++) {

            var address = {
                "OBJECTID":i,
                "Single Line Input":places[i].name
            };
            addresses.push(address)
        }
        locatorTask.addressesToLocations(addresses).then(function(response){
            console.log(response)
        }).otherwise(function (err) {
            console.log(response)
        })
    }



    function addPlacesToMap(places, graphicsLayer, sceneView, markerSymbol){


        var minX = Number.MAX_VALUE, minY =  Number.MAX_VALUE, maxX = Number.MIN_VALUE, maxY = Number.MIN_VALUE;

        // Add places to map
        for (var i = 0; i < places.length; i++) {

            var place = places[i];


            if(minX > place.x){
                minX = place.x
            }

            if(maxX < place.x){
                maxX = place.x
            }

            if(minY > place.y){
                minY = place.y
            }

            if(maxY < place.y){
                maxY = place.y
            }

            var placesPoint = new Point({
                x:place.x,
                y:place.y,
                z:1010
            });


            var pointGraphic = new Graphic({
                geometry: placesPoint,
                symbol: markerSymbol
            });

            graphicsLayer.add(pointGraphic)
        }

        var placesExtent= new Extent({
            xmin: minX,
            ymin: minY,
            xmax: maxX,
            ymax: maxY
        });

        var mapPadding = 100;

        sceneView.padding = {
            top: mapPadding,
            left:mapPadding,
            right:mapPadding,
            bottom:mapPadding
        };

        sceneView.then(function(){
            sceneView.goTo(placesExtent);
        })

    }

});


function getPlacesData(){

    return JSON.parse('{"places": ' +
    '[{"name":"london","x":"45.2","y":"60.4"},' +
    '{"name":"dubai","x":"45.2","y":"23.4"},' +
    '{"name":"tokyo","x":"46.2","y":"30.3"}]}');
}





