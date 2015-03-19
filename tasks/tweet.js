var 
  //events = require('events'),
  request = require('request'),
  MongoClient = require('mongodb').MongoClient;

function Tweet(options) {
  var _this = this;
  this.options = options;
  this.debug = this.options.debug || false;
}

Tweet.prototype.format = function(location, content) {
  switch(content.type) {
    case 'travel':
      return this.formatTravel(location, content);
    default:
      return null;
  }
};

Tweet.prototype.formatTravel = function(location, content) {
  var summary = content.incident.summary;
  if (summary.length > 80) {
    summary = summary.substr(0, 80) +'...'
  }
  return 'Travel: ' + summary + ' http://www.bbc.co.uk/travel/' +location.id +'/incidents/road';
};

module.exports = {
  Tweet: Tweet
};