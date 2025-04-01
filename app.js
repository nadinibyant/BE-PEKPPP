var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const server = require('./routes/index')
const cors = require('cors');
const { whatsappClient } = require('./config/whatsaap');
var app = express();
const db = require('./models')


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/file-bukti-dukung', express.static(path.join(__dirname, 'public/doc/bukti_dukung')));

const corsOptions = {
  origin: process.env.NODE_ENV === 'development'
    ? [process.env.DEV_ORIGIN]
    : [process.env.PROD_ORIGIN],
};

app.use(cors(corsOptions)); 

app.use('/', server.admin)
app.use('/', server.adminKelolaOpd)
app.use('/', server.adminKelolaEvaluator)
app.use('/', server.adminAspekPenilaian)
app.use('/', server.adminPeriodePenilaian)
app.use('/', server.adminDashboard)
app.use('/', server.opdDashboard)
app.use('/', server.opd)
app.use('/', server.penilaianfo1Opd)
app.use('/', server.verifikasiF01)
app.use('/', server.evaluator)
app.use('/', server.penilaianf02)
app.use('/', server.hasilPenilaian)
app.use('/', server.hasilPenilaianEval)
app.use('/', server.hasilPenilaianOpd)
app.use('/', server.izinHasilPenilaian)
app.use('/', server.profile)
app.use('/', server.chat)
app.use('/', server.dashEvaluator)

const cornJob = require('./jobs/cornJob');
cornJob(db);

app.use(function(req, res, next) {
  next(createError(404));
});

app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
