#!/usr/bin/env node

/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */

var fs = require('fs');
var path = require('path');
var spawn = require('child_process').spawn;
var prompt = require("prompt");

var CLI_MODULE_PATH = function() {
  return path.resolve(
    process.cwd(),
    'node_modules',
    'react-native',
    'cli'
  );
};

var cli;
try {
  cli = require(CLI_MODULE_PATH());
} catch(e) {}

if (cli) {
  cli.run();
} else {
  var args = process.argv.slice(2);
  if (args.length === 0) {
    console.error(
      'You did not pass any commands, did you mean to run `react-native init`?'
    );
    process.exit(1);
  }

  switch (args[0]) {
  case 'init':
    if (args[1]) {
      init(args[1]);
    } else {
      console.error(
        'Usage: react-native init <ProjectName>'
      );
      process.exit(1);
    }
    break;
  default:
    console.error(
      'Command `%s` unrecognized. ' +
      'Did you mean to run this inside a react-native project?',
      args[0]
    );
    process.exit(1);
    break;
  }
}

function init(name) {
  if (!name.match(/^[$A-Z_][0-9A-Z_$]*$/i)) {
    console.error(
      '"%s" is not a valid name for a project. Please use a valid identifier ' +
        'name (alphanumeric).',
      name
    );
    process.exit(1);
  }

  if (fs.existsSync(name)) {
    createAfterConfirmation(name)
  } else {
    createProject(name);
  }
}

function createAfterConfirmation(name) {
    prompt.start();

    var property = {
      name: 'yesno',
      message: 'Directory ' + name + ' already exist. Continue?',
      validator: /y[es]*|n[o]?/,
      warning: 'Must respond yes or no',
      default: 'no'
    };

    prompt.get(property, function (err, result) {
      if (result.yesno[0] === 'y') {
        createProject(name);
      } else {
        console.log('Project initialization canceled');
        process.exit();
      }
    });
}

function createProject(name) {
  var root = path.resolve(name);
  var projectName = path.basename(root);

  console.log(
    'This will walk you through creating a new React Native project in',
    root
  );

  if (!fs.existsSync(root)) {
    fs.mkdirSync(root);
  }

  var packageJson = {
    name: projectName,
    version: '0.0.1',
    private: true,
    scripts: {
      start: 'node_modules/react-native/packager/packager.sh'
    }
  };
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify(packageJson));
  process.chdir(root);

  run('npm install --save react-native', function(e) {
    if (e) {
      console.error('`npm install --save react-native` failed');
      process.exit(1);
    }

    var cli = require(CLI_MODULE_PATH());
    cli.init(root, projectName);
  });
}

function run(command, cb) {
  var parts = command.split(/\s+/);
  var cmd = parts[0];
  var args = parts.slice(1);
  var proc = spawn(cmd, args, {stdio: 'inherit'});
  proc.on('close', function(code) {
    if (code !== 0) {
      cb(new Error('Command exited with a non-zero status'));
    } else {
      cb(null);
    }
  });
}
