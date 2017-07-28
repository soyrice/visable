// Filename: popup.js
// Date:     July 2017
// Authors:  Evgeni Dobranov & Thomas Binu
// Purpose:  Defines extension UI and functional behavior

mostFrequent = "";

// Entry point into app functionality
function onPopupLoad()
{
	// Hide all buttons and render loading icon
	$(".btn").hide();
	$("#closeButton").on("click", function(event) {
		event.preventDefault();
		$(".btn").show();
		$("#mapDiv").show();
		$("#closeButton").hide();
	});
	$("#closeButton").hide();
	renderPlanet();

	// Print up to 5 dots on pending div every second
	var numDots = 0;
	var intervalID = setInterval(function() {
		$("#pending").append(".");
		numDots++;
		if (numDots >= 5)
			clearInterval(intervalID);
	}, 1000);

	// Listener for communication with contentscript.js
	chrome.runtime.onMessage.addListener(function(request, sender)
	{
		if (request.action == "getSource")
		{
			var pageContent = (request.source).toString().replace("\"", "");

			// jQuery POST call to NLP server for geoparsing
			$.ajax(
			{
			  url         : "https://7c27de3a.ngrok.io/jsonItems",
			  type        : "POST",
			  data        : JSON.stringify({"Text" : pageContent}),
			  contentType : 'application/json',

			  // On success, clean the output, change map interface and ping Esri API
			  success: function(response)
			  {
				var parsedLocations = cleanResponse(response);
				changeMapInterfaceElements();
				renderEsriMap(parsedLocations);
			  },

			  // On fail, feed Esri API dummy data for displaying
			  error: function (jqXHR, textStatus, errorThrown)
			  {
				mostFrequent = "Seattle";
				changeMapInterfaceElements();
				renderEsriMap(['Seattle', 'Miami', 'Chicago', 'Moscow', 'Tahiti', 'Hawaii', 'Fiji', 'Bulgaria', 'India', 'Belgium', 'France', 'Brussels', 'Madrid']);
			  }
			});
		}
	});

	// Immediately inject script to get page content
	chrome.tabs.executeScript(null, { file: "js/contentscript.js" }, function(response)
	{
		if (chrome.runtime.lastError) {
			console.log("Chrome runtime error: ", chrome.runtime.lastError.message);
		}
	});
}

// Filter out relevant information from NLP server response
function cleanResponse(response)
{
	responseJSON    = JSON.parse(response);
	parsedLocations = [];
	mostFrequentCount = 0;

	for (var i = 0; i < responseJSON.length; i++)
	{
		// Ignore ISO (A2) country codes
		if (responseJSON[i].Name.length > 2)
		{
			parsedLocations.push(responseJSON[i].Name);

			// Keep track of most frequent entry
			if(responseJSON[i].Count > mostFrequentCount) {
				mostFrequentCount = responseJSON[i].Count;
				mostFrequent = responseJSON[i].Name;
			}
		}
	}

	return parsedLocations;
}

// Transition to appropriate HTML elements for 3D globe rendering
function changeMapInterfaceElements()
{
	$("#pending").remove();
	$("#rotatingGlobe").remove();
	$("#row1").remove();

	$(".btn").show();
	$("#esriTitle").append("<img src='images/science.jpg' alt='esri' height='50'/>");

	// Go to Esri Online site when button is clicked
	$(".btn").on("click", function(event)
	 {
		 event.preventDefault();
		 $("#closeButton").show();
		 
		 $(".btn").hide();
		 $("#mapDiv").hide();

		 $("#esriOnline").text("");
		 $("#esriOnline").append("<iframe src='http://www.arcgis.com/home/search.html?q=" + mostFrequent + "&t=content&start=1&sortOrder=desc&sortField=relevance' width='100%'' height='100%'' frameborder='0'></iframe>");
	 });
}

// Loading icon
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
		topojson: { file:   'js/planetary/world-110m.json' },
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