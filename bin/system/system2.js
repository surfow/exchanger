/**
SURFOW V6.0.0
**/
const { remote } = require('electron');
const webview = document.querySelector('webview');
const {BrowserWindow} = require('electron').remote;
var ipcRenderer = require('electron').ipcRenderer;
const {session} = require('electron').remote;
const ses = session.fromPartition('persist:exchange');
const path = require('path');
let CloseWindow
let StartWindow
var session_data = null;
var current_browse_key = false;
var current_session_points = 0;
var first_start = true;

function clearCookies()
{
	ses.clearStorageData([], (data) => {});
}

// Get session informations from the first window
ipcRenderer.on('start-data', function (event, data) {
    session_data = data;
});

document.querySelector('#close').onclick = function() {
    // close session before closing window
    $("#loading_area").fadeIn(300);
    close_session(session_data);
};
document.querySelector('#restore').onclick = function() {
    // restore window
    remote.BrowserWindow.getFocusedWindow().setSize(800, 600);
};
document.querySelector('#minimize').onclick = function() {
    //minimize window
    remote.BrowserWindow.getFocusedWindow().minimize();
};
document.querySelector('#maximize').onclick = function() {
    // Maximize window
    remote.BrowserWindow.getFocusedWindow().maximize();
};

// call the close window to report closing before leaving this app
function close_session(close_data)
{
    /// main
    CloseWindow = new BrowserWindow({
        width: 400,
        height: 180,
        titleBarStyle: 'hidden',
        acceptFirstMouse: true,
        transparent: true,
        frame: false,
		show: false,
	    webPreferences: {
		  preload: path.join(__dirname, 'data5')
	    }
    })

    CloseWindow.loadFile('bin/data4.html')

    CloseWindow.setResizable(false);
    CloseWindow.setMaximizable(false);

    CloseWindow.once('ready-to-show', () => {
		CloseWindow.show();
		CloseWindow.focus();
		setTimeout(function(){
			CloseWindow.webContents.send('session-data', close_data);
            window.close();
        }, 50);
    })

    CloseWindow.on('closed', function () {
      CloseWindow = null
    })

}

// call the close window to report closing before leaving this app
function back_to_login()
{
    // Create the browser window.
   StartWindow = new BrowserWindow({
        width: 500,
        height: 260,
        titleBarStyle: 'hidden',
        acceptFirstMouse: true,
        transparent: true,
        frame: false,
        show: false
    })

    StartWindow.loadFile('bin/data1.html');

    StartWindow.setResizable(false);
    StartWindow.setMaximizable(false);

    StartWindow.once('ready-to-show', () => {
        StartWindow.show();
        StartWindow.focus();
        setTimeout(function(){
            window.close();
        }, 50);
    })

    StartWindow.on('closed', function () {
      StartWindow = null
    })

}

// remove the padding and the broder redius on maximize
jQuery(window).bind('resize', function() {
    if(Math.floor(screen.width - jQuery(window).width()) <= 100)
    {
        //jQuery('body').addClass("maxwork");
        jQuery('html').css({"background":"rgba(102, 117, 205, 1)"});
    } else {
        //jQuery('body').removeClass("maxwork");
        jQuery('html').css({"background":"transparent"});
    }
    if(screen.width == jQuery(window).width())
    {
        jQuery('#maximize').hide();
        jQuery('#restore').show();
    } else {
        jQuery('#maximize').show();
        jQuery('#restore').hide();
    }
});

// show status
function displayOverlay(text) {
    $("#status").html(text);
    $("#status").fadeIn(300);
}

// hide status
function removeOverlay() {
    $("#status").fadeOut(300);
}

const loadstart = () => {
    // show loading
    displayOverlay('<div uk-spinner="ratio: 0.4"></div> Loading...');
}

const loadstop = () => {
    // hide loading
    removeOverlay();
}

function strip_tags(html, allowed_tags){
	html = html+"";
	allowed_tags = allowed_tags+"";
    allowed_tags = allowed_tags.trim()

    if (allowed_tags) {
        allowed_tags = allowed_tags.split(/\s+/).map(function(tag){ return "/?" + tag });
        allowed_tags = "(?!" + allowed_tags.join("|") + ")";
    }

    return html.replace(new RegExp("(<" + allowed_tags + ".*?>)", "gi"), "");
}

