var kill = require('killprocess');
var execSync = require('exec-sync');
var Lineup = require('lineup');
var lineup = new Lineup();

var format = require('../utils').format;
var strUtil = require('../utils').strings;
var objUtil = require('../utils').objects;
var procUtil = require('../utils').processes;

module.exports = function(context) {
  var flags = context.options;
  var noflags = objUtil.isEmpty(flags);
  var pids = getPIDs();

  // Command: stop
  // Stops all processes.
  if(noflags) {
    if(pids.p) {
      console.log();
      format.actionify(
        strUtil.concat([
          "Exiting Postgres on port ",
          procUtil.getPortOf("postgres"),
          " (PID=",
          pids.p,
          ")..."
        ]), "info");
      console.log();

      pids.p.forEach(function(pid) {
        var res = execSync('kill ' + pid);

        if(!res) {
          format.actionify(
            strUtil.concat([
              "Killed Postgres on pid ",
              pid, "."
            ]), "success");
          console.log();
        } else {
          format.actionify(
            res, "error"
          );
          console.log();
        }
      });

    } else {
      console.log();
      format.actionify(
        "Postgres does not seem be running.", "info"
      );
      console.log();
    }

    if(pids.r) {
      console.log();
      format.actionify(
        strUtil.concat([
          "Exiting Redis on port ",
          procUtil.getPortOf("redis-server"),
          " (PID=",
          pids.r,
          ")..."
        ]), "info");
      console.log();

      var res = execSync('kill ' + pids.r);

      if(!res) {
        format.actionify(
          strUtil.concat([
            "Killed Redis on pid ",
            pids.r, "."
          ]), "success");
        console.log();
      } else {
        format.actionify(
          res, "error"
        );
        console.log();
      }

    } else {
      console.log();
      format.actionify(
        "Redis does not seem be running.", "info"
      );
      console.log();
    }

    if(pids.m) {
      console.log();
      format.actionify(
        strUtil.concat([
          "Exiting MongoDB on port ",
          procUtil.getPortOf("mongod"),
          " (PID=",
          pids.m,
          ")..."
        ]), "info");
      console.log();

      var res = execSync('kill ' + pids.m);

      if(!res) {
        format.actionify(
          strUtil.concat([
            "Killed MongoDB on pid ",
            pids.m, "."
          ]), "success");
        console.log();
      } else {
        format.actionify(
          res, "error"
        );
        console.log();
      }

    } else {
      console.log();
      format.actionify(
        "MongoDB does not seem be running.", "info"
      );
      console.log();
    }

    if(pids.s) {
      console.log();
      format.actionify(
        strUtil.concat([
          "Exiting Goodybag API Server on port ",
          procUtil.getPortOf("goodybag-cater-api"),
          " (PID=",
          pids.s,
          ")..."
        ]), "info");
      console.log();

      var res = execSync('kill ' + pids.s);

      if(!res) {
        format.actionify(
          strUtil.concat([
            "Killed Goodybag API Server on pid ",
            pids.s, "."
          ]), "success");
        console.log();
      } else {
        format.actionify(
          res, "error"
        );
        console.log();
      }

    } else {
      console.log();
      format.actionify(
        "Goodybag API Server does not seem be running.", "info"
      );
      console.log();
    }

  } else {

    if(flags.p) {
      if(pids.p) {
        console.log();
        format.actionify(
          strUtil.concat([
            "Exiting Postgres on port ",
            procUtil.getPortOf("postgres"),
            " (PID=",
            pids.p,
            ")..."
          ]), "info");
        console.log();

        pids.p.forEach(function(pid) {
          var res = execSync('kill ' + pid);

          if(!res) {
            format.actionify(
              strUtil.concat([
                "Killed Postgres on pid ",
                pid, "."
              ]), "success");
            console.log();
          } else {
            format.actionify(
              res, "error"
            );
            console.log();
          }
        });

      } else {
        console.log();
        format.actionify(
          "Postgres does not seem be running.", "info"
        );
        console.log();
      }
    }

    if(flags.r) {
      if(pids.r) {
        console.log();
        format.actionify(
          strUtil.concat([
            "Exiting Redis on port ",
            procUtil.getPortOf("redis-server"),
            " (PID=",
            pids.r,
            ")..."
          ]), "info");
        console.log();

        var res = execSync('kill ' + pids.r);

        if(!res) {
          format.actionify(
            strUtil.concat([
              "Killed Redis on pid ",
              pids.r, "."
            ]), "success");
          console.log();
        } else {
          format.actionify(
            res, "error"
          );
          console.log();
        }

      } else {
        console.log();
        format.actionify(
          "Redis does not seem be running.", "info"
        );
        console.log();
      }
    }

    if(flags.m) {
      if(pids.m) {
        console.log();
        format.actionify(
          strUtil.concat([
            "Exiting MongoDB on port ",
            procUtil.getPortOf("mongod"),
            " (PID=",
            pids.m,
            ")..."
          ]), "info");
        console.log();

        var res = execSync('kill ' + pids.m);

        if(!res) {
          format.actionify(
            strUtil.concat([
              "Killed MongoDB on pid ",
              pids.m, "."
            ]), "success");
          console.log();
        } else {
          format.actionify(
            res, "error"
          );
          console.log();
        }

      } else {
        console.log();
        format.actionify(
          "MongoDB does not seem be running.", "info"
        );
        console.log();
      }
    }

    if(flags.s) {
      if(pids.s) {
        console.log();
        format.actionify(
          strUtil.concat([
            "Exiting Goodybag API Server on port ",
            procUtil.getPortOf("goodybag-cater-api"),
            " (PID=",
            pids.s,
            ")..."
          ]), "info");
        console.log();

        var res = execSync('kill ' + pids.s);

        if(!res) {
          format.actionify(
            strUtil.concat([
              "Killed Goodybag API Server on pid ",
              pids.s, "."
            ]), "success");
          console.log();
        } else {
          format.actionify(
            res, "error"
          );
          console.log();
        }

      } else {
        console.log();
        format.actionify(
          "Goodybag API Server does not seem be running.", "info"
        );
        console.log();
      }
    }
  }
  context.end();
};

function getPIDs() {
  var pids = {};
  pids.p = getPID("Postgres"); // running: 7, not running: 3
  pids.r = getPID("redis-server"); // running: 4, not running: 3
  pids.m = getPID("mongod"); // running: 4, not running: 3
  pids.s = getPID("goodybag-cater-api");
  return pids;
}

function getPID(procName) {
  var pid = null;

  if(procName==="goodybag-cater-api") {
    var res = execSync('lsof -n -i4TCP:'+ procUtil.getPortOf(procName) +' | grep LISTEN');
    if(res) {
      res = res.replace( /^\D+/g, '');
      pid = parseInt(res);
    }
  } else {
    var res = execSync('ps -ax | grep ' + procName);
    res = res.split(procName);
    if(res.length > 3) {
      if(procName==="Postgres") {
        var res1 = res[0].replace( /(\r\n|\n|\r)/gm," ").split(" ");
        var res2 = res[2].replace( /(\r\n|\n|\r)/gm," ").split(" ");
        var pid1 = parseInt(res1[0]);
        var pid2 = parseInt(res2[1]);
        pid = [pid1, pid2];
      } else {
        pid = parseInt(res);
      }
    }
  }

  return pid;
}
