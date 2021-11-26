var ip = "127.0.0.1";
var fScan = false;
var fGet = false;
var gRecognize_type;
var gFulltext_type;
var gFileFormat;
var arrayRecognize = [];
var skippr_idx = 0;
//var  img_width_height = "background-size:500px 500px;";
var skipprheight = 500; //px
var skipprwidth = 500; //px
//ori
var Supported_Languages = { 0: "English", 1: "Traditional", 2: "Simplified Chinese" };
var language = Supported_Languages[0];
var CompanySignList = { "English": "image/background.gif", "Traditional": "image/background.gif", "Simplified Chinese": "image/plustek.png" };
var CompanySign = CompanySignList[language];
var bEnablePaperDetected = false;
//var bEnableAdvanced = true;
var bEnableRegzLang = true;
var ImgList = [];
var nImgIndex = 0;
var nPicIndex = 1;
var multipdf = "", multitif = "";
var IMGCount = 0, IMGDOCount = 0;
var IsIMGReady = false;
//----------------------------------------------

function Connection(command, callback_func, str) {

    if (fScan == true) {
        alert("Resource Temporarily Unavailable...");
        return;
    }
    var obj = new Object();
    var socket;
    var PreviewObj = new PreviewImg();
    if (str == "") {
        str = command;
    }

	var result = {};
	str.split("&").forEach(function(part){
		var item = part.split("=");
		result[item[0]] = decodeURIComponent(item[1]);
	});
	gRecognize_type = result["recognize-type"];
	gFulltext_type = result["fulltext-type"];
    gFileFormat = result["imagefmt"];
    try {
            //for iis remote use
            var szHref = window.location.href;
            if (szHref.indexOf("http") == 0) {
                var p1 = szHref.indexOf("//");
                var p2 = 0;
                if (p1 > 0) {
                    p2 = szHref.indexOf("/", p1+2);
                }
                if (p2 > p1+2){
                    szHref = szHref.substring(p1+2, p2);
                }
                if (szHref != "localhost") {
                    ip = szHref;
                }
            }

            if(window.location.href.indexOf("https") === -1) {
                socket = new WebSocket("ws://" + ip + ":17777/" + str, "webfxscan");   
            }
            else {
                socket = new WebSocket("wss://" + ip + ":17777/" + str, "webfxscan");
            }
                        
        if (command == "GetPreview") {
            socket.binaryType = "arraybuffer";
        }
        obj.command = command;
    } catch (e) {
        obj.ret = -1;
        obj.data = command + " : WebSocket error";
        obj.status = 0;
        callback_func(obj);
        fScan = false;
        return;
    }
    socket.onclose = function (event) {
        socket.close();
        if ((event.code != "1000") && (event.code != "1005")) {
            obj.ret = -1;
            obj.data = "error:Cannot Connect to Server(" + event.code + ")";
            obj.status = 0;
            callback_func(obj);
            fScan = false;
        }

    };
    
    socket.onerror = function() {
    	
    	obj.ret = -1;
		obj.data = "error:Connection Errror";
		obj.status = 0;	
    	callback_func(obj);
    	delete socket;
    	fScan = false;
    };
    
    socket.onmessage = function (event) {
        switch (command) {
            case "GetDevicesList":
                RecvDeviceList(obj, callback_func, event.data);
                break;
            case "GetImageList":
                RecvImageList(obj, callback_func, event.data);
                break;
            case "GetOCRData":
                RecvImageListAndOCR(obj, callback_func, event.data);
                break;
			case "GetImageDataAndDownload":
                RecvImageListAndData(obj, callback_func, event.data);
                break;
            case "GetPreview":
                if (event.data instanceof ArrayBuffer) {
                    var bytearray = new Uint8Array(event.data);
                    PreviewObj.CheckFormat(bytearray);
                    if (PreviewObj.format == "jpeg") {
                        PreviewObj.RecvPreviewImagejpeg(bytearray, obj, callback_func);
                    }
                    else {
                        // filename.pnm
                        PreviewObj.RecvPreviewImage(bytearray);
                        obj.data = PreviewObj;
                        obj.ret = 0;
                        callback_func(obj);
                    }
                }
                else {
                    if (event.data != "finish") {
                        obj.data = event.data;
                        obj.ret = -1;
                        callback_func(obj);   
                    }

                }
                break;
            case "RmFiles":
                RecvRmFilesResult(obj, callback_func, event.data);
                break;
            case "GetFileList":
                RecvFileList(obj, callback_func, event.data);
                break;
        }
    };
}

function ManualEjectConnection(str) {
    if (fScan == true) {
        alert("Resource Temporarily Unavailable...");
        return;
    }
    var socket;

    try {
        var szHref = window.location.href;
        if(szHref.indexOf("https") === -1) {
            socket = new WebSocket("ws://" + ip + ":17777/" + str, "webfxscan");
        }
        else {
            socket = new WebSocket("wss://" + ip + ":17777/" + str, "webfxscan");
        }
    } catch (e) {
        return;
    }
    
    socket.onclose = function (event) {
        socket.close();
    };
    
    socket.onerror = function() {
    	delete socket;
    };
    
    socket.onmessage = function (event) {

    };
}

function Connection_2(command, callback_func, str) {
    /*if (fGet == true) {
        alert("Resource Temporarily Unavailable...");
        return;
    }*/
    fGet = true;
    var obj = new Object();
    var socket;
    if (str == "") {
        str = command;
    }
    try {        
    	    //for iis remote use
            var szHref = window.location.href;
            if (szHref.indexOf("http") == 0) {
                var p1 = szHref.indexOf("//");
                var p2 = 0;
                if (p1 > 0) {
                    p2 = szHref.indexOf("/", p1+2);
                }
                if (p2 > p1+2) {
                    szHref = szHref.substring(p1+2, p2);
                }
                if (szHref != "localhost") {
                    ip = szHref;
                }
            }

            if(window.location.href.indexOf("https") === -1) {
                socket = new WebSocket("ws://" + ip + ":17776/" + str, "webfxscan");
            }
            else {
                socket = new WebSocket("wss://" + ip + ":17776/" + str, "webfxscan");
            }
                        
            if (command == "GetFileData") {
            socket.binaryType = "arraybuffer";
            }
        obj.command = command;
    } catch (e) {
        obj.ret = -1;
        obj.data = command + " : WebSocket error";
        obj.status = 0;
        callback_func(obj);
        fGet = false;
        return;
    }
    socket.onclose = function (event) {
        socket.close();
        fGet = false;
        if ((event.code != "1000") && (event.code != "1005")) {
            obj.ret = -1;
            obj.data = "error:Cannot Connect to Server(" + event.code + ")";
            obj.status = 0;
            callback_func(obj);
        }
		else  {
			obj.ret = -1;
            obj.data = "finish";
            obj.status = 0;
            callback_func(obj);
		}
		

    };
    socket.onmessage = function (event) {
        switch (command) {
            case "GetFilePath":
            case "GetFileData":
                obj.data = event.data;
                obj.ret = 0;
                fGet = false;
                //delete socket;
                callback_func(obj);
                break;               
            case "GetRecognizeData":
            case "GetVersion":
                obj.data = event.data;
                obj.ret = 0;
                fGet = false;
                callback_func(obj);           
                break;              
        }
    };
	
	socket.onerror = function() {
    	
    	obj.ret = -1;
		obj.data = "error:Connection Errror";
		obj.status = 0;	
    	callback_func(obj);
    	delete socket;
    	fGet = false;
    };
}


function getImageFileStream(getclick, filename, thumbnail, del, callback_func) {
    if (!String.prototype.trim) {
        String.prototype.trim = function () {
            return this.replace(/^\s+|\s+$/g, '');
        };
    }
    if(thumbnail == true)
    {
        str = "GetFileData?filename=" + filename.trim() + "&thumbnail=true" + "&delete=" + del;
        Connection_2("GetFileData", callback_func, str);
    }
    else if(document.getElementById("text_Getfilename").value.search('.pdf') != -1 && getclick == "true")
    {
        str = "GetFilePath?filename=" + filename.trim() + "&thumbnail=false" + "&delete=" + del;
        Connection_2("GetFilePath", callback_func, str);
    }    
    else
    {
        str = "GetFileData?filename=" + filename.trim() + "&thumbnail=false" + "&delete=" + del;
        Connection_2("GetFileData", callback_func, str);
    }
}

function RecvDeviceList(obj, func, data) {
    if (data.toString().substring(0, 10) == "error:None") {
        obj.ret = -1;
        obj.data = GetStr(language, "Scanner Not Found");
        obj.status = 0;
        func(obj);
    }
    else if (data.substring(0, 5) == "error:") {
        obj.ret = -1;
        obj.data = data;
        obj.status = 0;
        func(obj);
    }
    else {
        obj.ret = 0;
        obj.data = data;
        func(obj);
    }
}

