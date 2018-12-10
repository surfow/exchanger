/**
SURFOW V6.0.0
**/
const { remote } = require('electron')
const {BrowserWindow} = require('electron').remote;
var ipcRenderer = require('electron').ipcRenderer;
var session_close_data = null;

ipcRenderer.on('session-data', function (event, data) {
    session_close_data = data;
});

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

function close_session(handleData = function(){})
{
    $.ajax({
        url : safeText(session_close_data.close_url),
        type: "POST",
        data: "session_key="+safeText(session_close_data.session_key),
        success: function(close_data, textStatus, jqXHR)
        {
            handleData(close_data);
        },
        error: function(error)
        {
            handleData(error);
        }
    });
}

jQuery( document ).ready(function() {
    var wait_for_settings;
    var tries = 0;
    wait_for_settings = setInterval(function(){
        tries++;
        if(session_close_data != null)
        {
            clearInterval(wait_for_settings);
            close_session(function(data){
                remote.BrowserWindow.getFocusedWindow().close();
                app.quit();
            });
        } else if(tries >= 20) {
            clearInterval(wait_for_settings);
            remote.BrowserWindow.getFocusedWindow().close();
            app.quit();
        }
    }, 500);
    setTimeout(function(){
        window.close();
        app.quit();
    }, 12000);
});
