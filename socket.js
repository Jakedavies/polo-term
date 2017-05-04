const autobahn = require('autobahn');
const wsuri = 'wss://api.poloniex.com';
const connection = new autobahn.Connection({
  url: wsuri,
  realm: 'realm1',
});

let cb1 = () => {};
let cb2 = () => {};
function onMarketEvent(cb) {
  cb1 = cb;
}

function onTrollBox(cb) {
  cb2 = cb;
}

connection.onopen = function(session) {
  session.subscribe('BTC_LTC', cb1);
  session.subscribe('trollbox', cb2);
};

connection.onclose = function() {
  console.log('Websocket connection closed');
};

connection.open();

module.exports = {
  onMarketEvent,
  onTrollBox,
};