function RecvImageList(obj, func, data) {
    if (data.toString().substring(0, 5) == "data:") // recv data
    {
        obj.ret = 0;
        obj.data = data.substring(5, data.length);
        func(obj);
    }
    else if (data.toString().substring(0, 7) == "status:") // scanning , recv status
    {
        var strData = data.split(",");
        obj.ret = 1;
        obj.status = strData[0];
        if (strData.length > 1) {
            obj.filename = strData[1];
        }
        else {
            delete obj.filename;
        }
        func(obj);
    }
    else if (data.toString().search("finish") != -1) // scan finish
    {
        if(data.toString().search("exception finish") == -1)
        {
            if(document.getElementById("sel_imgfmt").value == "multi-pdf")
            {
                var skippr_newid = 'skippr' +  skippr_idx;
                
                (async function() {
                   await sleep(2000);
                })();
                
                var obj = document.getElementById(skippr_newid);
                var iframe = document.createElement('iframe');
                iframe.id = "picid1";
                iframe.setAttribute("src", multipdf);
                iframe.setAttribute("width", "100%");
                iframe.setAttribute("height", "100%");
                iframe.setAttribute("frameborder", "0");
                iframe.setAttribute("scrolling", "auto");
                obj.appendChild(iframe);
                
            }
            else if(document.getElementById("sel_imgfmt").value == "pdf")
            {
                for(idx=1;idx<nPicIndex;idx++)
                {
                    var pic_id = 'picid' +  idx;
                    document.getElementById(pic_id).style="visibility:visible";
                }
            }
            else if(document.getElementById("sel_imgfmt").value == "multi-tif")
            {
                var skippr_newid = 'skippr' +  skippr_idx;
                
                (async function() {
                   await sleep(2000);
                })();
     
                var obj = document.getElementById(skippr_newid);
                var img = document.createElement('iframe');
                img.id = "picid1";
                img.setAttribute("src", multitif);
                img.setAttribute("width", "100%");
                img.setAttribute("height", "100%");
                img.setAttribute("frameborder", "0");
                img.setAttribute("scrolling", "auto");
                obj.appendChild(img);
                 
            }
            else if(document.getElementById("sel_imgfmt").value == "tif")
            {
                for(idx=1;idx<nPicIndex;idx++)
                {
                    var pic_id = 'picid' +  idx;
                    document.getElementById(pic_id).style="visibility:visible";
                }
            }
            else if(document.getElementById("sel_imgfmt").value == "jpg"|| document.getElementById("sel_imgfmt").value == "bmp" || document.getElementById("sel_imgfmt").value == "png")
            {
                if((IsIMGReady == false && IMGCount == 1 && IMGDOCount == 1) || (IsIMGReady == true && fScan == true))  //only one page
                {
                    var skippr_id_ = '#skippr' +  skippr_idx;
            
                    $(function(){
                        $(skippr_id_).skippr({
                            navType: 'bubble'
                        });
                    });
                }
                fScan = false;
                return;
            }
            var skippr_id_ = '#skippr' +  skippr_idx;
            $(function(){
                $(skippr_id_).skippr({
                    navType: 'bubble'
                });
            });
            
        }
        fScan = false;
    }
    else if(data.toString().substring(0, 9) == "FilePath:")  //for new UI test
    {
        //copy file to tmp dir for remote clients use
        IMGCount++;
        if(data.toString().search(".jpg") != -1 || data.toString().search(".bmp") != -1 || data.toString().search(".png") != -1)
        {
            var skippr_newid = 'skippr' +  skippr_idx;
            var pic_id = 'picid' +  nPicIndex;
            nPicIndex++;
 
            var obj = document.getElementById(skippr_newid);            
            var div3 = document.createElement("div");   
            var dir = data.replace("FilePath:", "");
            var inx1 = dir.lastIndexOf(String.fromCharCode(92));
            var dir2 = dir.replace(String.fromCharCode(92,92), String.fromCharCode(47));
            var dir3 = dir2.replace(/\\/g, String.fromCharCode(47)); 
            var inx = dir3.lastIndexOf('.');
            var dir4 = dir3.substr(0, inx+4);
            var dir5 = dir4.replace("FilePath/", "");
            var img = new Image(); 

            img.onload = function(){
                IMGDOCount++;
                var scale = 1;
                if (img.height > skipprheight) {
                    scale = skipprheight / img.height;
                }
                if ((img.width * scale) > skipprwidth) {
                    scale = skipprwidth / img.width;
                }

                img.style.height = parseInt(img.height * scale) + "px";
                img.style.width = parseInt(img.width * scale) + "px";
  
                var attr = ''.concat('background-image: url(', dir4,  '); ', 'background-size:', img.style.width,' ', img.style.height, '; ', ' background-repeat: no-repeat;');
                div3.setAttribute("style", attr);
                div3.setAttribute("id", pic_id);
                obj.appendChild(div3);  
                img.onload = null;

                if(fScan == false && IMGCount == IMGDOCount)  //scan done and load last image done
                {
                    IsIMGReady = true;
                    var skippr_id_ = '#skippr' +  skippr_idx;
            
                    $(function(){
                        $(skippr_id_).skippr({
                            navType: 'bubble'
                        });
                    });
                }
                else if(fScan == true && IMGCount == IMGDOCount && IMGCount > 1)  //scan not done and load last image done
                    IsIMGReady = true;
            };
            img.src = dir4;
        }
        else if(data.toString().search(".pdf") != -1 )
        {
            var pic_id = 'picid' +  nPicIndex;
            var dir = data.replace("FilePath:", "");
            var inx1 = dir.lastIndexOf(String.fromCharCode(92));
            var dir2 = dir.replace(String.fromCharCode(92,92), String.fromCharCode(47));
            var dir3 = dir2.replace(/\\/g, String.fromCharCode(47));
            var inx = dir3.lastIndexOf('.');
            var dir4 = dir3.substr(0, inx+4);
            multipdf = dir4;
           
            if (document.getElementById("sel_imgfmt").value == "pdf" )
            {

                nPicIndex++;    
                var skippr_newid = 'skippr' +  skippr_idx;
                var skippr_newid_ = '#skippr' +  skippr_idx;
    
                var obj = document.getElementById(skippr_newid);
     
                //------------wait for pdf load----------------

                (async function() {
                await sleep(1500);
                })();

                //---------------------------------------------
                var iframe = document.createElement('iframe');
                iframe.id = pic_id;
                iframe.setAttribute("src", dir4);
                iframe.setAttribute("width", "100%");
                iframe.setAttribute("height", "100%");

                obj.appendChild(iframe);
                document.getElementById(pic_id).style="visibility:hidden";
            }
        }
        else if(data.toString().search("tif") != -1 )
        {
            var pic_id = 'picid' +  nPicIndex;
            var dir = data.replace("FilePath:", "");
            var inx1 = dir.lastIndexOf(String.fromCharCode(92));
            var dir2 = dir.replace(String.fromCharCode(92,92), String.fromCharCode(47));
            var dir3 = dir2.replace(/\\/g, String.fromCharCode(47));
            var inx = dir3.lastIndexOf('.');
            var dir4 = dir3.substr(0, inx+4);
            multitif = dir4;

            if (document.getElementById("sel_imgfmt").value == "tif" )
            {
                nPicIndex++;    
                var skippr_newid = 'skippr' +  skippr_idx;
                var skippr_newid_ = '#skippr' +  skippr_idx;      
    
                var obj = document.getElementById(skippr_newid);
              
                (async function() {
                await sleep(1500);
                })();
 
                var img = document.createElement('iframe');
                img.id = pic_id;
                img.setAttribute("data", dir4);
                img.setAttribute("width", "100%");
                img.setAttribute("height", "100%");
                
                 
                obj.appendChild(img);
            }
        }
    }
    else //recv error
    {
        obj.ret = -1;
        obj.data = data;
        obj.status = 0;
        func(obj);
    }
}

function RecvImageListAndOCR(obj, func, data) {
    if (data.toString().substring(0, 5) == "data:") // recv data
    {
        obj.ret = 0;
        obj.data = data.substring(5, data.length);
        func(obj);
    }
    else if (data.toString().substring(0, 7) == "status:") // scanning , recv status
    {
        var strData = data.split(",");
        obj.ret = 1;
        obj.status = strData[0];
        if (strData.length > 1) {
            obj.filename = strData[1];
			
			var szOCRName = obj.filename;
				
			if (gFileFormat == "jpg")
				szOCRName = szOCRName.replace(".jpg", "");
			else if (gFileFormat == "bmp")
				szOCRName = szOCRName.replace(".bmp", "");
			else if (gFileFormat == "tif")
				szOCRName = szOCRName.replace(".tif", "");
			else if (gFileFormat == "pdf")
				szOCRName = szOCRName.replace(".pdf", "");
			else if (gFileFormat == "png")
				szOCRName = szOCRName.replace(".png", "");
            
			var str = "GetRecognizeData?filename=" + szOCRName + "&recognize-type=" + gRecognize_type + "&fulltext-type=" + gFulltext_type;
			arrayRecognize.push(str);
        }
        else {
            delete obj.filename;
        }
        func(obj);
    }
    else if (data.toString().substring(0, 6) == "finish") // scan finish
    {
        delete socket;
		for (idx = 0; idx < arrayRecognize.length; idx ++){ 
			Connection_2("GetRecognizeData", func, arrayRecognize[idx]);
			fGet = false;
		}
		arrayRecognize = [];
    }
    else //recv error
    {
        obj.ret = -1;
        obj.data = data;
        obj.status = 0;
        func(obj);
    }
}

function RecvImageListAndData(obj, func, data) {
    if (data.toString().substring(0, 5) == "data:") // recv data
    {
        obj.ret = 0;
        obj.data = data.substring(5, data.length);
        func(obj);
    }
    else if (data.toString().substring(0, 7) == "status:") // scanning , recv status
    {
        var strData = data.split(",");
        obj.ret = 1;
        obj.status = strData[0];
        if (strData.length > 1) {
            obj.filename = strData[1];
        }
        else {
            delete obj.filename;
        }
        func(obj);
    }
    else if (data.toString().substring(0, 6) == "finish") // scan finish
    {
        //delete socket;
    }
    else //recv error
    {
        obj.ret = -1;
        obj.data = data;
        obj.status = 0;
        func(obj);
    }
}

function RecvRmFilesResult(obj, func, data) {
    if (data.substring(0, 7) == "data:ok") {
        obj.ret = 0;
        obj.data = "";
    }
    else {
        obj.ret = -1;
        obj.data = data;
    }
    func(obj);
}

function RmFiles(func, filename) {
    var obj = new Object();
    if (filename == "") {
        obj.ret = -1;
        obj.data = "Bad parameter :  No path of target folder.";
        func(obj);
        return;
    }
    var str = "RmFiles?filename=" + filename;
    Connection("RmFiles", func, str);
}

