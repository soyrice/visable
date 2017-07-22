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


    "dojo/domReady!"

], function(Map, SceneView, MapView, Locate, Extent, Graphic, Point,  SimpleMarkerSymbol, GraphicsLayer, Locator, JSON, PopupTemplate) {


    var places = getPlacesData()

    var map = new Map({
        basemap: "streets",
        ground: "world-elevation"
    });

    var sceneView = new SceneView({
        container: "mapDiv",
        map: map,
        scale: 50000000
    });

    addLocationButton()


    locatePlacesAndAddToMap(places)


    function addLocationButton(){

        var locateBtn = new Locate({
            view: sceneView
        });

        sceneView.ui.add(locateBtn, {
            position: "top-left"
        });

    }

    function locatePlacesAndAddToMap(places){


        // Add graphics layer
        var graphicsLayer = new GraphicsLayer();
        map.add(graphicsLayer)

        // Initialize a symbol
        var markerSymbol = new SimpleMarkerSymbol({
            style: "circle",
            color: "blue",
            outline: {
                color: [ 255, 255, 225 ],
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
                "OBJECTID":i,
                "singleLine":places[i]
            };
            addresses.push(address)
        }

        var params = {
            addresses: addresses
        }

        locatorTask.addressesToLocations(params).then(function(locations){

            var places = []

            console.log(locations)

            locations.forEach(function(loc) {

                console.log(loc);

                var place = {
                    name:loc.attributes.LongLabel,
                    x:loc.location.x,
                    y:loc.location.y,
                    subregion:loc.attributes.Subregion
                }
                places.push(place)
            });


            addPlacesToMap(places, graphicsLayer, sceneView, markerSymbol)


        }).otherwise(function (err) {
            console.log(response)
        })
    }



    function addPlacesToMap(places, graphicsLayer, sceneView, markerSymbol){


        var minX = Number.MAX_VALUE, minY =  Number.MAX_VALUE, maxX = -Number.MAX_VALUE, maxY = -Number.MAX_VALUE;

        // Add places to map
        for (var i = 0; i < places.length; i++) {

            var place = places[i];


            var xCord = Math.round(place.x)
            var yCord = Math.round(place.y)

            if(minX > xCord){
                minX = xCord
            }

            if(maxX < xCord){
                maxX = xCord
                console.log(xCord)
            }

            if(minY > yCord){
                minY = yCord

            }

            if(maxY < yCord){
                maxY = yCord
            }

            var placesPoint = new Point({
                x:place.x,
                y:place.y,
                z:1010
            });


            var pointGraphic = new Graphic({
                geometry: placesPoint,
                symbol: markerSymbol,
                attribute:{
                    "name":place.name
                }
            });
            console.log(place.name);

            pointGraphic.popupTemplate = {
                title: place.name,
                content:"{name}",
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

        var placesExtent= new Extent({
            xmin: minX,
            ymin: minY,
            xmax: maxX,
            ymax: maxY
        });

        var mapPadding = 50;

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

    return ['Texas', 'New York' ,'Redlands', 'Alabama'];
}





