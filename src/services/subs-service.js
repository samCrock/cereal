(function() {
  'use strict';

  angular
  .module('app')
  .service('subsService', subsService);

  /* @ngInject */
  function subsService($q, $http, commonService) {

    let request = require('request')
    let cheerio = require('cheerio')
    let fsExtra = require('fs-extra')
    let magnet_uri = require('magnet-uri')
    let WebTorrent = require('webtorrent')
    let logUpdate = require('log-update')
    let chokidar = require('chokidar')
    let srt2vtt = require('srt2vtt')

    let subs_module = {}
    let path = __dirname + '/../../library/'

    subs_module['search'] = function search(searchObj) {
      return new Promise(function(resolve, reject) {
        let fileName = searchObj.fileName
        let show = searchObj.show
        let episode = searchObj.episode
        let searchString = encodeURIComponent(fileName)
        var url = 'http://subscene.com/subtitles/release?q=' + searchString;
        request.get(url, function(error, response, body) {
          if (error || !response) reject(error)
          if (!error && response.statusCode == 200) {
            var $ = cheerio.load(body)
            var json = []
            var counter = 0
            var subtitle_match = {
              similarity: 0,
              value: {}
            }
            var matches = []
            $('.a1').filter(function() {
              var data = $(this)
              var link = data['0'].children[1].attribs.href
              var lang = data['0'].children[1].children[1].children[0].data.trim()
              var title = data['0'].children[1].children[3].children[0].data.trim()
              var spliced_title = title.split('-')[0]
              var spliced_search = searchString.split('-')[0]
              var similarity = commonService.calculateSimilarity(fileName, spliced_title)


              // if (lang === 'English' && similarity > best_match.similarity) {
              if (lang === 'English') {
                // console.log('Subs strings similarity ->', similarity)
                // console.log(fileName, '->', spliced_title)
                subtitle_match = {
                  similarity: similarity,
                  value: {
                    link: link,
                    path: path + show + '/' + episode
                  }
                }
                matches.push(subtitle_match)
                // console.log('Found sub:', spliced_title)
              }
            })

            function compare(a, b) {
              if (a.similarity < b.similarity)
              return -1;
              if (a.similarity > b.similarity)
              return 1;
              return 0;
            }

            matches.sort(compare);
            matches = matches.slice(matches.length - 5, matches.length)
            console.log('Subs found ->', matches)
            resolve(matches)
            // resolve(best_match.value)
          } else reject(error)
        })
      })
    }

    subs_module['download'] = function download(optsArray) {
      return new Promise(function(resolve, reject) {
        if (optsArray) {

          optsArray.forEach( (opts, i) => {

            let path = decodeURIComponent(opts.value.path)
            let link = opts.value.link
            let url = 'http://subscene.com' + link

            request.get(url, function(error, response, body) {
              if (error) reject(error)
              if (!error && response.statusCode == 200) {
                let $ = cheerio.load(body)
                let dButton = $('.download')['0']
                let libraryUrl = 'http://subscene.com' + dButton.children[1].attribs.href
                let zipTitle = ''
                $('.release').filter(function() {
                  zipTitle = $(this)['0'].children[3].children[0].data.trim()
                })
                request.get(libraryUrl)
                .pipe(fsExtra.createWriteStream(path + '/' + zipTitle + '.zip'))
                .on('close', function() {
                  fsExtra.readFile(path + '/' + zipTitle + '.zip', (err, data) => {
                    if (err) throw err
                    let zip = new require('node-zip')(data, {
                      base64: false,
                      checkCRC32: true
                    })
                    let subFile = zip.files[Object.keys(zip.files)[0]]
                    let subName = zip.files[Object.keys(zip.files)[0]].name
                    fsExtra.outputFile(path + '/' + subName, subFile._data, function(err) {
                      if (err) reject('Cannot write file :', err)
                      // fsExtra.unlinkSync(path + '/' + zipTitle + '.zip')
                      console.log('Subs downloaded in:', path)
                      var res = path + '/' + subName
                      var srtData = fsExtra.readFileSync(res)
                      srt2vtt(srtData, function(err, vttData) {
                        if (err) throw new Error('Error converting subs:', err)
                        fsExtra.outputFileSync(res.substring(0, res.length - 4) + '.vtt', vttData)
                        // resolve(res)
                        if (i == optsArray.length - 1) resolve()
                      })
                    })
                  })
                })
              }
            })
          })

        } else {
          reject('No subs found')
        }
      })
    }
    return subs_module
  }
})();