function GetRecognizeData(func, filename, recognize_type, fulltext_type) {
    var obj = new Object();
    if (filename == "") {
        obj.ret = -1;
        obj.data = "Bad parameter :  No path of target folder.";
        func(obj);
        return;
    }
    var str = "GetRecognizeData?filename=" + filename + "&recognize-type=" + recognize_type + "&output-type=" + fulltext_type;
    Connection_2("GetRecognizeData", func, str);
    //Connection("GetRecognizeData",func,str);
}

function RecvFileList(obj, func, data) {
    if (data.toString().substring(0, 5) == "data:") {
        obj.ret = 0;
        var str = data.toString().substring(5, data.length).split(",");
        if (str[0] == 1) {
            obj.data = "";
            obj.data = str[1];
        }
        else {
            //obj.data = obj.data + "," + str[1];
            obj.data = obj.data + "\r\n" + str[1];
        }
    }

    else if (data.toString().substring(0, 6) == "finish") {
        obj.ret = 0;
        //obj.data = obj.data + data;
        func(obj);
    }
    else// if(data.substring(0,6) == "error:")
    {
        obj.ret = -1;
        obj.data = data;
        func(obj);
    }

}


//GetFileList
function GetFileList(func) {
    Connection("GetFileList", func, "GetFileList");
}

function GetVersion() {
    str = "GetVersion?";
    Connection_2("GetVersion", RecvData, str);
    
}


//-------------------------------------------------------------------
//Preview Object
//-------------------------------------------------------------------

PreviewImg = function () {
    this.format = "";

    var RecvImageNo = 0;
    var canvas_f = document.createElement("canvas");
    var canvas_b = document.createElement("canvas");
    var context_f = 0;
    var context_b = 0;


    var img_f = document.createElement("img");
    img_f.id = "image_view";
    var img_b = document.createElement("img");
    img_b.id = "image_view";
    var PreviewImgObj = this;
    bin2txt = function (buffer) {
        return String.fromCharCode.apply(null, buffer);
    };
    this.CheckFormat = function (bytearray) {
        //var bytearray = new Uint8Array(event.data);
        if (bin2txt(bytearray.subarray(0, 2)) == "P4") {
            this.format = "P4";
        }
        else if (bin2txt(bytearray.subarray(0, 2)) == "P5") {
            this.format = "P5";
        }
        else if (bin2txt(bytearray.subarray(0, 2)) == "P6") {
            this.format = "P6";
        }
        else {
            this.format = "jpeg";
        }
    };
    this.RecvPreviewImage = function (bytearray) {
        
        if (this.format == "P4") {
            HeaderLine = 3;
        }
        else {
            HeaderLine = 4;
        }

        var count = 0, i = 0;
        for (i = 0 ; i < bytearray.length; i++) //parser header
        {
            if (bytearray[i] == "10") // 0a 
            {
                count++;
                if (count == HeaderLine) {
                    break;
                }
            }
        }

        var strdata = bin2txt(bytearray.subarray(0, i)); //get header , to string
        var start = i + 1; //pixel data 
        var str = strdata.split('\n');

        var type = str[0];
        if (type != "P4") {
            var a_value = parseInt(str[3]);
        }
        value = str[2].split(" ");

        var imgdata = 0;
        var imgdatalen = 0;

        if (RecvImageNo == 0) //front
        {
            canvas_f.height = parseFloat(value[1]);
            canvas_f.width = parseFloat(value[0]);
            context_f = canvas_f.getContext('2d');
            imgdata = context_f.getImageData(0, 0, canvas_f.width, canvas_f.height);
            imgdatalen = imgdata.data.length;
        }
        else if (RecvImageNo == 1) {
            canvas_b.height = parseFloat(value[1]);
            canvas_b.width = parseFloat(value[0]);
            context_b = canvas_b.getContext('2d');
            imgdata = context_b.getImageData(0, 0, canvas_b.width, canvas_b.height);
            imgdatalen = imgdata.data.length;
        }
        switch (type) {
            case "P6":
                for (var j = 0; j < imgdatalen; j++) {
                    if ((j % 4) == 3) {
                        imgdata.data[j] = a_value;
                    }
                    else {
                        imgdata.data[j] = bytearray[start++];
                    }
                }
                break;
            case "P5":
                for (var j = 0; j < imgdatalen; j = j + 4) {
                    imgdata.data[j] = bytearray[start];
                    imgdata.data[j + 1] = bytearray[start];
                    imgdata.data[j + 2] = bytearray[start++];
                    imgdata.data[j + 3] = a_value;
                }
                break;
            case "P4":
                var shift = 0x80;
                var pixel = 0;
                for (var j = 0; j < imgdatalen; j = j + 4) {
                    if (shift == 0) {
                        shift = 0x80;
                        start++;
                    }
                    pixel = bytearray[start] & shift;
                    if (pixel != 0) {
                        pixel = 0;
                    }
                    else {
                        pixel = 255;
                    }
                    imgdata.data[j] = pixel;
                    imgdata.data[j + 1] = pixel;
                    imgdata.data[j + 2] = pixel;
                    imgdata.data[j + 3] = 255;
                    shift = shift >> 1;
                }
                break;
        }

        if (RecvImageNo == 0) //front
        {
            context_f.putImageData(imgdata, 0, 0);
            RecvImageNo = 1;
        }
        else if (RecvImageNo == 1)  //Back
        {
            context_b.putImageData(imgdata, 0, 0);
            RecvImageNo = 0;
        }
        //}
        //else
        //{
        //	if(event.data != "finish")
        //	{
        //alert("[Data ERROR]" + event.data);
        //	}
        //}
    };
	
    this.ShowPreviewImage = function (id, ImageNo) {
        var div = document.getElementById(id);
        if (document.getElementById("canvas_view")) {
            document.getElementById("canvas_view").parentNode.removeChild(document.getElementById("canvas_view"));
        }
        var chatdiv = document.createElement("canvas");
        chatdiv.id = "canvas_view";
        var scale = 1;

        var windowheight = parseFloat(window.getComputedStyle(document.getElementById("view")).height);
        var windowwidth = parseFloat(window.getComputedStyle(document.getElementById("view")).width);

        if (ImageNo == 0) //front
        {
            imageheight = canvas_f.height;
            imagewidth = canvas_f.width;
        }
        else if (ImageNo == 1) {
            imageheight = canvas_b.height;
            imagewidth = canvas_b.width;
        }

        if (imageheight > windowheight) {
            scale = windowheight / imageheight;
        }
        if ((imagewidth * scale) > windowwidth) {
            scale = windowwidth / imagewidth;
        }


        chatdiv.height = imageheight * scale;
        chatdiv.width = imagewidth * scale;

        var context = chatdiv.getContext('2d');
        context.scale(scale, scale);

        if (ImageNo == 0) //front
        {
            context.drawImage(canvas_f, 0, 0);

        }
        else if (ImageNo == 1) {
            context.drawImage(canvas_b, 0, 0);
        }
        div.appendChild(chatdiv);
    };

    this.RecvPreviewImagejpeg = function (bytes, obj, callback_func) {
        if (RecvImageNo == 0) //front
        {
            RecvImageNo = 1;
            img_f.src = 'data:image/jpeg;base64,' + encode(bytes);
            img_f.onload = function () {
                obj.data = PreviewImgObj;
                obj.ret = 0;
                callback_func(obj);              
            };
            img_f.onerror = function (stuff) {
                alert("Recv Preview Image error:", stuff);
            };
        }
        else if (RecvImageNo == 1)  //Back
        {
            RecvImageNo = 0;
            img_b.src = 'data:image/jpeg;base64,' + encode(bytes);
            img_b.onload = function () {
                obj.data = PreviewImgObj;
                obj.ret = 0;
                callback_func(obj);
            };
            img_f.onerror = function (stuff) {
                alert("Recv Preview Image error:", stuff);
            };
        }
    };

    this.ShowPreviewImagejpeg = function (id, ImageNo) {
        var div = document.getElementById(id);

        var windowheight = parseFloat(window.getComputedStyle(document.getElementById("view")).height);
        var windowwidth = parseFloat(window.getComputedStyle(document.getElementById("view")).width);
        if (document.getElementById("image_view")) {
            document.getElementById("image_view").parentNode.removeChild(document.getElementById("image_view"));
        }
        scale = 1;
        if (ImageNo == 0) //front
        {
            if (img_f.height > windowheight) {
                var scale = windowheight / img_f.height;
            }
            if ((img_f.width * scale) > windowwidth) {
                var scale = windowwidth / img_f.width;
            }
            img_f.style.height = parseInt(img_f.height * scale) + "px";
            div.appendChild(img_f);
        }
        else if (ImageNo == 1) {

            if (img_b.height > windowheight) {
                var scale = windowheight / img_b.height;
            }
            if ((img_b.width * scale) > windowwidth) {
                var scale = windowwidth / img_b.width;
            }
            img_b.style.height = parseInt(img_b.height * scale) + "px";
            div.appendChild(img_b);
        }

    };

    encode = function (input) {
        var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        var output = "";
        var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
        var i = 0;

        while (i < input.length) {
            chr1 = input[i++];
            chr2 = i < input.length ? input[i++] : Number.NaN; // Not sure if the index 
            chr3 = i < input.length ? input[i++] : Number.NaN; // checks are needed here

            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;

            if (isNaN(chr2)) {
                enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
                enc4 = 64;
            }
            output += keyStr.charAt(enc1) + keyStr.charAt(enc2) +
               keyStr.charAt(enc3) + keyStr.charAt(enc4);
        }
        return output;
    };
};
//-------------------------------------------------------------------
// get from UI_demo.html
//-------------------------------------------------------------------



