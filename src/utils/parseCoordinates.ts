function validateCoordinates(coords: number[]) {
    if (coords[0] >= -90 && coords[0] <= 90 && coords[1] >= -180 && coords[1] <= 180) return coords;

}

export default function parseCoordinates(text: string) {
    text = text
        // Remove leading & trailing whitespace
        .trim()
        // Remove smart single quotes and apostrophes from windows
        .replace(/[\u2018\u2019\u201A]/g, '\'')
        // Remove double quotes
        .replace(/[\u201C\u201D\u201E]/g, '"')
        // Remove en-dash & em-dash
        .replace(/[\u2013\u2014]/g, '-');

    const ddMatch = decimalDegrees(text);
    if (ddMatch) return validateCoordinates(ddMatch);

    const dmsMatch = degreesMinutesSeconds(text);
    if (dmsMatch) return validateCoordinates(dmsMatch);


}

// eslint-disable-next-line max-len
const ddRegex = new RegExp(/^([+-]?\d+\.\d+) *[d°]? *([NnSs]?)[, /|]*([+-]?\d+\.\d+) *[d°]? *([EwWw]?)$/);
// eslint-disable-next-line max-len
const dmsRegex = new RegExp(/^([NnSs]?)([+-]?\d{0,3}) *[d:°ºdD]? *(\d{0,3}\.?\d{0,6}) *[:'′mM]? *(\d{0,3}\.?\d{0,6})? *[:"″sS]? *([NnSs]?)[, /|]*([EeWw]?)([+-]?\d{0,3}\.?\d{0,6}) *[d:°ºdD]? *(\d{0,3}\.?\d{0,6}) *[:'’′mM]? *(\d{0,3}\.?\d{0,6})? *[:"”″sS]? *([EwWw]?)$/);

function decimalDegrees(input: string) {
    const parsed = ddRegex.exec(input);
    if (!parsed || parsed.length !== 5) return;

    let lat = parseFloat(parsed[1]);
    let lng = parseFloat(parsed[3]);

    if (parsed[2].toUpperCase() === 'S' && lat > 0) {
        lat = lat * -1;
    }
    if (parsed[4].toUpperCase() === 'W' && lng > 0) {
        lng = lng * -1;
    }

    return [lat, lng];
}

function degreesMinutesSeconds(input: string) {
    const parsed = dmsRegex.exec(input);
    if (!parsed || parsed.length !== 11) return;

    let lat = parseFloat(parsed[2]);
    const latDecimals = ((parseFloat(parsed[3]) || 0) / 60 + (parseFloat(parsed[4]) || 0) / 3600);
    if (lat > 0) lat += latDecimals;
    else lat -= latDecimals;

    if ((parsed[1] || parsed[5]).toUpperCase() === 'S') lat = lat * -1;

    let lng = parseFloat(parsed[7]);
    const lngDecimals = ((parseFloat(parsed[8]) || 0) / 60 + (parseFloat(parsed[9]) || 0) / 3600);
    if (lng > 0) lng += lngDecimals;
    else lng -= lngDecimals;

    if ((parsed[6] || parsed[10]).toUpperCase() === 'W') lng = lng * -1;

    return [lat, lng];
}
