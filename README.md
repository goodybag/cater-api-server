# cater-api-server

> Mhmmmmm food

![Travis CI](https://magnum.travis-ci.com/goodybag/cater-api-server.svg?token=Y9pCkdx3gqFuzfxv2XR4)

## Setup

__Install Postgres:__

http://postgresapp.com/

Current version requirement: 9.3 and up

__Install Node.js:__

https://nodejs.org/  v0.10.36

__Create databases:__

```
psql -h localhost --command="create database cater"
psql -h localhost --command="create database cater_test"
```

__Setup errthing:__

```
git clone git@github.com:goodybag/cater-api-server.git
cd cater-api-server
npm install
```

__Setup local config__

In the root directory there is a file named `local-config.json.sample`, edit
this file as needed and save it as `local-config.json`

Change the information in `local-config.json`:  
- change email to your current goodybag email  
- enter testUserID (this will be provided to you)  
- you have the option to receive test calls and texts if you change the X's with your phone number 

__Install MongoDB:__

```
brew install mongodb
mongod
```

If you run into this error after running the last command:
********************************************************
 ERROR: dbpath (/data/db) does not exist.
 Create this directory or give existing directory in --dbpath.
 See http://dochub.mongodb.org/core/startingandstoppingmongo
********************************************************
 
 
```
sudo mkdir /data
sudo mkdir /data/db
sudo chown <YOUR_USERNAME> /data
sudo chown <YOUR_USERNAME> /data/db
mongod
```

__Install Redis__

```
wget http://download.redis.io/redis-stable.tar.gz
tar xvzf redis-stable.tar.gz
cd redis-stable
make
sudo cp src/redis-server /usr/local/bin/
sudo cp src/redis-cli /usr/local/bin/
```

__Install Heroku Toolbelt__

[https://toolbelt.heroku.com](https://toolbelt.heroku.com)

```
heroku login
```

if you have multiple heroku accounts, checkout https://github.com/ddollar/heroku-accounts

__Watch files, start log server, etc:__

```
npm install -g grunt-cli
grunt
```

__Create a balanced config__
```
./bin/create-balanced-configs.js
```

__Sync prod data with local:__

```
./bin/prod-to-local
```

__Start server:__

```
npm start
```

`npm start` can take awhile. Trying running `node server` for a faster start.


## Testing

To run the functional test suite, you currently need the selinium chrome driver installed:

```
wget http://chromedriver.storage.googleapis.com/2.9/chromedriver_mac32.zip
unzip chromedriver_mac32.zip
mv chromedriver /usr/local/bin
node db/setup --test
node db/fake-data --test
```

To run the entire suite:

```
./bin/start-test-server
npm test
```

Or a single file:

```
mocha test/functional/login.js
```

To write your own functional tests, start off with some scaffolding:

```
grunt generate.functional-test:my-test-name
```

This will generate `my-test-name.js` in `test/functional`. You may have multiple tests per file, but keep the file scoped to one task. For instance, if you're testing login, it's ok to test the login functionality of multiple pages. And it's ok to add tests for failing login cases.

__Resources:__

* [http://selenium.googlecode.com/git/docs/api/javascript/module_selenium-webdriver.html](Web Driver JS Docs)