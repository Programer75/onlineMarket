const express = require('express');
const app = express();
const hbs = require('hbs');
const sqlite = require('sqlite3');
const session = require('express-session');
const crypto = require('crypto');
// try {
//     const crypto = require('crypto');
// } catch (err) {
//     console.log('crypto support is disabled!');
// }

app.set("view engine", "hbs");
app.set("views", "./templates");
app.use(express.static(__dirname + '/static'));
app.use(session({
    secret: 'keyboard cat',
    saveUninitialized: true,
    resave: true,
    user:{
        reg:false
    }
}));

hbs.registerPartials(__dirname + "/templates/partials");


async function getDbData(typeQ, dataQ) {
    let typeQueryes = {
        "all": "SELECT * FROM users",
        "search": "SELECT * FROM users WHERE name=?",
        "id": "SELECT * FROM users WHERE id=?"
    };
    let sqlQuery = typeQueryes[typeQ];
    let db = new sqlite.Database("shopbd.db");
    let prom = new Promise((res) => {
        db.all(sqlQuery, dataQ, (err, rows) => {
            res(rows)
        });
    });
    let data = await prom;
    db.close();
    return data;
}

async function addDbData(dataQ) {
    let sqlQuery = 'INSERT INTO users(id, name, password, secret, userHash) VALUES (null,?,?,?,?)';
    let db = new sqlite.Database("shopbd.db");
    let prom = new Promise((res, rej) => {
        db.run(sqlQuery, dataQ, (err) => {
            if (err) {
                console.log(err);
                rej(false);
            } else {
                res(true)
            }
        }
        )
    });
    let datadb = await prom;
    db.close();
    return datadb;
}

async function updateDbData(dataQ) {
    let sqlQuery = "UPDATE users SET password=? ,  secret=?, userHash=?  WHERE id=?";
    let db = new sqlite.Database("shopbd.db");
    let prom = new Promise((res, rej) => {
        db.run(sqlQuery, dataQ, (err) => {
            if (err) {
                console.log(err);
                rej(false);
            } else {
                res(true)
            }
        });
    });
    let datadb = await prom;
    db.close();
    return datadb;
}

async function makeSecret() {
    let prom = new Promise((res, rej) => {
        var secret = "this is just a simple secret";
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+=-?/\|";
        for (var i = 0; i < secret.length; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        if (text != secret) {
            res(text);
        } else {
            rej("err");
        }
    });
    let secretId = await prom;
    return secretId;
}

async function makeHash(text, secret) {
    let prom = new Promise((res, rej) => {
        if (text.length != 0) {
            let hash = crypto.createHmac('sha512', secret);
            hash.update(text)
            res(hash.digest('hex'));
        } else {
            rej(401)
        }
    });
    let userHash = await prom;
    return userHash;
}

app.get("/", function (req, res) {
    if (req.session.user != undefined) {
        getDbData("all", []).then((data) => {
            let tempData = {
                "colums": Object.keys(data[0]),
                "rows": data
            };
            res.render('index.hbs', tempData);
        });
    } else {
        req.session.user = {
            reg: false
        }
        res.render('login.hbs', req.session.user);
    }
    // req.session.user = {
    //     name:"Anton",
    //     password:"Delete"
    // };
    // getDbData("all",[]).then((data)=>{
    //     if (data.length != 0) {
    //         let tempData={
    //             "colums":Object.keys(data[0]),
    //             "rows":data
    //         };
    //         res.render('index.hbs',tempData);
    //     } else {
    //         req.session.user = {
    //             reg:true
    //         }
    //         res.render('login.hbs', req.session.user);
    //     }
    // });
});

app.get("/login", (req, res) => {
    res.render("login.hbs", req.session.user);
});

app.get("/favicon.ico", (req, res) => {
    res.sendStatus(404);
});

app.get("/log", function (req, res) {
    let userLogin = req.query.lgn;
    let userPassword = req.query.pswrd;
    getDbData("search", userLogin).then((data) => {
        if (data.length != 0) {
            let textToHash = userLogin + ":" + userPassword;
            makeHash(textToHash, data[0].secret).then((userHash) => {
                if (userHash == data[0].userHash) {
                    var tempData = {
                        "colums": Object.keys(data[0]),
                        "rows": data
                    };
                    res.render('index.hbs', tempData);
                    req.session.user = data[0];
                } else {
                    res.send("Incorrect password!");
                }
            })
        } else {
            req.session.user = {
                reg: true
            };
            res.render('login.hbs', req.session.user);
        }
    });
});

app.get("/reg", function (req, res) {
    let userLogin = req.query.lgn;
    let userPassword = req.query.pswrd;
    getDbData("search", userLogin).then((data) => {
        if (data.length != 0) {
            res.sendStatus(401);
        } else {
            let userData = []
            userData.push(userLogin);
            userData.push(userPassword);
            makeSecret().then((secret) => {
                userData.push(secret);
                let textToHash = userLogin + ":" + userPassword;
                makeHash(textToHash, secret).then((userHash) => {
                    userData.push(userHash);
                    addDbData(userData).then((data) => {
                        if (data) {
                            res.redirect('/');
                        } else {
                            res.sendStatus(500);
                        }
                    });
                })
            })
        }
    })
});

app.get("/forgot", (req, res) => {
    let userData = [];
    let userPassword = req.query.pswrd;
    if (req.session.user != undefined){
        if (req.session.user.id != req.query.id ) {
            res.sendStatus(403);
        } else {    
            getDbData("id", req.query.id).then((data) => {
                if (data.length != 0) {
                    userData.push(userPassword);
                    makeSecret().then((secret) => {
                        userData.push(secret);
                        let textToHash = data[0].name + ":" + userPassword;
                        makeHash(textToHash, secret).then((userHash) => {
                            userData.push(userHash);
                            userData.push(data[0].id);
                            updateDbData(userData).then((result) => {
                                if (result) {
                                    req.session.user.secret = secret;
                                    req.session.user.userHash = userHash;
                                    req.session.user.password = userPassword;
                                    res.send(`${data[0].name}: password changed.`)
                                } else {
                                    res.sendStatus(500)
                                }
                            })
                        })
                    })
                } else {
                    res.sendStatus(400);
                }
            });
        };
    }else{
        res.sendStatus(401);
    }
});

app.use((req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.redirect("/");
    }
});

app.listen(3000, () => {
    console.log("Страдаем");
});