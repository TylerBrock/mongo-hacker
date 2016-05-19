//----------------------------------------------------------------------------
// Randomise API
//----------------------------------------------------------------------------

function randomWord(length, words, seed){
    /* Return a random word(s).
        length: length of each word (default is 5 letters).
        words: number of words (default is 1 word).
        seed: a word to be planted randomly amongst the word(s), good for search. (optional)
    */
    words = typeof words !== 'undefined' ? words : 1;
    length = typeof length !== 'undefined' ? length : 5;
    var seedOn = typeof seed !== 'undefined';
    var text = "";
    var possible ="abcdefghijklmnopqrstuvwxyz";
    var firstword = true;
    for (var j=0; j < words; j++){
        var word = "";
        for (var i=0; i < length; i++){
            word += possible.charAt(Random.randInt(possible.length));
        }
        /* Plant a seeded word */
        if (seedOn == true){
            var randomBool = Random.rand() >= 0.8;
            if (randomBool == true){
                if (firstword == true){ text = seed; firstword = false;}
                else {text += " " + seed;}
                seedOn = false;
            }
        }
        if (firstword == true){ text = word; firstword = false;}
        else {text += " " + word;}
    }
    return text;
};

function randomNumber(max){
    /* Return a random number
        max: highest random number (default is 100).
    */
    max = typeof max !== 'undefined' ? max : 100;
    return Random.randInt(max);
};

function randomDate(start, end){
    /* Return a random date between start and end values. 
       start: Date(), default 2 years ago. 
       end: Date(), default today.
    */
    end = typeof end !== 'undefined' ? end : new Date();
    if (typeof start === 'undefined') { 
        start = new Date(end.getTime());
        start.setYear(start.getFullYear() - 2);
    }
    return new Date(start.getTime() + Random.randInt(end.getTime() - start.getTime()));
};
