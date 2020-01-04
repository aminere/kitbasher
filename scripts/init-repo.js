
// Apply patches
const fs = require('fs');

var copyFunc = function (src, destination) {
    console.log("Copying " + src + " to " + destination);
    fs.copyFile(src, destination, err => { if(err) { console.log(err); } else { console.log('OK'); } });
};

copyFunc("scripts/patches/golden-layout/goldenlayout.js", "node_modules/golden-layout/dist/goldenlayout.js");
