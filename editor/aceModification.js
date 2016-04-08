function keyLogger(time,selectionRange,selectedText,pressedKey,pastedText,menuItem,logEvent,fileName,editorChanged){
                this.time=time;
                this.selectionRange=selectionRange;
                this.selectedText=selectedText;
                this.pressedKey=pressedKey;
                this.pastedText=pastedText;
                this.menuItem = menuItem;
                this.logEvent=logEvent;
                this.file=fileName;
                if(editorChanged=== 'undefined')
                    editorChanged=null;
                this.editorChanged=editorChanged;
                //console.log(JSON.stringify(this));
}
function getLogStringKeyhandler(e){
        this.altKey=e.altKey;
        this.ctrlKey=e.ctrlKey;
        this.key=e.key;
        this.keyCode=e.keyCode;
        this.timeStamp=e.timeStamp;
        this.type=e.type;
        this.shiftKey=e.shiftKey;
}	
 //-------------CUT COPY PASTE EDITOR--------------//
	/*editor.on("copy", function(e){
		console.log('Copy Detected');
		//alert(e+ " "+ e.originalEvent);			
		new keyLogger((new Date()).getTime(),editor.selection.getRange(),editor.getSelectedText(),null ,null ,"log_copy");
	});*/
//    var menu = $JQVPL('#vpl_menu');
//    menu.click(function(e){
//        //var actionId = ui.item.attr('id');
//
//        alert(e.target.parentElement.id);
//
//    });
var lastSelectedText = '';
function captureCut(event,editor,fileName){
		//alert('cut');
    	console.log('Cut Detected'+  (new Date()).getTime()   );
    	return new keyLogger((new Date()).getTime(),editor.selection.getRange(),editor.getSelectedText(),null ,null ,null,"log_cut",fileName,null);
    }
function captureCopy(e,editor,fileName){
		console.log('Copy Detected');
		return new keyLogger((new Date()).getTime(),editor.selection.getRange(),editor.getSelectedText(),null ,null ,null,"log_copy",fileName,null);
	}
function capturePaste(e,editor,fileName){
		console.log('Paste Detected');
		return new keyLogger((new Date()).getTime(),editor.selection.getRange(),editor.getSelectedText(),null , e.text,null,"log_paste",fileName,null);
	}
function captureKey(e,editor,fileName,editorChanged){
		//console.log(e);
        if(e.keyCode ==8 || e.keyCode == 46)
            return new keyLogger((new Date()).getTime(),editor.selection.getRange(),lastSelectedText,new getLogStringKeyhandler(e) ,null ,null,"log_key",fileName,editorChanged);
        else
            return new keyLogger((new Date()).getTime(),editor.selection.getRange(),editor.getSelectedText(),new getLogStringKeyhandler(e) ,null ,null,"log_key",fileName,editorChanged);
	}

function captureMenu(e,editor,fileName){
    console.log('Menu Item selected');
    return new keyLogger((new Date()).getTime(),editor.selection.getRange(),editor.getSelectedText(),null ,null , e.target.text,"log_menu",fileName,null);

}
function updateLog(aceLog,tsI){
            var aceLogNew=[];
            for(x in aceLog){
                if(x.time>tsI){
                    aceLogNew.push(x);
                }
            }
            return aceLogNew;
        }
function autoSave(fileName,editor,_editor_jquery_){
    var timoutWarning = 900000; // Display warning in 14 Mins.
    //var timoutNow = 900000; // Timeout in 15 mins.
    //var logoutUrl = 'http://domain.com/logout.aspx'; // URL to logout page.

    var warningTimer;
    //var timeoutTimer;

    function StartTimers() {
        warningTimer = setTimeout(function(){rsFunctionsObject.autoSaveFunc()}, timoutWarning);
        //timeoutTimer = setTimeout("IdleTimeout()", timoutNow);
    }

    function ResetTimers() {
        clearTimeout(warningTimer);
        //clearTimeout(timeoutTimer);
        StartTimers();
    }
    //setTimeout(function(){ResetTimers()},5000);
    _editor_jquery_.on("mousemove keyup",function(){
        ResetTimers();
    });

    StartTimers();

}

