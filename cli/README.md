#goodybag-cli
*The kickass goodybag command line interface. (v0.1.0)*

Currently, only compatible with the Mac OS X operating system.

##Basic Usage

```
$ node gcli

goodybag-cli >
```

###Setup

```
$ cp cli/local-config.json.sample cli/local-config.json
```

This `.json` holds the port numbers for the servers. Verify that this information is correct for your system.

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
goodybag-cli > help <[COMMAND] ...>
```

**Alias:** `h`

**Description:** Prints the basic usage information on each [COMMAND] given (1 or more). Otherwise, prints the full table of available commands.

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
goodybag-cli > start [-p] [-r] [-m] [-s]
```

**Alias:** `st`

**Description:** Starts the server from scratch if no flags are given. This means starting `Postgres`, `redis`, `mongod`, and the `goodybag-cater-api` server, in that order. If flags are given, then only the processes specified will start. If a process is already started, it will be ignored.

**Flags:**
* `-p`: Opens the Postgres app.
* `-r`: Starts `redis-server`.
* `-m`: Starts `mongod`.
* `-s`: Starts `goodybag-cater-api` server.

===

####Stop
```
goodybag-cli > stop [-p] [-r] [-m] [-s]
```

**Alias:** `stp`

**Description:** Stops the server, closing all processes with it (e.g., Postgres, `redis`, `mongod`). If flags are given, then only the processes specified will be stopped. If a process is already stopped, it will be ignored.

**Flags:**
* `-p`: Closes the Postgres app.
* `-r`: Stops `redis-server`.
* `-m`: Stops `mongod`.
* `-s`: Stops `goodybag-cater-api` server.
