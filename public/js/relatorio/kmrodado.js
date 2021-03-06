
// boolean
var _mostrarRotas = false;
var _mostrarPontos = false;
var _mostrarDirecao = false;
var _mostrarCalor = false;
//saving the data
var _rotas = [];
var _pontos = [];


var _novarota = [] ;
var _novarotaLatLng = [];
var _allLatLng = [];
var _map;
var idbus = false;

var directionsDisplay;
var directionsService = new google.maps.DirectionsService();    


function getBaseUrl() {
    var re = new RegExp(/^.*\//);
    return re.exec(window.location.href);
}



function arunQuery() {
    startLoadingAnimation();
    if($('#min-pt-by-bus').val())
        minPointsByIdBus = $('#min-pt-by-bus').val() ;
    if($('#max-distance').val())
        maxDistance =  $('#max-distance').val();

   


    //TODO should check if the date is not to big...
    //TODO should check if the initialDate < finalDate
    //TODO should check if the query is in the same month

    var initialDate = $("#initialDate").val();
    var finalDate = $("#finalDate").val();

    if (!initialDate || !finalDate)
    {
        alert("Por favor, preencha as datas")
        return;
    }
    var month = moment(initialDate,"DD/MM/YYYY HH:mm:ss").format("YYYYMM");
    initialDate = moment(initialDate,"DD/MM/YYYY HH:mm:ss").format("YYYY-MM-DD HH:mm:ss");
    finalDate = moment(finalDate,"DD/MM/YYYY HH:mm:ss").format("YYYY-MM-DD HH:mm:ss");



    _mostrarRotas = ($('#mostrar-rotas').is(':checked')) ? true : false ;
    _mostrarPontos = ($('#mostrar-pontos').is(':checked')) ? true : false ;
    _mostrarDirecao = ($('#mostrar-direcao').is(':checked')) ? true : false ;
    _mostrarCalor = ($('#mostrar-calor').is(':checked')) ? true : false ;
   


    //Making the query
    var where ="";
    var and = false;
    if($('#linea').val()){
        where += 'LINHA = "'+ $('#linea').val()+'"';
        line =  $('#linea').val();
        and = true;
    }else{
        line = null;
    }
    if($('#idBus').val()){
        if(and) where += " AND ";else and=true;
        where += 'ORDEM ="'+$('#idBus').val()+'"';
        idbus = true;
    }
    if(and) where+= " AND ";

    var query = 'SELECT * FROM [riobus-analytics:onibus.gps_'+month+'] '+
        'WHERE  '+where+' VELOCIDADE >=0 AND TIMESTAMP(DATAHORA) > "'+initialDate+'" '+
        'AND TIMESTAMP(DATAHORA) < "'+finalDate+'" ORDER BY ORDEM,DATAHORA';



    //TODO should send something nicer;;;
    var url = getBaseUrl()+'api/bigquery?query='+query;

    console.log("querying...");
   // console.log(url);
    $.getJSON(url, function(data, status) {

        var stateValues = data;
       // console.log(stateValues);

        endLoadingAnimation();
        _map = setUpGoogleMaps();
        document.getElementById("resposta").innerHTML = '';

        $.each(stateValues, function(i ,item){
            addRota(item);
           
        });

        if(_mostrarCalor){
                //console.log(_allLatLng.length);  
                createCalor(_allLatLng);
        }
        if(line != null)addDefaultRota(line, _map);

       
    });


}


function addDefaultRota(line)
{
    var urlLine = "http://rest.riob.us/itinerary/"+line;
    $.getJSON(urlLine, function(data, status) {
        //console.log(data);
        var rota = [];
        data.map(function(data) {
            if(JSON.stringify(data) != "{}") {
                rota.push(new google.maps.LatLng(data.latitude, data.longitude));
            }
        });
        var rotas = new google.maps.Polyline({
            path: rota,
            map: _map,
            strokeColor: "#000000",
            strokeOpacity: 0.5,
            strokeWeight: 2,
            fillOpacity : 0
        });
        rotas.setMap(_map);
    });
}


function setUpGoogleMaps()
{
    directionsDisplay = new google.maps.DirectionsRenderer();

    var latlng = new google.maps.LatLng(-22.91325725,-43.6628216475272);
    var options = {
        center: latlng,
        zoom: 10,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };

    var map = new google.maps.Map(document.getElementById("map"), options);
    $('#map').show();
    directionsDisplay.setMap(map);

    return map;
}


function addRota(onibus)
{
    //console.log("Onibus "+pos);
   
    //onibus = [[dataHora, ordem ,latitude, longitude,velocidade, direcao]];
    var onibusLength = onibus.length ;

    var onibusTotalDistance = 0;
    var onibusTotalDistanceDate = 0;
    if(onibusLength > minPointsByIdBus)
    {
        //trying to make a nicer global route with direcao;
        //

        var tmp = [];
        var savedOnibus = [];
        var previousLatlng = new google.maps.LatLng(onibus[0][2], onibus[0][3]);
        var previousDataHora = onibus[0][0];
        var previousVelocidade = onibus[0][4];
        var currentLatLng;
        var currentDataHora;
        var currentVelocidade;

        var color = '#'+Math.floor(Math.random()*16777215).toString(16);//just random color,
        if(_mostrarCalor) _allLatLng.push(previousLatlng);
        tmp.push(previousLatlng);
        savedOnibus.push(onibus[0]);
        
        for(var i=1;i<onibus.length;i++)
        {

            if(onibus[i][2] != "" && onibus[i][3] != "") //lat lng not empty
            {
                currentLatLng  = new google.maps.LatLng(onibus[i][2], onibus[i][3]);
                if(_mostrarRotas || _mostrarPontos || _mostrarDirecao || _mostrarCalor)
                {
                    currentDataHora = onibus[i][0];
                    currentVelocidade = onibus[i][4];
                    var DatetimeDistance = calculateDistanceWithDatetime(previousDataHora,previousVelocidade, currentDataHora, currentVelocidade);
                    var GmapDistance = distanceBetweenTwoLatLngWithGmaps(previousLatlng, currentLatLng);
                    var sameHour = isSameHour(previousDataHora,currentDataHora);

                    if(GmapDistance < maxDistance) //distance between two
                    {
                        if(GmapDistance >= 0 && !sameHour) //we don't want to display the same point
                        {
                            if(_mostrarCalor) _allLatLng.push(currentLatLng);
                            if(_mostrarRotas || _mostrarPontos || _mostrarDirecao)
                            {
                                 onibusTotalDistanceDate += DatetimeDistance;
                                onibusTotalDistance += GmapDistance;
                                tmp.push(currentLatLng); //TODO should remove this and use savedOnibus...
                                savedOnibus.push(onibus[i]);
                            }  
                        }

                        previousLatlng = currentLatLng;
                        previousDataHora = currentDataHora;
                        previousVelocidade = currentVelocidade;
                    }
                    else
                    {
                       return;
                    }
                }
            }//endif lat long not empty
        }//enforeach



        if(idbus) tryRoute(tmp, color);
        //console.log("tryRoute "+ onibus[0][1]);

        if(_mostrarRotas){
            var rota = new google.maps.Polyline({
                path: tmp,
                map: _map,
                strokeColor: color,
                strokeOpacity: 0.8,
                strokeWeight: 0.8,
                fillOpacity : 0
            });

            rota.setMap(_map);
            //save rota
            _rotas['"'+onibus[0][1]+'"'] = rota;
        }

        //add markers

        if(_mostrarPontos) {
            _pontos['"'+onibus[0][1]+'"'] = [];
            for(i=0;i<tmp.length;i++){
                var html = '<div id="content">'+
                    '<div id="siteNotice">'+
                    '</div>'+
                    '<h1 id="firstHeading" class="firstHeading">'+savedOnibus[i][1]+'</h1>'+ //title
                    '<div id="bodyContent">'+
                    '<p>Hora : '+getReadableHora(savedOnibus[i][0])+'<br>'+
                    'Velocidade :'+savedOnibus[i][4]+' km/h</p>'+
                    '</div>'+
                    '</div>';

                _pontos['"'+onibus[0][1]+'"'][i] = createMarker(tmp[i], color, html);
            }
        }

        if(_mostrarDirecao){
            for(i=0;i<tmp.length;i++) {
                createArrow(tmp[i], savedOnibus[i][5], color);
            }
        }

     

        //add direçao
        if( _mostrarRotas || _mostrarPontos || _mostrarDirecao){
               //prepare output;
            var title = '' + onibus[0][1];
            var desc = ' <div class="col-sm-3"> '+  (onibusTotalDistance/1000).toFixed(2) + ' km </div>';
            desc += ' <div class="col-sm-3"> '+  (onibusTotalDistanceDate/1000).toFixed(2) + ' km </div>';
            desc += ' <div class="col-sm-3">'+tmp.length+'/'+onibus.length+'</div>';

            var response = '<div class="col-sm-12" style="color : '+color+'">';
            response += '<h4 class="col-sm-3"><span class="col-sm-6">'+title+'</span>';
            if(_mostrarRotas) response += '<span class="col-sm-3"><input id="OnibusId_'+onibus[0][1]+'" value="'+onibus[0][1]+'" type="checkbox" checked></span>'
            if(_mostrarPontos) response+= '<span class="col-sm-3"><input id="OnibusPontoId_'+onibus[0][1]+'" value="'+onibus[0][1]+'" type="checkbox" checked></span>'
            response += '</h4>';
            response += ''+desc + '</div>';

            response += "</div>";
            document.getElementById("resposta").innerHTML += response;
        }
     
    }
}


function toRadians (angle) {
    return angle * (Math.PI / 180);
}

function createArrow(latlng, direcao, color){
    var bool = true;
    if(direcao > 0 && direcao < 360){
        var lat = latlng.lat()+Math.cos(toRadians(direcao))*0.0005;
        var lng = latlng.lng()+Math.sin(toRadians(direcao))*0.0005;
        var latlng2 =  new google.maps.LatLng(lat,lng);
    }else{
        bool = false;
        console.log("dir "+ direcao);
    }
    if(bool){

        var lineSymbol = {
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW
        };

        var lineCoordinates = [
            latlng,
            latlng2
        ];

        var line = new google.maps.Polyline({
            path: lineCoordinates,
            icons: [{
                icon: lineSymbol,
                offset: '100%',
                strokeColor: color,
                fillColor : color
            }],
            map: _map
        });
    }

}

function createMarker(latlng,color, html) {

    //console.log(html);
    var newmarker = new google.maps.Marker({
        position: latlng,
        map: _map,
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 1,
            strokeWeight: 2,
            fillColor: color,
            strokeColor: color,
            fillOpacity : 1,
        },
    });

    newmarker['infowindow'] = new google.maps.InfoWindow({
        content: html
    });

    google.maps.event.addListener(newmarker, 'click', function() {
        this['infowindow'].open(_map, this);
    });

    return newmarker;
}


