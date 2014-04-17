// startup vars
var rdappHeight = 1350,
    rdappWidth = 1106;

// wrapper for our "classes", "methods" and "objects"
window.RDViewer = {};

//loader
(function(){

    var mapItems, distroData, dataload;

    function Loader() {

    }

    Loader.prototype.loadData = function() {

        var storygroupid = document.getElementById("canvasRegionalDistribution").getAttribute("data-haplogroup-id");

        // mapItems stuff
        dataload = false;

        $.getJSON('https://api.moffpart.com/api/1/results/getHaplogroup?q=""&c=regionalDistribution&callback=?', function(ret) {

            mapItems = ret;

            $.getJSON('https://api.moffpart.com/api/1/results/getHaplogroup?q={"storygroupid":"'+ storygroupid +'"}&c=c2Regional&callback=?', function(ret2) {

                distroData = ret2;
                parseData();

            });
        });

        // preloader graphics
        var prossElement = document.createElement('div'),
            dialogElement = document.createElement('div'),
            spinElement = document.createElement('div'),
            paraElement = document.createElement('p'),
            textItem = document.createTextNode("Loading mapItems…");

        prossElement.setAttribute('id', "Processing");
        prossElement.setAttribute('Style', "height:" + rdappHeight + "px; width:" + rdappWidth + "px;");
        dialogElement.setAttribute('class','dialog');
        spinElement.setAttribute('class','spinner-container');

        paraElement.appendChild(textItem);
        dialogElement.appendChild(paraElement);
        dialogElement.appendChild(spinElement);
        prossElement.appendChild(dialogElement);
        document.getElementById("canvasRegionalDistribution").appendChild(prossElement);
        $('#Processing').show();
    };

    function parseData() {

        dataload = true;
    }

    Loader.prototype.loadStatus = function() {

        return dataload
    };

    Loader.prototype.returnData = function() {

        allData = {
            mapItems:mapItems,
            yDistroData:distroData
        };
        return allData
    };

    RDViewer.Loader = Loader;

})();

// artboard
(function(){

    // data
    var drawItemsData, distroData, interactionObject;

    // zoom params
    var zoomRatio = 1;


    function Artboard(){

        interactionObject = {
            state:0,
            data:"Nil"
        };
    }

    Artboard.prototype.dataLoad = function (data){

        drawItemsData  = data.mapItems;
        distroData = data.yDistroData;

    };

    Artboard.prototype.zoom = function (user){

        zoomRatio = user.zoomValue;
    };

    Artboard.prototype.background = function (displayObject){

        // area to add stuff ----->

        var dataSource = distroData[0];
        var shieldParams = [];

        for (var i = 0; i < drawItemsData.length; i++) {

            if (drawItemsData[i].region === "shields") {shieldParams = drawItemsData[i].shieldArray; continue; }
            var area = drawItemsData[i].region;
            var color = "#C7C7C7";

            for(var region in dataSource){
                if (dataSource.hasOwnProperty(region)) {

                    if (region === area) {color = dataSource[region].color}
                }
            }

            var traceArray = drawItemsData[i].traceArray;
            var areaDraw = new createjs.Shape();
            areaDraw.graphics.beginStroke("#FFF");
            areaDraw.graphics.setStrokeStyle(1,"round");
            areaDraw.graphics.beginFill(color);

            for (var j = 0; j < traceArray.length; j++) {

                var traceObject = traceArray[j];
                for(var key in traceObject){

                    if (traceObject.hasOwnProperty(key)) {

                        if (key === "moveTo") {

                            areaDraw.graphics.moveTo(
                                Number(traceObject[key][0])*zoomRatio,
                                Number(traceObject[key][1])*zoomRatio)
                        }
                        if (key === "lineTo") {

                            areaDraw.graphics.moveTo(
                                Number(traceObject[key][0])*zoomRatio,
                                Number(traceObject[key][1])*zoomRatio)
                        }
                        if (key === "bezierCurveTo") {
                            areaDraw.graphics.bezierCurveTo(
                                Number(traceObject[key][0])*zoomRatio,
                                Number(traceObject[key][1])*zoomRatio,
                                Number(traceObject[key][2])*zoomRatio,
                                Number(traceObject[key][3])*zoomRatio,
                                Number(traceObject[key][4])*zoomRatio,
                                Number(traceObject[key][5])*zoomRatio
                            )}
                    }
                }
            }

            areaDraw.graphics.closePath ();
            displayObject.addChild(areaDraw);

        }

        var statisticsContainer = new createjs.Container();
        displayObject.addChild(statisticsContainer);

        for (var k = 0; k < shieldParams.length; k++) {

            var shildyThing = new createjs.Shape();
            shildyThing.graphics.setStrokeStyle(3).beginStroke("#888").beginFill("#575756").drawRoundRect(shieldParams[k].x*zoomRatio,shieldParams[k].y*zoomRatio,111*zoomRatio,45*zoomRatio,8*zoomRatio,8*zoomRatio);
            statisticsContainer.addChild(shildyThing);

            var mapArea = shieldParams[k].region,
                percent;

            for(var mapRegion in dataSource){

                if (dataSource.hasOwnProperty(mapRegion)) {

                    if (mapRegion === mapArea) {percent = dataSource[mapRegion].percentage}
                }
            }

            var percentageText = new createjs.Text(percent + "%", "32px Petrona", "#fff");
            percentageText.x = shieldParams[k].x*zoomRatio + 55*zoomRatio;
            percentageText.y = shieldParams[k].y*zoomRatio + 5*zoomRatio;
            percentageText.textAlign = "center";
            statisticsContainer.addChild(percentageText);

            var titleText = new createjs.Text(shieldParams[k].title, "18px Petrona", "#333");
            titleText.x = shieldParams[k].x*zoomRatio + 55*zoomRatio;
            titleText.y = shieldParams[k].y*zoomRatio + 50*zoomRatio;
            titleText.textAlign = "center";
            statisticsContainer.addChild(titleText);
        }

        // <------ area to add stuff

        displayObject.updateCache("source-overlay");
    };

    Artboard.prototype.redraw = function (displayObject){

        // area to add stuff ----->

        // <------ area to add stuff
    };

    RDViewer.Artboard = Artboard;

})();


