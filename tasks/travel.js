var 
  //events = require('events'),
  request = require('request'),
  MongoClient = require('mongodb').MongoClient;

function Travel(options) {
  var _this = this;
  this.options = options;
  this.debug = this.options.debug || false;
  //events.EventEmitter.call(this);
}

//Travel.prototype.__proto__ = events.EventEmitter.prototype;

Travel.prototype.getDBCollection = function(callback) {
  var _this = this;
  MongoClient.connect(this.options.mongo.url, function(err, db) {
    if (null === err) {
      callback(null, db, db.collection(_this.options.mongo.collections.content));
    } else {
      callback(true);
    }
  });
};

Travel.prototype.updateLocation = function(locationId) {
  var _this = this;
  if (this.debug) { console.log('Travel.updateLocation', locationId); }  
  this.getIncidentsByLocationId(locationId, function(result){
    if (null === result) {
      if (_this.debug) { console.log('Error updating travel for location', locationId); }
    } else {
      if (_this.debug) { console.log('result.road.total', result.road.total); }
      result.road.incidents.forEach(function(incident){
        //if ('medium' === incident.severity || 'severe' === incident.severity) {
          _this.updateIncident(locationId, incident);
        //}
      });
    }
  });
};

Travel.prototype.updateIncident = function(locationId, incident) {
  var _this = this;
  if (this.debug) { console.log('Travel.updateIncident', locationId, incident.id); }
  this.getIncident(incident.id, function(result) {
    if (null === result) {
      _this.insertIncident(locationId, incident, function(err) {
        if (null === err) {
          if (_this.debug) { console.log('Travel incident inserted'); }
        } else {
          if (_this.debug) { console.error('Error incerting travel incident inserted'); }
        }
      });
    } else {
      if (_this.debug) { console.log('Travel.updateIncident - incident already exists'); }
    }
  });
};

Travel.prototype.getIncident = function(incidentId, callback) {
  var _this = this;
  if (this.debug) { console.log('Travel.getIncident', incidentId); }
  this.getDBCollection(function(err, db, collection) {
    if (err) {
      if (_this.debug) { console.log('Travel.getIncident - unable to get db connection.'); }
      callback(true);
    } else {
      collection.find({id: 'travel_' +incidentId}).toArray(function(err, docs) {
        db.close();
        if (err || 0 === docs.length) {
          if (_this.debug) { console.log('Travel.getIncident - incident not found'); }
          callback(null);
        } else {
          if (_this.debug) { console.log('Travel.getIncident - found incident'); }
          callback(docs[0]);
        }
      });
    }
  })
};

Travel.prototype.insertIncident = function(locationId, incident, callback) {
  var _this = this,
    doc = {
      type: 'travel',
      id: 'travel_' +incident.id,
      locationId: locationId,
      dateCreated: new Date(),
      incident: incident
    };
  if (this.debug) { console.log('Travel.insertIncident', locationId, incident.id); }
  this.getDBCollection(function(err, db, collection) {
    if (err) {
      if (_this.debug) { console.log('Travel.insertIncident - unable to get db connection.'); }
    } else {
      collection.insert(doc, function(err) {
        db.close();
        if (null === err) {
          if (_this.debug) { console.log('Travel incident inserted'); }
          callback(null);
        } else {
          if (_this.debug) { console.error('Error inserting travel incident inserted'); }
          callback(true);
        }
      });
    }
  });
};

Travel.prototype.getIncidentsByLocationId = function(locationId, callback) {
  if (this.debug) { console.log('Travel.getIncidentsByLocationId', locationId); }
  var url = 'http://data.bbc.co.uk/travel/location/' +locationId +'/incidents?apikey=' +this.options.apiKey;
  request({
    url: url,
    json: true
  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      callback(body);
    } else {
      if (_this.debug) { console.log('Error requesting travel incidents for', url); }
      callback(false);
    }
  });
};

module.exports = {
  Travel: Travel
};