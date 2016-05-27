Cereal
===========

Automagically download your daily tv-series

---

This basic implementation just downloads torrents matching the titles specified in following.json with today's tv calendar

## Install
```
$ npm install
```

## Start
```
$ npm run start [x]
```
x => Optional integer setting the day to search (default = yesterday)

### Example   
```
$ node main.js 2
```
Look for shows aired 2 days ago


## Single episode download
```
$ npm run download [serie] [episode]
```
### Example   
```
$ node run download "Silicon Valley" "s03e01"
```

