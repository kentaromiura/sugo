var clint = require('clint')()
var flow = require('finally')

clint.command('--help', '-h', 'General usage information')
clint.command('--full', '-f', 'Use all the features at the same time')

clint.command('--typescript', '-ts', 'Starts typescript server')
clint.command('--ecmascript6', '-es6', 'Starts es6 server')
clint.command('--react', '-r', 'Starts react jsx server')
clint.command('--wrapup', '-w', 'Starts the wrapup server')

clint.command('--open', '-o', 'opens the directory where polpetta runs')
clint.command('--port', '-p', '[port] change port, default 31337')
clint.command('--ip', '-i', '[ip] change the ip, default 0.0.0.0')

var options = {
  polpetta: './node_modules/.bin/polpetta',
  help: false,
  react : false,
  ts: false,
  es6: false,
  wrapup: false,
  full: false,
  none: true,
  ip: '0.0.0.0',
  port: 31337,
  open: false
}
var selections = 0;

function fullerize(){
  options.none = options.wrapup = options.ts = options.es6 = options.react = false; options.full = true;
}

function set(option){
  selections ++
  options.none = false
  options[option] = true
}

clint.on('command', function(name, value){
  switch(name){
    case '--open'       : options.open = true; break
    case '--port'       : options.port = value; break
    case '--ip'         : options.ip = value; break
    case '--help'       : options.help = true; break

    case '--wrapup'     : set('wrapup'); break
    case '--react'      : set('react'); break
    case '--typescript' : set('ts'); break
    case '--ecmascript6': set('es6'); break

    case '--full': selections++; fullerize(); break
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
  
  if (options.none) {
    console.log("You didn't select a server")
    process.exit(2)
  }

  var spawn = require('child_process').spawn; 
  var ƒ = flow();
	  
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

  args.push(options.ip + ':' + options.port)

  if(options.open){
    ƒ.then(function(){
      var o = spawn('open', [args[0]])
      this.continue()
    })
  }
var _code
  ƒ.then(function(err){
    var me = this
    var prc = spawn(options.polpetta, args);
    prc.on('close', function (code) {
      _code = code
      console.log('process exit code ' + code);
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
