//都让它在bower_components下面去查找，
var path = require('path');
var _ = require('underscore');//uderscore它里面有一个extend这个方法，它可以另外一个对象的新的字段来替换掉老的对象对应的字段。


//实现数据的增删改查，以及后端逻辑，已经在数据库里面定义了模式，也编译了模型，引入mongoose这个模块，来链接本地的数据库。
var mongoose = require('mongoose');
var movie = require('./models/movie');//这里用到的movie,也就是刚才在模型里面mongoosemodel所编译成的模型，加载进来。

var port = process.env.PORT || 3000//process 是个全局变量，获取环境中的变量，以及外围我们传递的参数。
// 也可以在命令行中输入PORT=4000 node app.js
var app = express();//启动一个web服务器。将一个实例赋给一个变量，名字叫做app

mongoose.connect('mongodb://localhost/imooc');//链接数据库。

app.set('views','./views/pages');//设置视图的根目录。
app.set('view engine','jade');//设置默认的模板引擎，
  
//在后台录入页，还有一个提交表单的操作，加入一个方法，它能将表单里面的数据进行格式化，
app.use(express.bodyParser());
app.use(express.static(path.join(_dirname,bower_components)));//静态资源的获取，path.join()可以传入多个参数，将路径给拼接起来
//_dirname就是当前的目录，
app.locals.moment = require('moment');
app.listen(port);
console.log('imooc started on port'+port);//便于在命令行中查看相关信息。


//在入口文件加上几个文件的路由。在express里面路由的编写比较简单。直接调用get方法，浏览器访问页面都是以get方法提交请求的。
//get里面接收两个参数，一个是路由的匹配规则，一个是回调的方法。在回调方法里面会注入两个方法，分别是request,和response.
app.get('/',function(req,res){
   //当node后端匹配到'/',根目录这种访问格式的时候，就可以给它返回首页。并向首页里面传入一个变量title.
    movie.fetch(function(err,movies){//在回调方法里面拿到返回的movies
        if(err){
            console.log(err);
        }
        //然后再渲染。
        res.render('index',{
            title:'imooc 首页',
            //伪造数据
            movies:movies//把查询的电影列表赋值给movies这个key.
    })
    });//这个title的变量值就会被替换到index title里面的占位符。
});
app.get('/admin/list',function(req,res){
    movie.fetch(function(err,movies) {//在回调方法里面拿到返回的movies
        if (err) {
            console.log(err);
        }
        //然后再渲染。
        res.render('index', {
            title: 'imooc 首页',
            //伪造数据
            movies: movies//把查询的电影列表赋值给movies这个key.
        })
    })
});
app.get('/movie/:id',function(req,res){//:id,在url里面就能将匹配到/movie/id的值通过requestparams就可以拿到参数值。
    var id = req.params.id;
    //然后就可以查询，也就是我们在模式里面定义的静态方法。
    movie.findById(id,function(err,movie){//将id传入进去，在回调方法中拿到查询到的电影数据。
        res.render('detail',{
            title:'imooc 详情页'+movie.title,
            movie:movie
        });
    });
});
//要实现从表单过来数据的存储，还需要加个路由。拿到从后台录入页post过来的数据。
app.post('/admin/movie/new',function(req,res){
    //做个判断，从表单过来的数据有可能是新加的，也可能是刚更新过。先拿一下是否有ID的定义
    var id = req.body.movie._id
    var movieObj = req.body.movie
    var _movie
    if(id !== 'undefined'){//说明这部电影是存储到数据库里面过的。我们现在需要对它更新。
        movie.findById(id,function(err,movie){
            if(err){
              console.log(err);
            }
            //然后用post过来的电影数据里面更新的字段来替换老的电影数据。这里还需要用到一个模块，
            _movie = _.extend(movie,movieObj);//查询的movie放到第一个参数，postmovie放在第二个位置。
            _movie.save(function(err,movie){
                if(err){
                    console.log(err);
                }
                //如果电影的数据更新了，也存入成功了，应该让页面重定向电影的详情页面。
                res.redirect('/movie/'+movie._id);
            });
        })
    }else{//如果post列表中没有这个id值的话，那么这个电影就是新加的，直接调用模型，也就是构造函数。
        _movie = new Movie({
            doctor:movieObj.doctor,
            country:movieObj.country,
            title:movieObj.title,
            year:movieObj.year,
            poster:movieObj.poster,
            language:movieObj.language,
            flush:movieObj.flush
        })
        _movie.save(function(err,movie){
            if(err){
                console.log(err);
            }
            //如果电影的数据更新了，也存入成功了，应该让页面重定向电影的详情页面。
            res.redirect('/movie/'+movie._id);
        });
    }
});
//在列表页点更新的时候，会重新回到后台录入页，这个时候需要将data数据初始化到表单中，所以还需要个路由。
app.get('/admin/update/:id',function(req,res){//这个url地址过来，我们就知道它要更新一部电影。
    var id = req.params.id;
    if(id){
        movie.findById(id,function(err,movie){
            if(err){
                console.log(err);
            }
            res.render('admin',{
                title:"后台更新页",
                movie:movie
            });
        })
    }

});
app.get('/admin/movie',function(req,res){

    res.render('admin',{
        title:'imooc 后台录入页',
        //
        movie:{
            doctor:"",
            country:"",
            title:"",
            year:"",
            poster:"",
            language:""
        }
    });
});
//jade模板的优势，可以实现继承，公共模块提取出来的调用，所以在view下面要调整好目录的层次，
//拿到从浏览器过来的删除的请求。
app.delete('/admin/list',function(req,res){
    //通过query来拿，因为它是问号后追加参数传递过来的。
    var id = req.query.id
    if(id){
        movie.remove({_id:id},function(err,movie){
           if(err){
               console.log(err);
           }else{
               res.json({success:1})
           }
        })
    }
});
