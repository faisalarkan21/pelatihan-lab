var mysql = require('mysql');
const HackerEarth = require('hackerEarth-node');


var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'compiler_java',

});

connection.connect(function (err) {
    if (err) {
        console.error('error connecting: ' + err.stack);
        return;
    }

    console.log('connected as id ' + connection.threadId);
});



exports.login = function (req, res) {
    if (req.session.namaSession) {

        res.redirect("profile");

    } else {

        res.render('login-user');
    };

};


exports.autentifikasi = function (req, res) {

    console.log('kena');
    console.log(req.body.user_name);

    var query = connection.query("select * from users where user_id = ? ", req.body.user_name, function (err, data) {



        if (err) {
            console.log(err);
            return next("Mysql error, check your query");
        }


        console.log(data);


        if (data.length < 1) {

            res.render('index', {
                error: "has-error is-empty",
                data: "<label class='control-label' id='error' >Data tidak ada didalam database</label>"
            });

        } else if ((req.body.user_name === data[0].user_id) && (req.body.password === data[0].password)) {
            console.log('masuk sini');
            req.session.namaSession = data[0].user_id;
            res.redirect('profile');


        } else {

            res.render('index', {
                error: "has-error is-empty",
                data: "<label class='control-label' id='error' >Password anda salah</label>"
            });

        }
    });
};



exports.profile = function (req, res) {


    var query = connection.query("select * from users where user_id = ? ", req.session.namaSession, function (err, data) {



        if (err) {
            console.log(err);
            return next("Mysql error, check your query");
        }


        var query = connection.query("select * from soal_java", function (err, dataSoal) {

            var query = connection.query("select * from user_jawaban_java where user_id = ?", req.session.namaSession, function (err, dataUser) {

                console.log(dataUser);

                if (err) {
                    console.log(err);
                    return next("Mysql error, check your query");
                }

                var reconstructionSoal = [];

                for (let z = 0; z < dataSoal.length; z += 1) {
                    let indexJawaban = dataUser.length;

                    reconstructionSoal.push({
                        id_soal: dataSoal[z].id_soal,
                        soal: dataSoal[z].soal,
                        jawaban: dataSoal[z].jawaban,
                        jawaban_user: dataUser[z].jawaban_user,
                        hasilCompile: dataUser[z].hasil_compile,
                        status: dataUser[z].status

                    });
                }
                console.log(reconstructionSoal);
                res.render("users/profile", {
                    nama: req.session.namaSession,
                    reconstructionSoal: reconstructionSoal

                });

            });


            console.log(data);



        });
    });
}


exports.compile = function (req, res) {

    console.log('disini code');
    console.log(req.body.code);
    console.log(req.body.id_soal);

    var hackerEarth = new HackerEarth(
        'd0c154273b76376b0055a2c582b5e971b5a49bd2', //Your Client Secret Key here this is mandatory
        '0' //mode sync=1 or async(optional)=0 or null async is by default and preferred for nodeJS
    );


    var config = {};
    config.time_limit = 1; //your time limit in integer
    config.memory_limit = 323244; //your memory limit in integer
    config.source = req.body.code; //your source code for which you want to use hackerEarth api
    config.input = ""; //input against which you have to test your source code
    config.language = "Java"; //optional choose any one of them or none
    var statusCompile

    hackerEarth.compile(config, function (err, response) {
            if (err) {
                console.log(err);
            } else {
                let resJson = JSON.parse(response);
                console.log(resJson);

                hackerEarth.run(config, function (err, response) {
                    if (err) {

                    } else {

                        var query = connection.query("select * from soal_java where id_soal = ?", req.body.id_soal, function (err, dataJawaban) {

                            console.log(req.body.id_soal);
                            if (err) {
                                console.log(err);
                                return next("Mysql error, check your query");
                            }
                            let resJson = JSON.parse(response);
                         
                            console.log(dataJawaban[0]);
                            var status;

                            if (resJson.compile_status === 'OK') {
                                // status = resJson.compile_status;
                                console.log('disini hasil run');
                                console.log(resJson.run_status.output);
                                console.log(dataJawaban[0].jawaban);
                                console.log(resJson.run_status.output === dataJawaban[0].jawaban);

                                if (resJson.run_status.output.trim() === dataJawaban[0].jawaban) {
                                    status = 'Jawaban Anda Benar';

                                } else {
                                    status = 'Jawaban Anda Salah';

                                }


                            } else {
                                status = resJson.compile_status;
                            }


                            let user_jawaban = {
                                id_soal: req.body.id_soal,
                                user_id: req.session.namaSession,
                                jawaban_user: req.body.code,
                                hasil_compile: resJson.run_status.output,
                                status: status

                            }

                            var query = connection.query("update user_jawaban_java set ? where id_soal = ?", [user_jawaban, req.body.id_soal], function (err, dataJawaban) {

                                console.log('disni nilai');
                                nilai = 'Jawaban Anda Benar';
                                console.log(nilai);

                                console.log(dataJawaban);

                                if (err) {
                                    console.log(err);
                                    return next("Mysql error, check your query");
                                }

                                res.redirect('profile')
                            });


                        });



                    }
                })


            }














        }


    )
};


exports.keluar = function (req, res) {


    req.session.destroy();


    res.redirect('/');


};

exports.daftar = function (req, res) {

    res.render('users/daftar');

}