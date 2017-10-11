(function() {
    'use strict';
    window.addEventListener('resize', function(event) {
        calculateLayout()
    });

    function calculateLayout() {
        var rem = window.getComputedStyle(document.body).getPropertyValue('font-size')
        var width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth
        var remPx = rem.substring(0, 2)
        var poster_w = remPx * 12 // 12 = poster width
        var poster_h = remPx * 17 // 12 = poster height
        var columns = Math.floor(width / poster_w)

        // console.log('')
        // console.log('screen_w       :', width)
        // console.log('rem            :', remPx)
        // console.log('poster_w       :', poster_w)
        // console.log('poster_h       :', poster_h)
        // console.log('columns        :', columns)


        sessionStorage.setItem('LAYOUT_CONFIG', JSON.stringify({
            'screen_w': width,
            'rem': remPx,
            'poster_w': poster_w,
            'poster_h': poster_h,
            'columns': columns
        }))
    }

    calculateLayout()


    var last_known_scroll_position = 0;
    var last_known_tab_scroll_position = 0;
    var ticking = false;

    function doSomething(scroll_pos, wrapper_pos) {
        // do something with the scroll position
        // console.log('window', scroll_pos, 'tab', wrapper_pos)
    }

    function isHidden(el) {
        // console.log('isHidden:', el.offsetParent === null)
        return (el.offsetParent === null)
    }

    // window.addEventListener('scroll', function(e) {
    //     last_known_scroll_position = window.scrollY
    //     let tabs = document.getElementsByTagName('md-tab-content')
    //     if (tabs) {
    //         for (var i = 0; i < tabs.length; i++) {
    //             if (!isHidden(tabs[i])) {
    //                 last_known_tab_scroll_position = tabs[i].scrollTop
    //                 console.log('tabs[i].scrollTop', tabs[i].scrollTop)
    //             }
    //         }
    //     }
    //     if (!ticking) {
    //         window.requestAnimationFrame(function() {
    //             doSomething(last_known_scroll_position, last_known_tab_scroll_position)
    //             ticking = false
    //         })
    //     }
    //     ticking = true
    // })

    // window.addEventListener('scroll', function(e) {
    //     last_known_scroll_position = window.scrollY
    //     let tabs = document.getElementsByTagName('md-tab-content')
    //     if (tabs) {
    //         for (var i = 0; i < tabs.length; i++) {
    //             if (!isHidden(tabs[i])) {
    //             var tab = tabs[i]
    //                 tab.addEventListener('scroll', function(e) {
    //                     // console.log('tab', tab)
    //                     last_known_tab_scroll_position = e.target.scrollTop
    //                     if (!ticking) {
    //                         window.requestAnimationFrame(function() {
    //                             doSomething(last_known_scroll_position, last_known_tab_scroll_position)
    //                             ticking = false
    //                         })
    //                     }
    //                 })
    //             }
    //         }
    //     }
    //     if (!ticking) {
    //         window.requestAnimationFrame(function() {
    //             doSomething(last_known_scroll_position, last_known_tab_scroll_position)
    //             ticking = false
    //         })
    //     }
    //     ticking = true
    // })




})();
