//----------------------------------------------------------------------------
// Color Functions
//----------------------------------------------------------------------------
__ansi = {
    csi: String.fromCharCode(0x1B) + '[',
    reset:      '0',
    text_prop:  'm',
    foreground: '3',
    bright:     '1',
    underline:  '4',

    colors: {
        black:   '0',
        red:     '1',
        green:   '2',
        yellow:  '3',
        blue:    '4',
        magenta: '5',
        cyan:    '6',
        gray:    '7',
    }
};

function controlCode( parameters ) {
    if ( parameters === undefined ) {
        parameters = "";
    }
    else if (typeof(parameters) == 'object' && (parameters instanceof Array)) {
        parameters = parameters.join(';');
    }

    return __ansi.csi + String(parameters) + String(__ansi.text_prop);
};

function applyColorCode( string, properties, nocolor ) {
    // Allow global __colorize default to be overriden
    var applyColor = (null == nocolor) ? __colorize : !nocolor;

    return applyColor ? controlCode(properties) + String(string) + controlCode() : String(string);
};

function colorize( string, color, nocolor ) {

    var params = [];
    var code = __ansi.foreground + __ansi.colors[color.color];

    params.push(code);

    if ( color.bright === true ) params.push(__ansi.bright);
    if ( color.underline === true ) params.push(__ansi.underline);

    return applyColorCode( string, params, nocolor );
};

function colorizeAll( strings, color, nocolor ) {
    return strings.map(function(string) {
        return colorize( string, color, nocolor );
    });
};
