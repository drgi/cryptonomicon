/* eslint-disable */

const API_KEY =
  'ea8529412c46c795f86d49aed1033bd3e9e13d2c8245ee9c0527ebdcf4add3cf';
const tickers = new Map();
export const loadTicker = (tickersMap) => {
  if (tickersMap.size === 0) return;
  fetch(
    `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${[
      ...tickersMap.keys(),
    ].join(',')}&tsyms=USD&api_key=${API_KEY}`
  )
    .then((r) => r.json())
    .then((rawData) => {
      const updatedPrice = Object.fromEntries(
        Object.entries(rawData).map(([key, value]) => [key, value.USD])
      );
      Object.entries(updatedPrice).forEach(([currency, price]) => {
        const handlers = tickers.get(currency) || [];
        handlers.forEach((fn) => fn(price));
      });
    });
};
export const subscribeToTickers = (ticker, cb) => {
  const subscribers = tickers.get(ticker) || [];
  tickers.set(ticker, [...subscribers, cb]);
};
export const unSubscribeToTickers = (ticker, cb) => {
  tickers.delete(ticker);
};

setInterval(() => loadTicker(tickers), 5000);
window.tickers = tickers;
