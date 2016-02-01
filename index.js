var axios = require('axios');
var cheerio = require('cheerio');
var epubGenerator = require('epub-generator');
var feed = require('feed-read');
var fs = require('fs');
var Promise = require('bluebird');

var RSS_FEED = 'http://www.aaronsw.com/2002/feeds/pgessays.rss';

function createXHTML (title, body) {
  var xhtml = '<?xml version="1.0" encoding="utf-8"?><!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd"><html xmlns="http://www.w3.org/1999/xhtml"><head><title>' +
    title + '</title></head><body>' + body + '</body></html>';
  return xhtml;
}

function properUrl (url) {
  var endsWith = '.html';
  return url.indexOf(endsWith, url.length - endsWith.length) !== -1;
}

feed(RSS_FEED, function (err, articles) {
  if (err) throw err;

  articles.reverse();

  var epubStream = epubGenerator({
    title: 'Paul Graham Essays',
    author: 'Paul Graham'
  });

  var scrapedArticles = [];

  for (var i = 0; i < articles.length; i++) {
    var url = articles[i].link;
    if (properUrl(url)) {
      scrapedArticles.push(axios.get(url)
          .then(function (response) {
            var $ = cheerio.load(response.data);
            var title = $('title').text();
            var body = $('font').html();
            return {
              title: title,
              xhtml: createXHTML(title, body)
            };
          })
          .catch(function (response) { console.log(response); }));
    }
  }

  Promise.all(scrapedArticles).then(function (xhtmlArticles) {
    for (var i = 0; i < xhtmlArticles.length; i++) {
      var title = xhtmlArticles[i].title;
      var xhtml = xhtmlArticles[i].xhtml;
      epubStream.add('index' + i + '.xhtml', xhtml, {
        title: title,
        toc: true
      });
    }

    epubStream.end().pipe(fs.createWriteStream('pgessays.epub'));
  });
});
