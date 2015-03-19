var 
  Content = require('../tasks/content').Content;
  Tweet = require('../tasks/tweet').Tweet;
  Twitter = require('twitter');
  request = require('request'),
  MongoClient = require('mongodb').MongoClient;

function Feed(options) {
  var _this = this;
  this.options = options;
  this.debug = this.options.debug || false;
  this.content = new Content(this.options);
}

Feed.prototype.getDBCollection = function(callback) {
  var _this = this;
  MongoClient.connect(this.options.mongo.url, function(err, db) {
    if (null === err) {
      callback(null, db, db.collection(_this.options.mongo.collections.feed));
    } else {
      callback(true);
    }
  });
};

Feed.prototype.update = function(location, callback) {
  var _this = this;
  if (this.debug) { console.log('Feed.update', location.id); }  
  this.getNewContent(location.id, function(content){
    if (content) {
      console.log('New feed content', content.length);
      if (0 < content.length) {
        // post oldest first
        content = content.reverse();
        _this.post(location, content);
      }
    }
  });
};

Feed.prototype.post = function(location, content, callback) {
  var _this = this,
    status,
    tweet = new Tweet(this.options),
    client = new Twitter({
      consumer_key: location.twitter.consumer_key,
      consumer_secret: location.twitter.consumer_secret,
      access_token_key: location.twitter.access_token_key,
      access_token_secret: location.twitter.access_token_secret,
    });
  var debugCount = 0;
  if (this.debug) { console.log('Feed.post', content.length, 'items'); }  

  content.forEach(function(item){
    status = tweet.format(location, item);
    //if (_this.debug) { console.log('Feed.post - status', status); }  
    if (status) {
      console.error('Feed.post - POST STATUS', item.id);
      client.post('statuses/update', {status: status},  function(error, tweet, response){
        if(error) {
          console.error('Feed.post - error', error);
        } else {
          _this.addItemToFeed(item);
          //console.log(tweet);  // Tweet body. 
          //console.log(response);  // Raw response object. 
        }
      });
    }
  });
};


Feed.prototype.getFeed = function(locationId, callback) {
  var _this = this;
  if (this.debug) { console.log('Feed.getFeed', locationId); }  
  this.getDBCollection(function(err, db, collection) {
    if (err) {
      if (_this.debug) { console.log('Feed.getFeed - unable to get db connection.'); }
      callback(true);
    } else {
      collection.find({locationId: locationId}, {sort: [['dateCreated', -1]]}).toArray(function(err, docs) {
        db.close();
        if (err || 0 === docs.length) {
          if (_this.debug) { console.log('Feed.getFeed - no feed items found'); }
          callback(null);
        } else {
          if (_this.debug) { console.log('Feed.getFeed - found ' +docs.length +' feed items'); }
          callback(docs);
        }
      });
    }
  })
};

Feed.prototype.addItemToFeed = function(item) {
  var _this = this;
  if (this.debug) { console.log('Feed.addItemToFeed'); }  
  this.getDBCollection(function(err, db, collection) {
    if (err) {
      if (_this.debug) { console.log('Feed.addItemToFeed - unable to get db connection.'); }
      callback(true);
    } else {
      collection.insert([item], function(err, result) {
        db.close();
        if (err) {
          if (_this.debug) { console.log('Feed.addItemToFeed - failed top insert'); }
          //callback(null);
        } else {
          if (_this.debug) { console.log('Feed.addItemToFeed - inserted'); }
        }
      });
    }
  })
};

Feed.prototype.getNewContent = function(locationId, callback) {
  var _this = this;
  if (this.debug) { console.log('Feed.getNewContent', locationId); }  
  this.getFeed(locationId, function(feedDocs) {
    var criteria = {
      locationId: locationId
    };
    if (feedDocs && 0 < feedDocs.length) {
      criteria.dateCreated = { $gte: feedDocs[0].dateCreated};
    }
    _this.content.getContent(criteria, function(contentDocs){
      var newDocs = [],
        contentIdExistsInFeed;
      if (feedDocs) {
        contentDocs.forEach(function(contentDoc){
          contentIdExistsInFeed = false;
          feedDocs.forEach(function(feedDoc){
            if (feedDoc.id === contentDoc.id) {
              contentIdExistsInFeed = true;
            }
          });
          if (!contentIdExistsInFeed) {
            newDocs.push(contentDoc);
          }
        });
      } else {
        newDocs = contentDocs;
      }
      callback(newDocs);
    });
  });

};


module.exports = {
  Feed: Feed
};