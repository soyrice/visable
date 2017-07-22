if (window.getSelection().toString())
	response = window.getSelection().toString();
else
	response = document.body.innerText;

chrome.runtime.sendMessage({
	action: "getSource",
	//source: document.body.innerText
	source: response
});

//console.log(window.getSelection().toString());