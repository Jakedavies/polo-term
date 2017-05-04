#! /usr/local/bin/node

const blessed = require('blessed');
const contrib = require('blessed-contrib');
const screen = blessed.screen();
const socket = require('./socket');
const Promise = require('bluebird');
const rightpad = require('right-pad');
const grid = new contrib.grid({ rows: 2, cols: 5, screen: screen });
const rp = require('request-promise');

screen.title = 'CryptoTerm';

const list = grid.set(0, 0, 2, 1, blessed.list, {
  border: {
    type: 'line',
  },
  selectedBg: 'grey',

  // Allow mouse support
  mouse: true,

  // Allow key support (arrow keys + enter)
  keys: true,

  // Use vi built-in keys
  vi: true,
  search: true,
  label: 'Coins',
});

// Create a box perfectly centered horizontally and vertically.
const box = grid.set(0, 4, 1, 1, blessed.text, {
  tags: true,
  border: {
    type: 'line',
  },
  style: {
    border: {
      fg: '#f0f0f0',
    },
  },
  scrollable: true,
  label: 'trollbox',
});

const box2 = grid.set(1, 4, 1, 1, blessed.text, {
  tags: true,
  border: {
    type: 'line',
  },
  style: {
    border: {
      fg: '#f0f0f0',
    },
  },
  scrollable: true,
  label: 'trades',
});

const line = grid.set(0, 1, 2, 3, contrib.line, {
  style: {
    line: 'yellow',
    text: 'green',
    baseline: 'black',
  },
  xLabelPadding: 3,
  xPadding: 5,
  label: 'Stocks',
});

const lineData = {
  x: ['t1', 't2', 't3', 't4'],
  y: [5, 1, 7, 5],
};

line.setData([lineData]);

screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  return process.exit(0);
});

socket.onTrollBox(stuff => {
  const name = stuff[2];
  const message = stuff[3];
  const level = stuff[4];
  const styledName = level > 5000 ? `{blue-fg}${name}{/blue-fg}` : name;

  box.insertBottom(`{bold}${styledName}{/bold}: ${message}`);
  box.setScrollPerc(100);
  screen.render();
});

socket.onMarketEvent(trades => {
  const newTrades = trades.filter(t => t.type === 'newTrade');
  const lines = newTrades.map(trade => {
    const action = trade.data.type === 'buy'
      ? '{green-fg}Buy{/green-fg}:  '
      : '{red-fg}Sell{/red-fg}: ';
    return `${action}${trade.data.rate}\t${trade.data.total} BTC`;
  });
  box2.insertTop(lines);
  box2.setScrollPerc(0);
  screen.render();
});

list.focus(0);
const tickersR = rp({ uri: 'https://poloniex.com/public?command=returnTicker', json: true });
const volumesR = rp({
  uri: 'https://poloniex.com/public?command=return24hVolume',
  json: true,
});
Promise.all([tickersR, volumesR]).spread((tickers, volumes) => {
  const nameWithVolume = Object.keys(tickers)
    .map(ticker => {
      return {
        name: ticker.replace('BTC_', ''),
        volume: volumes[ticker].BTC,
      };
    })
    .filter(coin => !coin.name.includes('_'));
  const sorted = nameWithVolume.sort((a, b) => b.volume - a.volume);

  list.setItems(sorted.map(d => `${rightpad(d.name, 5, ' ')} | ${d.volume} BTC`));
  list.on('select', function(item) {
    line.setLabel(item.content.split(' ')[0] + ' - BTC');
    screen.render();
  });
  screen.render();
});

screen.render();
