/**
 * Created by cyrilledelabre on 02/07/15.
 */

exports.bigquery = function(request, res){

    var query = request.param('query');

    var gcloud = require('gcloud')({
        keyFilename: 'private/riobus.json',
        projectId: 'western-augury-98214'
    });

    var bigquery = gcloud.bigquery();

    bigquery.query(query, function(err, rows, nextQuery, apiResponse) {
        if(err) {
            console.log(err)
            return;
        }
        if(apiResponse.totalRows <1) {
            return;
        }

        var stateValues = [];
        var j = -1;
        var lastOrdem = "";
        rows.forEach(function(item, i) {
            var ordem = item.ORDEM;
            var latitude = item.LATITUDE;
            var longitude = item.LONGITUDE;
            var velocidade = item.VELOCIDADE;
            var dataHora = item.DATAHORA;
            var direcao = item.DIRECAO;

            if (lastOrdem != ordem) {
                j++;
                stateValues[j] = [];
            }


            var stateValue = [dataHora, ordem, latitude, longitude, velocidade,direcao];
            stateValues[j].push(stateValue);

            lastOrdem = ordem;
        });

        res.send(stateValues);

    });

};
