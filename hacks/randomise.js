//----------------------------------------------------------------------------
// Randomise API
//----------------------------------------------------------------------------

function randomWord(length, words, seed){
    /* randomWord
        length: length of each word (default is 5 letters).
        words: number of words (default is 1 word).
        seed: a word to be planted randomly amongst the word(s) (optional)
    */
    words = typeof words !== 'undefined' ? words : 1;
    length = typeof length !== 'undefined' ? length : 5;
    
    var seedOn = typeof seed !== 'undefined';

    var text = "";
    var possible ="abcdefghijklmnopqrstuvwxyz";
        
    for (var j=0; j < words; j++){
        var word = "";
        for (var i=0; i < length; i++){
            word += possible.charAt(Random.randInt(possible.length));
        }
        if (seedOn == true){
            var randomBool = Random.rand() >= 0.8;
            if (randomBool == true){
                text += seed + " ";
                seedOn = false;
        }
    }
        text += word + " ";
    }
    return text;
};

function randomNumber(digits){
    /* randomNumber
        max: highest random number (default is 100).
    */
    digits = typeof digits !== 'undefined' ? digits : 100;
    return Random.randInt(digits);
};

function randomDate(start, end){
    /* randomDate
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
