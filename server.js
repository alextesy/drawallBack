
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var cors = require('cors');
var dateFormat=require('dateformat');
app.use(cors());
var DButilsAzure = require('./DButils');
var util=require('util');
var socket=require('socket.io');
var oneDay=86400000;
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());



var port = process.env.PORT || 8080;
var server =app.listen(port, function () {
    console.log('alex ' + port);
});
var io=socket(server);
io.sockets.on('connection',newConnection);


//New connection from client, whenever client draws anything it brodcasts to all other clients
function newConnection(socket){
    console.log("new Connection");
    socket.on('mouse', mouseMsg);
    function mouseMsg(data){
        socket.broadcast.emit('mouse',data);
    }
    
    //console.log(socket);
}


//Save element to db
app.post('/element',function(req,res){
    element=req.body;
    var yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    checkDate=dateFormat(yesterday, "yyyy-mm-dd hh:MM:ss");
    var sql = "SELECT COUNT (*) as count FROM main WHERE ip='%s' AND timestamp > '%s' AND board='%s';";
    var query=util.format(sql,element.ip,checkDate,element.board);
    DButilsAzure.execQuery(query)
    .then(function(result){
        if(result[0].count>element.limit){
            res.send("Error");
        }
        else{
            let sql = "INSERT INTO main (ip,shape,color,size,x,y,board) VALUES ('%s','%s','%s',%s,%s,%s,'%s');";
            var query=util.format(sql,element.ip,element.shape,element.color,element.size,element.x,element.y,element.board);
            DButilsAzure.execQuery(query)
            .then(function(result){
               res.send("Success");
            })
            .catch(function(err){
                console.log("error");
                res.status(500).send("Error While Updating the element");
            })
        }
    })



   // var query=util.format("SELECT username,password FROM users WHERE username='%s';",req.body.username);
  
})

//Get specific board's elements
app.get('/board/:id',function(req,res){
    var boardName=req.params.id ;
    var sql = "SELECT * from main where board='%s' ORDER BY id ASC;";
    var query=util.format(sql,boardName);
    DButilsAzure.execQuery(query)
    .then(function(result){
        res.send(result)
    })
    .catch(function(err){
        console.log("error");
        res.status(500).send("Error While retrieving the Board");

    })


})

//Create a new Board
app.post('/newBoard',function(req,res){
    var name=req.body.name;
    var limit=req.body.limit;
    var ip=req.body.ip;
    var sql = "SELECT * FROM boards WHERE boardName='%s';"
    var query=util.format(sql,name);
    DButilsAzure.execQuery(query)
    .then(function(result){
        if(result.length>0){
            res.send({'response':'exists'});
        }
        else{
            var sql = "INSERT INTO boards VALUES ('%s','%s','%s');"
            var query=util.format(sql,name,ip,limit);
            DButilsAzure.execQuery(query)
            .then(function(result){
                res.send({'response':'success'});
            })
        }
    })
    .catch(function(err){
        res.status(500).send('Something went wrong while creating new table');
    })


})

//Get board properties
app.get('/properties/:boardName',function(req,res){
    var boardName=req.params.boardName;
    var sql = "SELECT limit,admin from boards where boardName= '%s';";
    var query=util.format(sql,boardName);
    DButilsAzure.execQuery(query)
    .then(function(result){
        res.send(result)
    })
    .catch(function(err){
        console.log("error")
        res.status(500).send("Error While retrieving the board's properties")

    })
})

//Admin Del elements 
app.post('/adminDel',function(req,res){
    var col=req.body.col;
    var value=req.body[col];
    var board=req.body.board;
    var sql = "DELETE FROM %s WHERE %s = '%s';";
    var query=util.format(sql,board,col,value);
    DButilsAzure.execQuery(query)
    .then(function(result){
        res.send(result)
    })
    .catch(function(err){
        console.log("error")
        res.status(500).send("Error While retrieving the board's properties")

    })
})

       
app.get('/Top',function(req,res){
    var sql = "SELECT ip  from main GROUP BY ip ORDER BY COUNT(*) DESC ";
    var stats={};
    DButilsAzure.execQuery(sql)
    .then(function(result){
        stats.ip=result[0].ip
        var sql = "SELECT shape  from main GROUP BY shape ORDER BY COUNT(*) DESC";
        DButilsAzure.execQuery(sql)
        .then(function(result){
            stats.shape=result[0].shape
            res.send(stats)

        })
    })
    .catch(function(err){
        console.log("error")
        res.status(500).send("Error While retrieving the stats")

    })
})
       




    



    
    








//-----------------------------------------------------------------------------------------------------


