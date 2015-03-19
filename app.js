var 
  Feed = require('./tasks/feed').Feed;
  Travel = require('./tasks/travel').Travel;

var config = {
  debug: true,
  apiKey: process.env.NEWSLABS_API_KEY,
  mongo: require('./config/mongo.json'),
  locations: require('./config/locations.json')
};

//console.log('config', config);
//var incidents = require('./data/travel_incidents.json');
//console.log('incidents', incidents.road.total);

var travel = new Travel(config);
travel.updateLocation(config.locations[0].id);

//var feed = new Feed(config);
//feed.update(config.locations[0]);