function PageInit() {
    /*
    //Receive status
    RecvStatus =  function(status)
    {
        // add your code 
    };
    */

    /*
    //Receive Device Name
    RecvDeviceName =  function(data)
    {
        // add your code 
    };
    */
/*

    document.getElementById("view4").style.height = document.getElementById("view1").offsetHeight + "px";
    document.getElementById("right").style.height = (document.getElementById("view1").offsetHeight * 1.2) + "px";
  */
    Connection("GetDevicesList", RecvData, "GetDevicesList");

    var PreviewObj = new PreviewImg();
    
    document.getElementById("text_brightness").value = document.getElementById("range_brightness").value;
    document.getElementById("text_contrast").value = document.getElementById("range_contrast").value;
    document.getElementById("text_quality").value = document.getElementById("range_quality").value;

}
function AddSel(id, data) {
    var List = data.split(",");
    var varItem;
    var str;

   
    document.getElementById(id).options.length = 0;
    for (j = 0; j < List.length; j++) {
        if (LANGUAGE[language] === undefined) {
            if (language = "English") {
                str = List[j];
            }
        }
        else {
            str = LANGUAGE[language][List[j]];
            if ((str === undefined) || (str == "")) {
                str = List[j];
            }
        }
        varItem = new Option(str, List[j]);
        document.getElementById(id).options.add(varItem);
    }
}

function AddListSel(data) {
    var List = data.split(",");
    var varItem;
    var str;
    document.getElementById("List").options.length = 0;
    for (j = 0; j < List.length; j++)
    {
        if(List[j] != "\0")
        {
            str = List[j].split(" ");
            if(language == "Simplified Chinese")
            {
                varItem = new Option("精益扫描仪" , str[1]);
            }
            else
            {
                varItem = new Option(str[1] , str[1]);
            }
                    
            document.getElementById("List").options.add(varItem);
        }
    }
}
function RecvData(obj) {
    if (obj.ret == 1) {
        RecvStatus(obj.status);
        switch (obj.command) {
        case "GetImageDataAndDownload":                 
                RecvFileName(obj.filename);
                break;
        }
    }
    else if (obj.ret == 0) {
        switch (obj.command) {
            case "GetDevicesList":
                RecvDeviceName(obj.data);
                ChangeScanData(document.getElementById("List").value);
                break;

            case "GetImageList":
                CloseStatus(obj);
                break;
            case "GetImageDataAndDownload":
                CloseStatus(obj);
                DownloadRecvFileName();
                break;
            case "GetOCRData":
                CloseStatus(obj);
                break;
            case "GetPreview":
                PreviewObj = obj.data;
                if (document.getElementById("view_f").className == "buttonD") {
                    if (PreviewObj.format != "jpeg") {
                        PreviewObj.ShowPreviewImage("view", 0);
                    }
                    else {
                        PreviewObj.ShowPreviewImagejpeg("view", 0);
                    }

                }
                else {
                    if (PreviewObj.format != "jpeg") {
                        PreviewObj.ShowPreviewImage("view", 1);
                    }
                    else {
                        PreviewObj.ShowPreviewImagejpeg("view", 1);
                    }
                }
                break;
            case "RmFiles":
                alert("RmFiles OK");
                break;
            case "GetFileList":
                var windowRegRes = window.open("", "FileList", "width=450,height=400");
                windowRegRes.document.write("<p>FileList</p>");
                windowRegRes.document.write("<textarea rows='15' cols='55' overflow='auto' readonly>");
                windowRegRes.document.write(obj.data);
                windowRegRes.document.write("</textarea>");
                break;
            case "GetRecognizeData":
                if(typeof obj.data === 'object') { // for fulltext recognize
                    var aUrl = window.URL;
                    var a = document.createElement('a');
                    var file = new Blob([obj.data], {type:'application/octet-binary'});
                    a.style = "display: none";
                    a.href = aUrl.createObjectURL(file);
                    a.download = "fulltext." + document.getElementById("sel_fulltext_type").value;
                    try {
                        window.navigator.msSaveOrOpenBlob(file, a.download); // for IE
                    } catch(err) {
                        a.click(); // for Chrome, Firefox
                    }
                }
                else if(typeof obj.data === 'string') {
                    var windowRegRes = window.open("", "Recognize Result", "width=600,height=400");
                    windowRegRes.document.write("<p>GetRecognizeData</p>");
                    windowRegRes.document.write("<textarea rows='20' cols='60' readonly>");
                    windowRegRes.document.write(obj.data);
                    windowRegRes.document.write("</textarea>");
                }
                break;
            case "DetectPaper":
                if (obj.data == "paper detected") {
                    Scan();
                }
                CloseStatus(obj);
                break;
            case "GetVersion":
                break;
        }
    }
    else {
        CloseStatus(obj);
        
        if (obj.data.toString() != "finish" && obj.data.toString() != "exception finish" && obj.data.toString().search("FilePath") == -1 && obj.data.toString().length != 0)
        {
            alert(obj.data.toString());
            fScan = false;
        }
    }
}

function RecvFileName(data) {

    //document.getElementById("text_filename").innerHTML = document.getElementById("text_filename").innerHTML + "," + data;
    var filename = data;
    ImgList.push(filename)
}

function DownloadRecvFileName() {
    for (i = 0; i < ImgList.length; i++) 
    {
        var filename = ImgList[i];
        //document.getElementById("view").innerHTML = '<img id="image_view" name="image_view" >';
        getImageFileStream("false", filename, "false", "false", RecvDataAndFastDownload);
    }
    
    //ImgList.length =0;
}

function RecvDeviceName(data) {
    AddListSel(data);

}
function ChangeScanData(DeviceName) {
    AddSel("sel_source", SELECT_STR[SPEC[DeviceName]]["source"]);
    document.getElementById("sel_source").index = 0;
   
    if (SPEC[DeviceName] == "type3") {
        AddSel("sel_paper-size", SELECT_STR[SPEC[DeviceName]]["paper-size"][document.getElementById("sel_source").value]);
        document.getElementById("sel_paper-size").index = 0;
    }
    else {
        AddSel("sel_paper-size", SELECT_STR[SPEC[DeviceName]]["paper-size"]);
        document.getElementById("sel_paper-size").index = 0;
    }

    AddSel("sel_mode", SELECT_STR[SPEC[DeviceName]]["mode"]);
    document.getElementById("sel_mode").index = 0;

    if (document.getElementById("sel_imgfmt") != null) {
        AddSel("sel_imgfmt", SELECT_STR[SPEC[DeviceName]]["image-format"]);
        document.getElementById("sel_imgfmt").index = 0;
    }

    AddSel("sel_resolution", SELECT_STR[SPEC[DeviceName]]["resolution"]);
    document.getElementById("sel_resolution").index = 0;
    
    if (document.getElementById("sel_recognize_type") != null) {
        AddSel("sel_recognize_type", SELECT_STR[SPEC[DeviceName]]["recognize-type"]);
        document.getElementById("sel_recognize_type").index = 0;
    }

    if (document.getElementById("sel_fulltext_type") != null) {
        AddSel("sel_fulltext_type", SELECT_STR[SPEC[DeviceName]]["fulltext-type"]);
        document.getElementById("sel_fulltext_type").index = 0;
    }
    
    if (document.getElementById("sel_recognize_lang") != null) {
        AddSel("sel_recognize_lang", SELECT_STR[SPEC[DeviceName]]["recognize-lang"]);
        document.getElementById("sel_recognize_lang").index = 0;
    }
    
    document.getElementById("range_brightness").value = 0;
    changeValue(document.getElementById("range_brightness").value, "text_brightness");
    document.getElementById("range_contrast").value = 0;
    changeValue(document.getElementById("range_contrast").value, "text_contrast");

    document.getElementById("range_quality").value = 75;
    changeValue(document.getElementById("range_quality").value, "text_quality");
    document.getElementById("chk_swcrop").checked = false;
    document.getElementById("chk_swdeskew").checked = false;
    document.getElementById("chk_fronteject").checked = false;

    document.getElementById("chk_manualeject").checked = false;
    document.getElementById("chk_removeblankpage").checked = false;
    document.getElementById("chk_multifeeddetect").checked = false;


    cookieStr = getCookie(DeviceName);
    if (cookieStr != "") {       
        var cookieArray = cookieStr.split('&');
        document.getElementById("sel_source").value = ArraySearch(cookieArray, "source");
        if (document.getElementById("sel_source").value == "Flatbed") {
            AddSel("sel_paper-size", SELECT_STR[SPEC[DeviceName]]["paper-size"][document.getElementById("sel_source").value]);
        }
        document.getElementById("sel_paper-size").value = ArraySearch(cookieArray, "paper-size");
        document.getElementById("sel_mode").value = ArraySearch(cookieArray, "mode");
        document.getElementById("sel_resolution").value = ArraySearch(cookieArray, "resolution");
        document.getElementById("range_brightness").value = ArraySearch(cookieArray, "brightness");
        changeValue(document.getElementById("range_brightness").value, "text_brightness");
        document.getElementById("range_contrast").value = ArraySearch(cookieArray, "contrast");
        changeValue(document.getElementById("range_contrast").value, "text_contrast");

        document.getElementById("range_quality").value = ArraySearch(cookieArray, "quality");
        changeValue(document.getElementById("range_quality").value, "text_quality");

        if (ArraySearch(cookieArray, "swcrop") == "true") {
            document.getElementById("chk_swcrop").checked = true;
        }
        else {
            document.getElementById("chk_swcrop").checked = false;
        }

        if (ArraySearch(cookieArray, "swdeskew") == "true") {
            document.getElementById("chk_swdeskew").checked = true;
        }
        else {
            document.getElementById("chk_swdeskew").checked = false;
        }
        if(ArraySearch(cookieArray,"front-eject") == "true")
        {
            document.getElementById("chk_fronteject").checked = true;
        }
        else
        {
            document.getElementById("chk_fronteject").checked = false;
        }
        if(ArraySearch(cookieArray,"manual-eject") == "true")
        {
            document.getElementById("chk_manualeject").checked = true;
        }
        else
        {
            document.getElementById("chk_manualeject").checked = false;
        }
        if (ArraySearch(cookieArray, "remove-blank-page") == "true") {
            document.getElementById("chk_removeblankpage").checked = true;
        }
        else {
            document.getElementById("chk_removeblankpage").checked = false;
        }
        if (ArraySearch(cookieArray, "multifeed-detect") == "true") {
            document.getElementById("chk_multifeeddetect").checked = true;
        }
        else {
            document.getElementById("chk_multifeeddetect").checked = false;
        }


    }
}

