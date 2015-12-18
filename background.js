chrome.app.runtime.onLaunched.addListener(function() {
    console.log(chrome);
    chrome.app.window.create('app.html', {
        'outerBounds': {
            'width': 1800,
            'height': 950
        }
    });
});