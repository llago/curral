exports.kmrodado = function(req, res){
  res.render('kmrodado', { title: 'Km Rodado' });
};

exports.km_bar_inorte = function(req, res){
  res.render('km_bar_inorte', { title: 'Km Rodado Inter Norte' });
};

exports.km_bar_stCruz = function(req, res){
  res.render('km_bar_stCruz', { title: 'Km Rodado Sta Cruz' });
};

exports.km_bar_carioca = function(req, res){
  res.render('km_bar_carioca', { title: 'Km Rodado Carioca' });
};

exports.km_bar_isul = function(req, res){
  res.render('km_bar_isul', { title: 'Km Rodado Inter Sul' });
};

exports.nOnibus = function(req, res){
  res.render('nOnibus', { title: 'Numero de Onibus' });
};