function ChangeSource(source) {
    if (SPEC[document.getElementById("List").value] == "type3") {
        AddSel("sel_paper-size", SELECT_STR[SPEC[document.getElementById("List").value]]["paper-size"][document.getElementById("sel_source").value]);
        document.getElementById("sel_paper-size").value = "A4";
    }
    
    if (source == "ADF-Duplex") {
        document.getElementById("chk_duplexmerge2").style.display = "block";
        document.getElementById("chk_duplexmerge1").style.display = "block";
    }
    else if (source == "Sheetfed-Duplex"){
        document.getElementById("chk_duplexmerge2").style.display = "block";
        document.getElementById("chk_duplexmerge1").style.display = "block";
    }
    else {
        document.getElementById("chk_duplexmerge1").style.display = "none";
        document.getElementById("chk_duplexmerge2").style.display = "none";
    }
}

function ChangeFulltextStatus(ocrType) {
    if (ocrType == "Full Text") {
        document.getElementById("sel_fulltext_type").disabled = false;
        if (document.getElementById("sel_recognize_lang") != null) 
            document.getElementById("sel_recognize_lang").disabled = false;
    }
    else {
        document.getElementById("sel_fulltext_type").disabled = true;
        if (document.getElementById("sel_recognize_lang") != null) 
            document.getElementById("sel_recognize_lang").disabled = true;
    }
}


function Scan() {
    if (document.getElementById("pic_count")) {
                    document.getElementById("pic_count").parentNode.removeChild(document.getElementById("pic_count"));
                }
    nPicIndex = 1;  //reset      
    var skippr_id = 'skippr' +  skippr_idx;
    skippr_idx++;
    var skippr_newid = 'skippr' +  skippr_idx;

    if (skippr_id!="") 
    var obj = document.getElementById(skippr_id);
   
    var parentObj = obj.parentNode;
    parentObj.removeChild(obj);
   
    var skippr2 = document.createElement("div");
    if (skippr_newid!="") 
        skippr2.setAttribute("id", skippr_newid);
    parentObj.appendChild(skippr2);

    IMGCount = 0;
    IMGDOCount = 0;
    IsIMGReady = false;
    
    RecvStatus(0);

    str = "SetParams?";
    str += "device-name=" + document.getElementById("List").value;
    str += "&scanmode=scan";
    str += "&paper-size=" + document.getElementById("sel_paper-size").value;
    str += "&source=" + document.getElementById("sel_source").value;
    str += "&resolution=" + document.getElementById("sel_resolution").value;
    str += "&mode=" + document.getElementById("sel_mode").value;
    if (document.getElementById("sel_imgfmt") != null)
        str += "&imagefmt=" + document.getElementById("sel_imgfmt").value;
    str += "&brightness=" + document.getElementById("range_brightness").value;
    str += "&contrast=" + document.getElementById("range_contrast").value;
    str += "&quality=" + document.getElementById("range_quality").value;
    str += "&swcrop=" + document.getElementById("chk_swcrop").checked;
    str += "&swdeskew=" + document.getElementById("chk_swdeskew").checked;
    str += "&front-eject=" + document.getElementById("chk_fronteject").checked;
    str += "&manual-eject=" + document.getElementById("chk_manualeject").checked;
    str += "&duplexmerge=" + document.getElementById("chk_duplexmerge").checked;
    str += "&remove-blank-page=" + document.getElementById("chk_removeblankpage").checked;
    str += "&multifeed-detect=" + document.getElementById("chk_multifeeddetect").checked;
    if (document.getElementById("sel_imgfmt") != null)
        str += "&denoise=" + document.getElementById("chk_denoise").checked;
    if (document.getElementById("chk_rm_blackedges") != null)
        str += "&remove-blackedges=" + document.getElementById("chk_rm_blackedges").checked;

    if (document.getElementById("sel_recognize_type") != null) {
        switch (document.getElementById("sel_recognize_type").value) {
            case "ID Card":
                str += "&recognize-type=id";
                break;
            case "Insurance Card":
                str += "&recognize-type=insurance";
                break;
            case "Passport":
                str += "&recognize-type=passport";
                break;
            case "USDL":
                str += "&recognize-type=usdl";
                break;
            case "IDID":
                str += "&recognize-type=idid";
                break;
            case "CN_VAT_INVOICE":
                str += "&recognize-type=cn_vat_invoice";
                break;
            case "Full Text":
                str += "&recognize-type=fulltext";
                break;
            case "Barcode":
                str += "&recognize-type=barcode";
                break;
            case "Auto":
                str += "&recognize-type=auto";
                break;
            case "none":
                str += "&recognize-type=none";
                break;
            case "TWRC":
                str += "&recognize-type=twrc";
                break;
            case "TD2ID":
                str += "&recognize-type=td2id";
                break;
        }
    }

    if (document.getElementById("sel_recognize_type") != null) {
        if (document.getElementById("sel_recognize_type").value == "Full Text")
            str += "&fulltext-type=" + document.getElementById("sel_fulltext_type").value;
            
        if (document.getElementById("sel_recognize_lang") != null) {
            switch (document.getElementById("sel_recognize_lang").value) {
                case "default":
                    str += "&recognize-lang=default";
                    break;
                case "en":
                    str += "&recognize-lang=en";
                    break;
                case "zh-tw+en":
                    str += "&recognize-lang=zh-tw+en";
                    break;
                case "zh-cn+en":
                    str += "&recognize-lang=zh-cn+en";
                    break;
                case "de+en":
                    str += "&recognize-lang=de+en";
                    break;
                case "jp":
                    str += "&recognize-lang=jp";
                    break;
                case "kp":
                    str += "&recognize-lang=kp";
                    break;
                case "vn+en":
                    str += "&recognize-lang=vn+en";
                    break;
                case "br":
                    str += "&recognize-lang=br";
                    break;
                case "pt":
                    str += "&recognize-lang=pt";
                    break;
            }
        }
    }
    
    setCookie(document.getElementById('List').value, str.substring(10, str.length), 365);  
    Connection("GetImageList", RecvData, str);
    fScan = true;
}

