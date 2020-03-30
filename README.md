# SDK for Alldebrid :rocket:

This library was built to interact with alldebrid, either globaly using the command line, or in a new project as a dependency.

Enjoy ! :heart:

# `Install globally`

Install the package globally using npm
```
npm i -g alldebrid
alldebrid set config -a agent -k apikey
alldebrid get torrents
```
Or you can just use it without installing it using the `npx` command;

Check out the [package api](./doc/global.md) for global use.

# `Install locally`

Install the package locally using npm
```
npm i alldebrid
```
then you can use it anywhere in your code
```js
const Alldebrid = require('alldebrid');
const alldebrid = new Alldebrid(agent, apikey);
alldebrid.getTorrentList().then(torrents=>...);
```
Check out the [package api](./doc/local.md) for local use.
