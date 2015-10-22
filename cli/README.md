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

**Description:** Prints out a list of available commands.

**Flags:** *none*

===

####Start
```
goodybag-cli > start
```

**Description:** Starts the server. Also starts `psql`, `redis-server`, `mongod`, and `grunt` if not already running.

**Flags:** *none*

===

####Stop
```
goodybag-cli > stop
```

**Description:** Stops the server. Also safely exits `psql`, `redis-server`, `mongod`, and `grunt` if they are running.

**Flags:** *none*