function FastOCR() {
    if (document.getElementById("List").selectedIndex == -1) {
        alert(GetStr(language, "Scanner Not Found"));
        return;
    }
    RecvStatus(0);
    str = "SetParams?";
    str += "device-name=" + document.getElementById("List").value;
    str += "&scanmode=scan";
    str += "&paper-size=" + document.getElementById("sel_paper-size").value;
    str += "&source=" + document.getElementById("sel_source").value;
    str += "&resolution=" + document.getElementById("sel_resolution").value;
    str += "&mode=" + document.getElementById("sel_mode").value;
    if (document.getElementById("sel_imgfmt") != null)
        str += "&imagefmt=" + document.getElementById("sel_imgfmt").value;
    else
        str += "&imagefmt=jpg";
    str += "&brightness=" + document.getElementById("range_brightness").value;
    str += "&contrast=" + document.getElementById("range_contrast").value;
    str += "&quality=" + document.getElementById("range_quality").value;
    str += "&swcrop=" + document.getElementById("chk_swcrop").checked;
    str += "&swdeskew=" + document.getElementById("chk_swdeskew").checked;
    str += "&front-eject=" + document.getElementById("chk_fronteject").checked;

    str += "&manual-eject=" + document.getElementById("chk_manualeject").checked;
    str += "&chk_duplexmerge=" + document.getElementById("chk_duplexmerge").checked;
    str += "&remove-blank-page=" + document.getElementById("chk_removeblankpage").checked;
    str += "&multifeed-detect=" + document.getElementById("chk_multifeeddetect").checked;
    if (document.getElementById("chk_denoise") != null)
        str += "&denoise=" + document.getElementById("chk_denoise").checked;
    if (document.getElementById("chk_rm_blackedges") != null)
        str += "&remove-blackedges=" + document.getElementById("chk_rm_blackedges").checked;
    
    switch (document.getElementById("sel_recognize_type").value) {
        case "ID Card":
            str += "&recognize-type=id";
            break;
        case "Insurance Card":
            str += "&recognize-type=insurance";
            break;
        case "Passport":
            str += "&recognize-type=passport";
            break;
        case "Passport-Copy":
            str += "&recognize-type=passport-loose";
            break;
        case "USDL":
            str += "&recognize-type=usdl";
            break;
        case "IDID":
            str += "&recognize-type=idid";
            break;
        case "CN_VAT_INVOICE":
            str += "&recognize-type=cn_vat_invoice";
            break;
        case "Full Text":
            str += "&recognize-type=fulltext";
            break;
        case "Barcode":
            str += "&recognize-type=barcode";
            break;
        case "Auto":
            str += "&recognize-type=auto";
            break;
        case "none":
            str += "&recognize-type=none";
            break;
        case "TWRC":
            str += "&recognize-type=twrc";
            break;
        case "TD2ID":
            str += "&recognize-type=td2id";
            break;
    }
    
    if (document.getElementById("sel_recognize_type").value == "Full Text")
        str += "&fulltext-type=" + document.getElementById("sel_fulltext_type").value;
        
    if (document.getElementById("sel_recognize_lang") != null) {
        switch (document.getElementById("sel_recognize_lang").value) {
                case "default":
                    str += "&recognize-lang=default";
                    break;
                case "en":
                    str += "&recognize-lang=en";
                    break;
                case "zh-tw+en":
                    str += "&recognize-lang=zh-tw+en";
                    break;
                case "zh-cn+en":
                    str += "&recognize-lang=zh-cn+en";
                    break;
                case "de+en":
                    str += "&recognize-lang=de+en";
                    break;
                case "jp":
                    str += "&recognize-lang=jp";
                    break;
                case "kp":
                    str += "&recognize-lang=kp";
                    break;
                case "vn+en":
                    str += "&recognize-lang=vn+en";
                    break;
                case "br":
                    str += "&recognize-lang=br";
                    break;
                case "pt":
                    str += "&recognize-lang=pt";
                    break;
            }
    }

    setCookie(document.getElementById('List').value, str.substring(10, str.length), 365);
    Connection("GetOCRData", RecvData, str);
}

 function FastDownload() {
    if (document.getElementById("List").selectedIndex == -1) {
        alert(GetStr(language, "Scanner Not Found"));
        return;
    }
    RecvStatus(0);
    str = "SetParams?";
    str += "device-name=" + document.getElementById("List").value;
    str += "&scanmode=scan";
    str += "&paper-size=" + document.getElementById("sel_paper-size").value;
    str += "&source=" + document.getElementById("sel_source").value;
    str += "&resolution=" + document.getElementById("sel_resolution").value;
    str += "&mode=" + document.getElementById("sel_mode").value;
    if (document.getElementById("sel_imgfmt") != null)
        str += "&imagefmt=" + document.getElementById("sel_imgfmt").value;
    str += "&brightness=" + document.getElementById("range_brightness").value;
    str += "&contrast=" + document.getElementById("range_contrast").value;
    str += "&quality=" + document.getElementById("range_quality").value;
    str += "&swcrop=" + document.getElementById("chk_swcrop").checked;
    str += "&swdeskew=" + document.getElementById("chk_swdeskew").checked;
    str += "&front-eject=" + document.getElementById("chk_fronteject").checked;

    str += "&manual-eject=" + document.getElementById("chk_manualeject").checked;
    str += "&duplexmerge=" + document.getElementById("chk_duplexmerge").checked;
    str += "&remove-blank-page=" + document.getElementById("chk_removeblankpage").checked;
    str += "&multifeed-detect=" + document.getElementById("chk_multifeeddetect").checked;
    if (document.getElementById("sel_imgfmt") != null)
        str += "&denoise=" + document.getElementById("chk_denoise").checked;
    if (document.getElementById("chk_rm_blackedges") != null)
        str += "&remove-blackedges=" + document.getElementById("chk_rm_blackedges").checked;

    if (document.getElementById("sel_recognize_type") != null) {
        switch (document.getElementById("sel_recognize_type").value) {
            case "ID Card":
                str += "&recognize-type=id";
                break;
            case "Insurance Card":
                str += "&recognize-type=insurance";
                break;
            case "Passport":
                str += "&recognize-type=passport";
                break;
            case "USDL":
                str += "&recognize-type=usdl";
                break;
            case "IDID":
                str += "&recognize-type=idid";
                break;
            case "CN_VAT_INVOICE":
                str += "&recognize-type=cn_vat_invoice";
                break;
            case "Full Text":
                str += "&recognize-type=fulltext";
                break;
            case "Barcode":
                str += "&recognize-type=barcode";
                break;
            case "Auto":
                str += "&recognize-type=auto";
                break;
            case "none":
                str += "&recognize-type=none";
                break;
            case "TWRC":
                str += "&recognize-type=twrc";
                break;
            case "TD2ID":
                str += "&recognize-type=td2id";
                break;
        }
    }

    if (document.getElementById("sel_recognize_type") != null) {
        if (document.getElementById("sel_recognize_type").value == "Full Text")
            str += "&fulltext-type=" + document.getElementById("sel_fulltext_type").value;
            
        if (document.getElementById("sel_recognize_lang") != null) {
            switch (document.getElementById("sel_recognize_lang").value) {
                case "default":
                    str += "&recognize-lang=default";
                    break;
                case "en":
                    str += "&recognize-lang=en";
                    break;
                case "zh-tw+en":
                    str += "&recognize-lang=zh-tw+en";
                    break;
                case "zh-cn+en":
                    str += "&recognize-lang=zh-cn+en";
                    break;
                case "de+en":
                    str += "&recognize-lang=de+en";
                    break;
                case "jp":
                    str += "&recognize-lang=jp";
                    break;
                case "kp":
                    str += "&recognize-lang=kp";
                    break;
                case "vn+en":
                    str += "&recognize-lang=vn+en";
                    break;
                case "br":
                    str += "&recognize-lang=br";
                    break;
                case "pt":
                    str += "&recognize-lang=pt";
                    break;
            }
        }
    }
    setCookie(document.getElementById('List').value, str.substring(10, str.length), 365);

    Connection("GetImageDataAndDownload", RecvData, str);
    }

 function ManualEject() {
    if (document.getElementById("List").selectedIndex == -1) {
        alert(GetStr(language, "Scanner Not Found"));
        return;
    }
    str = "EjectPaper?";
    str += "device-name=" + document.getElementById("List").value;
    str += "&front-eject=" + document.getElementById("chk_fronteject").checked;
    setCookie(document.getElementById('List').value, str.substring(10, str.length), 365);

    ManualEjectConnection(str);
    }


function Preview() {
    document.getElementById("view").innerHTML = '<img id="image_view" name="image_view" >';
    if (document.getElementById("List").selectedIndex == -1) {
        alert(GetStr(language, "Scanner Not Found"));
        return;
    }
    str = "SetParams?";
    str += "device-name=" + document.getElementById("List").value;

    str += "&scanmode=preview";
    str += "&paper-size=" + document.getElementById("sel_paper-size").value;
    str += "&source=" + document.getElementById("sel_source").value;
    str += "&resolution=100";// + document.getElementById("sel_resolution").value;
    str += "&mode=" + document.getElementById("sel_mode").value;
    if (document.getElementById("sel_imgfmt") != null)
        str += "&imagefmt=" + document.getElementById("sel_imgfmt").value;
    else
        str += "&imagefmt=jpg";
    str += "&brightness=" + document.getElementById("range_brightness").value;
    str += "&contrast=" + document.getElementById("range_contrast").value;
    str += "&quality=" + document.getElementById("range_quality").value;
    str += "&swcrop=" + document.getElementById("chk_swcrop").checked;
    str += "&swdeskew=" + document.getElementById("chk_swdeskew").checked;
    str += "&front-eject=" + document.getElementById("chk_fronteject").checked;

    str += "&manual-eject=" + document.getElementById("chk_manualeject").checked;
    str += "&remove-blank-page=" + document.getElementById("chk_removeblankpage").checked;
    str += "&multifeed-detect=" + document.getElementById("chk_multifeeddetect").checked;
    if (document.getElementById("chk_denoise") != null)
        str += "&denoise=" + document.getElementById("chk_denoise").checked;
    if (document.getElementById("chk_rm_blackedges") != null)
        str += "&remove-blackedges=" + document.getElementById("chk_rm_blackedges").checked;
    
    Connection("GetPreview", RecvData, str);
}

function CloseStatus(obj) {
    var maskId = "mask";
    var dialogId = "dialogId";
    if (document.getElementById(dialogId)) {
        document.getElementById(dialogId).parentNode.removeChild(document.getElementById(dialogId));
    }
    if (document.getElementById(maskId)) {
        document.getElementById(maskId).parentNode.removeChild(document.getElementById(maskId));
    }
    return;
}

function changeValue(value, id) {
    document.getElementById(id).value = value;
}

function view_front() {
    document.getElementById("view_f").className = "buttonD";
    document.getElementById("view_b").className = "buttonU";

    if (PreviewObj.format != "jpeg") {
        PreviewObj.ShowPreviewImage("view", 0);
    }
    else {
        PreviewObj.ShowPreviewImagejpeg("view", 0);
    }

}

function view_back() {
    document.getElementById("view_f").className = "buttonU";
    document.getElementById("view_b").className = "buttonD";

    if (PreviewObj.format != "jpeg") {
        PreviewObj.ShowPreviewImage("view", 1);
    }
    else {
        PreviewObj.ShowPreviewImagejpeg("view", 1);
    }
}

function GetDevicesList() {
    document.getElementById("List").options.length = 0;
    Connection("GetDevicesList", RecvData, "GetDevicesList");
}

function RecvStatus(status) {
    var maskId = "mask";
    var dialogId = "dialogId";
    if (document.getElementById(dialogId)) {
        document.getElementById(dialogId).parentNode.removeChild(document.getElementById(dialogId));
    }
    if (document.getElementById(maskId)) {
        document.getElementById(maskId).parentNode.removeChild(document.getElementById(maskId));
    }

    var maskDiv = document.createElement("div");
    maskDiv.id = maskId;
    maskDiv.style.position = "fixed";
    maskDiv.style.zIndex = "1";
    maskDiv.style.width = window.innerWidth + "px";
    maskDiv.style.height = window.innerHeight + "px";
    maskDiv.style.top = "0px";
    maskDiv.style.left = "0px";
    maskDiv.style.background = "gray";
    maskDiv.style.filter = "alpha(opacity=10)";
    maskDiv.style.opacity = "0.50";
    document.body.appendChild(maskDiv);

    //Dialog 
    var dialogDiv = document.createElement("div");
    dialogDiv.id = dialogId;
    dialogDiv.style.position = "fixed";
    dialogDiv.style.zIndex = "9999";
    dialogDiv.style.width = "200px";
    dialogDiv.style.height = "100px";

    dialogDiv.style.top = (parseInt(window.innerHeight) - 100) / 2 + "px";
    dialogDiv.style.left = (parseInt(window.innerWidth) - 200) / 2 + "px";
    dialogDiv.style.background = " #FFFFFF ";
    dialogDiv.style.border = "1px solid gray";
    dialogDiv.style.padding = "5px";
    dialogDiv.style.borderRadius = "5px";
    if (status == 0) {
        dialogDiv.innerHTML = "<div style='text-align:center;line-height:100px'>" + GetStr(language, "Connecting") + "...</div>";
    }
    else {
        dialogDiv.innerHTML = "<div style='text-align:center;line-height:100px'>" + GetStr(language, "Scanning") + "  " + status.substr(7, 8) + "  " + GetStr(language, "page") + "...</div>";
    }
    document.body.appendChild(dialogDiv);                    // Append <button> to <body>
}

