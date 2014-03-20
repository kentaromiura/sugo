var clint = require('clint')()
var flow = require('finally')
var fs = require('fs')
var path = require('path')
var ncp = require('ncp')

clint.command('--help', '-h', 'General usage information')
clint.command('--full', '-f', 'Use all the features at the same time')

clint.command('--typescript', '-ts', 'Starts typescript server')
clint.command('--coffeescript', '-cs', 'Starts the coffeescript server')
clint.command('--ecmascript6', '-es6', 'Starts es6 server')
clint.command('--react', '-r', 'Starts react jsx server')
clint.command('--wrapup', '-w', 'Starts the wrapup server')

clint.command('--open', '-o', 'opens the directory where polpetta runs')
clint.command('--port', '-p', '[port] change port, default 31337')
clint.command('--ip', '-i', '[ip] change the ip, default 0.0.0.0')
clint.command('--path', '-p', 'Path where to copy .htaccess and run polpetta')

var options = {
  polpetta: './node_modules/.bin/polpetta',
  help: false,
  react : false,
  ts: false,
  es6: false,
  wrapup: false,
  coffee: false,
  full: false,
  none: true,
  ip: '0.0.0.0',
  port: 31337,
  open: false,
  path: null
}
var selections = 0;

function fullerize(){
  options.none = options.wrapup = options.ts = options.es6 = options.react = options.coffee = false; options.full = true;
}

function set(option){
  selections ++
  options.none = false
  options[option] = true
}

clint.on('command', function(name, value){
  switch(name){
    case '--open'        : options.open = true; break
    case '--port'        : options.port = value; break
    case '--ip'          : options.ip = value; break
    case '--help'        : options.help = true; break

    case '--wrapup'      : set('wrapup'); break
    case '--react'       : set('react'); break
    case '--typescript'  : set('ts'); break
    case '--ecmascript6' : set('es6'); break
    case '--coffeescript': set('coffee'); break

    case '--full': selections++; fullerize(); break
    case '--path': options.path = value; break;
  }
})

clint.on('complete', function(){
  console.log(clint.help(2, " : "))

  if (options.help){
    console.log('This is the help message, yeah, it\' s not very useful.')
    process.exit(0)
  }

  var args = []
  if (selections > 1){
    console.log('You selected more than one options, switching to full featured server')
    fullerize()
  }

  var ƒ = flow();

  if (options.path){
    if(!fs.existsSync(options.path)){
      console.log("The path "+options.path+" does not exist")
      process.exit(3)
    }
  }

  if (options.none) {
    console.log("You didn't select a server")
    process.exit(2)
  }

  var spawn = require('child_process').spawn;


  if (options.full || options.ts) {
    if (options.ts) args.push('./ts')
    var ts = require('typescript'),
        need_fix = ts.TypeScriptCompiler == undefined

	if (need_fix) {
	  ƒ.then(function(err){
		var me = this
	  	var fix = spawn('./fix_typescript.sh')
                fix.on('close', function(){
			me.continue()
		})
		fix.stdout.on('data', function(data){
			console.log(data.toString())
		})
	  })
        }
  }

  if (options.es6)    args.push('./es6')
  if (options.react)  args.push('./react')
  if (options.full)   args.push('./full')
  if (options.wrapup) args.push('./wrup')
  if (options.coffee) args.push('./coffee')

  args.push(options.ip + ':' + options.port)

  if(options.open){
    ƒ.then(function(){
      var o = spawn('open', [args[0]])
      this.continue()
    })
  }

  if(options.path){
    ƒ.then(function(){
      var me = this
      ncp(path.join('.', '/node_modules'), path.join(options.path, '/node_modules'), function(err){
        if(err){
          console.log('Error while copying node_modules', err)
          process.exit(6)
        }
        me.continue()
      })
    })
    ƒ.then(function(){
      var me = this
      var read = fs.createReadStream(path.join(args[0],  '/.htaccess'));
      read.on("error", function(err) {
       console.log("Can't read origin .htaccess")
       process.exit(4)
      })
      var write = fs.createWriteStream(path.join(options.path,  '/.htaccess'));
      write.on("error", function(err) {
        console.log("Can't write target .htaccess")
        process.exit(5)
      })
      write.on("close", function(ex) {
        args[0] = path.resolve(options.path)
        me.continue()
      });
      read.pipe(write);

    })
  }

var _code
  ƒ.then(function(err){
    var me = this

    var prc = spawn(options.polpetta, args);
    prc.on('close', function (code) {
      _code = code
      console.log('polpetta process exit code ' + code);
      me.continue()

    });


    prc.stdout.on('data', function (data) {
      var str = data.toString()
      var lines = str.split(/(\r?\n)/g);
      console.log(lines.join(""));
    });

  })
  ƒ.finally(function(){
      process.exit(_code)
  })
})

clint.parse(process.argv.slice(2))
