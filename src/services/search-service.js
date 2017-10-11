(function() {
  'use strict';

  angular
  .module('app')
  .service('searchService', searchService);

  /* @ngInject */
  function searchService() {

    let request = require('request')
    let cheerio = require('cheerio')
    let Promise = require('bluebird')

    let search_module = {}

    search_module['show'] = function show(searchString) {

      return new Promise((resolve, reject) => {

        // let dashedShowName = commonService.spacedToDashed(searchString)

        var url = 'https://trakt.tv/search/shows?query=' + encodeURIComponent(searchString)

        console.log(url)

        request.get(url, function(error, response, body) {

          if (error || !response) return reject(error)

          console.log(response.statusCode)

          if (!error && response.statusCode == 200) {
            let $ = cheerio.load(body)
            let items = $('.grid-item')
            // console.log('items', items)
            let showObj = {}
            let results = []
            items.filter((i) => {
              if (i < 10) {
                let dashedTitle, title, poster, show_url
                if (items[i].attribs) show_url = items[i].attribs['data-url']
                if (items[i].children[1].children[0]) poster = items[i].children[1].children[0].children[1].attribs['data-original']
                if (show_url) {
                  dashedTitle = show_url.split('/')[2]
                  var result = {
                    dashedTitle: dashedTitle,
                    poster: poster,
                    url: 'https://trakt.tv' + show_url
                  }
                  if (result.poster.indexOf('placeholder') === -1) results.push(result)
                }

              }
            })
            resolve(results)
          } else reject()
        });
      });

    }

    return search_module;
  }
})();
