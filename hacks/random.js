var random = {

    _phonetics : [
        "Alpha", "Bravo", "Charlie", "Delta", "Echo",
        "Foxtrot", "Golf", "Hotel", "India", "Juliet",
        "Kilo", "Lima", "Mike", "November", "Oscar",
        "Papa", "Quebec", "Romeo", "Sierra", "Tango",
        "Unicorn", "Victor", "Whiskey", "Xray", "Yankee", "Zulu",
        "Able","Baker","Charlie","Dog","Easy",
        "Fox","George","How","Item","Jig",
        "King","Love","Mike","Nan","Oboe",
        "Peter","Queen","Roger","Sugar","Tare",
        "Uncle","Victor","William","X-ray","Yoke","Zebra"
    ],

    _numstr : "0123456789",

    randint : function(a, b) {
        switch (arguments.length) {
            case 1:
                return Math.floor(Math.random() * a);
            default:
                return a + Math.floor(Math.random() * (b-a));
        }
    },

    keyval : function() {
        var out = {};
        for (var i = 0; i < arguments.length; i+=2) {
            out[arguments[i]] = arguments[i+1]();
        }
        return out;
    },

    array : function(n, func) {
        var out = [];
        for (var i = 0; i < n; i++) {
            out.push(func());
        }
        return out;
    },

    string : function(n, words) {
        var words = words || random._phonetics;
        var n = n || 1;
        var len = words.length;
        var out = random.array(n, function(){return words[random.randint(len)]});
        return out.join(" ");
    },

    char : function(n) {
        var out = "";
        while (out.length < n) {
            out += random.string() + " ";
        }
        return out.slice(0, n);
    },

    number : function(len,frac) {
        switch (arguments.length) {
            case 0:
                var len = 3;
            case 1:
                var out = (len > 0) ? [random.randint(1,10)] : [0];
                out = out.concat(random.array(len-1, function(){return random._numstr[random.randint(10)]}));
                return Number(out.join(""));
            case 2:
                return Number(random.number(len) + "." + random.number(frac));
        }
    },

    date : function(year) {
        year = year || (new Date()).getFullYear();
        return new Date(year, random.randint(12), random.randint(30) + 1, 0, 0, random.randint(86400));
    }

}

var r = random;
