## scrollMeVisible.js

### Usage

  As I work on a web app project, I came to a point that I want to highlight some DOM element. Unfortunately those were lost in a nasty composition of scroll pane, therefore they weren't visible in the browser window viewport. I thought I need to do something for them.

  That's why I wrote this plugin, it allow to show an element regardless of where it is on the DOM stream. See how it's work :

` $('#myId').scrollMeVisible( <options> ); `

Pretty simple. options are implemented, mainly for scrolling with fancies animations.

```

var options={
    animate    : true,                                              // false set the scrollbar immediatly
    duration   : 400 ,                                              // duration of the animation, in ms
    ease       : 'linear',                                          // easing function, support linear and inOut
    queue      : false,                                             // if true, scrollbars are animated one after one, instead of all in the same time
    fixedSpeed : false,                                             // if true, it's the speed of animation (px/s) which is fixed, instead of the duration. In that case the speed is given by ( 500px / duration )
    callback   : function(){   alert('end of animation'); }         // a function called at the end of the animation
};

```

It works well for me, though I can not assume It work well in cases. Feel free to contribute by reporting the issues you got.

### Exemples

  Feel the power of scrollMeVisible on that [page](http://platane.github.com/scrollMeVisible.js)
  


