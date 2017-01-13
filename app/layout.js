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


    	sessionStorage.setItem('LAYOUT_CONFIG', {
    		'screen_w' : width,
    		'rem'      : remPx,
    		'poster_w' : poster_w,
    		'poster_h' : poster_h,
    		'columns'  : columns
    	})
    }

    calculateLayout()

})();