function setCookie(c_name, value, expiredays) {
    var exdate = new Date();
    exdate.setDate(exdate.getDate() + 365);
    document.cookie = c_name + "=" + escape(value) + ((expiredays == null) ? "" : ";expires=" + exdate.toGMTString());
}

function getCookie(c_name) {
    if (document.cookie.length > 0) {
        c_start = document.cookie.indexOf(c_name + "=");
        if (c_start != -1) {
            c_start = c_start + c_name.length + 1;
            c_end = document.cookie.indexOf(";", c_start);
            if (c_end == -1)
                c_end = document.cookie.length;
            var str = unescape(document.cookie.substring(c_start, c_end));
            //alert(str);
            setCookie(c_name, str, 365);
            return str;
        }
    }
    return "";
}

function ArraySearch(buf, key) {
    var i;
    for (i = 0 ; i < buf.length ; i++) {
        if (buf[i].indexOf(key) == 0) {
            return buf[i].substring(key.toString().length + 1, buf[i].lengh);
        }
    }
    return -1;
}

function GetStr(language, key) {
    if (LANGUAGE[language] === undefined) {
        if (language == "English") {
            return key;
        }
        else {
            alert("not support " + language);
        }
    }
    else if (LANGUAGE[language][key] === undefined) {
        return key;
    }
    else {
        return LANGUAGE[language][key];
    }

}

function getImageFile(thumbnail) {
    if(thumbnail == true)
        getImageFileStream("true", document.getElementById("text_Getthumfilename").value, "true", "false", RecvData_demo);
    else if(document.getElementById("text_Getfilename").value.search('.pdf') != -1)
        getImageFileStream("true", document.getElementById("text_Getfilename").value, "false", "false", RecvData_demo_pdf);
    else
        getImageFileStream("true", document.getElementById("text_Getfilename").value, "false", "false", RecvData_demo);
};

function DownloadImageFile() {
    getImageFileStream("false", document.getElementById("text_dnloadimgfilename").value, "false", "false", RecvDataAndDownload);
};

function DownloadImageFile_hidden() {
    getImageFileStream("false", document.getElementById("text_dnloadimgfilename_hidden").value, "false", "false", RecvDataAndDownload_hidden);
};

function RecvData_demo(obj) {
    if (obj.data instanceof ArrayBuffer || obj.data instanceof Array) 
    {

        var bytes;
        if (obj.data instanceof Array)
            bytes = obj.data;
        else
            bytes = new Uint8Array(obj.data);
      
        var  url = 'data:image/jpeg;base64,' + encode(bytes);
       
        var skippr_id = 'skippr' +  skippr_idx;
        skippr_idx++;
        var skippr_newid = 'skippr' +  skippr_idx;
        if (skippr_id!="") 
            var obj_ = document.getElementById(skippr_id);

            　
        var parentObj = obj_.parentNode;
        parentObj.removeChild(obj_);
        var skippr2 = document.createElement("div");
        if (skippr_newid!="") 
            skippr2.setAttribute("id", skippr_newid);
        parentObj.appendChild(skippr2);

        var div3 = document.createElement("div");
        div3.setAttribute("id", "picid1"); 
  
        var img = new Image(); 

        img.onload = function(){
            var scale = 1;
            if (img.height > skipprheight) {
                scale = skipprheight / img.height;
            }
            if ((img.width * scale) > skipprwidth) {
                scale = skipprwidth / img.width;
            }
                    
            img.style.height = parseInt(img.height * scale) + "px";
            img.style.width = parseInt(img.width * scale) + "px";
     
            var attr = ''.concat('background-image: url(', url,  '); ', 'background-size:', img.style.width, ' ', img.style.height, '; ', ' background-repeat: no-repeat;');
            div3.setAttribute("style", attr);
            skippr2.appendChild(div3);   

            var skippr_id_ = '#skippr' +  skippr_idx;

            $(function(){
                $(skippr_id_).skippr({
                    navType: 'bubble'
                });
            });
            img.onload =null;
        };
        img.src = url; 
        nPicIndex = 1;
    }
    else {
        if (obj.data.toString() == "error:file not found") {
            alert("Can't Find Any Files");
        }
        else {
            if (obj.data.toString() != "finish")
            {
                alert(obj.data.toString());
            }
        }

    }
}

function RecvData_demo_pdf(obj){
    if (obj.ret == 0)
    {
        var skippr_id = 'skippr' +  skippr_idx;
        skippr_idx++;
        var skippr_newid = 'skippr' +  skippr_idx;
        if (skippr_id!="") 
            var obj_ = document.getElementById(skippr_id);

        var parentObj = obj_.parentNode;
        parentObj.removeChild(obj_);
        var skippr2 = document.createElement("div");
        if (skippr_newid!="") 
            skippr2.setAttribute("id", skippr_newid);
        parentObj.appendChild(skippr2);

        var iframe = document.createElement('iframe');
        iframe.id = "picid1";
        iframe.setAttribute("src", obj.data);
        iframe.setAttribute("width", "100%");
        iframe.setAttribute("height", "100%");
    
        skippr2.appendChild(iframe);
 
        var skippr_id_ = '#skippr' +  skippr_idx;
        $(function(){
            $(skippr_id_).skippr({
                navType: 'bubble'
            });
        });                       
    }
    else {
        if (obj.data.toString() == "error:file not found") {
            alert("Can't Find Any Files");
        }
        else {
            if (obj.data.toString() != "finish")
            {
                alert(obj.data.toString());
            }
        }

    }
}

