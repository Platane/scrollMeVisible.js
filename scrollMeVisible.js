/**
 * @summary     scrollMeVisible
 * @description the simpliest way to set the scrollPane to make an element visible in the window viewport
 * @version     0.1
 * @author      arthur brongniart <arthur@arthur.brongniart.fr>
 * @link        https://github.com/Platane/scrollMeVisible.js
 * @license     MIT licensed
 * @copyright   Copyright 2013 arthur brongniart
 *
 */
(function($){

    // is the element a document
    var isDocument=function($el){
      return $el.get(0).toString()=="[object HTMLDocument]" || $el.children().get(0).tagName.toLowerCase() == 'html';
    };

    var scrollTo=function(el,scrollx,scrolly){
      if(el.scrollTo){
        el.scrollTo(scrollx,scrolly);
        return;
      }
      if(el.scrollLeft!=null && el.scrollTop!=null){
        el.scrollLeft=scrollx;
        el.scrollTop=scrolly;
        return;
      }
      if(el.scrollX!=null && el.scrollY!=null){
        el.scrollX=scrollx;
        el.scrollY=scrolly;
        return;
      }
      throw 'unable to scroll';
    };

    var getSroll=function(el){
        if(el.scrollLeft!=null && el.scrollTop!=null)
          return {
              x:el.scrollLeft,
              y:el.scrollTop
            };
        if(el.scrollX!=null && el.scrollY!=null)
         return {
              x:el.scrollX,
              y:el.scrollY
            };
        throw 'unable to scroll';
    };

    var requestAnimFrame=(function(callback){
      return window.requestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      window.oRequestAnimationFrame ||
      window.msRequestAnimationFrame ||
      function(callback){
        window.setTimeout(callback, 1000 / 60 );
      };
    })();

    //constants
    var margin={
      top:35,
      bottom:100,
      left:35,
      right:100,
    }

    /*
     * look for the parent of the $el, put the ones which need to be scrolled in a list
     * @param $el the element to make visible
     * @param $viewport, ignore, its for reccurssive call
     */
    scrollQueu=function($el, $viewport){

    // at first, the viewport is the parent
    $viewport=$viewport!=null?$viewport:$el.parent();

    //if body or html, do nothing
    if( $viewport.get(0).tagName && ( $viewport.get(0).tagName.toLowerCase()=='body' || $viewport.get(0).tagName.toLowerCase()=='html' ) )
      return scrollQueu($el,$viewport.parent());

    var viewportIsDocument= isDocument($viewport);

    //compute the viewport rect and the element bounding rect
    var view={    //view port relative to the parent
      top:0,left:0,bottom:0,right:0
    };


    if( viewportIsDocument ){
      view.top=   window.scrollY;
      view.left=  window.scrollX;
      view.bottom=view.top+window.innerHeight;
      view.right= view.left+window.innerWidth;
    }else{
      var o= $viewport.offset();
      view.top=  o.top;
      view.left=  o.left;
      view.bottom=view.top+$viewport.innerHeight();
      view.right= view.left+$viewport.innerWidth();
    }
    

    var rect={   //bound of the element relative to the parent
      top:0,left:0,bottom:0,right:0
    }
    var o= $el.offset();
    rect.top=o.top;
    rect.left=o.left;
    rect.bottom=rect.top+$el.outerHeight(false);
    rect.right=rect.left+$el.outerWidth(false);

    //on x axe
    var xscrollBy=0,
        yscrollBy=0;

      if( view.left > rect.left )
        xscrollBy = ( -margin.left ) - ( view.left - rect.left );
      
      if( view.right < rect.right )
        xscrollBy = ( margin.right ) - ( view.right - rect.right );
      
      if( view.left > rect.left && view.right < rect.right ){
         // the viewport is to small,
         // unable to display all the rect
         // eventully we could position the middle of the viewport on the middle of the el
         // for now just do nothing
         xscrollBy=0;
      }
    

    //on y axe
      if( view.top > rect.top )
        yscrollBy = (- margin.top ) - ( view.top - rect.top );
      
      if( view.bottom < rect.bottom )
        yscrollBy = ( margin.bottom ) - ( view.bottom - rect.bottom );
      
      if( view.top > rect.top && view.bottom < rect.bottom ){
         // see bellow
         yscrollBy=0;
      }

    // hold the object to push to the list
    // then apply the scroll 
    var obj=null;
    if( xscrollBy || yscrollBy ){
       var el=viewportIsDocument?window:$viewport.get(0);
       var s=getSroll(el);
       obj=({
        el:el,
        x:s.x+xscrollBy,
        y:s.y+yscrollBy,
       });

       // apply the scroll (if we dont, the suite of the algorithme ( bubblign to the parent ) will be false )
       scrollTo(el,obj.x,obj.y);

       // check if the element has actuality made the srcoll
       // if not, its not scrollable, so do not push it to the list
       var safter=getSroll(el);
       if( s.x==safter.x && s.y==safter.y )
          obj=null;
    }

    //reccusive call 
    var acc=null;
    if( viewportIsDocument )
      acc=[];
    else
      acc=scrollQueu($el,$viewport.parent());

    // add the object to the list
    if(obj)
      acc.push(obj);

    return acc; 
  };
  
  /*
   * memorize the state of the parents 's element scrollBar
   * is able to restore this state
   */
  var ParentScrollSave=function($el){
    this.stack=[];
    while( ($el=$el.parent()).length>0 ){
      var el=isDocument( $el ) ? window : $el.get(0);
      var s=getSroll(el);
      this.stack.push({
        el: el,
        x:s.x,
        y:s.y,
      })
    }
  };
  ParentScrollSave.prototype={
    stack:null,
    restore:function(){
      immediateScroll(this.stack);
    }
  };


  /*
   * object that contain easing function
   */
  var easeStock={
    //linear function
    linear:function(x){
      return x;
    },

    //easing in and out function
    inOut:function(x){
      return 1/( 1 + (1-x)*(1-x)/(x*x) );
    },
  };

  /*
   * scroll all the scrollbars without animation
   */
  var immediateScroll=function(q){
    var i=q.length;
    while(i--)
      scrollTo(q[i].el,q[i].x,q[i].y);
  };

  /*
   * scroll all the scrollbars at same time with a custom animation
   */
  var synchronousScroll=function(q,duration,ease,fixedSpeed,callback){
    var j=q.length;
    var merge=function(){
      if(!(--j))
        callback();
    };
    var i=q.length;
    while(i--)
     new AutoScroll(
        q[i].el ,
        q[i] ,
        duration ,
        ease ,
        fixedSpeed ,
        callback==null?null:merge );
  };

  /*
   * scroll all the scrollbars one after one with a custom animation
   */
  var queuedScroll=function(q,duration,ease,fixedSpeed,callback){
    var i=0;
    var next=function(){
        new AutoScroll(
          q[i].el ,
          q[i] ,
          duration ,
          ease ,
          fixedSpeed ,
          i++<q.length-1?next:callback);
    }
    next();
  };

  /*
   * object which request animation frame to perform a cutom animation on one scrollbar
   */
  var AutoScroll=function(el,target,duration,ease,fixedSpeed,callback){
    this.el=el;
    this.duration=duration;
    this.ease=ease;
    this._a=getSroll(el);
    this._b=target;
    this._endCallBack=callback;

    if(fixedSpeed){
      // if fixedSpeed param is on, it's the speed not the duraton of the animation that is fixed
      // assuming that the duration passing in argument is for a average distance of 500px
      // compute the velocity, set the duration according
      var speed=500/duration;
      var distance=Math.sqrt( (this._a.x-this._b.x)*(this._a.x-this._b.x) + (this._a.y-this._b.y)*(this._a.y-this._b.y) );
      this.duration=distance/speed;
    }

    this.start();
  };
  AutoScroll.prototype={

    // true if animation running, false else
    run:null,

    // the DOM element which got the scrollbar
    el:null,

    // duration of the animation
    duration:null,

    // a numeric function [0,1] -> [0,1]
    ease:null,

    // a callback trigegred at the end of the animation
    _endCallBack:null,

    // the timestamp of the last cycle call
    _lastTime:null,
    
    // {x:number , y:number } the starting state
    _a:null,

    // {x:number , y:number } the ending state
    _b:null,

    // number the avancement
    _e:null,
   
    cycle:function(){

      // compute the time spent since the last call of cycle
      var nTime=new Date().getTime();
      var delta=Math.min( 500, nTime-this._lastTime );
      this._lastTime=nTime;

      // update the avancement
      this._e=Math.min(this._e+delta/this.duration,1);

      // apply an easy function
      var t=this.ease(this._e);

      // interpolation between the start state and the ending one
      var scrollx=(1-t)*this._a.x + t*this._b.x,
          scrolly=(1-t)*this._a.y + t*this._b.y;

      // apply to the scrollbar
      scrollTo( this.el , scrollx , scrolly );
      
      //are we done scrolling this one?
      if(this._e>=1){
        // yes we are, stop the temporal loop and trigger the callback
        this.run=false;
        if( this._endCallBack )
            this._endCallBack();
      }

      // temporal loop  
      if(this.run)
        requestAnimFrame($.proxy(this.cycle,this));
    },
    start:function(){
      this.run=true;
      this._e=0;
      this._lastTime=new Date().getTime();
      this.cycle();
    },
    stop:function(){
      this.run=false;
    },
  };

  var defaultOptions={
    queu : true,
    duration : 400,
    animate : false,
    ease : 'linear',
    fixedSpeed: true,
    callback:null,
  };
  $.fn.scrollMeVisible=function( options ){
    options=options||{};
    return this.each(function(){
      var $el=$(this);

      //save the astte of the parents
      var state=new ParentScrollSave($el);

      //search the element that need to be scrolled
      // /!\ this method got side effect, that why we use a state saver
      var q=scrollQueu($el);

      //parse options
      for( var i in defaultOptions )
        if( options[i]==null )
            options[i]=defaultOptions[i];
      if( !easeStock[ options.ease ] )
        options.ease=defaultOptions.ease;


      if( !options.animate || q.length==0 ){
        // no animation, as the scrollQueu produce a side effect which set all the scrollBar at right position, we are good to go
        // trigger the callback
        if( options.callback )
            options.callback();
        return;
      }else{
        
        // as the scrollQueu produce a side effect which set all the scrollbar at right position, we need to reset it before starting the animation
        state.restore();

        var ease=easeStock[options.ease];
        if( options.queu )
          queuedScroll(q,options.duration,ease,options.fixedSpeed,options.callback);
        else
          synchronousScroll(q,options.duration,ease,options.fixedSpeed,options.callback);
      }
    });
  };

})(jQuery);



