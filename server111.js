const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const rp = require('request-promise');
const path = require('path');
app.use(bodyParser.json());
app.use(express.static('public'));

const handlebars = require('express-handlebars').create({defaultLayout:'main'});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

var state = '';
var accessToken = '';
const clientID = '715839541049-fsj0u3nouct28mi3r7273jucsv92qh82.apps.googleusercontent.com';
const clientSecret = 'sjFM02CuzjMn9c0Mk5dwmkqK';

function createState(length) {
  var str = "";
  for ( ; str.length < length; str += Math.random().toString(36).substr(2));
  return str.substr( 0, length );
}

app.get('/', function (req, res) {
  var context = {};
  res.render('homepage', context);
});

app.get('/authenticator', function (req, res) {
  state = createState(16);
  const redirectURL = 'https://accounts.google.com/o/oauth2/v2/auth?' + 'response_type=code&client_id=' + clientID + '&redirect_uri=https://hw6-oauth-liuqib.appspot.com/midcheck&scope=profile email&state=' + state;
  res.redirect(redirectURL);
});

app.get('/midcheck', function (req, res) {
  if (req.query.state == state) {
    var options = {
      method: 'POST',
      uri: 'https://oauth2.googleapis.com/token',
      formData: {
        code: req.query.code,
        client_id: clientID,
        client_secret: clientSecret,
        redirect_uri: 'https://hw6-oauth-liuqib.appspot.com/midcheck',
        grant_type:'authorization_code'
      },
      headers: {
        'content-type': 'application/x-www-form-urlencoded'
      }
    };

    rp(options)
    .then(function (body) {
      accessToken = JSON.parse(body).access_token;
      res.redirect('/success');
    })
    .catch(function (err){
      res.status(500).send(err);
    });
  }
  else {
    console.log("States don't match");
    res.status(500).send("States don't match");
  }
});

app.get('/success', function (req, res) {
  const authHeader = 'Bearer ' + accessToken;
  console.log("authHeader" + authHeader);
  var options2 = {
    uri: 'https://people.googleapis.com/v1/people/me?personFields=names,emailAddresses',
    headers: {
      'Authorization': authHeader
    },
    json: true
  };
  rp(options2)
  .then(function (person) {
    var context = {};
    context.firstName = person.names[0].givenName;
    context.lastName = person.names[0].familyName;
    context.secretState = state;
    res.render('dataDisplay', context);
  })
  .catch(function (err) {
    console.log(err);
    res.status(500).send("Something went wrong");
  });
});

const PORT = process.env.PORT || 8080;

app.listen(process.env.PORT || 8080, () => {
  console.log(`App listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
});

module.exports = app;
