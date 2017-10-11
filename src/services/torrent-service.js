(function() {
  'use strict';

  angular
  .module('app')
  .service('torrentService', torrentService);

  /* @ngInject */
  function torrentService(wtService, commonService, jsonService, subsService, dbService, $rootScope, $timeout) {


    const os = require('os')
    let util = require('util')
    let exec = require('child_process').exec
    let platform = os.platform()

    let chalk = require('chalk')
    let request = require('request')
    let cheerio = require('cheerio')
    let fsExtra = require('fs-extra')
    let logUpdate = require('log-update')
    let chokidar = require('chokidar')
    let magnetUri = require('magnet-uri')

    let torrent_module = {}
    let path = __dirname + '/../../library/'
    let watcher = chokidar.watch(path)
    const wt_client = wtService.client()

    torrent_module['getCurrents'] = function getCurrents() {
      return wt_client.torrents
    }

    let downloadTorrent = torrent_module['downloadTorrent'] = function downloadTorrent(t) {
      return new Promise(function(resolve, reject) {

        if (!t) { reject(404) }

        t.poster = './assets/posters/' + commonService.spacedToDashed(t.show) + '.jpg'

        fsExtra.mkdirp(path, function(err) {

          if (err) return console.error(err)

          // *********************** ADD ***********************
          wt_client.add(t.magnet, {
            path: path + t.show + '/' + t.episode
          }, function(torrent) {
            t.path = path + t.show + '/' + t.episode
            torrent.id = t.id

            $rootScope.$broadcast('downloading', {
              show: t.show,
              episode: t.episode
            })

            if (torrent.progress != 1) {
              torrent.files.forEach(function(file) {
                console.log('Started downloading ' + file.name)
              })
            }
            // *********************** ON DONE ***********************
            torrent.on('done', () => {
              console.log(torrent.dn, ' ready!')

              // Search for subs
              subsService.search({
                fileName: torrent.dn,
                show: t.show,
                episode: t.episode
              })
              .then((opts) => {
                subsService.download(opts)
                .then(() => {
                  dbService.fetchShows().then((library) => {})
                })
              })
              .catch(() => {
                console.log('No subs found')
                dbService.fetchShows().then((library) => {})
              })

              t.ready = true
              delete t['download_info']

              wt_client.remove(t.magnet)
              let recent = localStorage.getItem('recent')
              if (recent) {
                recent = JSON.parse(recent)
              } else {
                recent = []
              }
              recent.push(t)
              localStorage.setItem('recent', JSON.stringify(recent))
              resolve(torrent.name)
              $rootScope.$apply()

              // // Update pending downloads
              $rootScope.$emit('episode_downloaded', t)
            })

            // *********************** ON DOWNLOAD ***********************
            let first = true
            torrent.on('download', (chunkSize) => {
              var output = [
                chalk.cyan(''),
                chalk.cyan('=================='),
                chalk.dim('              Name : ') + torrent.name,
                chalk.dim('        Downloaded : ') + commonService.formatBytes(torrent.downloaded),
                chalk.dim('             Speed : ') + commonService.formatBytes(torrent.downloadSpeed) + '/s',
                chalk.dim('          Progress : ') + Math.floor(torrent.progress * 100),
                chalk.dim('               Eta : ') + commonService.formatTime(torrent.timeRemaining),
                chalk.cyan('==================')
              ]

              logUpdate(output.join('\n'))

              // Update pending in rootScope
              $rootScope.pending.filter((pending) => {
                if (pending.name === torrent.name) {
                  first = false
                  pending.eta_label = commonService.formatTime(torrent.timeRemaining),
                  pending.eta = torrent.timeRemaining,
                  pending.progress = Math.floor(torrent.progress * 100)
                  pending.speed = commonService.formatBytes(torrent.downloadSpeed) + '/s'
                }
              })
              if (first) {
                $rootScope.pending.push({
                  show: t.show,
                  episode: t.episode,
                  name: torrent.name,
                  path: t.path,
                  magnet: t.magnet,
                })
              }

            })

          })


        })
      })
    }


    // Search order:
    // PIRATEBAY
    // KICKASS
    // EZTV
    let searchTorrent = torrent_module['searchTorrent'] = function searchTorrent(searchObj) {
      return new Promise(function(resolve, reject) {
        var show = searchObj.show
        var episode = searchObj.episode
        if (searchObj.date) episode = searchObj.date.split('T')[0].replace(/-/g, '.')
        console.log(show, episode)
        // Clear search string from year
        var match = show.match(/(200[0-9]|201[0-9])/)
        if (match) {
          show = show.substring(0, match['index'])
          console.log('Cleared show string:', show)
          searchObj.clearedShow = show
        }
        searchTorrent_pirateBay(searchObj)
        .then((torrent) => {
          resolve(torrent)
        })
        .catch(() => {
          if ($rootScope.CONFIG.engines === 1) reject()
          searchTorrent_kickass(searchObj)
          .then((torrent) => {
            resolve(torrent)
          })
          .catch(() => {
            if ($rootScope.CONFIG.engines === 2) reject()
            searchTorrent_eztv(searchObj)
            .then((torrent) => {
              resolve(torrent)
            })
            .catch(() => {
              reject()
            })
          })
        })
      })
    }

    // // KICKASS
    let searchTorrent_kickass = torrent_module['searchTorrent_kickass'] = function searchTorrent_kickass(searchObj) {
      return new Promise(function(resolve, reject) {

        var show = searchObj.show
        if (searchObj.clearedShow) {
          searchObj.clearedShow = searchObj.clearedShow.split('.').join('')
          show = searchObj.clearedShow
        }

        show = show.split('.').join('')

        var episode = searchObj.episode
        var searchString = show + ' ' + episode
        console.log('Searching Kickass for: ' + searchString)

        searchString = encodeURIComponent(searchString)

        var url = 'https://kickass.soy/search.php?q=' + searchString + '/?field=seeders&sorder=desc'
        console.log(url)

        request.get(url, function(error, response, body) {

          if (error || !response) return reject(error)

          console.log('[', response.statusCode, ']')

          if (!error && response.statusCode === 200) {

            var torrent = 0

            var $ = cheerio.load(body)
            var data = $('#torrent_latest_torrents')

            if (!data) reject('Offline')

            data = data[3]
            // console.log('data', data)

            if (data && data.children) {
              torrent = {}
              torrent.show = commonService.capitalCase(show)
              if (searchObj.clearedShow) torrent.show = commonService.capitalCase(searchObj.show)
              torrent.episode = episode

              if (data) {
                console.log('TORRENT DATA', data)
                if (data.children[1].children[3]) torrent.name = data.children[1].children[3].children[5].children[1].children[0].data
                if (data.children[1].children[1]) torrent.magnet = data.children[1].children[1].children[5].attribs.href
                if (data.children[3]) torrent.size = data.children[3].children[0].data
                if (data.children[7]) torrent.seeds = data.children[7].children[0].data

                if (torrent.magnet.indexOf('php?url=')) {
                  torrent.magnet = decodeURIComponent(torrent.magnet.split('php?url=')[1])
                }
                console.log('Kickass Search result ->', torrent)
                resolve(torrent)
              } else {
                console.log('No results')
                reject()
              }
            } else {
              console.log('No results')
              reject()
            }

          } else {
            console.log('Kickass is offline')
            reject()
          }
        })
      })
    }


    //EZTV
    let searchTorrent_eztv = torrent_module['searchTorrent_eztv'] = function searchTorrent_eztv(searchObj) {
      return new Promise(function(resolve, reject) {
        var show = searchObj.show
        show = show.split('.').join('')

        var episode = searchObj.episode
        var searchString = show + ' ' + episode
        console.log('Searching eztv for: ' + searchString)

        searchString = encodeURIComponent(searchString)

        var url = 'https://eztv.ag/search/' + searchString
        console.log(url)

        request.get(url, function(error, response, body) {

          if (error || !response) return reject(error)

          console.log('[', response.statusCode, ']')

          if (!error && response.statusCode === 200) {

            var torrent = 0

            var $ = cheerio.load(body)
            var data = $('.forum_header_border')

            data = data[3]
            // console.log('data', data)

            if (data.children) {
              torrent = {}
              torrent.show = commonService.capitalCase(show)
              torrent.episode = episode
              torrent.name = data.children[3].children[1].children[0].data
              torrent.magnet = data.children[5].children[1].attribs.href
              torrent.size = data.children[7].children[0].data
              if (data.children[11].children[0].data) torrent.seeds = data.children[11].children[0].data
              if (!data.children[11].children[0].data) torrent.seeds = data.children[11].children[0].children[0].data

              if (commonService.areMatching(show, torrent.name)) {
                console.log('EZTV Search result ->', torrent)
                resolve(torrent)
              } else {
                reject('No matching torrent found')
              }
            } else {
              reject('No results')
            }

          } else reject(parseInt(response.statusCode))
        })
      })
    }


    // //PIRATEBAY
    let searchTorrent_pirateBay = torrent_module['searchTorrent_pirateBay'] = function searchTorrent_pirateBay(searchObj) {
      return new Promise(function(resolve, reject) {
        var show = searchObj.show
        show = show.split('.').join('')

        var episode = searchObj.episode
        var searchString = show + ' ' + episode
        console.log('Searching PB for: ' + searchString)

        searchString = encodeURIComponent(searchString)

        // var url = 'https://thepiratebay.org/search/' + searchString + '/0/99/0'
        // var url = 'https://fastpiratebay.co.uk/s/?q=' + searchString + '&page=0&orderby=99'
        var url = 'https://tpb.tw/s/?q=' + searchString + '&page=0&orderby=99'


        console.log(url)

        request.get(url, function(error, response, body) {

          if (error || !response) return reject(error)

          console.log('[', response.statusCode, ']')

          if (!error && response.statusCode === 200) {
            var $ = cheerio.load(body)
            var data = $('#searchResult')
            // console.log(data[''0    ])
            // console.log('*************************')
            // console.log('NAME', data['0'].children[3].children[3].children[1].children[1].children[0].data)
            // console.log('MAGNET->', data['0'].children[3].children[3].children[3].attribs.href)
            // console.log('SEEDS', data['0'].children[3].children[5].children[0].data)
            // console.log('', data['0'].children[3])
            // console.log('*************************')
            var torrent = {}
            if (!data) reject('Offline')

            if (data['0']) {
              var magnetURL = data[0].children[1].children[0].children[2].children[3] ? 'https://tpb.tw' + data[0].children[1].children[0].children[2].children[3].attribs.href : ''
              torrent.show = commonService.capitalCase(show)
              torrent.episode = episode
              torrent.name = data['0'].children[1].children[0].children[2].children[1].children[1].children[0].data

              console.log(magnetURL);
              request.get(magnetURL, function(error, response, body) {

                console.log('   response', response)
                if (error || !response) reject(error)
                console.log('[', response.statusCode, ']')

                if (!error && response.statusCode === 200) {
                  var $ = cheerio.load(body)

                  var magnet = $('.download')
                  var details = $('#details')


                  torrent.magnet = magnet['0'].children[1].attribs.href
                  var size = details['0'].children[1].children[10].children[0].data
                  size = size.split('(')
                  torrent.size = size[0].trim()
                  torrent.seeds = details['0'].children[2].children[10].children[0].data

                  console.log('torrent ->', torrent)

                  // if (commonService.areMatching(show, torrent.name)) {
                    console.log('PB Search result ->', torrent)
                    resolve(torrent)
                  // } else {
                    // reject('No matching torrent found')
                  // }
                } else {
                  console.log('No results')
                  reject('No results')
                }
              })
            } else {
              console.log('No results')
              reject('No results')
            }
          } else resolve(parseInt(response.statusCode))
        })
      })
    }

    torrent_module['streamEpisode'] = function streamEpisode(searchObj, $rootScope) {
      $rootScope.msg = 'Searching for' + ' ' + searchObj.show + ' ' + searchObj.episode
      return new Promise(function(resolve, reject) {
        searchTorrent(searchObj)
        .then(function(t) {
          // console.log('streamEpisode search result ->', t)
          if (t.name) {
            $rootScope.msg = 'Loading \n' + t.name
            $rootScope.$apply()
            switch (process.platform) {
              case 'darwin':
              resolve(exec('webtorrent download "' + t.magnet + '" --vlc'))
              break
              case 'win32':
              resolve(shell.openExternal('webtorrent download "' + t.magnet + '" --vlc'))
              break
              case 'win64':
              resolve(shell.openExternal('webtorrent download "' + t.magnet + '" --vlc'))
              break
              default:
              resolve(exec('webtorrent download "' + t.magnet + '" --vlc'))
              break
            }
          } else {
            $rootScope.msg = 'This episode in not available'
            $rootScope.$apply()
            reject($rootScope.msg)
          }
        })
      })
    }

    return torrent_module

  }
})();
