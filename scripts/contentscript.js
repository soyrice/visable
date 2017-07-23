if (window.getSelection().toString())
	response = window.getSelection().toString();
else
	response = document.body.innerText;

chrome.runtime.sendMessage({
	action: "getSource",
	source: response
});

chrome.runtime.onMessage.addListener(function(message, sender) {
    if (message.action == "searchForWord") {
    	window.find(message.source);
    }
});