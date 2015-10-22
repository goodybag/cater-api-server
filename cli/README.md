#goodybag-cli
*The kickass goodybag command line interface. (v0.1.0)*

Currently, only compatible with the Mac OS X operating system.

##Basic Usage

```
$ node gcli

goodybag-cli >
```

##Project Structure

* `gcli.js` - Starts the gcli app.
* `cli/`
  * `config.json` - Holds configs for goodybag-cli.
  * `app.js` - Exports the gcli app.
  * `prompt/` - Takes care of the cli's greeting & prompt messages.
  * `cmds/` - Holds logic for all commands available on the cli.
  * `util/` - Contains utility functions commonly used throughout the app.

##API

####Help
```
goodybag-cli > help
```

**Alias:** `h`

**Description:** Prints out a full list of available commands.

**Flags:** *none*

===

####Version
```
goodybag-cli > version
```

**Alias:** `v`

**Description:** Prints out the current version of goodybag-cli.

**Flags:** *none*

===

####Start
```
goodybag-cli > start
```

**Alias:** `st`

**Description:** Starts the server. Also starts `psql`, `redis-server`, `mongod`, and `grunt` if not already running.

**Flags:** *none*

===

####Stop
```
goodybag-cli > stop
```

**Alias:** `stp`

**Description:** Stops the server. Also safely exits `psql`, `redis-server`, `mongod`, and `grunt` if they are running.

**Flags:** *none*

===

####Restart
```
goodybag-cli > restart
```

**Alias:** `rst`

**Description:** Restarts the server if it is already running. Otherwise, does not execute.

**Flags:** *none*
