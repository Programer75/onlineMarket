const express = require('express');
const app = express();
const hbs = require('hbs');
const sqlite = require('sqlite3');
const session = require('express-session');
const crypto = require('crypto');
const bodyParser = require("body-parser");
const Web3 = require("web3");
const async = require('hbs/lib/async');
const web3 = new Web3("https://ropsten.infura.io/v3/07b71cb31ed442b1b84e22f40b8f3418");
const addr = "0x57021F6913005c5f68A94839D489faD3cb66bCc2";
const constABI = require("./abi.json");
// let keyBuffer = Buffer.from(key1, 'hex');


app.set("view engine", "hbs");
app.set("views", "./templates");
app.use(express.static(__dirname + '/static'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({
    secret: 'wG#hIjzdGL2oMcj664Jaf+GRd@1@',
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
        "category":"SELECT * FROM games WHERE category=?",
        "findGame":"SELECT * FROM games",
        "game":"SELECT * FROM games WHERE id=?",
        "genre":"SELECT * FROM games WHERE genre=?",
        "id": "SELECT * FROM users WHERE id=?",
        "cart":"SELECT * FROM cart WHERE user=?",
        "poor user":"SELECT * FROM users WHERE secret=?",
        "total":"SELECT DISTINCT price FROM games INNER JOIN orders ON games.id = orders.game WHERE orders.customer=?"
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
async function addDbData(typeQ,dataQ) {
    let typeQueryes = {
        "user":'INSERT INTO users(id, name, secret, userHash,img) VALUES (null,?,?,?,null)',
        "creator":'INSERT INTO creators(id, name, info, img) VALUES (null,?,?,?,?)',
        "order":'INSERT INTO orders(id,game,customer,status) VALUES (null,?,?,null)',
        "cart":'INSERT INTO cart(id,user,game) VALUES (null,?,?)'
    };
    let sqlQuery = typeQueryes[typeQ];
    let db = new sqlite.Database("shopbd.db");
    let prom = new Promise((res, rej) => {
        db.run(sqlQuery, dataQ, (err) => {
            if (err) {
                console.log(err);
                rej(false);
            } else {
                res(true)
            }
        })
    });
    let datadb = await prom;
    db.close();
    return datadb;
}

async function updateDbData(dataQ) {
    let sqlQuery = "UPDATE users SET  secret=?, userHash=?  WHERE id=?";
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

async function deleteDbData(typeQ,dataQ) {
    let typeQueryes = {
        "cart":"DELETE FROM cart WHERE id=?",
        "user":"DELETE FROM users WHERE id=?",
        "creator":"DELETE FROM creators WHERE id=?"
    }
    let sqlQuery = typeQueryes[typeQ];
    let db = new sqlite.Database("shopbd.db");
    let prom = new Promise((res, rej) => {
        db.run(sqlQuery, dataQ[0], (err) => {
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
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_=-?/\|";
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

async function sendTransaction(data) {
    let key1Buffer = Buffer.from(data.key1, 'hex');
    let result = await new Promise((resolve, reject) => {
        web3.eth.getTransactionCount(data.acc1, (err, txCount) => {
            if (err) {
                reject(err)
            } else {
                console.log(txCount);
                // Build the transaction
                const txObject = {
                    nonce: web3.utils.toHex(texc),
                    to: data.acc2,
                    value: web3.utils.toHex(web3.utils.toWei(data.ether, 'ether')),
                    gasLimit: web3.utils.toHex(21000),
                    gasPrice: web3.utils.toHex(web3.utils.toWei('10', 'gwei')),
                }
                // Sign the transaction
                const tx = new Tx(txObject, { chain: 'ropsten' })
                tx.sign(key1Buffer)
                const serializedTx = tx.serialize()
                const raw = '0x' + serializedTx.toString('hex')
                // Broadcast the transaction
                web3.eth.sendSignedTransaction(raw, (err, txHash) => {
                    if (err) {
                        reject(err)
                    } else {
                        texc++
                        resolve('txHash: ' + txHash)
                    }
                    // Now go check etherscan to see the transaction!
                })

            }
        });
    });
    return result
};

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
});

app.get("/login", (req, res) => {
    res.render("login.hbs", req.session.user);
});

app.get("/favicon.ico", (req, res) => {
    res.sendStatus(404);
});

app.post("/log", function (req, res) {
    let userLogin = req.body.lgn;
    let userPassword = req.body.pswrd;
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
                    console.log(req.session.user);
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

app.post("/reg", function (req, res) {
    let userLogin = req.body.lgn;
    let userPassword = req.body.pswrd;
    getDbData("search", userLogin).then((data) => {
        if (data.length != 0) {
            res.sendStatus(401);
        } else {
            let userData = [];
            userData.push(userLogin);
            makeSecret().then((secret) => {
                userData.push(secret);
                let textToHash = userLogin + ":" + userPassword;
                makeHash(textToHash, secret).then((userHash) => {
                    userData.push(userHash);
                    addDbData("user",userData).then((data) => {
                        if (data) {
                            getDbData("search",userLogin).then((user) =>{
                                if (user.length != 0) {
                                    req.session.user = user[0];
                                    res.redirect('/')
                                } else {
                                    res.sendStatus(500)
                                }
                            })
                        } else {
                            res.sendStatus(500);
                        }
                    });
                })
            })
        }
    })
});

app.get("forget/:forgeturl", (req,res) =>{
    if (req.session.user == undefined) {
        getDbData("poor user", req.params.forgeturl).then((data)=>{
            if (data.length !=0 ) {
                req.session.user = data[0];
                res.redirect("/usrforgot");
            } else {
                res.sendStatus(403);
            }
        });
    } else {
        res.sendStatus(403);
    }
});

app.post("/forgot", (req, res) => { 
    let userData = [];
    let userPassword = req.body.pswrd;
    if (req.session.user != undefined){
        if (req.session.user.id != req.query.id) {
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

app.get("/cart", (req,res)=>{
    let type = req.query.type;
    let userData = [];
    switch (type) {
        case "add":
            if (req.session.user != undefined) {
                userData
                userData.push(req.session.user.id);
                userData.push(req.query.id);
                addDbData("cart",userData).then((result)=>{
                    if (result) {
                        res.send("ok")                   
                    } else {
                        res.sendStatus(500)
                    }
                });
            } else {
                res.sendStatus(401);
            }
            break;
        case "delete":
            if (req.session.user != undefined) {
                userData.push(req.session.user.id);
                userData.push(Number(req.query.id));
                console.log(userData);
                getDbData("cart",userData[0]).then((data)=>{
                    if (data.length != 0) {
                        let deleteData = [];
                        deleteData.push(data[0].id);
                        deleteDbData("cart",deleteData).then((result)=>{
                            if (result) {
                                res.sendStatus(200);
                            } else {
                                res.sendStatus(500);
                            }
                        })
                    } else {
                        res.sendStatus(404);
                    }
                })
            } else {
                res.sendStatus(401);
            }
            break;
        default:
            res.sendStatus(400);
            break;
    }
});

app.post("/buy",(req,res)=>{
    if(req.session.user != undefined){
        let dbData = [];
        dbData.push(req.session.user.id);
        getDbData("cart",dbData).then((data)=>{
            data.forEach(element => {
                let orderItems = [];
                orderItems.push(element.game);
                orderItems.push(element.user);
                deleteDbData("cart",element.id).then((deleteResult)=>{
                    if(deleteResult){
                        addDbData("order",orderItems).then((result)=>{
                            if (result) {
                            } else {
                                console.log("Something went wrong!");
                            }
                        });
                    }else{
                        console.log("Delete from cart: something went wrong!");
                    }
                });
            });
            getDbData("total",dbData[0]).then((games)=>{
                let total = 0;
                games.forEach(gamePrice => {
                    total = gamePrice.price + total;
                });
                let data = {
                    acc1:req.session.user[wallet_id],
                    key1:req.session.user[wallet_key],
                    acc2:addr,
                    ether: total/100000
                }
                sendTransaction(data).then((resultat)=>{
                    if(resultat.substr(0,8) == 'txHash: '){
                        res.sendStatus(200);
                    }else{
                        console.log(resultat);
                        res.sendStatus(500);
                    }
                });
            });
        });
    }else{
        res.sendStatus(401);
    }
});

app.post("/logout",(req,res)=>{
    req.session.destroy((err)=>{
        console.log(err);
    });
    res.redirect("/");
});

app.get("/find",(req,res)=>{
    let searchQ = req.query.search.toLowerCase();
    let searchR = [];
    getDbData("findGame",[]).then((data)=>{
        data.forEach(game => {
            let gameName = game.name.toLowerCase();
            if (gameName.includes(searchQ) ) {
                searchR.push(game);             
            }
        });
        if (searchR.length != 0) {
            res.send(searchR);
        } else {
            res.send(null);
        }
    });
});

app.get("/sort",(req,res)=>{
    let genre = req.query.genre;
    if (genre.length == 1) {
        getDbData("genre",genre).then((data)=>{
            if (data.length !=0) {
                res.send(data);
            }else{
                res.sendStatus(400);
            };
        });
    } else {     
        let sortData = [];
        genre.forEach(element => {
            getDbData("genre",element).then((games)=>{
                if (games.length!=0) {
                    games.forEach(game => {
                        sortData.push(game);
                    });
                }
            });
        });
        res.send(sortData);
    }
});

app.post("/del",(req,res)=>{
    if (req.session.user != undefined) {
        switch (req.body.type) {
            case "user":
                if (req.session.user.id == req.query.id){
                    deleteDbData()
                };
                break;
            case "creator":
                let hashText = 'admin:' + req.body.pswrd;
                getDbData("search",'admin').then((Admin)=>{
                    makeHash(hashText, Admin[0].secret).then((userHash) => {
                        if (req.session.user.name = "admin" && userHash == Admin[0].userHash) {
                            deleteDbData("creator",req.body.id).then((result)=>{
                                if (result) {
                                    res.sendStatus(200);
                                } else {
                                    res.sendStatus(500); 
                                }
                            });  
                        } else {
                            res.sendStatus(403);
                        }
                    })
                });
                break;
            default:
                res.sendStatus(400);
                break;
        };
    } else {
        res.sendStatus(401);
    } 

    res.sendStatus(500);
});

app.get("/:page",(req,res)=>{
    if (req.params.page.includes(pages)){
        /*
        switch (key) {
            case value:
                // res.sendFile()
                break;
                
                default:
                    break;
                }
                */
        res.sendStatus(200);
    }else{
        res.sendStatus(400);
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