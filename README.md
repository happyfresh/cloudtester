cloudtester
===========



[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/@happyfresh/cloudtester.svg)](https://npmjs.org/package/@happyfresh/cloudtester)
[![Downloads/week](https://img.shields.io/npm/dw/@happyfresh/cloudtester.svg)](https://npmjs.org/package/@happyfresh/cloudtester)
[![License](https://img.shields.io/npm/l/@happyfresh/cloudtester.svg)](https://github.com/happyfresh/cloudtester/blob/master/@happyfresh/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g @happyfresh/cloudtester
$ cloudtester COMMAND
running command...
$ cloudtester (-v|--version|version)
@happyfresh/cloudtester/0.0.2 linux-x64 node-v14.10.1
$ cloudtester --help [COMMAND]
USAGE
  $ cloudtester COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`cloudtester help [COMMAND]`](#cloudtester-help-command)
* [`cloudtester task-kill`](#cloudtester-task-kill)

## `cloudtester help [COMMAND]`

display help for cloudtester

```
USAGE
  $ cloudtester help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.2.0/src/commands/help.ts)_

## `cloudtester task-kill`

describe the command here

```
USAGE
  $ cloudtester task-kill

OPTIONS
  -h, --help                 show CLI help
  -l, --logLevel=info|debug  set the log level

EXAMPLE
  $ cloudtester begin
  hello world from ./src/hello.ts!
```

_See code: [src/commands/task-kill.ts](https://github.com/happyfresh/cloudtester/blob/v0.0.2/src/commands/task-kill.ts)_
<!-- commandsstop -->
