var feed = require('feed-read');

var RSS_FEED = 'http://www.aaronsw.com/2002/feeds/pgessays.rss';

feed(RSS_FEED, function (err, articles) {
  if (err) throw err;

  console.log(articles);
});
