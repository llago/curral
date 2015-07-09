
// boolean
var _mostrarRotas = false;
var _mostrarPontos = false;
var _mostrarDirecao = false;
//saving the data
var _rotas = [];
var _pontos = [];


var _novarota = [] ;
var _novarotaLatLng = [];

var _map;


function getBaseUrl() {
    var re = new RegExp(/^.*\//);
    return re.exec(window.location.href);
}



function runQuery() {
    startLoadingAnimation();

    if($('#min-pt-by-bus').val())
        minPointsByIdBus = $('#min-pt-by-bus').val() ;
    if($('#max-distance').val())
        maxDistance =  $('#max-distance').val();

    if($('#linea').val())
        line =  $('#linea').val();

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


    //Making the query
    var where ="";
    var and = false;
    if($('#linea').val()){
        where += 'LINHA = "'+ $('#linea').val()+'"';
        and = true;
    }
    if($('#idBus').val()){
        if(and) where += " AND ";else and=true;
        where += 'ORDEM ="'+$('#idBus').val()+'"';
    }
    if(and) where+= " AND ";

    var query = 'SELECT * FROM [riobus-analytics:onibus.gps_'+month+'] '+
        'WHERE  '+where+' VELOCIDADE >0 AND TIMESTAMP(DATAHORA) > "'+initialDate+'" '+
        'AND TIMESTAMP(DATAHORA) < "'+finalDate+'" ORDER BY ORDEM,DATAHORA';



    //TODO should send something nicer;;;
    var url = getBaseUrl()+'api/bigquery?query='+query;

    console.log("querying...");
    console.log(url);
    $.getJSON(url, function(data, status) {

        var stateValues = data;

        endLoadingAnimation();
        _map = setUpGoogleMaps();
        document.getElementById("resposta").innerHTML = '';

        $.each(stateValues, function(i ,item){
            addRota(item, i);

        });

        if(line)addDefaultRota(line, _map);




        // var newRota = new google.maps.Polyline({
        //     path: _novarotaLatLng,
        //     map: _map,
        //     strokeColor: "#ff0000",
        //     strokeOpacity: 0.9,
        //     strokeWeight: 2,
        //     fillOpacity : 0
        // });

        // console.log("pontos " + _novarotaLatLng.length);

        // newRota.setMap(_map);
        // //save rota
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
    var latlng = new google.maps.LatLng(-22.91325725,-43.6628216475272);
    var options = {
        center: latlng,
        zoom: 10,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };

    var map = new google.maps.Map(document.getElementById("map"), options);
    $('#map').show();

    return map;
}


function addRota(onibus, pos)
{
    console.log("Onibus "+pos);
    var first = false;
    if(pos==1)
    {
        first = true
    }
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

        tmp.push(previousLatlng);
        savedOnibus.push(onibus[0]);

        for(var i=1;i<onibus.length;i++)
        {
            if(onibus[i][2] != "" && onibus[i][3] != "") //lat lng not empty
            {
                 currentLatLng  = new google.maps.LatLng(onibus[i][2], onibus[i][3]);
                 currentDataHora = onibus[i][0];
                 currentVelocidade = onibus[i][4];
                var DatetimeDistance = calculateDistanceWithDatetime(previousDataHora,previousVelocidade, currentDataHora, currentVelocidade);
                var GmapDistance = distanceBetweenTwoLatLngWithGmaps(previousLatlng, currentLatLng);
                var sameHour = isSameHour(previousDataHora,currentDataHora);

                if(GmapDistance < maxDistance) //distance between two
                {
                    if(GmapDistance >= 0 && !sameHour) //we don't want to display the same point
                    {
                        onibusTotalDistanceDate += DatetimeDistance;
                        onibusTotalDistance += GmapDistance;
                        tmp.push(currentLatLng); //TODO should remove this and use savedOnibus...
                        savedOnibus.push(onibus[i]);



                        // if(first)
                        // {
                        //     if(onibusLength > 50){
                        //         _novarota.push(onibus[i]);
                        //         _novarotaLatLng.push(currentLatLng );
                        //     }else{
                        //         console.log("not length engouh")
                        //     }

                        // }
                        // else
                        // {
                        //     //console.log("tryto...")
                        //     trytofindNearestPoint(onibus[i] ,currentLatLng );
                        // }



                    }else{
                        //console.log()
                    }
                    //save the previous data
                    previousLatlng = currentLatLng;
                    previousDataHora = currentDataHora;
                    previousVelocidade = currentVelocidade;
                }
                else
                {
                    //TODO display the erroDistance;
                    var erroDistance = onibus[i][1] + " (" + GmapDistance + " > "+maxDistance+")" ;
                    return;
                }

            }
        }


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


        //prepare output;
        var title = 'Onibus ' + onibus[0][1];
        var desc = ' distância total (por pontos lat/lng) : '+  (onibusTotalDistance/1000).toFixed(2) + ' km <br>';
        desc += ' distância total (hora + velocidade) : '+  (onibusTotalDistanceDate/1000).toFixed(2) + ' km <br>';
        desc += ' n° pontos differentes : '+tmp.length+'/'+onibus.length+' (onde distância alterada)';

        var response = '<div class="col-sm-4" style="color : '+color+'">';
        response += '<h4>'+title+'</h2>';
        response += desc + '<br>';
        if(_mostrarRotas) response += '<input id="OnibusId_'+onibus[0][1]+'" value="'+onibus[0][1]+'" type="checkbox" checked> Rota'
        if(_mostrarPontos) response += '<input id="OnibusPontoId_'+onibus[0][1]+'" value="'+onibus[0][1]+'" type="checkbox" checked> Pontos'

        response += "</div>";
        document.getElementById("resposta").innerHTML += response;
    }
}

function trytofindNearestPoint(onibus, onibusLatLng )
{
    //onibus = [[dataHora, ordem ,latitude, longitude,velocidade, direcao]];
    var onibusDirecao = onibus[5];
    //console.log(onibus);
    var position = 0;
    var bool  = false;


    //init for the first one
    var previousDistance = 500; //testing
    for(var i = 0 ; i < _novarota.length ; i++ )
    {
        var arrayLatLng = new google.maps.LatLng(_novarota[i][2], _novarota[i][3]);
        var currentDistance = distanceBetweenTwoLatLngWithGmaps(arrayLatLng , onibusLatLng);
        if(currentDistance < previousDistance)
        {
            var arrayDirecao = _novarota[i][5];
            if(isSameDirecao(onibusDirecao , arrayDirecao))
            {
                position = i;
                previousDistance = currentDistance;
                bool = true;
                console.log("found !");

            }else{
                //console.log("distance ok but not direcao : onibus : " + onibusDirecao + " | array : " + arrayDirecao);
            }
        }else{
            //console.log("distance = " + currentDistance);
        }
    }

    if(bool)
    {
        _novarota.splice(position,0,onibus);
        _novarotaLatLng.splice(position,0,onibusLatLng );
        console.log("lenght : "+_novarotaLatLng.length);
        return true;
    }
    return false;
}

function isSameDirecao(dir1, dir2) {
    if(dir1 > 0 && dir1 < 360) {
        if (dir2 > 0 && dir2 < 350) {
           return (dir1 - dir2) < 10
        }
    }else{
        return false;
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
        $('#dvLoading').fadeIn("fast");
    });
}

function endLoadingAnimation(){
    // Finishes the loading animation
    $('#dvLoading').fadeOut("fast", function() {
        $('#main-container').fadeTo("fast",1);
    });
}


$(function(){
    endLoadingAnimation();
    //generating datetimepicker for initialDate and finalDate
    $('[id*=Date]').datetimepicker({format: "DD/MM/YYYY HH:mm:ss",language: 'pt-br'});
});