function RecvDataAndDownload(obj) {
    // download image file
    if (obj.ret == 0)
    {
        var aUrl = window.URL;
        var a = document.createElement('a');
        var file = new Blob([obj.data], {type:'application/octet-binary'});
        a.style = "display: none";
        a.href = aUrl.createObjectURL(file);
        a.download = document.getElementById("text_dnloadimgfilename").value;

        try {
            window.navigator.msSaveOrOpenBlob(file, a.download); // for IE
        } catch(err) {
            // for Chrome, Firefox
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    }
}

function RecvDataAndDownload_hidden(obj) {
    // download image file
    if (obj.ret == 0)
    {
        var aUrl = window.URL;
        var a = document.createElement('a');
        var file = new Blob([obj.data], {type:'application/octet-binary'});
        a.style = "display: none";
        a.href = aUrl.createObjectURL(file);
        a.download = document.getElementById("text_dnloadimgfilename_hidden").value;

        try {
            window.navigator.msSaveOrOpenBlob(file, a.download); // for IE
        } catch(err) {
            // for Chrome, Firefox
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    }
}

function RecvDataAndFastDownload(obj) {
    // download image file
    if (obj.ret == 0)
    {
        var aUrl = window.URL;
        var a = document.createElement('a');
        var file = new Blob([obj.data], {type:'application/octet-binary'});
        a.style = "display: none";
        a.href = aUrl.createObjectURL(file);
        a.download = ImgList[nImgIndex];
        nImgIndex++;
        try {
            window.navigator.msSaveOrOpenBlob(file, a.download); // for IE
        } catch(err) {
            // for Chrome, Firefox
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    }
    if (obj.ret == -1)
    {
        if( nImgIndex == ImgList.length)
            nImgIndex = ImgList.length = 0;
    }
}

function encode(input) {
    var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    var output = "";
    var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
    var i = 0;

    while (i < input.length) {
        chr1 = input[i++];
        chr2 = i < input.length ? input[i++] : Number.NaN; // Not sure if the index 
        chr3 = i < input.length ? input[i++] : Number.NaN; // checks are needed here

        enc1 = chr1 >> 2;
        enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
        enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
        enc4 = chr3 & 63;

        if (isNaN(chr2)) {
            enc3 = enc4 = 64;
        } else if (isNaN(chr3)) {
            enc4 = 64;
        }
        output += keyStr.charAt(enc1) + keyStr.charAt(enc2) +
        keyStr.charAt(enc3) + keyStr.charAt(enc4);
    }
    return output;
}
function sleep(milliseconds) {
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
        if ((new Date().getTime() - start) > milliseconds) {
            break;
        }
    }
}

function DelFile() {
    RmFiles(RecvData, document.getElementById("text_delfilename").value);
}

function OCR() {
    var recognize_type = "";
    var fulltext_type = "";
    switch (document.getElementById("sel_recognize_type").value) {
        case "ID Card":
            recognize_type = "id";
            break;
        case "Insurance Card":
            recognize_type = "insurance";
            break;
        case "Passport":
            recognize_type = "passport";
            break;
        case "Passport-Copy":
            recognize_type = "passport-loose";
            break;
        case "USDL":
            recognize_type = "usdl";
            break;
        case "IDID":
            recognize_type = "idid";
            break;
        case "CN_VAT_INVOICE":
            recognize_type = "cn_vat_invoice";
            break;
        case "Full Text":
            recognize_type = "fulltext";
            fulltext_type = document.getElementById("sel_fulltext_type").value;
            break;
        case "Barcode":
            recognize_type = "barcode";
            break;
        case "Auto":
            recognize_type = "auto";
            break;
        case "none":
            recognize_type = "none";
            break;
        case "TWRC":
            recognize_type = "twrc";
            break;
        case "TD2ID":
            recognize_type = "td2id";
            break;
    }
    
    GetRecognizeData(RecvData, document.getElementById("text_OCRfilename").value, recognize_type, fulltext_type);
}

function DownloadFile() {

    var skippr_div = '#skippr' +  skippr_idx + ':has(div)';
    var skippr_iframe = '#skippr' +  skippr_idx + ':has(iframe)';
    
    if ($( skippr_div ).length==0 && $( skippr_iframe ).length==0)
        return;

    var pic_id = '#picid' +  document.getElementById('picidx').value;

    if($( skippr_iframe ).length >0)
    {
        var pic_id_ = 'picid' +  document.getElementById('picidx').value;
        var bg = document.getElementById(pic_id_).src;
    }
    else if ($( skippr_div ).length >0)  //if iframe exist, then div has same number
    {
        var bg = $(pic_id).css("background-image");
    }
   
    if(bg.search("file:///") != -1 || bg.search("SavePath") != -1) //from scan image
    {
          
        bg = bg.replace('file:///', '').replace(/.*\s?url\([\'\"]?/, '').replace(/[\'\"]?\).*/, '');
        
        var bg2 = bg.replace("FilePath:", "");
        var bg2 = bg.replace("SavePath:", "");
        var bg3 = bg2.replace(String.fromCharCode(92,92), String.fromCharCode(47));
        var bg4 = bg3.replace(/\\/g, String.fromCharCode(47));
        var inx = bg4.lastIndexOf('.');
        var inx2 = bg4.lastIndexOf(String.fromCharCode(47));
        var bg5 = bg4.substr(inx2+1, inx+4);
        var dnloadimgfilename = document.getElementById('text_dnloadimgfilename_hidden');
        dnloadimgfilename.setAttribute("value", bg5);
        document.getElementById("btn_download_hidden").click();     
    }
    else //from "Get Image File" button
    {
        var dnloadimgfilename = document.getElementById('text_dnloadimgfilename_hidden');
        dnloadimgfilename.setAttribute("value", document.getElementById("text_Getfilename").value);
        document.getElementById("btn_download_hidden").click(); 
        //alert(document.getElementById("text_Getfilename").value);
    }
};

function DownloadAllFile() {
    var pic_id="";
    var bg="", bg2="", bg3="", bg4="", bg5="";
    var inx = 0, inx2 = 0;
    var dnloadimgfilename;

    var skippr_div = '#skippr' +  skippr_idx + ':has(div)';
    var skippr_iframe = '#skippr' +  skippr_idx + ':has(iframe)';
    if ($( skippr_div ).length == 0 && $( skippr_iframe ).length == 0)         
        return;

    var piccount = parseInt(document.getElementById('picallcount').value);

    for (idx = 1; idx <= piccount; idx ++){ 
        pic_id = '#picid' +  idx;

        if($( skippr_iframe ).length >0)
        {
            var pic_id_ = 'picid' +  document.getElementById('picidx').value;
            var bg = document.getElementById(pic_id_).src;
        }
        else if ($( skippr_div ).length >0)  //if iframe exist, then div has same number
        {
            var bg = $(pic_id).css("background-image");
        }
        
        if(bg.search("file:///") != -1 || bg.search("SavePath") != -1) //from scan image
        {
            bg = bg.replace('file:///', '').replace(/.*\s?url\([\'\"]?/, '').replace(/[\'\"]?\).*/, '');
            bg2 = bg.replace("FilePath:", "");
            bg2 = bg.replace("SavePath:", "");
            bg3 = bg2.replace(String.fromCharCode(92,92), String.fromCharCode(47));
            bg4 = bg3.replace(/\\/g, String.fromCharCode(47));
            inx = bg4.lastIndexOf('.');
            inx2 = bg4.lastIndexOf(String.fromCharCode(47));
            bg5 = bg4.substr(inx2+1, inx+4);
            dnloadimgfilename = document.getElementById('text_dnloadimgfilename_hidden');
            dnloadimgfilename.setAttribute("value", bg5);
            document.getElementById("btn_download_hidden").click();
        }
        else //from "Get Image File" button
        {
            dnloadimgfilename = document.getElementById('text_dnloadimgfilename_hidden');
            dnloadimgfilename.setAttribute("value", document.getElementById("text_Getfilename").value);
            document.getElementById("btn_download_hidden").click(); 
        }
    }
};

//--------------------------------------------------------------
//------------------------copy cmd------------------------------
//--------------------------------------------------------------

function copycmd(){
    
    var str;
    //str = "SetParams?" + "\r\n";
    str += "device-name = " + document.getElementById("List").value + "\r\n";
    str += "scanmode = " + document.getElementById("sel_mode").value + "\r\n";
    str += "paper-size = " + document.getElementById("sel_paper-size").value + "\r\n";
    str += "source = " + document.getElementById("sel_source").value + "\r\n";
    str += "resolution = " + document.getElementById("sel_resolution").value + "\r\n";
    str += "mode = " + document.getElementById("sel_mode").value + "\r\n";
    if (document.getElementById("sel_imgfmt") != null)
        str += "imagefmt = " + document.getElementById("sel_imgfmt").value + "\r\n";
    str += "brightness = " + document.getElementById("range_brightness").value + "\r\n";
    str += "contrast = " + document.getElementById("range_contrast").value + "\r\n";
    str += "quality = " + document.getElementById("range_quality").value + "\r\n";
    str += "swcrop = " + document.getElementById("chk_swcrop").checked + "\r\n";
    str += "swdeskew = " + document.getElementById("chk_swdeskew").checked + "\r\n";
    str += "front-eject = " + document.getElementById("chk_fronteject").checked + "\r\n";
    str += "manual-eject = " + document.getElementById("chk_manualeject").checked + "\r\n";
    str += "duplexmerge = " + document.getElementById("chk_duplexmerge").checked + "\r\n";
    str += "remove-blank-page = " + document.getElementById("chk_removeblankpage").checked + "\r\n";
    str += "multifeed-detect = " + document.getElementById("chk_multifeeddetect").checked + "\r\n";
    if (document.getElementById("sel_imgfmt") != null)
        str += "denoise = " + document.getElementById("chk_denoise").checked + "\r\n";
    if (document.getElementById("chk_rm_blackedges") != null)
        str += "remove-blackedges = " + document.getElementById("chk_rm_blackedges").checked + "\r\n";

    if (document.getElementById("sel_recognize_type") != null) {
        switch (document.getElementById("sel_recognize_type").value) {
            case "ID Card":
                str += "recognize-type = id" + "\r\n";
                break;
            case "Insurance Card":
                str += "recognize-type = insurance" + "\r\n";
                break;
            case "Passport":
                str += "recognize-type = passport" + "\r\n";
                break;
            case "USDL":
                str += "recognize-type = usdl" + "\r\n";
                break;
            case "IDID":
                str += "recognize-type = idid" + "\r\n";
                break;
            case "CN_VAT_INVOICE":
                str += "recognize-type = cn_vat_invoice" + "\r\n";
                break;
            case "Full Text":
                str += "recognize-type = fulltext" + "\r\n";
                break;
            case "Barcode":
                str += "recognize-type = barcode" + "\r\n";
                break;
            case "Auto":
                str += "recognize-type = auto" + "\r\n";
                break;
            case "none":
                str += "recognize-type = none" + "\r\n";
                break;
            case "TWRC":
                str += "recognize-type = twrc" + "\r\n";
                break;
            case "TD2ID":
                str += "recognize-type = td2id" + "\r\n";
                break;
        }
    }

    if (document.getElementById("sel_recognize_type") != null) {
        if (document.getElementById("sel_recognize_type").value == "Full Text")
            str += "&fulltext-type = " + document.getElementById("sel_fulltext_type").value + "\r\n";
            
        if (document.getElementById("sel_recognize_lang") != null) {
            switch (document.getElementById("sel_recognize_lang").value) {
                case "default":
                    str += "recognize-lang = default" + "\r\n";
                    break;
                case "en":
                    str += "recognize-lang = en" + "\r\n";
                    break;
                case "zh-tw+en":
                    str += "recognize-lang = zh-tw+en" + "\r\n";
                    break;
                case "zh-cn+en":
                    str += "recognize-lang = zh-cn+en" + "\r\n";
                    break;
                case "de+en":
                    str += "recognize-lang = de+en" + "\r\n";
                    break;
                case "jp":
                    str += "recognize-lang = jp" + "\r\n";
                    break;
                case "kp":
                    str += "recognize-lang = kp" + "\r\n";
                    break;
                case "vn+en":
                    str += "recognize-lang = vn+en" + "\r\n";
                    break;
                case "br":
                    str += "recognize-lang = br" + "\r\n";
                    break;
                case "pt":
                    str += "recognize-lang = pt" + "\r\n";
                    break;
            }
        }
    }

    document.getElementById("text_cmd_hidden").value = str;
    document.getElementById("btn_cmd_hidden").click();
    document.getElementById("btn_cmd_hidden").click();
}

document.addEventListener("DOMContentLoaded", function () {
        // 取得所有有 .item 類別的 DMO 元素
        var items = document.querySelectorAll('.item');

        // 將所有找到的元素一個個丟進去 copyToClipBoard 處理，添加監聽事件
        //for (var i = 0; i < items.length; ++i) {
        //    copyToClipBoard(items[i]);
        //}
        copyToClipBoard(items[0]);    
        function copyToClipBoard(item) {       
            var btnCopy = item.querySelector('.btn-copy');    
            btnCopy.addEventListener('click', function (event) {     
                var copyArea = item.querySelector('.copy-area');
                var range = document.createRange();
                range.selectNode(copyArea);
        
                window.getSelection().addRange(range);
                try {
                    var copyStatus = document.execCommand('copy');
                    var msg = copyStatus ? 'copied' : 'failed';
                    console.log(msg);
                } catch (error) {
                    console.log('Oops!, unable to copy');
                }
                window.getSelection().removeAllRanges();
            });
        }
    });

//--------------------------------------------------------------
//------------------------copy cmd end--------------------------
//--------------------------------------------------------------





































