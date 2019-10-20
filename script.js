var isRunning = false;
var encryptedKey = '';
var address = '';
var dictionaryArray = [];
var i = 0;

function start() {
    console.log("start");

    isRunning = true;

    var dictionary = document.querySelector("#file-input");

    // list of selected files
    var all_files = dictionary.files;

    if (all_files.length == 0) {
        alert('Error : No file selected');
        return;
    }

    // first file selected by user
    var file = all_files[0];

    var text = readTextFile(file);

}

function stop() {

    if (isRunning) {
        // stop
        isRunning = false;
        console.log("stopped");
    }
}

function readTextFile(file) {
    var reader = new FileReader();

    // file reading started
    reader.addEventListener('loadstart', function() {
        console.log('File reading started');
    });

    // file reading finished successfully
    reader.addEventListener('load', function(e) {
        var dictionaryFile = e.target.result;

        // contents of the file        
        encryptedKey = $('[aria-label = key]').val();
        address = $('[aria-label = address]').val();
        dictionaryArray = dictionaryFile.split("\n");
        document.getElementById("logger").innerHTML = "";
        log("passwords to test: " + dictionaryArray.length);

        doBruteForce(0);
        // debug: decryptBip38('test', onComplete);

    });

    // file reading failed
    reader.addEventListener('error', function() {
        alert('Error : Failed to read file');
    });

    // file read progress 
    reader.addEventListener('progress', function(e) {
        if (e.lengthComputable == true) {
            var percent_read = Math.floor((e.loaded / e.total) * 100);
            console.log(percent_read + '% read');
        }
    });
    reader.readAsText(file);
}

function setProgress(percent) {
    var progress = $('.progress-bar');
    progress.css('width', percent.toFixed(0) + '%');
    progress.html(percent.toFixed(0) + '%')
}

function doBruteForce(i) {

    if (isRunning && i < dictionaryArray.length) {
        setProgress(i / dictionaryArray.length * 100);
        const passphrase = dictionaryArray[i].replace(/(\r\n|\n|\r)/gm, "")
        console.log('checking: ' + passphrase);
        decryptBip38(passphrase, onComplete);
    }
    else {
        console.log('none of the passphrases matched :-(')
    }
}

function onComplete() {
    if (isRunning) {
        i++;
        doBruteForce(i);
    }
}

function log(str) {
    if (document.getElementById("logger"))
        document.getElementById("logger").innerHTML += str + "<br/>";
    console.log(str);
}

function test() {
    log('test');

    encryptedKey = $('[aria-label = key]').val();
    address = $('[aria-label = address]').val();
    passphrase = $('[aria-label = passphrase]').val();

    decryptBip38(passphrase, onComplete);

}

function decryptBip38(passphrase, onComplete) {
    ninja.privateKey.BIP38EncryptedKeyToByteArrayAsync(encryptedKey, passphrase, function(privBytes) {
        if (privBytes.constructor == Error) {
            log("Error: " + ", error: " + privBytes.message + ' Passphrase: ' + passphrase);
            success = false;
        } else {
            var btcKey = new Bitcoin.ECKey(privBytes);

            wifNotCompressed = btcKey.setCompressed(false).getBitcoinWalletImportFormat();
            wifCompressed = btcKey.setCompressed(true).getBitcoinWalletImportFormat();

            var unCompressedAddress = new Bitcoin.ECKey(wifNotCompressed).getBitcoinAddress();
            var compressedAddress = new Bitcoin.ECKey(wifCompressed).getBitcoinAddress();

            //var wif = !address.substr(0, 1).match(/[LK]/) ? btcKey.setCompressed(false).getBitcoinWalletImportFormat() : btcKey.setCompressed(true).getBitcoinWalletImportFormat();
            if (unCompressedAddress == address || compressedAddress == address) {
                log("success decryptBip38");
                $('[aria-label = passphrase]').val(passphrase);
                isRunning = false;
                alert('key found! ' + passphrase);
            } else {
                log("fail decryptBip38: address does not match");
            }
        }
        onComplete();
    });
}