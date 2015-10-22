#goodybag-cli
*The kickass goodybag command line interface. (v0.1.0)*

Currently, only compatible with the Mac OS X operating system.

##Basic Usage

```
$ node gcli.js

goodybag-cli >
```

##Available Commands

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

**Description:** Prints out the version number of the cli.

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
