function onPopupLoad()
{
	var result = document.querySelector("#result");

	chrome.runtime.onMessage.addListener(function(request, sender) {
		if (request.action == "getSource") {
			result.innerText = request.source;
		}
	});

	$(document).ready(function () {
		$(".btn").on("click", function(event)
		{
			event.preventDefault();
			$(".btn").hide();
			$("#pending").append("Injecting script...<br><i class='fa fa-cog fa-spin fa-3x' aria-hidden='true'></i>");
				window.setTimeout(function (){
				
  				chrome.tabs.executeScript(null, {
    				file: "contentscript.js"
  				}, function(response) {
  					if (chrome.runtime.lastError) {
     					result.innerText = 'There was an error injecting script : \n' + chrome.runtime.lastError.message;
    				}
    			$("#pending").hide();

  				});
				
			}, 1000);
		});
	});
}

window.onload = onPopupLoad;