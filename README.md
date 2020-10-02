cloudtester
===========



[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/cloudtester.svg)](https://npmjs.org/package/cloudtester)
[![Downloads/week](https://img.shields.io/npm/dw/cloudtester.svg)](https://npmjs.org/package/cloudtester)
[![License](https://img.shields.io/npm/l/cloudtester.svg)](https://github.com/happy/cloudtester/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g cloudtester
$ cloudtester COMMAND
running command...
$ cloudtester (-v|--version|version)
cloudtester/0.0.0 darwin-x64 node-v14.8.0
$ cloudtester --help [COMMAND]
USAGE
  $ cloudtester COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`cloudtester hello [FILE]`](#cloudtester-hello-file)
* [`cloudtester help [COMMAND]`](#cloudtester-help-command)

## `cloudtester hello [FILE]`

describe the command here

```
USAGE
  $ cloudtester hello [FILE]

OPTIONS
  -f, --force
  -h, --help       show CLI help
  -n, --name=name  name to print

EXAMPLE
  $ cloudtester hello
  hello world from ./src/hello.ts!
```

_See code: [src/commands/hello.ts](https://github.com/happy/cloudtester/blob/v0.0.0/src/commands/hello.ts)_

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
<!-- commandsstop -->
