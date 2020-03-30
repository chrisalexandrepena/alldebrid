# API Documentation for global use

# `Table of contents`

- [Config](#config)
- [Torrents](#torrents)
- [Magnets](#magnets)
- [Links](#Links)

# `Config`
## Setting the config
The package needs alldebrid [previously generated](https://alldebrid.com/apikeys/) API credentials:
- An app `agent`
- An app `api key`
They can be added either from the beginning:
```js
const alldebrid = new Alldebrid(agent, apikey);
```
or later
```js
alldebrid.setConfig(agent, apikey);
```

## Getting the config
At any time you can query the current config:
```js
alldebrid.config
```

# `Torrents`
## Fetching available torrent links
You can fetch available torrent links using
```js
alldebrid.getTorrentList().then(torrents=>...)
```
this command may take an optionnal `filter` argument:
```js
alldebrid.getTorrentList({regex, status}).then(torrents=>...)
```
- `regex` must be of type `string` and allows you to only query torrents with matching names (_ex: /torrent name/gi_)
- `status`, an `Array` of `strings` which can be one of the following:
  - 'ready'
  - 'downloading'
  - 'removed'
  - 'upload_failed'
  - 'download_failed'

adding no filters will just query all torrents.

## Fetching individual torrents
If you know the id of the torrent you want to fetch you may use it to query its status:
```js
alldebrid.getTorrent(123456).then(torrent=>...)
```

## Deleting torrents
If you know the id of the torrents you want to delete you may use them:
```js
alldebrid.deleteTorrents([123456, 789101]).then(()=>...)
```

# `Magnets`

## Uploading magnet links
You can upload magnet links using
```js
alldebrid.uploadMagnets([magnetLink1, magnetLink2])
```

# `Links`

## Unlocking links
You can unlock links from compatible websites using
```js
alldebrid.debridLink(link, password)
alldebrid.debridLinks([link1, link2], password)
```
You may specify an optional `password` (supported on uptobox / 1fichier).