function createCalor(array) {
    var pointArray = new google.maps.MVCArray(array);

    var heatmap = new google.maps.visualization.HeatmapLayer({
    data: pointArray
  });

  heatmap.setMap(_map);
  heatmap.set('radius', 5);
  heatmap.set('opacity', 0.5);
   
}


function tryRoute(onibuses, color){
   // console.log("tryRoute");
  //  console.log(onibuses);
    if(onibuses.length >= 2)
    {
         sleep(1500).then(function() { 
            var start = onibuses.shift();
            var end = onibuses.shift(); 
            addRoute(start, end , color);
            onibuses.unshift(end);

            tryRoute(onibuses, color); // recall 
        }); 
    }
 
}

function sleep(ms)
{
    return(new Promise(function(resolve, reject) {        
        setTimeout(function() { resolve(); }, ms);        
    }));    
}

function addRoute(start, end, color) 
{       
    var request = 
    {
        origin: start, 
        destination: end,   
        travelMode: google.maps.DirectionsTravelMode.DRIVING,
    };

    directionsService.route(request, function(response, status) 
    {
        console.log(status);
        //console.log(response);
        if (status == google.maps.DirectionsStatus.OK) {
                //console.log(response.routes[0].overview_path);
               // directionsDisplay.setDirections(response);
                var rota = new google.maps.Polyline({
                path: response.routes[0].overview_path,
                map: _map,
                strokeColor: color,
                strokeOpacity: 1,
                strokeWeight: 3,
                fillOpacity : 1
            });

            rota.setMap(_map);
        }       

    });
}

