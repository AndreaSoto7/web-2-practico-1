const sha1 = require('sha1');

module.exports = {
    sha1Encode: (str) => {
        return sha1(str);
    }
}