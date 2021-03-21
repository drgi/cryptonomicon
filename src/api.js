/* eslint-disable */

const API_KEY =
  'ea8529412c46c795f86d49aed1033bd3e9e13d2c8245ee9c0527ebdcf4add3cf';
const tickers = new Map();
const socket = new WebSocket(
  `wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`
);
socket.onerror = (err) => {
  console.log('Socket Error', err);
};

const bc = new BroadcastChannel('crypto');
bc.onmessage = (message) => {
  console.log('Bc message', message);
  const { currency, price } = JSON.parse(message.data);
  refreshCurrency({ currency, price });
};
socket.addEventListener('message', (evt) => {
  const { FROMSYMBOL: currency, TYPE: type, PRICE: price } = JSON.parse(
    evt.data
  );
  if (type === '5') {
    bc.postMessage(JSON.stringify({ currency, price }));
    refreshCurrency({ currency, price });
  }
});

function refreshCurrency({ currency, price }) {
  const handlers = tickers.get(currency) || [];
  if (price) {
    handlers.forEach((fn) => fn(price));
  }
}
const loadTicker = (tickersMap) => {
  if (tickersMap.size === 0) return;

  // fetch(
  //   `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${[
  //     ...tickersMap.keys(),
  //   ].join(',')}&tsyms=USD&api_key=${API_KEY}`
  // )
  //   .then((r) => r.json())
  //   .then((rawData) => {
  //     const updatedPrice = Object.fromEntries(
  //       Object.entries(rawData).map(([key, value]) => [key, value.USD])
  //     );
  //     Object.entries(updatedPrice).forEach(([currency, price]) => {
  //       const handlers = tickers.get(currency) || [];
  //       handlers.forEach((fn) => fn(price));
  //     });
  //   });
};
function sendMessageToWs(message) {
  message = JSON.stringify(message);
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(message);
  }
  socket.addEventListener('open', () => socket.send(message), {
    once: true,
  });
}
function subscribeToTickerOnWs(ticker) {
  const messageForSocket = {
    action: 'SubAdd',
    subs: [`5~CCCAGG~${ticker}~USD`],
  };
  sendMessageToWs(messageForSocket);
}
function unSubscribeToTickerOnWs(ticker) {
  const messageForSocket = {
    action: 'SubRemove',
    subs: [`5~CCCAGG~${ticker}~USD`],
  };
  sendMessageToWs(messageForSocket);
}
export const subscribeToTickers = (ticker, cb) => {
  const subscribers = tickers.get(ticker) || [];
  tickers.set(ticker, [...subscribers, cb]);
  subscribeToTickerOnWs(ticker);
};
export const unSubscribeToTickers = (ticker, cb) => {
  tickers.delete(ticker);
  unSubscribeToTickerOnWs(ticker);
};

setInterval(() => loadTicker(tickers), 5000);
window.tickers = tickers;