function distanceBetweenTwoLatLngWithGmaps(LatLng1 , LatLng2) {
    return google.maps.geometry.spherical.computeDistanceBetween(LatLng1, LatLng2);
}

function calculateDistanceWithDatetime(previousDataHora,previousVelocidade, currentDataHora, currentVelocidade){

    var previous = moment.unix(previousDataHora);
    var current = moment.unix(currentDataHora);
    var time = (moment.duration(current - previous)._milliseconds );  //got the time in milliseconds

    previousVelocidade = ( previousVelocidade * 1000 ) / 3600; // in meters/seconds
    currentVelocidade =  ( currentVelocidade  * 1000 ) / 3600; // in meters/seconds
    var velocidadeMedia = (previousVelocidade + currentVelocidade) / 2

    var distanciaPercorrida = velocidadeMedia * time  / 1000 ;

    return distanciaPercorrida;
}

function isSameHour(previousDataHora,currentDataHora){
    var previous = moment.unix(previousDataHora);
    var current = moment.unix(currentDataHora);
    var time = (moment.duration(current - previous)._milliseconds );
    return (time/1000 < 1); // > 1 second

}

function getReadableHora(hora){
    return moment.unix(hora).format("DD/MM/YYYY HH:mm:ss");
}



//events listener

$(document).ready(function () {
    $('#resposta').on('click', '[id^="OnibusId_"]', function(){
        onibus = $(this).val();
        rota = _rotas['"'+onibus+'"'];

        if ($(this).is(':checked')) {
            rota.setMap(_map);
        } else {
            rota.setMap(null);
        }
    });
    $('#resposta').on('click', '[id^="OnibusPontoId_"]', function(){
        onibus = $(this).val();
        var pontos = _pontos['"'+onibus+'"'];
        for(var i = 0 ; i < pontos.length ; i ++ )
        {
            if ($(this).is(':checked')) {
                pontos[i].setMap(_map);
            } else {
                pontos[i].setMap(null);
            }
        }
    });
});


function startLoadingAnimation(){
    // Starts the loading animation
    $('#main-container').fadeTo("fast",0.1,function(){
    });//
}

function endLoadingAnimation(){
    // Finishes the loading animation
    $('#main-container').fadeTo("fast",1,function(){
    });//
}


$(function(){
    endLoadingAnimation();
    //generating datetimepicker for initialDate and finalDate
    $('[id*=Date]').datetimepicker({format: "DD/MM/YYYY HH:mm:ss",language: 'pt-br'});
});


