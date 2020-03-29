#!/usr/bin/env node
import commandLineArgs from 'command-line-args';
import commandLineUsage from 'command-line-usage';

const commandOptions = commandLineArgs([
  { name: 'command', defaultOption: true, multiple: true },
  { name: 'verbose', alias: 'v', type: Boolean, defaultValue: false },
  { name: 'magnetlink', alias: 'm', group: ['magnet', 'get'] },
]);
// const [, , ...args] = process.argv;
console.log(commandOptions);
