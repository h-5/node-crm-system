const http=require('http');
const url=require('url');
const fs= require('fs');

const server=http.createServer((req,res)=>{
    let urlObj=url.parse(req.url,true);
    let pathname=urlObj.pathname;
    let query=urlObj.query;
    let reg=/\.(HTML|CSS|JS|ICO)/i;
    let extend=null;
    let mime='';
    if(reg.test(pathname)){
        extend=reg.exec(pathname)[1].toUpperCase();
        switch (extend){
            case "HTML":
                mime='text/html';
                break;
            case "CSS":
                mine='text/css';
                break;
            case "JS":
                mime='text/javascript';
                break;
            case "ICO":
                mime='application/octet-stream';
                break;
        }
        try{
            let readFile=fs.readFileSync('./'+pathname,"utf-8");
            res.writeHead(200,{
                'content-type':mime+';charset=utf-8'
            });
            res.end(readFile);
        }catch(e){
            res.writeHead(404,{
                'content-type':'text/plain;charset=utf-8'
            });
            res.end('404');
        }
    }

   
    let con=null,result=null,queryId=null;

    //1.获取所有客户的信息
    if(pathname=="/getList"){
        con=fs.readFileSync('./json/custom.json','utf-8');
        if(con.length===0){
            con='[]';
        }

        con=JSON.parse(con);

        result={
            code:1,
            msg:'没有任何内容',
            data:null
        }

        if(con.length>0){
            result={
                code:0,
                msg:'有内容',
                data:con
            }
        }

        res.writeHead(200,{
            'content-type':'application/json;charset=utf-8'
        });

        res.end(JSON.stringify(result));
        return;

    }

    //2.根据传递进来的客户id获取某一个具体的客户信息
    if(pathname==="/getInfo"){
        //获取客户端的id
        queryId=query.id;
     
        con=fs.readFileSync('./json/custom.json','utf-8');
     
        con.length===0?con='[]':null;
        con=JSON.parse(con);

        result={
            code:1,
            msg:'没有用户的id',
            data:null
        }
        for(let i=0;i<con.length;i++){
            if(con[i].id==queryId){
                result={
                    code:0,
                    msg:'有用户的id',
                    data:con[i]
                }
                break;
            }
        }
        res.writeHead(200,{
            'content-type':'application/json;charset=utf-8'
        });
        res.end(JSON.stringify(result));
    }

    //3.根据传递进来的客户id删除客户的信息
    if(pathname==="/deleteInfo"){
        let queryId=query.id;
        con=fs.readFileSync('./json/custom.json','utf-8');
        //考虑服务器当中的文件内容是否空；
        con.length==0?con='[]':null;
        con=JSON.parse(con);
        result={
            code:0,
            msg:'删除失败'
        }
        let flag=false;//假设当前没有删除
        for(let i=0;i<con.length;i++){
            if(con[i].id==queryId){
                //删除服务器当中,文件数组的一项
                //第i项开始删除一项,返回的是删除的哪一项，原来的数组变
                con.splice(i,1);
                flag=true;//删除成功
                break;
            }
        }

        //如果已经删除成功,数组的长度已经变成了
        if(flag){
            //重新遍历数组当中的数据，重新写入;
            //第一个参数（服务器当中的文件）
            //第二个参数 我们文件当中读取出来的内容字符串，写的内容也是字符串，json.stringify 是  （把 字符串或者对象）（转换成序列化）的json形式的字符串，con是data
            result={
                code:0,
                msg:'删除成功'
            }
            fs.writeFileSync('./json/custom.json',JSON.stringify(con),'utf-8');
        }
        res.writeHead(200,{
            'content-type':'application/json;charset=utf-8'
        });
        //最后返回result
        res.end(JSON.stringify(result));
        return;
    }

    //4.增加客户信息
    //如果请求post的情况下怎么办？
    //
    if(pathname==="/addInfo"){
        //服务器端 接受前端发送的 post请求，通过on的形式绑定一个事件
        //通过请求对象on的形式 注册一个事件，接受数据的事件data，第二参数是前端接过来的数据data
        //客户端发送的请求是字符串形式的'{‘"id":0,"name":"A","age":26,"sex":"男"’}'
        //这些字符串；在post（请求主体） 当中传递来的

        //请求形式post的时候，我们用on的形式注册一个data事件，接受客户端的请求
        //客户端发送的数据一点点一点点传递过来的，一个字节一个字节传递过来的
        //回调函数什么时候执行的，我接受一点数据的时候执行的
        let str='';
        //data是一点点接受内容的事件
        //chunk是每一次接受的一点点,接受一点然后拼接，接受一点然后拼接，
        req.on('data',function (chunk) {
            str+=chunk;
        })
        //end代表我已经全部接受完了，接受完成的事件
        req.on('end',function () {
            //在这里的str请求的整个主体,'{‘"id":0,"name":"A","age":26,"sex":"男"’}';
            // 过来的字符串是jsjkjjon格式的字符串
            //什么都没传
            if(str.length==0){
                result={
                    "code":1,
                    "msg":"什么都没传，传递失败"
                }
                res.writeHead(200,{
                    'content-type':'application/json;charset=utf-8'
                });
                //返回客户端什么都没传的消息
                res.end(JSON.stringify(result));
                return;
            }


            let data=JSON.parse(str);
            //在现有的data中追加一个id：获取con中最后一项的id，新的id是在原有基础上加一即可
            //获取最后一项的id，con[con.length-1].id

            //如果之前没有id
            if(con.length==0){
                con.id=1;
            }else{
                //原来的id是字符串，所以用parseFloat
                let lastId=parseFloat(con[con.length-1].id);
                data.id=parseFloat+1;
            }
            //con是原来的数组,向原来的数组con，增加数据；
            con.push(data);
            // 写入新增加的数组,写入新的数组con
            fs.writeFileSync('./json/custom.json',JSON.stringify(con),'utf-8');
            res.writeHead(200,{
                "code":0,
                "msg":"增加成功"
            })
        })
        return;
    }

    //修改信息

    if(pathname==="/updateInfo"){
         //读取服务器当中的信息
         con=fs.readFileSync("./json/custom.json","utf-8");
        /*检查读取信息是否空*/
        if(con.length===0){
            con='[]';
        }


        let str='';

        req.on('data',function (chunk) {
            str+=chunk;
        });

        req.on("end",function () {
            if(str.length==0){
                res.writeHead(404,{
                    'content-type':'application/json;charset=utf-8'
                });
                result={
                    code:1,
                    msg:"修改失败"
                };
                res.end(JSON.stringify(result));
                return;
            }
            //获取请求主体；
            let data=JSON.parse(str);

            //有一个标记，有没有修改
            let flag=false;
            //如果我通过请求传递进来的id与数组中的id全等的情况下，修改信息；
            //循环的时候循环的是对象；
            con=JSON.parse(con);
            for(let i=0;i<con.length;i++){
                //如果数组中的id等于请求主体中的id
                if(con[i].id==data.id){
                    //当前的请求主体赋值给等于的哪一项
                   con[i]=data;
                    flag=true;//已经修改好了
                   break;
                }
            }
            //如果修改成功
            if(flag){
                //写入修改成功的结果, 当前的文件路径，重新写入的内容
                fs.writeFileSync('./json/custom.json',JSON.stringify(con),'utf-8');
                result={
                    code:0,
                    msg:'修改成功'
                }
                res.writeHead(200,{
                    'content-type':'application/json;charset=utf-8'
                });

                //因为是在进行服务器当中，返回给客户的信息是是否成功
                res.end(JSON.stringify(result));
            }
        })
    }
});

server.listen(3000,'localhost',()=>{
    console.log('success');
})