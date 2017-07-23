function onPopupLoad()
{
	renderPlanet();

	var result = document.querySelector("#result");

	// $("#searcher").keypress(function() {
	// 	chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
 //    		chrome.tabs.sendMessage(tabs[0].id, {
 //    			action: "searchForWord",
 //    			source: $('#searcher').val()
 //    		}, function(response) {}); 
	// 	});
	// });

	// Page actions
	$(document).ready(function () {
		$(".btn").on("click", function(event)
		{
			event.preventDefault();
			$(".btn").hide();
			$("#rotatingGlobe").hide();

			$("#pending").append("Injecting script...<br><i class='fa fa-cog fa-spin fa-3x' aria-hidden='true'></i>");

			chrome.tabs.executeScript(null, { file: "contentscript.js" }, function(response)
			{
				if (chrome.runtime.lastError)
 					result.innerText = 'There was an error injecting script : \n' + chrome.runtime.lastError.message;
			}
			
			);
		});
	});

	// Communication with contentscript.js
	chrome.runtime.onMessage.addListener(function(request, sender)
	{
		if (request.action == "getSource")
		{
			// result.innerText = request.source;

			var pageContent = (request.source).toString();
			pageContent = pageContent.replace("\"", "");

			$.ajax(
			{
			  url         : "https://gvifsgwfsw.localtunnel.me/jsonItems",
			  type        : "POST",
			  data        : JSON.stringify({"Text" : pageContent}),
			  contentType : 'application/json',
			  success: function(response)
			  {
			    console.log(response);
			    // result.innerText = response;
			    $("#pending").hide();
			    cleanOutput(response, result);         // For Esri API
			  }
			  // error: function (jqXHR, textStatus, errorThrown) {
			  // 	console.log(jqXHR);
			  // 	console.log(textStatus);
			  // 	console.log(errorThrown);
			  // }
			});
		}
	});
}

/*
[{"Type": "City", "Name": "Jos"}, {"Type": "City", "Name": "Tandil"}, {"Type": "City", "Name": "Mendoza"}, {"Type": "City", "Name": "Santa Fe"}, {"Type": "City", "Name": "Buenos Aires"}, {"Type": "City", "Name": "Asia"}, {"Type": "City", "Name": "Pampa"}, {"Type": "Region", "Name": "AR"}, {"Type": "Region", "Name": "US"}, {"Type": "Region", "Name": "PH"}, {"Type": "Region", "Name": "CN"}, {"Type": "Region", "Name": "AQ"}, {"Type": "Region", "Name": "GL"}, {"Type": "Region", "Name": "PR"}, {"Type": "Region", "Name": "NG"}, {"Type": "Region", "Name": "UY"}, {"Type": "Region", "Name": "BB"}, {"Type": "Region", "Name": "CL"}, {"Type": "Region", "Name": "AN"}, {"Type": "Region", "Name": "JM"}, {"Type": "Region", "Name": "CU"}, {"Type": "Region", "Name": "NP"}, {"Type": "Region", "Name": "NL"}, {"Type": "Region", "Name": "MX"}, {"Type": "Region", "Name": "ES"}, {"Type": "Region", "Name": "DK"}]
*/

function cleanOutput(response, whereToPrintTo)
{
	// console.log(JSON.parse(response));
	responseJSON = JSON.parse(response);
	cleanArray = [];

	for (var i = 0; i < responseJSON.length; i++)
	{
		if (responseJSON[i].Name.length > 2) 
			cleanArray.push(responseJSON[i].Name);
	}

	whereToPrintTo.innerText = cleanArray.toString();
}

