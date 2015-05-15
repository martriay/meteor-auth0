Auth0 = {};

Oauth.registerService('auth0', 2, null, function (query) {

  var tokens = getTokens(query);
  var user = getUserProfile(tokens.access_token);

  var username = user.name || user.email;
  var serviceData = {
    id:           user.user_id,
    accessToken:  tokens.access_token,
    id_token:     tokens.id_token,
    name:         username
  };

  _.extend(serviceData, user);

  return {
    serviceData: serviceData,
    options: {
      profile: {
        name: username
      }
    }
  };
});

var userAgent = 'Meteor';
if (Meteor.release) {
  userAgent += '/' + Meteor.release;
}

var getTokens = function (query) {
  var config = getConfiguration();
  var response;

  try {

    response = HTTP.post(
      'https://' + config.domain + '/oauth/token', {
        headers: {
          Accept: 'application/json',
          'User-Agent': userAgent
        },
        params: {
          code:           query.code,
          //state:          query.state,
          client_id:      config.clientId,
          client_secret:  config.clientSecret,
          grant_type:     'authorization_code',
          redirect_uri:   (function(baseUrl) {
            var suffix = '_oauth/auth0?close';

            if (baseUrl) {
              var separator = baseUrl.slice(-1) === '/' ? '' : '/';
              return baseUrl + separator + suffix;
            } else {
              return Meteor.absoluteUrl(suffix);
            }
          })(config.baseUrl)
        }
      });
  }
  catch (err) {
    throw _.extend(
      new Error('Failed to complete OAuth handshake with Auth0. ' + err.message), { response: err.response });
  }

  if (response.data.error) { // if the http response was a json object with an error attribute
    throw new Error('Failed to complete OAuth handshake with Auth0. ' + response.data.error);
  } 
  
  return response.data;
};

var getUserProfile = function (accessToken) {
  var config = getConfiguration();
  var response;
  try {
    response = HTTP.get(
      'https://' + config.domain + '/userinfo', {
        headers: {
          'User-Agent': userAgent 
        },
        params: {
          access_token: accessToken
        }
      });
  }
  catch (err) {
    throw _.extend(
      new Error('Failed to fetch user profile from Auth0. ' + err.message), { response: err.response });
  }

  return response.data;
};

var getConfiguration = function () {
  var config = ServiceConfiguration.configurations.findOne({ service: 'auth0' });
  if (!config) {
    throw new ServiceConfiguration.ConfigError('Service not configured.');
  }

  return config;
};

Auth0.retrieveCredential = function(credentialToken) {
  return Oauth.retrieveCredential(credentialToken);
};