// renderer
(function(){

    var stats, canvas, stage, view, control, highlight,
        artboard, artboardBackground, artboardRedraw, artboardEventArea,
        dashboardRedraw, dashboardBackground, dashboardEventArea,
        highlightContainer, highlightBackground, highlightRedraw, highlightEventArea,
        loader, loadStatus;

    RDViewer.loadInit = function(){

        /*stats = new Stats();
         $('.block').prepend(stats.domElement);*/

        // prepare the view
        view = new RDViewer.Artboard(rdappWidth,rdappHeight);

        // wrdloader init
        loader = new RDViewer.Loader();
        loadStatus = false;
        loader.loadData();

        TweenMax.ticker.addEventListener("tick", loadRequest);
    };

    function init() {

        // prepare our canvas
        canvas = document.createElement( 'canvas' );
        canvas.width = rdappWidth;
        canvas.height = rdappHeight;
        document.getElementById("canvasRegionalDistribution").appendChild(canvas);

        stage = new createjs.Stage(canvas);
        stage.enableMouseOver(10);

        // artboard
        artboard = new createjs.Container();
        //artboard.y = 20;
        stage.addChild(artboard);

        artboardBackground = new createjs.Container();
        artboardBackground.cache(0, 0, rdappWidth, rdappHeight);
        artboard.addChild(artboardBackground);
        view.background(artboardBackground);

        artboardRedraw = new createjs.Container();
        artboard.addChild(artboardRedraw);

        TweenMax.ticker.addEventListener("tick", frameRender);

    }

    function loadRequest(event) {

        var loadFinished = loader.loadStatus();
        if (loadFinished) {
            loadStatus = true;
            var data = loader.returnData();
            view.dataLoad(data);
            removeLoader()
        }
    }

    function removeLoader() {

        $('#Processing').remove();
        TweenMax.ticker.removeEventListener("tick", loadRequest);
        init();
    }

    function frameRender(event) {

        //stats.begin();

        //artboardRedraw.removeAllChildren();

        //view.redraw(artboardRedraw);

        // update stage
        stage.update();

        //stats.end();
    }

})();

//Init
RDViewer.loadInit();

// utils

//sorts array by key
/*function sortByKey(array, key) {
    return array.sort(function(a, b) {
        var
            x = a[key],
            y = b[key];
        return ((x > y) ? -1 : ((x < y) ? 1 : 0));
    });
}*/