function startLogging(fileName,editor,_editor_jquery_,options){
    //console.log(options.id);
    if(!options.id){
        return;
    }
    console.log("logging started...");
    var rn=Math.ceil(Math.random()*10000);
    var aceLog=[];
    var currFile={fileName:fileName,rn:rn};
    editor.on("cut",function(e){
        aceLog.push(captureCut(e,editor,currFile));
    });
    _editor_jquery_.bind({
        copy:function(e){
            aceLog.push(captureCopy(e,editor,currFile));
        }
    });
    editor.on("paste", function(e){
        aceLog.push(capturePaste(e,editor,currFile));
    });

    var menu = $JQVPL('#vpl_menu');
    menu.click(function(e){
        aceLog.push(captureMenu(e,editor,currFile));
    });

    editor.container.addEventListener("keydown", function(e){
    //console.log(e);

    if(e.ctrlKey===true && (e.key==='z'||e.key==='Z') || e.ctrlKey===true && e.keyCode===90){
                            var u1len=editor.session.getUndoManager().$undoStack[0].length;
            function f1(e2){
                    console.log("Undo detected");
                    //console.log(editor.session.getUndoManager().$undoStack);
                    u1len--;
                    //console.log(u1len);
                    if(u1len===0)
                            editor.off("change",f1);
                    var p=captureKey(e,editor,currFile,e2);
                    p.type='log_undo';
                    p.selection_range=null;
                    p.selectedText=null;
                    //console.log(JSON.stringify(p));
                    aceLog.push(p);
                    //console.log(JSON.stringify(e2));
            }
            //console.log(editor.session.getUndoManager().$undoStack.length);
            if(editor.session.getUndoManager().$undoStack.length>0)
                    editor.on("change",f1);
            }
            if(e.ctrlKey===true && (e.key==='y'||e.key==='Y') || e.ctrlKey===true && e.keyCode===89){
                            var u1len=editor.session.getUndoManager().$redoStack[0].length;
            function f1(e2){
                    console.log("Redo detected");
                    u1len--;
                    //console.log(u1len);
                    if(u1len===0)
                            editor.off("change",f1);
                    var p=captureKey(e,editor,currFile,e2);
                    p.type='log_redo';
                    p.selection_range=null;
                    p.selectedText=null;
                    //console.log(JSON.stringify(p));
                    aceLog.push(p);
                    //console.log(JSON.stringify(e2));
            }
            console.log(editor.session.getUndoManager().$redoStack.length);
            if(editor.session.getUndoManager().$redoStack.length>0)
                    editor.on("change",f1);
            }
}, true);
    _editor_jquery_.on("keyup keypress",function(e){
        aceLog.push(captureKey(e,editor,currFile,null));
        lastSelectedText=editor.getSelectedText();
        console.log(lastSelectedText);

        /*if(e.ctrlKey===true && e.key==='z' || e.ctrlKey===true && e.keyCode===90){
            console.log("Undo detected");
            editor.on("change",function(e){
                    console.log(e);
            });
            }*/
        console.log(currFile);
    });
    //setInterval(sendLog(aceLog), 200);
    editor.on('mousedown',function(e){
            //if(e.button==2)
                    console.log(e);
    });
    setInterval(function(){
        //sendLog(fileName,rn);
        rsFunctionsObject.rsSaveFunction();
    },900000);

     if(rsFunctionsObject.files === undefined){
        rsFunctionsObject.files=[];
    }
    if(rsFunctionsObject===undefined || rsFunctionsObject.runFunc === undefined){
    	rsFunctionsObject.runFunc=function(){
    		console.log("adding run");
    		aceLog.push(
    			new keyLogger((new Date()).getTime() ,
    				editor.selection.getRange(),
    				editor.getSelectedText(),
    				null,
    				null,
                    null,
    				"log_run",
    				null,
    				null));
    	}
    }
    
    rsFunctionsObject.files.push(function(){
        console.log("saving..."+fileName+"_"+rn);
        sendLog(fileName,rn);
    });
    function sendLog(fileName,rn){
                    var xmlhttp;
                    xmlhttp=new XMLHttpRequest();
                    xmlhttp.onreadystatechange=function()
                        {
                        var ts=xmlhttp.responseText;
                        console.log("ts="+ts);
                        if (xmlhttp.readyState===4 && xmlhttp.status===200)
                          {
                            console.log("responseText="+ts);
                            var tsI=parseInt(ts);
                            //update aceLog
                            aceLog=updateLog(aceLog,ts);
                          }
                          //console.log("afterRecieve:"+aceLog);
                        };
                    xmlhttp.open("POST","savelog.php",true);
                    xmlhttp.setRequestHeader("Content-type","application/x-www-form-urlencoded");
                    var sendParams='fileName='+fileName+'&rn='+rn+'&log='+JSON.stringify(aceLog);
                    sendParams+=options.download.indexOf('?')===-1? "" : "&"+(options.download.substring(options.download.indexOf('?')+1));
                    console.log(sendParams);
                    xmlhttp.send(sendParams);
                }
}
