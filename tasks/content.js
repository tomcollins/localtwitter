var 
  //events = require('events'),
  request = require('request'),
  MongoClient = require('mongodb').MongoClient;

function Content(options) {
  var _this = this;
  this.options = options;
  this.debug = this.options.debug || false;
}

Content.prototype.getDBCollection = function(callback) {
  var _this = this;
  MongoClient.connect(this.options.mongo.url, function(err, db) {
    if (null === err) {
      callback(null, db, db.collection(_this.options.mongo.collections.content));
    } else {
      callback(true);
    }
  });
};

Content.prototype.getContent = function(criteria, callback) {
  var _this = this;
  if (this.debug) { console.log('Content.getContent', criteria); }  
  this.getDBCollection(function(err, db, collection) {
    if (err) {
      if (_this.debug) { console.log('Content.getContent - unable to get db connection.'); }
      callback(true);
    } else {
      collection.find(criteria, {sort: [['dateCreated', -1]]}).toArray(function(err, docs) {
        db.close();
        if (err || 0 === docs.length) {
          if (_this.debug) { console.log('Content.getContent - no content found'); }
          callback(null);
        } else {
          if (_this.debug) { console.log('Content.getContent - found ' +docs.length +' items'); }
          callback(docs);
        }
      });
    }
  })
};



module.exports = {
  Content: Content
};