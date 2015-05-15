Auth0 = {};

// Request credentials for the user
// @param options {optional}
// @param credentialRequestCompleteCallback {Function} Callback function to call on
//   completion. Takes one argument, credentialToken on success, or Error on error.
Auth0.requestCredential = function (options, credentialRequestCompleteCallback) {

  // support both (options, callback) and (callback).
  if (!credentialRequestCompleteCallback && typeof options === 'function') {
    credentialRequestCompleteCallback = options;
    options = {};
  }

  var config = ServiceConfiguration.configurations.findOne({ service: 'auth0' });

  if (!config) {
    credentialRequestCompleteCallback(new ServiceConfiguration.ConfigError('Service not configured.'));
    return;
  }

  options = options || {};
  options.response_type = options.response_type || 'code';
  options.client_id = config.clientId;

  options.redirect_uri = (function(baseUrl) {
    var suffix = '_oauth/auth0?close';

    if (baseUrl) {
      var separator = baseUrl.slice(-1) === '/' ? '' : '/';
      return baseUrl + separator + suffix;
    } else {
      return Meteor.absoluteUrl(suffix);
    }
  })(config.baseUrl);

  options.state = Random.id();

  var loginUrl = 'https://' + config.domain + '/authorize?';

  for (var k in options) {
    loginUrl += '&' + k + '=' + options[k];
  }

  options.popupOptions = options.popupOptions || {};
  var popupOptions = {
    width:  options.popupOptions.width || 320,
    height: options.popupOptions.height || 450
  };

  Oauth.initiateLogin(options.state, loginUrl, credentialRequestCompleteCallback, popupOptions);
};

