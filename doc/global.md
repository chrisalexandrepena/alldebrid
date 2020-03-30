# API Documentation for global use

# `Table of contents`

- [Config](#config)
- [Torrents](#torrents)
- [Magnets](#magnets)
- [Links](#links)

# `Config`
## Setting the config
Before using the ci you need to add your [previously generated](https://alldebrid.com/apikeys/) API credentials:
- An app `agent`
- An app `api key`
```
alldebrid set config -a agent -k apikey
```

## Getting and resetting the config
At any time you can display or reset the current config:
```sh
alldebrid get config
alldebrid reset config
```

# `Torrents`
## Fetching available torrent links
You can fetch available torrent links using
```sh
alldebrid get torrents
```
this command may take two flags:
- `--regex` which allows you to only query torrents with matching names (_ex: /torrent name/gi_)
- `--status` which can be one of the following:
  - 'Ready'
  - 'Downloading'
  - 'Removed from hoster website'
  - 'Upload fail'
  - 'Not downloaded in 20 min'

adding no flags will just query all torrents.

## Fetching individual torrents
If you know the id of the torrent you want to fetch you may use it to query its status:
```sh
alldebrid get torrent --id 123456
```

## Deleting torrents
If you know the id of the torrents you want to delete you may use them:
```sh
alldebrid delete torrent --id 123456
alldebrid delete torrents --id 123456 789101
```

# `Magnets`

## Uploading magnet links
You can upload magnet links using
```sh
alldebrid upload magnet -l $magnetLink1
alldebrid upload magnets -l $magnetLink1 $magnetLink2
```

# `Links`

## Unlocking links
You can unlock links from compatible websites using
```sh
alldebrid debrid link -l $link -p $password
alldebrid debrid links -l $link1 $link2 -p $password
```
You may specify a password using the optional `-p` flag (supported on uptobox / 1fichier).