function htmlEntities(str) {
	str = str+"";
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function safeText(text)
{
    return htmlEntities(strip_tags(text, ""));
}


// rand function similar to rand rand() in php
function rand(min, max){
    if(min == 0){
        return Math.floor((Math.random() * max) + 0);
    }else{
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}

var progressinterval;

function prs_seconds(seconds, pings)
{
	var prs_seconds = Math.floor(seconds - pings);
	if(prs_seconds > 0){
		return prs_seconds;
	} else {
		return 0;
	}
}
// handle the progress
function run_progress(seconds)
{
    $("#progress").stop();
    $("#progress").css({"width": ""});
    $('#progress').animate(
        {
            width:'100%'
        },
        {
            duration: Math.floor(seconds*1000)+2000,
            step: function(now, fx) {
                //
            }
        }
    );
    var pings = 0;
    progressinterval = setInterval(function(){
        $('#percenprogress').html( prs_seconds(seconds, pings) + 's');
        if(pings >= seconds)
        {
            clearInterval(progressinterval);
        }
        pings++;
    }, 1000);
}

var reconnect;
// call session
function call_browsing(key, handleData = function(){}, fail = function(){})
{
    $.ajax({
		url : safeText(session_data.exchange_url),
		type: "POST",
        data: "session_key="+safeText(session_data.session_key)+"&browse_key="+safeText(key),
		success: function(browsing_data, textStatus, jqXHR)
		{
            if(browsing_data["type"] == "success")
            {
                handleData(browsing_data["data"]);
            } else {
                kill_browsing(safeText(browsing_data["data"]));
            }
		},
		error: function(jqXHR, textStatus, errorThrown)
		{
			fail(jqXHR);
		}
	});
}

// report bad urls
function report_url(handleData = function(){})
{
    if(current_browse_key)
    {
        $.ajax({
    		url : safeText(session_data.report_url),
    		type: "POST",
    		data: "session_key="+safeText(session_data.session_key)+"&browse_key="+safeText(current_browse_key),
    		success: function(report_data, textStatus, jqXHR)
    		{
    			handleData(true);
    		},
            error: function(error)
            {
                handleData(false);
            }
    	});
    } else {
        handleData(false);
    }
}

// report online
function report_online(handleData = function(){})
{
    $.ajax({
		url : safeText(session_data.ping_url),
		type: "POST",
		data: "session_key="+safeText(session_data.session_key)+"&browse_key="+safeText(current_browse_key),
		success: function(report_info, textStatus, jqXHR)
		{
			handleData(report_info);
		}
	});
}

var browsing_timeout;
function run_browsing(key)
{
    // disable report button
    $("#report").addClass("disable_area");

	// clear old data
	clearCookies();
	webview.setAttribute( 'httpreferrer', "");
    webview.setAttribute( 'useragent', "");

    try{
        // call session
        call_browsing(key, function(info){

			// set first start to false
			first_start = false;

            // update buttons
            trigger_exchange_btn("pause");

            // enable report button
            $("#report").removeClass("disable_area");

            // update url
            update_url(info["url"]);

            // set the next browsing
            var timeout = Math.floor(Math.floor(Math.floor(info["seconds"])*1000) + 2000);
            browsing_timeout = setTimeout(function(){
                $('.earning').hide().html("+"+safeText(info["earning"])).fadeIn(400);
                setTimeout(function(){
                    $('.earning').fadeOut(400).html("");
                }, 3000);
                run_browsing(safeText(info["key"]));
            }, timeout);

            // Start the current browsing
            setTimeout( function() {

                // set current browse key
                current_browse_key = safeText(info["key"]);

                // add visit
                current_session_points++;

                // start progress
                run_progress(Math.floor(safeText(info["seconds"])));

                // update views
                $('.put_points').html(safeText(info["points"]));
                $('.put_session_points').html(current_session_points);
                $('.surfow-loading a div center svg').css({"opacity": "1"});
                $('.load_speed').attr({"dur":"0.6s"});

                // stop previous webview
                webview.stop();

                // set referrer
                webview.setAttribute( 'httpreferrer', safeText(info["source"]));

                // set useragent
                webview.setAttribute( 'useragent', safeText(info["useragent"]));

                // Report online website
                report_online(function(data){ /*callback*/ });

                // change url in webview
                setTimeout(function(){
                    webview.setAttribute( 'src', safeText(info["browsing_url"]));
                }, 50);

            }, 20);
        }, function(data){
			if(first_start == true)
			{
				kill_browsing("Error connect, please try again");
			} else {
				$(".surfow-address span").html("reconnecting after 3 seconds...");
				reconnect = setTimeout(function(){
					clearTimeout(reconnect);
					$(".surfow-address span").html("reconnecting...");
					run_browsing(key);
				}, 3000);
			}
		});
    }
    catch(error)
    {
        // stop browsing if anything goes wrong
        kill_browsing("Error connect, please try again");
    }
}

function ValidURL(str) {
    // return url validation : true or false
    return /^(?:\w+:)?\/\/([^\s\.]+\.\S{2}|localhost[\:?\d]*)\S*$/.test(str);
}

function update_url(url)
{
    if(ValidURL(url))
    {
        if (url.indexOf("https") != -1) {
            $(".surfow-address span").html(url.replace("https", "<span class='ssl'>https</span>"));
            $(".surfow-secure .lock").fadeIn(300).find("svg").css({"margin-top":"4px"});
        } else {
            $(".surfow-address span").html(url);
            $(".surfow-secure .unlock").fadeIn(300);
        }
        return true;
    } else {
        return false;
    }
}

function kill_browsing(text="Home")
{
	first_start = true;
    $('.earning').fadeOut(400).html("");
    trigger_exchange_btn("wait");
    clearTimeout(browsing_timeout);
    clearInterval(progressinterval);
	clearTimeout(reconnect);
    $("#progress").stop();
    $("#progress").css({"width": ""});
    $('#percenprogress').html("0s");
    $("#report").addClass("disable_area");
    $(".surfow-address span").html(text);
    $('.surfow-loading a div center svg').css({"opacity": "0.2"});
    $('.load_speed').attr({"dur":"2s"});
    setTimeout(function(){
        trigger_exchange_btn("play");
    }, 2000);
    webview.clearHistory();
    webview.stop();
    webview.setAttribute( 'httpreferrer', "http://surfow.info/");
    webview.setAttribute( 'useragent', "");
    webview.setAttribute( 'src', "data3.html");
}

function trigger_exchange_btn(btn)
{
    if(btn == "play")
    {
        setTimeout(function(){
            $('#pause').hide(); $('#wait').hide(); $('#play').fadeIn(200);
        }, 50);
    }

    if(btn == "pause"){
        setTimeout(function(){
            $('#play').hide(); $('#wait').hide(); $('#pause').fadeIn(200);
        }, 50);
    }

    if(btn == "wait"){
        setTimeout(function(){
            $('#pause').hide(); $('#play').hide(); $('#wait').fadeIn(200);
        }, 50);
    }
}

function when_its_ready()
{
    //adding information to the view
    setInterval(function(){
        if(navigator.onLine){
            $("#internet").html("ONLINE");
        } else {
            $("#internet").html("OFFLINE");
        }
    }, 1000);

    $('.put_domain').html(safeText(session_data.domain));
    $('.put_points').html(safeText(session_data.points));
    $('.put_session_points').html("0");
    $('.put_username').html(safeText(session_data.username));

    webview.setAudioMuted(true);

    // web view events
    webview.addEventListener('dom-ready', () => {
        webview.executeJavaScript(
            'setInterval(function(){document.hasFocus=function(){return!0},window.onfocus=null,window.onblur=null,document.onvisibilitychange=null,Object.defineProperty(document,"hidden",{value:!1}),Object.defineProperty(document,"visibilityState",{value:"visible"}),Object.defineProperty(document,"webkitVisibilityState",{value:"visible"})},1e3);'+
            ''
            , true);
    });
    webview.addEventListener('did-start-loading', loadstart);
    webview.addEventListener('did-stop-loading', loadstop);

    jQuery(window).focus(function(){
        webview.focus();
    });
    jQuery(window).click(function(){
        webview.focus();
    });

    // listen on click start browsing
    jQuery('#play').click(function(){
        trigger_exchange_btn("wait");
        $('.surfow-loading a div center svg').css({"opacity": "0.6"});
        run_browsing(safeText(session_data.session_key));
    });

    // listen on pause button
    jQuery('#pause').click(function(){
        kill_browsing();
    });

    // listen on report button
    jQuery('#report').click(function(){
        $("#report").addClass("disable_area");
        report_url(function(status){});
    });

    // listen on mute checkbox
    jQuery('#mute').change(function(){
        if($(this).is(':checked'))
        {
            webview.setAudioMuted(true);
        } else {
            webview.setAudioMuted(false);
        }
    });
}

jQuery( document ).ready(function() {
    var wait_for_settings;
    var tries = 0;
    wait_for_settings = setInterval(function(){
        tries++;
        if(session_data != null)
        {
            clearInterval(wait_for_settings);
            $("#loading_area").fadeOut(300);
            when_its_ready();

        } else if(tries >= 20) {
            clearInterval(wait_for_settings);
            back_to_login();
        }
    }, 500);
});
