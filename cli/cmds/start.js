var exec = require('child_process').exec;
var execSync = require('exec-sync');
var chalk = require('chalk');

var format = require('../utils').format;
var strUtil = require('../utils').strings;
var objUtil = require('../utils').objects;
var procUtil = require('../utils').processes;
var ports = procUtil.getPorts();
var procNames = procUtil.getProcesses();

//TODO: cleanup code in commands
module.exports = function(context) {
  var flags = context.options;
  var noflags = objUtil.isEmpty(flags);
  var alreadyRunning = running = procsRunning();
  var status = {
    p: "not started",
    r: "not started",
    m: "not started",
    s: "not started"
  };

  // Command: start
  // Starts server from scratch.
  if(noflags) {
    var attempts = {
      p: 0,
      r: 0,
      m: 0,
      s: 0
    };

    // show initial state
    console.log();

    if(running.p) {
      format.actionify(
        strUtil.concat([
          "Postgres is already running on port ",
          procUtil.getPortOf("postgres"),
        ]), "info");
    }

    if(running.r) {
      format.actionify(
        strUtil.concat([
          "Redis is already running on port ",
          procUtil.getPortOf("redis-server")
        ]), "info");
    }

    if(running.m) {
      format.actionify(
        strUtil.concat([
          "MongoDB is already running on port ",
          procUtil.getPortOf("mongod")
        ]), "info");
    }

    if(running.s) {
      format.actionify(
        strUtil.concat([
          "Goodybag API Server is already running on port ",
          procUtil.getPortOf("goodybag-cater-api")
        ]), "info");
    }
    console.log();

    // start state machine
    var refresh = setInterval(function() {
      running = procsRunning();

      if(status.p === "started" && running.p) {
        format.actionify(
          strUtil.concat([
            "Postgres is now running on port ",
            procUtil.getPortOf("postgres")
          ]), "success");
        status.p = "finished";
      }

      if(status.r === "started" && running.r) {
        format.actionify(
          strUtil.concat([
            "Redis is now running on port ",
            procUtil.getPortOf("redis-server")
          ]), "success");
        status.r = "finished";
      }

      if(status.m === "started" && running.m) {
        format.actionify(
          strUtil.concat([
            "MongoDB is now running on port ",
            procUtil.getPortOf("mongod")
          ]), "success");
        status.m = "finished";
      }

      if(status.s === "started" && running.s) {
        format.actionify(
          strUtil.concat([
            "Goodybag API Server now running on port ",
            procUtil.getPortOf("goodybag-cater-api")
          ]), "success");
        status.s = "finished";
      }

      if(!running.p) {
        if(attempts.p === 0) {
          console.log();
          console.log();
          format.actionify(
            "Starting Postgres...", "info"
          );
          console.log();
          status.p = "started";

          var p_child = exec('open /Applications/Postgres.app');

          p_child.stdout.on('data', function(data) {
            format.actionify(data, "info");
          });

          p_child.stderr.on('data', function(data) {
            format.actionify(data, "error");
            clearInterval(refresh);
            format.continue();
          });
        }

        attempts.p++;
      }

      if(!running.r && (alreadyRunning.p || status.p === "finished")) {
        if(attempts.r === 0) {
          console.log();
          console.log();
          format.actionify(
            "Starting redis...", "info"
          );
          console.log();
          status.r = "started";

          var r_child = exec('redis-server');

          r_child.stdout.on('data', function(data) {
            if(status.r==="finished") {
              console.log();
              console.log();
              format.actionify(
                chalk.green("Received a response from Redis: "), "info"
              );
              console.log();
            }
            console.log(data);
            if(status.r==="finished") {
              format.continue();
            }
          });

          r_child.stderr.on('data', function(data) {
            format.actionify(data, "error");
            clearInterval(refresh);
            format.continue();
          });
        }

        attempts.r++;
      }

      if(!running.m && (alreadyRunning.p || status.p === "finished")
         && (alreadyRunning.r || status.r === "finished")) {
        if(attempts.m === 0) {
          console.log();
          console.log();
          format.actionify(
            "Starting mongod...", "info"
          );
          console.log();
          status.m = "started";

          var m_child = exec('mongod');

          m_child.stdout.on('data', function(data) {
            if(status.m==="finished") {
              console.log();
              console.log();
              format.actionify(
                chalk.green("Received a response from MongoDB: "), "info"
              );
              console.log();
            }
            console.log(data);
            if(status.m==="finished") {
              format.continue();
            }
          });

          m_child.stderr.on('data', function(data) {
            format.actionify(data, "error");
            clearInterval(refresh);
            format.continue();
          });
        }
        attempts.m++;
      }

      if(!running.s && (alreadyRunning.p || status.p === "finished")
         && (alreadyRunning.r || status.r === "finished")
         && (alreadyRunning.m || status.m == "finished")) {

        if(attempts.s === 0) {
          console.log();
          console.log();
          format.actionify(
            "Starting server...", "info"
          );
          console.log();
          status.s = "started";

          var s_child = exec('node server.js');

          s_child.stdout.on('data', function(data) {
            if(status.s === "finished") {
              console.log();
              console.log();
              format.actionify(
                chalk.green("Received a response from Goodybag API Server: "), "info"
              );
              console.log();
            }
            console.log(data);
            if(status.s === "finished") {
              format.continue();
            }
          });
        };

        attempts.s++;
      }

      if(status.s === "finished") {
        clearInterval(refresh);
        format.continue();
      }

      if(attempts.p > 8 || attempts.r > 8 || attempts.m > 8) {
        console.log();
        format.actionify("Operation timed out.", "error");
        clearInterval(refresh);
        format.continue();
      }
    }, 1000);

  // Command start [-p] [-r] [-m] [-s]
  // Starts only specified processes from flags.
  } else {
    var highestRankedFlag = getHighestRanked(flags);
    var attempts = {
      p: 0,
      r: 0,
      m: 0,
      s: 0
    };

    // show initial state, only if flag has been specified
    console.log();

    if(running.p && flags.p) {
      format.actionify(
        strUtil.concat([
          "Postgres is already running on port ",
          procUtil.getPortOf("postgres"),
        ]), "info");
    }

    if(running.r && flags.r) {
      format.actionify(
        strUtil.concat([
          "Redis is already running on port ",
          procUtil.getPortOf("redis-server")
        ]), "info");
    }

    if(running.m && flags.m) {
      format.actionify(
        strUtil.concat([
          "MongoDB is already running on port ",
          procUtil.getPortOf("mongod")
        ]), "info");
    }

    if(running.s && flags.s) {
      format.actionify(
        strUtil.concat([
          "Goodybag API Server is already running on port ",
          procUtil.getPortOf("goodybag-cater-api")
        ]), "info");
    }
    console.log();

    // start state machine
    var refresh = setInterval(function() {
      running = procsRunning();

      if(status.p === "started" && running.p) {
        format.actionify(
          strUtil.concat([
            "Postgres is now running on port ",
            procUtil.getPortOf("postgres")
          ]), "success");
        status.p = "finished";
      }

      if(status.r === "ready" && running.r) {
        format.actionify(
          strUtil.concat([
            "Redis is now running on port ",
            procUtil.getPortOf("redis-server")
          ]), "success");
        status.r = "finished";
      }

      if(status.m === "ready" && running.m) {
        format.actionify(
          strUtil.concat([
            "MongoDB is now running on port ",
            procUtil.getPortOf("mongod")
          ]), "success");
        status.m = "finished";
      }

      if(status.s === "ready" && running.s) {
        format.actionify(
          strUtil.concat([
            "Goodybag API Server now running on port ",
            procUtil.getPortOf("goodybag-cater-api")
          ]), "success");
        status.s = "finished";
      }

      if(!running.p && flags.p) {
        if(attempts.p === 0) {
          console.log();
          console.log();
          format.actionify(
            "Starting Postgres...", "info"
          );
          console.log();
          status.p = "started";

          var p_child = exec('open /Applications/Postgres.app');

          p_child.stdout.on('data', function(data) {
            format.actionify(data, "info");
          });

          p_child.stderr.on('data', function(data) {
            format.actionify(data, "error");
            clearInterval(refresh);
            format.continue();
          });
        }
        attempts.p++;
      }

      if(!running.r && flags.r &&
        (!flags.p || (flags.p && status.p==="finished"))) {
        if(attempts.r === 0) {
          console.log();
          console.log();
          format.actionify(
            "Starting redis...", "info"
          );
          console.log();
          status.r = "started";

          var r_child = exec('redis-server');

          r_child.stdout.on('data', function(data) {
            if(status.r==="finished") {
              console.log();
              console.log();
              format.actionify(
                chalk.green("Received a response from Redis: "), "info"
              );
              console.log();
            }
            console.log(data);
            if(strUtil.contains(data, 'ready to accept')) {
              status.r = "ready";
            }
            if(status.r==="finished") {
              format.continue();
            }
          });

          r_child.stderr.on('data', function(data) {
            format.actionify(data, "error");
            clearInterval(refresh);
            format.continue();
          });
        }
        attempts.r++;
      }

      if(!running.m && flags.m &&
        ((!flags.p && !flags.r) ||
         (flags.p && !flags.r && status.p==="finished") ||
         (flags.r && status.r==="finished"))) {
        if(attempts.m === 0) {
          console.log();
          console.log();
          format.actionify(
            "Starting mongod...", "info"
          );
          console.log();
          status.m = "started";

          var m_child = exec('mongod');

          m_child.stdout.on('data', function(data) {
            if(status.m==="finished") {
              console.log();
              console.log();
              format.actionify(
                chalk.green("Received a response from MongoDB: "), "info"
              );
              console.log();
            }
            console.log(data);
            if(strUtil.contains(data, 'waiting for connections')) {
              status.m = "ready";
            }
            if(status.r==="finished") {
              format.continue();
            }
          });

          m_child.stderr.on('data', function(data) {
            format.actionify(data, "error");
            clearInterval(refresh);
            format.continue();
          });
        }
        attempts.m++;
      }

      if(!running.s && flags.s) {
        if(!running.p && !flags.p) {
          flags.p = true;
        }

        if(!running.r && !flags.r) {
          flags.r = true;
        }

        if(!running.m && !flags.m) {
          flags.m = true;
        }

        if((alreadyRunning.p || status.p === "finished")
           && (alreadyRunning.r || status.r === "finished")
           && (alreadyRunning.m || status.m == "finished")) {
             if(attempts.s === 0) {
               console.log();
               console.log();
               format.actionify(
                 "Starting server...", "info"
               );
               console.log();
               status.s = "started";

               var s_child = exec('node server.js');

               s_child.stdout.on('data', function(data) {
                 if(status.s === "finished") {
                   console.log();
                   console.log();
                   format.actionify(
                     chalk.green("Received a response from Goodybag API Server: "), "info"
                   );
                   console.log();
                 }
                 console.log(data);
                 if(strUtil.contains(data, "listening on")) {
                   status.s = "ready";
                 };
                 if(status.s === "finished") {
                   format.continue();
                 }
               });
             };
             attempts.s++;
           }
      }

      if(status[highestRankedFlag] === "finished") {
        clearInterval(refresh);
        format.continue();
      }

      if(attempts.p > 8 || attempts.r > 8 || attempts.m > 8) {
        console.log();
        format.actionify("Operation timed out.", "error");
        clearInterval(refresh);
        format.continue();
      }
    });
  }

  context.end();
};

function procsRunning() {
  var running = {};
  var mapFlag = {
    0: "p",
    1: "r",
    2: "m",
    3: "s"
  };

  ports.forEach(function(port, i) {
    var res = execSync('lsof -n -i4TCP:'+ port +' | grep LISTEN');
    if (res) {
      running[mapFlag[i]] = true;
    } else {
      running[mapFlag[i]] = false;
    }
  });

  return running;
}

function getHighestRanked(flags) {
  var rankedFlags = [];
  if(flags.s){ rankedFlags.push("s"); }
  if(flags.m){ rankedFlags.push("m"); }
  if(flags.r){ rankedFlags.push("r"); }
  if(flags.p){ rankedFlags.push("p"); }

  return rankedFlags[0];
}
