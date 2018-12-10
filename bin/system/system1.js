/**
SURFOW V6.0.0
**/
const { remote } = require('electron');
const {BrowserWindow} = require('electron').remote;
var ipcRenderer = require('electron').ipcRenderer;
const path = require('path');

let mainWindow

ipcRenderer.on('opened-url', function (event, data) {
    jQuery('.url-exchange').val(data);
    setTimeout(function(){
        run_check();
    }, 20);
});

document.querySelector('#close').onclick = function() {
    remote.BrowserWindow.getFocusedWindow().close();
};
document.querySelector('#minimize').onclick = function() {
    remote.BrowserWindow.getFocusedWindow().minimize();
};

function run_session(data)
{
    /// main
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        minWidth: 600,
        minHeight: 400,
        titleBarStyle: 'hidden',
        acceptFirstMouse: true,
        transparent: true,
        frame: false,
        show: false
    })

    mainWindow.loadFile('bin/data2.html')

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        mainWindow.focus();
		//mainWindow.toggleDevTools();
        setTimeout(function(){
			mainWindow.webContents.send('start-data', data);
            window.close();
        }, 200);
    })

    mainWindow.on('closed', function () {
      mainWindow = null
    })

}

function ValidURL(str) {
    return /^(?:\w+:)?\/\/([^\s\.]+\.\S{2}|localhost[\:?\d]*)\S*$/.test(str);
}

function load_animation(type, error="Let's Exchange Traffic")
{
    if(type == "start")
    {
        $("#errors").parent().removeClass("uk-animation-shake");
        displayOverlay('<div uk-spinner="ratio: 0.4"></div> connecting...');
        $(".surfow-content div input").attr("disabled", true);
        $(".surfow-content div a").attr("disabled", true);
		$(".surfow-content div a").html("<span uk-icon='icon: more; ratio: 1.7'></span>");
    }
    if(type == "stop")
    {
        click_able = true;
        removeOverlay();
        $("#errors").html(error).parent().addClass("uk-animation-shake");
        $(".surfow-content div input").attr("disabled", false);
        $(".surfow-content div a").attr("disabled", false);
		$(".surfow-content div a").html("<span uk-icon='icon: bolt; ratio: 1.7'></span>");
    }
    setTimeout(function(){
        click_able = true;
    }, 30000);
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

function displayOverlay(text) {
    $("#status").html(text);
    $("#status").fadeIn(300);
}

function removeOverlay() {
    $("#status").fadeOut(300);
}

function isBase64(str) {
    try {
        return btoa(atob(str)) == str;
    } catch (err) {
        return false;
    }
}

function authorize_session(url, data, handleData = function(){})
{
    $.ajax({
		url : url,
		type: "POST",
		data: data,
		success: function(postdata, textStatus, jqXHR)
		{
			handleData(postdata);
		},
		error: function(jqXHR, textStatus, errorThrown)
		{
			handleData(jqXHR);
		}
	});
}

function main_check(key)
{
    var res = null;
    key = safeText(key.replace(/\s/g, ''));
    if(key != "")
    {
		var data_key = Session_config.strtr(key, {
			"-":"+",
			"_":"/"
		});
		var mod4 = data_key.length % 4;
        if (mod4) {
            data_key += '===='.substr(mod4);
        }
        if(isBase64(data_key))
        {
            var info = null;
            try {
                info = Session_config.decode(key);
            } catch(e) {
                res = "Something missing, try another key";
            }

            if(info != null)
            {
                if(info.protocol == "http" || info.protocol == "https")
                {
    				var call_url = safeText(info.protocol)+"://"+safeText(info.host)+safeText(info.path)+"/authorize-session";
    				var call_data = "user_id="+safeText(info.user_id)+"&session_id="+safeText(info.session_id);
                    authorize_session(call_url, call_data, function(data){
    					if(data["type"] == "success"){
    						run_session(data["data"]);
    					} else if(data["type"] == "error"){
                            load_animation("stop", safeText(data["data"].toString()));
    					} else {
                            load_animation("stop", "Invalid session key, Please try again");
    					}
    				});
                } else {
                    res = "Something missing, try another key";
                }
            } else {
                res = "invalid key, please try another session key";
            }
        } else {
            res = "Invalid session key";
        }
    } else {
        res = "Please enter the session key";
    }
    if(res != null)
    {
        load_animation("stop", res);
    }
}

var goodurltimeout;
function run_check()
{
    load_animation("start");
    clearTimeout(goodurltimeout);
    goodurltimeout = setTimeout(function(){
        var thekey = jQuery('.url-exchange').val();
        main_check(thekey);
    }, 800);
}

var click_able = true;
jQuery( document ).ready(function() {
    jQuery('.go-exchange').click(function(){
        if(click_able == true) {
            click_able = false;
            run_check();
        }
    });
    jQuery(document).keypress(function(e) {
        var keycode = (e.keyCode ? e.keyCode : e.which);
        if (keycode == '13' && click_able == true) {
            click_able = false;
            run_check();
        }
    });
});