function renderPlanet()
{
	(function() {
	  globe = planetaryjs.planet();
	  // Load our custom `autorotate` plugin; see below.
	  globe.loadPlugin(autorotate(25));
	  // The `earth` plugin draws the oceans and the land; it's actually
	  // a combination of several separate built-in plugins.
	  //
	  // Note that we're loading a special TopoJSON file
	  // (world-110m-withlakes.json) so we can render lakes.
	  globe.loadPlugin(planetaryjs.plugins.earth({
	    topojson: { file:   'js/world-110m.json' },
	    oceans:   { fill:   '#001D30' },
	    land:     { fill:   '#1267A3' },
	    borders:  { stroke: '#001320' }
	  }));
	  // Load our custom `lakes` plugin to draw lakes; see below.
	  globe.loadPlugin(lakes({
	    fill: '#06304e'
	  }));
	  // The `pings` plugin draws animated pings on the globe.
	  globe.loadPlugin(planetaryjs.plugins.pings());
	  // The `zoom` and `drag` plugins enable
	  // manipulating the globe with the mouse.
	  //globe.loadPlugin(planetaryjs.plugins.zoom({
	  //  scaleExtent: [100, 300]
	  //}));
	  globe.loadPlugin(planetaryjs.plugins.drag({
	    // Dragging the globe should pause the
	    // automatic rotation until we release the mouse.
	    onDragStart: function() {
	      this.plugins.autorotate.pause();
	    },
	    onDragEnd: function() {
	      this.plugins.autorotate.resume();
	    }
	  }));
	  // Set up the globe's initial scale, offset, and rotation.
	  globe.projection.scale(175).translate([195, 175]).rotate([30, -20, 0]);

	  // Every few hundred milliseconds, we'll draw another random ping.
	  var colors = ['red', 'yellow', 'white', 'orange', 'green', 'cyan', 'pink'];
	  setInterval(function() {
	    var lat = Math.random() * 170 - 85;
	    var lng = Math.random() * 360 - 180;
	    var color = colors[Math.floor(Math.random() * colors.length)];
	    globe.plugins.pings.add(lng, lat, { color: color, ttl: 2000, angle: Math.random() * 10 });
	  }, 150);

	  var canvas = document.getElementById('rotatingGlobe');
	  // Special code to handle high-density displays (e.g. retina, some phones)
	  // In the future, Planetary.js will handle this by itself (or via a plugin).
	  if (window.devicePixelRatio == 2) {
	    canvas.width = 800;
	    canvas.height = 800;
	    context = canvas.getContext('2d');
	    context.scale(2, 2);
	  }
	  // Draw that globe!
	  globe.draw(canvas);

	  // This plugin will automatically rotate the globe around its vertical
	  // axis a configured number of degrees every second.
	  function autorotate(degPerSec) {
	    // Planetary.js plugins are functions that take a `planet` instance
	    // as an argument...
	    return function(planet) {
	      var lastTick = null;
	      var paused = false;
	      planet.plugins.autorotate = {
	        pause:  function() { paused = true;  },
	        resume: function() { paused = false; }
	      };
	      // ...and configure hooks into certain pieces of its lifecycle.
	      planet.onDraw(function() {
	        if (paused || !lastTick) {
	          lastTick = new Date();
	        } else {
	          var now = new Date();
	          var delta = now - lastTick;
	          // This plugin uses the built-in projection (provided by D3)
	          // to rotate the globe each time we draw it.
	          var rotation = planet.projection.rotate();
	          rotation[0] += degPerSec * delta / 1000;
	          if (rotation[0] >= 180) rotation[0] -= 360;
	          planet.projection.rotate(rotation);
	          lastTick = now;
	        }
	      });
	    };
	  };

	  // This plugin takes lake data from the special
	  // TopoJSON we're loading and draws them on the map.
	  function lakes(options) {
	    options = options || {};
	    var lakes = null;

	    return function(planet) {
	      planet.onInit(function() {
	        // We can access the data loaded from the TopoJSON plugin
	        // on its namespace on `planet.plugins`. We're loading a custom
	        // TopoJSON file with an object called "ne_110m_lakes".
	        var world = planet.plugins.topojson.world;
	        lakes = topojson.feature(world, world.objects.ne_110m_lakes);
	      });

	      planet.onDraw(function() {
	        planet.withSavedContext(function(context) {
	          context.beginPath();
	          planet.path.context(context)(lakes);
	          context.fillStyle = options.fill || 'black';
	          context.fill();
	        });
	      });
	    };
	  };
	})();

}

window.onload = onPopupLoad;